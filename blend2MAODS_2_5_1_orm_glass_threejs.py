bl_info = {
    "name": "Material Bake + Unity Pack (HDRP/URP)",
    "author": "ChatGPT",
    "version": (2, 5, 1),
    "blender": (5, 2, 0),
    "location": "View3D > Sidebar > Bake",
    "description": "Bake material channels to textures, pack Unity maps including URP Emission, preserve MAODS source resolution, and export selected object hierarchies to FBX.",
    "category": "Material",
}

import bpy
import json
import os
import re
import shutil
import subprocess
import traceback


# ----------------------------
# Utils
# ----------------------------

def _safe_filename(name: str) -> str:
    name = name.strip()
    name = re.sub(r"[\\/:*?\"<>|]+", "_", name)
    name = re.sub(r"\s+", " ", name)
    return name


def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


def _remove_image_safe(img: bpy.types.Image):
    try:
        if img and img.users == 0:
            bpy.data.images.remove(img)
    except:
        pass


def _save_image_png(img: bpy.types.Image, out_path: str):
    img.filepath_raw = out_path
    img.file_format = "PNG"
    img.save()


def _new_solid_image(name: str, w: int, h: int, rgba=(0.0, 0.0, 0.0, 1.0), colorspace="sRGB"):
    img = bpy.data.images.new(name=name, width=w, height=h, alpha=True)
    try:
        img.colorspace_settings.name = colorspace
    except:
        pass

    px = [0.0] * (w * h * 4)
    r, g, b, a = rgba
    for i in range(0, len(px), 4):
        px[i + 0] = float(r)
        px[i + 1] = float(g)
        px[i + 2] = float(b)
        px[i + 3] = float(a)
    img.pixels[:] = px
    return img


def _load_image(path: str, created_images_accum: list):
    if not os.path.exists(path):
        return None
    img = None
    abs_path = bpy.path.abspath(path)
    for im in bpy.data.images:
        try:
            if bpy.path.abspath(im.filepath) == abs_path:
                img = im
                break
        except:
            pass
    if img is None:
        img = bpy.data.images.load(path)
        created_images_accum.append(img)
    return img


def _copy_rgb(src_img: bpy.types.Image, out_name: str, out_path: str, colorspace: str, created_images_accum: list):
    w, h = src_img.size
    out = bpy.data.images.new(out_name, width=w, height=h, alpha=True)
    try:
        out.colorspace_settings.name = colorspace
    except:
        pass
    created_images_accum.append(out)

    out.pixels[:] = src_img.pixels[:]
    _save_image_png(out, out_path)
    return out


def _make_basemap_with_alpha(basecolor: bpy.types.Image, alpha: bpy.types.Image,
                             name: str, out_path: str, created_images_accum: list):
    """
    Create a Unity BaseMap with RGB from *_basecolor.png and opacity from
    *_alpha.png. The alpha image is sampled from its red channel, which is
    correct for the grayscale alpha maps baked by this add-on.

    If no alpha image exists, preserve Base Color's existing alpha channel.
    """
    if not basecolor:
        return None

    w, h = basecolor.size
    out = bpy.data.images.new(name=name, width=w, height=h, alpha=True)
    try:
        out.colorspace_settings.name = "sRGB"
    except:
        pass
    try:
        # Unity Base Maps expect straight (non-premultiplied) RGB + alpha.
        out.alpha_mode = "STRAIGHT"
    except:
        pass
    created_images_accum.append(out)

    bp = basecolor.pixels[:]
    ap = alpha.pixels[:] if alpha else None
    aw, ah = alpha.size if alpha else (0, 0)
    dp = [0.0] * (w * h * 4)

    for y in range(h):
        for x in range(w):
            i = (y * w + x) * 4
            dp[i + 0] = bp[i + 0]
            dp[i + 1] = bp[i + 1]
            dp[i + 2] = bp[i + 2]

            if ap:
                # Nearest-neighbour sampling handles alpha maps whose size
                # differs from Base Color without changing their edge shape.
                ax = min(aw - 1, int(x * aw / w))
                ay = min(ah - 1, int(y * ah / h))
                ai = (ay * aw + ax) * 4
                dp[i + 3] = ap[ai + 0]
            else:
                dp[i + 3] = bp[i + 3]

    out.pixels[:] = dp
    _save_image_png(out, out_path)
    return out


# ----------------------------
# Resolution logic
# ----------------------------

def _is_scalar_socket(sock) -> bool:
    if not sock:
        return False
    dv = getattr(sock, "default_value", None)
    # In Blender, VALUE sockets typically have float default_value
    return isinstance(dv, (int, float))


def _find_first_image_texture_size(material: bpy.types.Material):
    """
    Try to infer "original" texture size from any Image Texture node that has an image.
    Returns (w,h) or None.
    """
    if not material or not material.use_nodes or not material.node_tree:
        return None
    nt = material.node_tree

    # Prefer images that are actually used (linked outputs), but fallback to any image nodes.
    candidates_linked = []
    candidates_any = []

    for n in nt.nodes:
        if n.type == "TEX_IMAGE" and getattr(n, "image", None):
            img = n.image
            try:
                w, h = img.size
                if w > 0 and h > 0:
                    candidates_any.append((w, h))
                    # consider "used" if any output socket is linked
                    used = any(getattr(o, "is_linked", False) for o in n.outputs)
                    if used:
                        candidates_linked.append((w, h))
            except:
                pass

    if candidates_linked:
        return candidates_linked[0]
    if candidates_any:
        return candidates_any[0]
    return None


def _compute_export_size(props, material: bpy.types.Material):
    """
    If Override Resolution OFF:
        - use original size from Image Texture node if possible
        - else use props.image_size
    If ON:
        - base size = (original if possible else props.image_size)
        - multiply by props.multiplier, clamp >= 1
    Returns (w,h) ints.
    """
    base = _find_first_image_texture_size(material)
    if base is None:
        base = (int(props.image_size), int(props.image_size))

    if not props.override_resolution:
        return (int(base[0]), int(base[1]))

    mul = float(props.multiplier)
    if mul <= 0:
        mul = 1.0
    w = max(1, int(round(base[0] * mul)))
    h = max(1, int(round(base[1] * mul)))
    return (w, h)


# ----------------------------
# Node graph helpers
# ----------------------------

def _iter_links_from_socket(sock):
    if not sock:
        return []
    try:
        return list(sock.links)
    except:
        return []


def _find_principled_from_surface(material: bpy.types.Material):
    if not material or not material.use_nodes:
        return None, None

    nt = material.node_tree
    outputs = [n for n in nt.nodes if n.type == "OUTPUT_MATERIAL"]
    out = next((n for n in outputs if getattr(n, "is_active_output", False)), outputs[0] if outputs else None)
    if not out:
        return None, None

    surf = out.inputs.get("Surface")
    if not surf:
        return None, out

    q = []
    for link in _iter_links_from_socket(surf):
        if link.from_node:
            q.append((link.from_node, link.from_socket))

    visited = set()

    def _push_upstream(node, from_socket):
        if node and node.type == "GROUP" and getattr(node, "node_tree", None):
            gtree = node.node_tree
            g_out = None
            for gn in gtree.nodes:
                if gn.type == "GROUP_OUTPUT":
                    g_out = gn
                    break
            if not g_out:
                return
            if from_socket is None:
                return

            out_sock_name = from_socket.name
            inside_sock = None
            for s in g_out.inputs:
                if s.name == out_sock_name:
                    inside_sock = s
                    break
            if inside_sock is None and len(g_out.inputs) > 0:
                inside_sock = g_out.inputs[0]

            if inside_sock:
                for lk in _iter_links_from_socket(inside_sock):
                    if lk.from_node:
                        q.append((lk.from_node, lk.from_socket))
            return

        for inp in getattr(node, "inputs", []):
            for lk in _iter_links_from_socket(inp):
                if lk.from_node:
                    q.append((lk.from_node, lk.from_socket))

    while q:
        node, from_socket = q.pop(0)
        if not node:
            continue
        key = (node.as_pointer(), from_socket.as_pointer() if from_socket else 0)
        if key in visited:
            continue
        visited.add(key)

        if node.type == "BSDF_PRINCIPLED":
            return node, out

        _push_upstream(node, from_socket)

    return None, out


def _find_direct_animated_mix(material: bpy.types.Material):
    """Return (Mix Shader, Principled A, Principled B, output), if exact."""
    if not material or not material.use_nodes or not material.node_tree:
        return None

    nt = material.node_tree
    outputs = [n for n in nt.nodes if n.type == "OUTPUT_MATERIAL" and getattr(n, "is_active_output", True)]
    if not outputs:
        outputs = [n for n in nt.nodes if n.type == "OUTPUT_MATERIAL"]

    for out in outputs:
        surface = out.inputs.get("Surface")
        if not surface or len(surface.links) != 1:
            continue
        mix = surface.links[0].from_node
        if not mix or mix.type != "MIX_SHADER":
            continue

        shader_inputs = list(mix.inputs)[1:3]
        if len(shader_inputs) != 2 or any(len(sock.links) != 1 for sock in shader_inputs):
            continue
        principled = [sock.links[0].from_node for sock in shader_inputs]
        if all(node and node.type == "BSDF_PRINCIPLED" for node in principled):
            return mix, principled[0], principled[1], out

    return None


def _temporary_surface_shader(material, output, shader_node):
    """Connect one shader directly to Surface; return data needed to restore it."""
    nt = material.node_tree
    surface = output.inputs.get("Surface")
    saved = [(link.from_socket, link.to_socket) for link in list(surface.links)]
    for link in list(surface.links):
        nt.links.remove(link)
    nt.links.new(shader_node.outputs[0], surface)
    return surface, saved


def _restore_surface_links(material, surface, saved):
    nt = material.node_tree
    for link in list(surface.links):
        nt.links.remove(link)
    for from_socket, to_socket in saved:
        try:
            nt.links.new(from_socket, to_socket)
        except (ReferenceError, RuntimeError):
            pass


def _action_fcurves_for_id(id_block):
    """Yield F-Curves from Blender 5.x layered actions and legacy actions."""
    anim_data = getattr(id_block, "animation_data", None)
    action = getattr(anim_data, "action", None) if anim_data else None
    if not action:
        return []

    curves = []
    legacy = getattr(action, "fcurves", None)
    if legacy is not None:
        try:
            curves.extend(list(legacy))
        except TypeError:
            pass

    slot = getattr(anim_data, "action_slot", None)
    for layer in getattr(action, "layers", []):
        for strip in getattr(layer, "strips", []):
            channelbag = None
            if slot and hasattr(strip, "channelbag"):
                try:
                    channelbag = strip.channelbag(slot)
                except (RuntimeError, TypeError):
                    channelbag = None
            if channelbag:
                curves.extend(list(channelbag.fcurves))
            elif not slot:
                for bag in getattr(strip, "channelbags", []):
                    curves.extend(list(bag.fcurves))

    unique = []
    seen = set()
    for curve in curves:
        pointer = curve.as_pointer()
        if pointer not in seen:
            seen.add(pointer)
            unique.append(curve)
    return unique


def _mix_animation_track(material, mix_node, scene):
    """Convert Mix Fac keys to the manifest's normalized keyframe format."""
    fac = mix_node.inputs[0]
    data_path = fac.path_from_id("default_value")
    curve = next((fc for fc in _action_fcurves_for_id(material.node_tree)
                  if fc.data_path == data_path and fc.array_index == 0), None)
    if not curve or not curve.keyframe_points:
        return None

    start = float(scene.frame_start)
    end = float(scene.frame_end)
    span = max(end - start, 1.0)
    frames = {start, end}
    for point in curve.keyframe_points:
        frame = float(point.co[0])
        if start <= frame <= end:
            frames.add(frame)

    keyframes = [
        {
            "progress": round((frame - start) / span, 6),
            "value": round(max(0.0, min(1.0, float(curve.evaluate(frame)))), 6),
        }
        for frame in sorted(frames)
    ]
    interpolations = {point.interpolation for point in curve.keyframe_points}
    easing = "step" if interpolations == {"CONSTANT"} else "linear" if interpolations == {"LINEAR"} else "smoothstep"
    return {"easing": easing, "keyframes": keyframes}


def _get_socket_default_rgba(sock):
    if not sock:
        return (0.0, 0.0, 0.0, 1.0)

    dv = getattr(sock, "default_value", None)
    if dv is None:
        return (0.0, 0.0, 0.0, 1.0)

    if hasattr(dv, "__len__"):
        if len(dv) >= 3:
            return (float(dv[0]), float(dv[1]), float(dv[2]), 1.0)

    try:
        v = float(dv)
        return (v, v, v, 1.0)
    except:
        return (0.0, 0.0, 0.0, 1.0)


def _active_material_output(material):
    outputs = [node for node in material.node_tree.nodes if node.type == "OUTPUT_MATERIAL"]
    return next((node for node in outputs if getattr(node, "is_active_output", False)), outputs[0] if outputs else None)


def _make_emit_override(material: bpy.types.Material, principled: bpy.types.Node, socket_name: str):
    nt = material.node_tree
    out = _active_material_output(material)
    if not out:
        return None

    surf = out.inputs.get("Surface")
    if not surf:
        return None

    saved_links = []
    for lk in list(surf.links):
        saved_links.append((lk.from_node, lk.from_socket))
        nt.links.remove(lk)

    em = nt.nodes.new("ShaderNodeEmission")
    em.location = (out.location.x - 300, out.location.y)

    # Blender 4.0+ / 5.x renamed the Principled emission colour input
    # from "Emission" to "Emission Color". The previous implementation
    # looked only for the old name, received None, and therefore baked black.
    # Keep the old name as a fallback for files created in earlier Blender
    # versions.
    if principled and socket_name == "Emission":
        src_socket = (
            principled.inputs.get("Emission Color")
            or principled.inputs.get("Emission")
        )
        strength_socket = principled.inputs.get("Emission Strength")
    else:
        src_socket = principled.inputs.get(socket_name) if principled else None
        strength_socket = None

    if src_socket and src_socket.is_linked:
        lk = src_socket.links[0]
        nt.links.new(lk.from_socket, em.inputs["Color"])
    else:
        rgba = _get_socket_default_rgba(src_socket)
        em.inputs["Color"].default_value = (rgba[0], rgba[1], rgba[2], 1.0)

    # Bake the actual emitted value: Emission Color multiplied by Emission
    # Strength. This also supports a texture or other node linked to Strength.
    if strength_socket:
        if strength_socket.is_linked:
            lk = strength_socket.links[0]
            nt.links.new(lk.from_socket, em.inputs["Strength"])
        else:
            try:
                em.inputs["Strength"].default_value = float(strength_socket.default_value)
            except (TypeError, ValueError):
                em.inputs["Strength"].default_value = 1.0

    nt.links.new(em.outputs["Emission"], surf)

    return {
        "out": out,
        "surf": surf,
        "saved_links": saved_links,
        "emission_node": em,
    }


def _restore_emit_override(material: bpy.types.Material, info: dict):
    if not info:
        return
    nt = material.node_tree
    surf = info.get("surf")
    em = info.get("emission_node")

    if surf:
        for lk in list(surf.links):
            nt.links.remove(lk)
        for n, s in info.get("saved_links", []):
            try:
                nt.links.new(s, surf)
            except:
                pass

    try:
        if em:
            nt.nodes.remove(em)
    except:
        pass


# ----------------------------
# Bake helpers
# ----------------------------

def _ensure_cycles(context):
    scene = context.scene
    if scene.render.engine != "CYCLES":
        scene.render.engine = "CYCLES"


def _create_temp_plane(context):
    """
    Create the temporary bake plane via Blender's data API.

    This avoids bpy.ops.mesh.primitive_plane_add(), which depends on the
    current editor context and selection state in Blender 5.2.
    """
    mesh = bpy.data.meshes.new("__BAKE_PLANE_MESH__")
    mesh.from_pydata(
        [(-1.0, -1.0, 0.0), (1.0, -1.0, 0.0),
         (1.0,  1.0, 0.0), (-1.0,  1.0, 0.0)],
        [],
        [(0, 1, 2, 3)],
    )
    mesh.update()

    uv_layer = mesh.uv_layers.new(name="UVMap")
    uv_coords = ((0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0))
    for poly in mesh.polygons:
        for loop_index, uv in zip(poly.loop_indices, uv_coords):
            uv_layer.data[loop_index].uv = uv

    plane = bpy.data.objects.new("__BAKE_PLANE__", mesh)
    context.scene.collection.objects.link(plane)
    return plane


def _set_active_only(context, obj):
    """Select only obj and make it active without bpy.ops.object.select_all()."""
    view_layer = context.view_layer

    for candidate in view_layer.objects:
        try:
            candidate.select_set(False)
        except RuntimeError:
            pass

    try:
        obj.hide_set(False)
        obj.select_set(True)
        view_layer.objects.active = obj
    except RuntimeError as exc:
        raise RuntimeError(f"Cannot make temporary bake plane active: {exc}") from exc


def _delete_object(obj):
    """
    Remove a temporary object without using context-sensitive operators.

    Blender 5.2 can reject bpy.ops.object.delete() when the current UI context
    has no valid selected object, even when the object was selected by script.
    Removing the datablock directly is reliable for this temporary bake plane.
    """
    try:
        if obj is None:
            return
        live_obj = bpy.data.objects.get(obj.name)
        if live_obj is not None:
            bpy.data.objects.remove(live_obj, do_unlink=True)
    except (ReferenceError, RuntimeError):
        pass


def _bake_to_image(context, plane_obj, material: bpy.types.Material, img: bpy.types.Image, bake_type: str, margin: int):
    """
    Bake onto the temporary plane with an explicit context override.

    Blender 5.2 can report "No valid selected objects" even after
    Object.select_set(True) when bpy.ops.object.bake() evaluates a stale UI
    context. The override passes the exact active/selected object directly to
    the bake operator.
    """
    _ensure_cycles(context)

    plane_obj.data.materials.clear()
    plane_obj.data.materials.append(material)

    nt = material.node_tree
    if nt is None:
        raise RuntimeError(f"Material '{material.name}' does not use nodes")

    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.select = True
    nt.nodes.active = tex

    try:
        _set_active_only(context, plane_obj)
        context.view_layer.update()

        scene = context.scene
        scene.render.bake.use_clear = True
        scene.render.bake.margin = margin
        scene.render.bake.use_selected_to_active = False

        # Explicitly provide the bake operator with its active and selected
        # object. This avoids depending on the viewport's current selection.
        with context.temp_override(
            scene=scene,
            view_layer=context.view_layer,
            active_object=plane_obj,
            object=plane_obj,
            selected_objects=[plane_obj],
            selected_editable_objects=[plane_obj],
        ):
            result = bpy.ops.object.bake(type=bake_type)

        if "FINISHED" not in result:
            raise RuntimeError(f"Bake operator returned: {result}")

    finally:
        try:
            nt.nodes.remove(tex)
        except (ReferenceError, RuntimeError):
            pass


def _bake_channel_emit(context, plane_obj, material, principled, socket_name, img, margin):
    info = _make_emit_override(material, principled, socket_name)
    try:
        _bake_to_image(context, plane_obj, material, img, bake_type="EMIT", margin=margin)
    finally:
        _restore_emit_override(material, info)


def _bake_normal_from_principled_input(context, plane_obj, material, principled, img, margin):
    nt = material.node_tree
    out = _active_material_output(material)
    if not out:
        return

    surf = out.inputs.get("Surface")
    if not surf:
        return

    saved_links = []
    for lk in list(surf.links):
        saved_links.append((lk.from_node, lk.from_socket))
        nt.links.remove(lk)

    normal_sock = principled.inputs.get("Normal") if principled else None
    if normal_sock and normal_sock.is_linked:
        vm_mul = nt.nodes.new("ShaderNodeVectorMath")
        vm_mul.operation = "MULTIPLY"
        vm_mul.inputs[1].default_value = (0.5, 0.5, 0.5)
        vm_mul.location = (out.location.x - 600, out.location.y)

        vm_add = nt.nodes.new("ShaderNodeVectorMath")
        vm_add.operation = "ADD"
        vm_add.inputs[1].default_value = (0.5, 0.5, 0.5)
        vm_add.location = (out.location.x - 450, out.location.y)

        em = nt.nodes.new("ShaderNodeEmission")
        em.location = (out.location.x - 300, out.location.y)

        lk = normal_sock.links[0]
        nt.links.new(lk.from_socket, vm_mul.inputs[0])
        nt.links.new(vm_mul.outputs[0], vm_add.inputs[0])
        nt.links.new(vm_add.outputs[0], em.inputs["Color"])
        nt.links.new(em.outputs["Emission"], surf)

        try:
            _bake_to_image(context, plane_obj, material, img, bake_type="EMIT", margin=margin)
        finally:
            for n in (vm_mul, vm_add, em):
                try:
                    nt.nodes.remove(n)
                except:
                    pass
    else:
        # Neutral tangent normal #8080FF at current resolution
        w, h = img.size
        px = [0.0] * (w * h * 4)
        r, g, b, a = (0.5, 0.5, 1.0, 1.0)
        for i in range(0, len(px), 4):
            px[i + 0] = r
            px[i + 1] = g
            px[i + 2] = b
            px[i + 3] = a
        img.pixels[:] = px

    for lk in list(surf.links):
        nt.links.remove(lk)
    for n, s in saved_links:
        try:
            nt.links.new(s, surf)
        except:
            pass


# ----------------------------
# Unity packing helpers
# ----------------------------

_INTERMEDIATE_SUFFIXES = ("alpha", "basecolor", "emission", "metallic", "normal", "roughness", "occlusion")


def _scan_material_names_from_files(base_dir: str):
    mats = set()
    for fn in os.listdir(base_dir):
        low = fn.lower()
        if not low.endswith(".png"):
            continue
        for suf in _INTERMEDIATE_SUFFIXES:
            tail = f"_{suf}.png"
            if low.endswith(tail):
                mats.add(fn[:-len(tail)])
                break
    return sorted(mats)


def _choose_pack_resolution(*images):
    """
    Return the resolution of the most detailed available source image.

    Scalar fallback maps are intentionally written as 64x64 images. They must
    not force a packed texture down to 64x64 when another packed channel uses
    a real texture at a higher resolution. Choosing the image with the largest
    pixel count preserves the highest available source detail and its aspect
    ratio.
    """
    candidates = []

    for image in images:
        if not image:
            continue
        try:
            w, h = int(image.size[0]), int(image.size[1])
        except (AttributeError, TypeError, ValueError, IndexError):
            continue

        if w > 0 and h > 0:
            candidates.append((w, h))

    if not candidates:
        return None

    return max(candidates, key=lambda size: (size[0] * size[1], size[0], size[1]))


def _make_maods_any(metallic: bpy.types.Image, occlusion: bpy.types.Image, roughness: bpy.types.Image,
                    name: str, out_path: str, created_images_accum: list,
                    default_metallic=0.0, default_occlusion=0.0, default_roughness=0.5):
    """
    MAODS:
      R = Metallic
      G = Occlusion (AO) (missing -> 0.0 / #000000)
      B = Not used (0.0)
      A = Smoothness = 1 - Roughness

    Output resolution is selected from the most detailed packed source map.
    This prevents a 64x64 scalar fallback map from reducing a textured
    Roughness, Metallic, or Occlusion channel to 64x64.
    """
    target_size = _choose_pack_resolution(metallic, roughness, occlusion)
    if target_size is None:
        return None

    w, h = target_size

    img = bpy.data.images.new(name=name, width=w, height=h, alpha=True)
    try:
        img.colorspace_settings.name = "Non-Color"
    except:
        pass
    created_images_accum.append(img)

    dp = [0.0] * (w * h * 4)

    mp = metallic.pixels[:] if metallic else None
    mw, mh = metallic.size if metallic else (0, 0)

    op = occlusion.pixels[:] if occlusion else None
    ow, oh = occlusion.size if occlusion else (0, 0)

    rp = roughness.pixels[:] if roughness else None
    rw, rh = roughness.size if roughness else (0, 0)

    for y in range(h):
        for x in range(w):
            if mp:
                mx = int(x * mw / w)
                my = int(y * mh / h)
                mi = (my * mw + mx) * 4
                m = mp[mi + 0]
            else:
                m = default_metallic

            if op:
                ox = int(x * ow / w)
                oy = int(y * oh / h)
                oi = (oy * ow + ox) * 4
                o = op[oi + 0]
            else:
                o = default_occlusion

            if rp:
                rx = int(x * rw / w)
                ry = int(y * rh / h)
                ri = (ry * rw + rx) * 4
                r = rp[ri + 0]
            else:
                r = default_roughness

            i = (y * w + x) * 4
            dp[i + 0] = m
            dp[i + 1] = o
            dp[i + 2] = 0.0
            dp[i + 3] = 1.0 - r

    img.pixels[:] = dp
    _save_image_png(img, out_path)
    return img


def _convert_all_for_unity_variant(base_dir: str, out_subdir: str, remove_images: bool):
    out_dir = os.path.join(base_dir, out_subdir)
    os.makedirs(out_dir, exist_ok=True)

    created_images = []
    mats = _scan_material_names_from_files(base_dir)

    processed = 0
    for mat_name in mats:
        basecolor_path  = os.path.join(base_dir, f"{mat_name}_basecolor.png")
        alpha_path      = os.path.join(base_dir, f"{mat_name}_alpha.png")
        metallic_path   = os.path.join(base_dir, f"{mat_name}_metallic.png")
        roughness_path  = os.path.join(base_dir, f"{mat_name}_roughness.png")
        occlusion_path  = os.path.join(base_dir, f"{mat_name}_occlusion.png")
        normal_path     = os.path.join(base_dir, f"{mat_name}_normal.png")
        emission_path   = os.path.join(base_dir, f"{mat_name}_emission.png")

        basecolor = _load_image(basecolor_path, created_images)
        alpha     = _load_image(alpha_path, created_images)
        metallic  = _load_image(metallic_path, created_images)
        roughness = _load_image(roughness_path, created_images)
        occlusion = _load_image(occlusion_path, created_images)
        normal    = _load_image(normal_path, created_images)
        emission  = _load_image(emission_path, created_images)

        # Scalar maps must not receive an sRGB transform before their pixels
        # are packed into another texture channel.
        for scalar_img in (alpha, metallic, roughness, occlusion, normal):
            if scalar_img:
                try:
                    scalar_img.colorspace_settings.name = "Non-Color"
                except:
                    pass

        if basecolor:
            out_path = os.path.join(out_dir, f"{mat_name}_BaseMap.png")
            _make_basemap_with_alpha(
                basecolor,
                alpha,
                f"OUT_{mat_name}_BaseMap",
                out_path,
                created_images,
            )

        if normal:
            out_path = os.path.join(out_dir, f"{mat_name}_Normal.png")
            _copy_rgb(normal, f"OUT_{mat_name}_Normal", out_path, "Non-Color", created_images)

        # URP Lit uses a separate Emission Map. The baked emission texture
        # already contains Emission Color multiplied by Emission Strength,
        # so copy it as an sRGB texture without packing it into BaseMap.
        if out_subdir.lower() == "urp" and emission:
            out_path = os.path.join(out_dir, f"{mat_name}_Emission.png")
            _copy_rgb(emission, f"OUT_{mat_name}_Emission", out_path, "sRGB", created_images)

        if metallic or roughness or occlusion:
            out_path = os.path.join(out_dir, f"{mat_name}_MAODS.png")
            _make_maods_any(metallic, occlusion, roughness, f"OUT_{mat_name}_MAODS", out_path, created_images)

        processed += 1

    if remove_images:
        for img in list(created_images):
            _remove_image_safe(img)

    return processed


# ----------------------------
# FBX hierarchy export helpers
# ----------------------------

_FBX_OBJECT_TYPES = {"EMPTY", "CAMERA", "LIGHT", "ARMATURE", "MESH", "OTHER"}


def _fbx_collect_hierarchy(root: bpy.types.Object):
    """Return root plus every recursive child, without duplicates."""
    objects = [root]
    seen = {root.as_pointer()}

    for child in root.children_recursive:
        key = child.as_pointer()
        if key not in seen:
            seen.add(key)
            objects.append(child)

    return objects


def _fbx_capture_selection_state(context):
    """Capture selection/active-object state so the scene is restored after export."""
    return {
        "selected": list(context.selected_objects),
        "active": context.view_layer.objects.active,
    }


def _fbx_restore_selection_state(context, state):
    """Restore the selection state without bpy.ops.object.select_all()."""
    view_layer = context.view_layer

    for obj in view_layer.objects:
        try:
            obj.select_set(False)
        except RuntimeError:
            pass

    for obj in state.get("selected", []):
        try:
            if obj.name in view_layer.objects:
                obj.select_set(True)
        except (ReferenceError, RuntimeError):
            pass

    active = state.get("active")
    try:
        if active is not None and active.name in view_layer.objects:
            view_layer.objects.active = active
        else:
            view_layer.objects.active = None
    except (ReferenceError, RuntimeError):
        pass


def _fbx_select_only(context, objects, active_object):
    """
    Select exactly ``objects`` and make ``active_object`` active.

    The FBX exporter reads the actual view-layer selection. Do not use
    bpy.ops.object.select_all() here: Blender 5.2 can reject that operator
    from a sidebar-panel context with "No valid selected objects".
    """
    view_layer = context.view_layer
    available = {obj.as_pointer(): obj for obj in view_layer.objects}

    missing = [obj.name for obj in objects if obj.as_pointer() not in available]
    if missing:
        raise RuntimeError(
            "Objects are excluded from the active View Layer and cannot be exported: "
            + ", ".join(missing)
        )

    for obj in view_layer.objects:
        try:
            obj.select_set(False)
        except RuntimeError:
            pass

    for obj in objects:
        try:
            # "Visible Objects" is disabled in the requested FBX settings.
            # Temporarily unhide per-object viewport hiding so hidden children
            # can still be selected and exported, then restore that state later.
            obj.hide_set(False)
            obj.select_set(True)
        except RuntimeError as exc:
            raise RuntimeError(f"Cannot select '{obj.name}' for FBX export: {exc}") from exc

    selected = {obj.as_pointer() for obj in context.selected_objects}
    expected = {obj.as_pointer() for obj in objects}
    if selected != expected:
        missing_names = [obj.name for obj in objects if obj.as_pointer() not in selected]
        extra_names = [obj.name for obj in context.selected_objects if obj.as_pointer() not in expected]
        details = []
        if missing_names:
            details.append("not selected: " + ", ".join(missing_names))
        if extra_names:
            details.append("unexpected selection: " + ", ".join(extra_names))
        raise RuntimeError("Could not set an exact FBX export selection (" + "; ".join(details) + ")")

    try:
        view_layer.objects.active = active_object
    except RuntimeError as exc:
        raise RuntimeError(f"Cannot make '{active_object.name}' active for FBX export: {exc}") from exc

    context.view_layer.update()


def _fbx_export_one(context, root: bpy.types.Object, objects, filepath: str):
    """Export one selected root hierarchy with the settings shown in the request."""
    _fbx_select_only(context, objects, root)

    # Explicit selection state keeps this deterministic when the sidebar panel
    # is not the viewport's current area.
    with context.temp_override(
        scene=context.scene,
        view_layer=context.view_layer,
        active_object=root,
        object=root,
        selected_objects=list(objects),
        selected_editable_objects=list(objects),
    ):
        result = bpy.ops.export_scene.fbx(
            filepath=filepath,
            check_existing=False,
            use_selection=True,
            use_visible=False,
            use_active_collection=False,
            object_types=_FBX_OBJECT_TYPES,
            use_custom_props=False,
            global_scale=1.0,
            apply_unit_scale=True,
            apply_scale_options="FBX_SCALE_NONE",  # UI: All Local
            axis_forward="-Z",
            axis_up="Y",
            use_space_transform=True,
            bake_space_transform=False,
            path_mode="COPY",
            embed_textures=False,
            batch_mode="OFF",
            use_mesh_modifiers=False,
            mesh_smooth_type="OFF",  # UI: Normals Only
            use_subsurf=False,
            use_mesh_edges=False,
            use_triangles=False,
            use_tspace=False,
            colors_type="SRGB",
            prioritize_active_color=False,
            primary_bone_axis="Y",
            secondary_bone_axis="X",
            armature_nodetype="NULL",
            use_armature_deform_only=False,
        )

    if "FINISHED" not in result:
        raise RuntimeError(f"FBX exporter returned: {result}")


# ----------------------------
# Properties
# ----------------------------

class MBB_Props(bpy.types.PropertyGroup):
    save_path: bpy.props.StringProperty(
        name="Save path",
        subtype="DIR_PATH",
        default="//bake_output",
        description="Directory to save baked textures",
    )
    image_size: bpy.props.IntProperty(
        name="Image Size",
        default=2048,
        min=64,
        max=16384,
        description="Fallback resolution when original texture size can't be inferred",
    )
    bake_margin: bpy.props.IntProperty(
        name="Bake Margin",
        default=16,
        min=0,
        max=128,
        description="Bake margin/padding in pixels",
    )
    bake_normal_from_input: bpy.props.BoolProperty(
        name="Bake Normal from Principled Normal input",
        default=True,
        description="If enabled and Principled Normal input is linked, bake that normal by remapping -1..1 to 0..1 via EMIT. Otherwise bake geometry NORMAL.",
    )
    overwrite_existing: bpy.props.BoolProperty(
        name="Overwrite existing",
        default=False,
        description="Overwrite existing images on disk; if off, skip baking maps that already exist",
    )
    remove_generated_images_from_blend: bpy.props.BoolProperty(
        name="Remove generated images from .blend",
        default=True,
        description="Remove loaded/generated images datablocks after operations",
    )

    override_resolution: bpy.props.BoolProperty(
        name="Override Resolution",
        default=False,
        description="If enabled, export resolution = base_resolution * Multiplier. Base resolution comes from Image Texture size, or Image Size if unavailable.",
    )
    multiplier: bpy.props.FloatProperty(
        name="Multiplier",
        default=1.0,
        min=0.01,
        max=16.0,
        description="Resolution multiplier when Override Resolution is enabled",
    )
    web_texture_format: bpy.props.EnumProperty(
        name="Web texture format",
        items=(
            ("WEBP", "WebP", "Convert PNG textures to WebP using Blender"),
            ("KTX2", "KTX2", "Convert PNG textures with the external toktx utility"),
        ),
        default="WEBP",
    )
    webp_quality: bpy.props.IntProperty(
        name="WebP Quality",
        default=90,
        min=1,
        max=100,
    )
    ktx2_normal_encoding: bpy.props.EnumProperty(
        name="Normal compression",
        items=(
            ("ETC1S", "ETC1S (small)", "Small files with lower normal-map quality"),
            ("UASTC", "UASTC (quality)", "Higher normal-map quality with larger files"),
        ),
        default="UASTC",
        description="KTX2 compression algorithm for normal maps",
    )
    ktx2_normal_scale: bpy.props.EnumProperty(
        name="Normal output resolution",
        items=(
            ("FULL", "100% (original)", "Keep the original normal-map resolution"),
            ("HALF", "50%", "Half width and height; 2048 becomes 1024"),
            ("QUARTER", "25%", "Quarter width and height; 2048 becomes 512"),
        ),
        default="HALF",
        description="Resolution of the normal map written to KTX2",
    )
    ktx2_other_encoding: bpy.props.EnumProperty(
        name="Other compression",
        items=(
            ("ETC1S", "ETC1S (small)", "Small files; recommended for most web textures"),
            ("UASTC", "UASTC (quality)", "Higher quality with larger files"),
        ),
        default="ETC1S",
        description="KTX2 compression algorithm for all textures except normal maps",
    )


# ----------------------------
# Operators
# ----------------------------

def _principled_socket(principled, *names):
    for name in names:
        socket = principled.inputs.get(name) if principled else None
        if socket is not None:
            return socket
    return None


def _socket_scalar(socket, default=0.0):
    if socket is None:
        return float(default)
    try:
        return float(socket.default_value)
    except (TypeError, ValueError):
        return float(default)


def _socket_rgb(socket, default=(1.0, 1.0, 1.0)):
    if socket is None:
        return [float(v) for v in default]
    value = getattr(socket, "default_value", default)
    try:
        return [float(value[0]), float(value[1]), float(value[2])]
    except (TypeError, IndexError):
        return [float(v) for v in default]


def _material_transparent_flag(material):
    for key in ("Transparent", "transparent"):
        try:
            if key in material and float(material[key]) >= 0.999:
                return True
        except (TypeError, ValueError):
            pass
    return False


def _is_glass_principled(material, principled):
    transmission = _principled_socket(principled, "Transmission Weight", "Transmission")
    return _material_transparent_flag(material) or (
        transmission is not None
        and not transmission.is_linked
        and _socket_scalar(transmission) >= 0.999
    )


def _principled_factors(material, principled, force_transmission=False):
    base = _principled_socket(principled, "Base Color")
    alpha = _principled_socket(principled, "Alpha")
    roughness = _principled_socket(principled, "Roughness")
    metalness = _principled_socket(principled, "Metallic")
    emission = _principled_socket(principled, "Emission Color", "Emission")
    emission_strength = _principled_socket(principled, "Emission Strength")
    transmission = _principled_socket(principled, "Transmission Weight", "Transmission")
    ior = _principled_socket(principled, "IOR")
    coat = _principled_socket(principled, "Coat Weight", "Clearcoat")
    coat_roughness = _principled_socket(principled, "Coat Roughness", "Clearcoat Roughness")

    base_rgb = [1.0, 1.0, 1.0] if base and base.is_linked else _socket_rgb(base, (0.8, 0.8, 0.8))
    alpha_value = 1.0 if alpha and alpha.is_linked else _socket_scalar(alpha, 1.0)
    emission_is_mapped = bool(
        (emission and emission.is_linked)
        or (emission_strength and emission_strength.is_linked)
    )
    transmission_value = 1.0 if force_transmission else (
        1.0 if transmission and transmission.is_linked else _socket_scalar(transmission, 0.0)
    )

    return {
        "baseColor": [*base_rgb, alpha_value],
        "roughness": 1.0 if roughness and roughness.is_linked else _socket_scalar(roughness, 0.5),
        "metalness": 1.0 if metalness and metalness.is_linked else _socket_scalar(metalness, 0.0),
        "normalScale": [1.0, 1.0],
        "emissive": [1.0, 1.0, 1.0] if emission_is_mapped else _socket_rgb(emission, (0.0, 0.0, 0.0)),
        "emissiveIntensity": 1.0 if emission_is_mapped else _socket_scalar(emission_strength, 0.0),
        "clearcoat": _socket_scalar(coat, 0.0) if not (coat and coat.is_linked) else 1.0,
        "clearcoatRoughness": _socket_scalar(coat_roughness, 0.03) if not (coat_roughness and coat_roughness.is_linked) else 1.0,
        "transmission": transmission_value,
        "thickness": max(0.0, float(material.get("thickness", 0.35 if force_transmission else 0.0))),
        "ior": max(1.0, _socket_scalar(ior, 1.5)),
    }


def _glass_shader_description(material, principled):
    if not _is_glass_principled(material, principled):
        return None
    factors = _principled_factors(material, principled, force_transmission=True)
    attenuation_color = material.get("attenuationColor", (1.0, 1.0, 1.0))
    try:
        attenuation_color = [float(attenuation_color[i]) for i in range(3)]
    except (TypeError, IndexError):
        attenuation_color = [1.0, 1.0, 1.0]
    return {
        "type": "glass-refraction",
        "parameters": {
            "color": factors["baseColor"][:3],
            "roughness": factors["roughness"],
            "metalness": factors["metalness"],
            "transmission": 1.0,
            "thickness": factors["thickness"],
            "ior": min(2.333, factors["ior"]),
            "attenuationColor": attenuation_color,
            "attenuationDistance": max(0.000001, float(material.get("attenuationDistance", 10.0))),
            "dispersion": max(0.0, min(1.0, float(material.get("dispersion", 0.0)))),
            "clearcoat": factors["clearcoat"],
            "clearcoatRoughness": factors["clearcoatRoughness"],
            "envMapIntensity": max(0.0, float(material.get("envMapIntensity", 1.0))),
            "doubleSided": not bool(getattr(material, "use_backface_culling", False)),
        },
    }

def _bake_principled_texture_set(context, plane, props, material, principled, output, state_dir, stem, created):
    """Bake only linked Principled inputs and return maps plus scalar factors."""
    _ensure_dir(state_dir)
    W, H = _compute_export_size(props, material)
    paths = {
        "baseColor": os.path.join(state_dir, "basecolor.png"),
        "metalness": os.path.join(state_dir, "metalness.png"),
        "roughness": os.path.join(state_dir, "roughness.png"),
        "alpha": os.path.join(state_dir, "alpha.png"),
        "emissive": os.path.join(state_dir, "emissive.png"),
        "normal": os.path.join(state_dir, "normal.png"),
        "transmission": os.path.join(state_dir, "transmission.png"),
    }
    base_image = None
    alpha_image = None
    exported_maps = {}

    def should_bake(path):
        return props.overwrite_existing or not os.path.exists(path)

    def new_image(label, colorspace, width=W, height=H):
        image = bpy.data.images.new(name=f"BAKE_{stem}_{label}", width=width, height=height, alpha=True)
        try:
            image.colorspace_settings.name = colorspace
        except RuntimeError:
            pass
        created.append(image)
        return image

    def bake_linked_scalar(socket_name, semantic):
        path = paths[semantic]
        socket = principled.inputs.get(socket_name)
        if not socket or not socket.is_linked:
            return None
        if should_bake(path):
            image = new_image(semantic, "Non-Color")
            _bake_channel_emit(context, plane, material, principled, socket_name, image, props.bake_margin)
            _save_image_png(image, path)
        exported_maps[semantic] = path
        return path

    surface, saved = _temporary_surface_shader(material, output, principled)
    try:
        base_socket = _principled_socket(principled, "Base Color")
        alpha_socket = _principled_socket(principled, "Alpha")
        base_is_linked = bool(base_socket and base_socket.is_linked)
        alpha_is_linked = bool(alpha_socket and alpha_socket.is_linked)

        if base_is_linked or alpha_is_linked:
            if should_bake(paths["baseColor"]):
                if base_is_linked:
                    base_image = new_image("basecolor", "sRGB")
                    _bake_channel_emit(context, plane, material, principled, "Base Color", base_image, props.bake_margin)
                else:
                    rgb = _socket_rgb(base_socket, (0.8, 0.8, 0.8))
                    base_image = _new_solid_image(
                        f"SOLID_{stem}_basecolor", W, H,
                        rgba=(rgb[0], rgb[1], rgb[2], 1.0), colorspace="sRGB",
                    )
                    created.append(base_image)
                _save_image_png(base_image, paths["baseColor"])
            exported_maps["baseColor"] = paths["baseColor"]

        bake_linked_scalar("Metallic", "metalness")
        bake_linked_scalar("Roughness", "roughness")

        if alpha_is_linked and should_bake(paths["alpha"]):
            alpha_image = new_image("alpha", "Non-Color")
            _bake_channel_emit(context, plane, material, principled, "Alpha", alpha_image, props.bake_margin)
            _save_image_png(alpha_image, paths["alpha"])
        elif alpha_is_linked and os.path.exists(paths["alpha"]):
            alpha_image = _load_image(paths["alpha"], created)

        emission = _principled_socket(principled, "Emission Color", "Emission")
        emission_strength = _principled_socket(principled, "Emission Strength")
        emission_is_linked = bool(
            (emission and emission.is_linked)
            or (emission_strength and emission_strength.is_linked)
        )
        if emission_is_linked and should_bake(paths["emissive"]):
            image = new_image("emissive", "sRGB")
            _bake_channel_emit(context, plane, material, principled, "Emission", image, props.bake_margin)
            _save_image_png(image, paths["emissive"])
        if emission_is_linked:
            exported_maps["emissive"] = paths["emissive"]

        normal_socket = _principled_socket(principled, "Normal")
        if normal_socket and normal_socket.is_linked and should_bake(paths["normal"]):
            image = new_image("normal", "Non-Color")
            if props.bake_normal_from_input:
                _bake_normal_from_principled_input(
                    context, plane, material, principled, image, props.bake_margin,
                )
            else:
                _bake_to_image(context, plane, material, image, bake_type="NORMAL", margin=props.bake_margin)
            _save_image_png(image, paths["normal"])
        if normal_socket and normal_socket.is_linked:
            exported_maps["normal"] = paths["normal"]

        transmission_socket = _principled_socket(principled, "Transmission Weight", "Transmission")
        if transmission_socket and transmission_socket.is_linked:
            bake_linked_scalar(transmission_socket.name, "transmission")
    finally:
        _restore_surface_links(material, surface, saved)

    if alpha_is_linked:
        if base_image is None and os.path.exists(paths["baseColor"]):
            base_image = _load_image(paths["baseColor"], created)
        if base_image is not None and alpha_image is not None:
            _make_basemap_with_alpha(
            base_image, alpha_image, f"BAKE_{stem}_basecolor_rgba",
            paths["baseColor"], created,
        )
        if os.path.isfile(paths["alpha"]):
            os.remove(paths["alpha"])

    factors = _principled_factors(
        material, principled,
        force_transmission=_material_transparent_flag(material),
    )
    return {"maps": exported_maps, "factors": factors}


def _manifest_state(texture_dir_relative, baked_state):
    prefix = texture_dir_relative.replace(os.sep, "/")
    maps = {
        semantic: f"{prefix}/{os.path.basename(path)}"
        for semantic, path in baked_state.get("maps", {}).items()
    }
    state = {"factors": baked_state.get("factors", {})}
    if maps:
        state["maps"] = maps
    return state


def _make_orm_image(ao, roughness, metalness, name, out_path, created):
    """Create glTF/Three.js ORM: R=AO, G=roughness, B=metalness."""
    target_size = _choose_pack_resolution(ao, roughness, metalness)
    if target_size is None:
        return None
    w, h = target_size
    output = bpy.data.images.new(name=name, width=w, height=h, alpha=True)
    try:
        output.colorspace_settings.name = "Non-Color"
    except RuntimeError:
        pass
    created.append(output)

    def sample(image, pixels, x, y, channel, fallback):
        if image is None or pixels is None:
            return fallback
        iw, ih = image.size
        sx = min(iw - 1, int(x * iw / w))
        sy = min(ih - 1, int(y * ih / h))
        return pixels[(sy * iw + sx) * 4 + channel]

    ao_pixels = ao.pixels[:] if ao else None
    roughness_pixels = roughness.pixels[:] if roughness else None
    metalness_pixels = metalness.pixels[:] if metalness else None
    pixels = [0.0] * (w * h * 4)
    for y in range(h):
        for x in range(w):
            index = (y * w + x) * 4
            pixels[index + 0] = sample(ao, ao_pixels, x, y, 0, 1.0)
            pixels[index + 1] = sample(roughness, roughness_pixels, x, y, 0, 1.0)
            pixels[index + 2] = sample(metalness, metalness_pixels, x, y, 0, 1.0)
            pixels[index + 3] = 1.0
    output.pixels[:] = pixels
    _save_image_png(output, out_path)
    return output


def _safe_manifest_asset_path(base_dir, manifest_dir, relative_path):
    candidate = os.path.abspath(os.path.join(manifest_dir, relative_path.replace("/", os.sep)))
    if os.path.commonpath((os.path.abspath(base_dir), candidate)) != os.path.abspath(base_dir):
        raise RuntimeError(f"Manifest texture path escapes export folder: {relative_path}")
    return candidate


def _pack_exported_orm(base_dir):
    packed = 0
    updated_manifests = 0
    for root, _dirs, filenames in os.walk(base_dir):
        for filename in filenames:
            if not filename.lower().endswith(".json"):
                continue
            manifest_path = os.path.join(root, filename)
            try:
                with open(manifest_path, "r", encoding="utf-8") as handle:
                    data = json.load(handle)
            except (OSError, json.JSONDecodeError):
                continue
            if data.get("version") != 1 or not isinstance(data.get("materials"), list):
                continue

            changed = False
            for material in data["materials"]:
                for state_name in ("from", "to"):
                    state = material.get(state_name)
                    if not isinstance(state, dict):
                        continue
                    maps = state.get("maps")
                    if not isinstance(maps, dict):
                        continue
                    source_entries = {
                        semantic: maps.get(semantic)
                        for semantic in ("ao", "roughness", "metalness")
                        if maps.get(semantic)
                    }
                    if not source_entries:
                        continue

                    created = []
                    loaded = {}
                    source_paths = {}
                    try:
                        for semantic, relative_path in source_entries.items():
                            source_path = _safe_manifest_asset_path(base_dir, root, relative_path)
                            if not os.path.isfile(source_path):
                                raise RuntimeError(f"Missing {semantic} texture: {source_path}")
                            source_paths[semantic] = source_path
                            loaded[semantic] = _load_image(source_path, created)
                            if loaded[semantic] is not None:
                                _ = loaded[semantic].pixels[0]

                        first_relative = next(iter(source_entries.values()))
                        state_relative_dir = os.path.dirname(first_relative).replace("\\", "/")
                        orm_relative = f"{state_relative_dir}/orm.png" if state_relative_dir else "orm.png"
                        orm_path = _safe_manifest_asset_path(base_dir, root, orm_relative)
                        _make_orm_image(
                            loaded.get("ao"), loaded.get("roughness"), loaded.get("metalness"),
                            f"ORM_{_safe_filename(material.get('target', 'Material'))}_{state_name}",
                            orm_path, created,
                        )
                        if not os.path.isfile(orm_path) or os.path.getsize(orm_path) == 0:
                            raise RuntimeError(f"ORM output was not created: {orm_path}")
                    finally:
                        for image in created:
                            _remove_image_safe(image)

                    for semantic in ("ao", "roughness", "metalness"):
                        maps.pop(semantic, None)
                    maps["orm"] = orm_relative
                    for source_path in set(source_paths.values()):
                        if os.path.abspath(source_path) != os.path.abspath(orm_path) and os.path.isfile(source_path):
                            os.remove(source_path)
                    packed += 1
                    changed = True

            if changed:
                with open(manifest_path, "w", encoding="utf-8") as handle:
                    json.dump(data, handle, ensure_ascii=False, indent=2)
                    handle.write("\n")
                updated_manifests += 1
    return packed, updated_manifests


def _manifest_referenced_textures(base_dir):
    referenced = set()
    for root, _dirs, filenames in os.walk(base_dir):
        for filename in filenames:
            if not filename.lower().endswith(".json"):
                continue
            path = os.path.join(root, filename)
            try:
                with open(path, "r", encoding="utf-8") as handle:
                    data = json.load(handle)
            except (OSError, json.JSONDecodeError):
                continue
            if data.get("version") != 1:
                continue
            for material in data.get("materials", []):
                for state_name in ("from", "to"):
                    for value in material.get(state_name, {}).get("maps", {}).values():
                        if isinstance(value, str):
                            referenced.add(_safe_manifest_asset_path(base_dir, root, value))
    return {os.path.normcase(os.path.abspath(path)) for path in referenced}


def _cleanup_unreferenced_export_textures(base_dir):
    referenced = _manifest_referenced_textures(base_dir)
    removed = 0
    for root, _dirs, filenames in os.walk(base_dir):
        if "textures" not in {part.lower() for part in os.path.relpath(root, base_dir).split(os.sep)}:
            continue
        for filename in filenames:
            if os.path.splitext(filename)[1].lower() not in {".png", ".webp", ".ktx2"}:
                continue
            path = os.path.normcase(os.path.abspath(os.path.join(root, filename)))
            if path not in referenced:
                os.remove(path)
                removed += 1
    textures_root = os.path.join(base_dir, "textures")
    if os.path.isdir(textures_root):
        for root, _dirs, _files in os.walk(textures_root, topdown=False):
            if root == textures_root:
                continue
            try:
                if not os.listdir(root):
                    os.rmdir(root)
            except OSError:
                pass
    return removed


def _update_manifest_texture_extensions(base_dir, extension):
    updated = 0
    for root, _dirs, filenames in os.walk(base_dir):
        for filename in filenames:
            if not filename.lower().endswith(".json"):
                continue
            path = os.path.join(root, filename)
            try:
                with open(path, "r", encoding="utf-8") as handle:
                    data = json.load(handle)
            except (OSError, json.JSONDecodeError):
                continue
            if data.get("version") != 1 or not isinstance(data.get("materials"), list):
                continue

            changed = False
            for material in data["materials"]:
                for state_name in ("from", "to"):
                    maps = material.get(state_name, {}).get("maps", {})
                    for semantic, value in list(maps.items()):
                        if isinstance(value, str) and value.lower().endswith(".png"):
                            maps[semantic] = os.path.splitext(value)[0] + extension
                            changed = True
            if changed:
                with open(path, "w", encoding="utf-8") as handle:
                    json.dump(data, handle, ensure_ascii=False, indent=2)
                    handle.write("\n")
                updated += 1
    return updated


def _convert_png_textures(
        context, base_dir, output_format, webp_quality,
        ktx2_normal_encoding="UASTC", ktx2_other_encoding="ETC1S",
        ktx2_normal_scale="HALF"):
    packed_orm, _orm_manifests = _pack_exported_orm(base_dir)
    png_paths = sorted(
        path for path in _manifest_referenced_textures(base_dir)
        if path.lower().endswith(".png") and os.path.isfile(path)
    )
    if not png_paths:
        removed = _cleanup_unreferenced_export_textures(base_dir)
        return 0, 0, packed_orm, removed

    if output_format == "KTX2":
        toktx = shutil.which("toktx")
        if not toktx and os.name == "nt":
            default_toktx = r"C:\Program Files\KTX-Software\bin\toktx.exe"
            if os.path.isfile(default_toktx):
                toktx = default_toktx
        if not toktx:
            raise RuntimeError(
                "KTX2 requires Khronos KTX-Software. Install it and add its bin folder "
                "(usually C:\\Program Files\\KTX-Software\\bin) to PATH"
            )
        for source in png_paths:
            target = os.path.splitext(source)[0] + ".ktx2"
            semantic = os.path.splitext(os.path.basename(source))[0].lower()
            oetf = "srgb" if semantic in {"basecolor", "emissive", "emission"} else "linear"
            selected_encoding = (
                ktx2_normal_encoding if semantic == "normal" else ktx2_other_encoding
            )
            encoding = selected_encoding.lower()
            encoding_options = []
            if encoding == "uastc":
                # Plain UASTC is large. RDO makes its blocks more compressible;
                # Zstd then losslessly supercompresses the KTX2 payload.
                rdo_lambda = "0.75" if semantic == "normal" else "1.0"
                encoding_options = ["--uastc_rdo_l", rdo_lambda, "--zcmp", "18"]
            resize_options = []
            if semantic == "normal":
                scale = {"FULL": None, "HALF": "0.5", "QUARTER": "0.25"}.get(
                    ktx2_normal_scale, "0.5"
                )
                if scale:
                    resize_options = ["--scale", scale]
            result = subprocess.run(
                [
                    toktx, "--t2", "--encode", encoding, "--genmipmap",
                    "--assign_oetf", oetf, "--assign_primaries", "bt709",
                    *encoding_options,
                    *resize_options,
                    target, source,
                ],
                capture_output=True, text=True,
            )
            if result.returncode != 0:
                raise RuntimeError(f"toktx failed for {os.path.basename(source)}: {result.stderr.strip()}")
        manifests = _update_manifest_texture_extensions(base_dir, ".ktx2")
        for source in png_paths:
            target = os.path.splitext(source)[0] + ".ktx2"
            if not os.path.isfile(target) or os.path.getsize(target) == 0:
                raise RuntimeError(f"KTX2 output was not created for {os.path.basename(source)}")
        for source in png_paths:
            os.remove(source)
        removed = _cleanup_unreferenced_export_textures(base_dir)
        return len(png_paths), manifests, packed_orm, removed

    for source in png_paths:
        image = bpy.data.images.load(source, check_existing=False)
        try:
            # Force lazy-loaded file pixels into memory before changing format.
            _ = image.pixels[0]
            target = os.path.splitext(source)[0] + ".webp"
            image.filepath_raw = target
            image.file_format = "WEBP"
            image.save(filepath=target, quality=int(webp_quality))
        finally:
            bpy.data.images.remove(image)
    manifests = _update_manifest_texture_extensions(base_dir, ".webp")
    for source in png_paths:
        target = os.path.splitext(source)[0] + ".webp"
        if not os.path.isfile(target) or os.path.getsize(target) == 0:
            raise RuntimeError(f"WebP output was not created for {os.path.basename(source)}")
    for source in png_paths:
        os.remove(source)
    removed = _cleanup_unreferenced_export_textures(base_dir)
    return len(png_paths), manifests, packed_orm, removed

class MBB_OT_bake_all(bpy.types.Operator):
    bl_idname = "mbb.bake_all"
    bl_label = "Bake All"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        props = context.scene.mbb_props
        out_dir = bpy.path.abspath(props.save_path)
        if not out_dir:
            self.report({"ERROR"}, "Save path is empty")
            return {"CANCELLED"}

        _ensure_dir(out_dir)

        objs = [o for o in context.selected_objects if o.type == "MESH"]
        if not objs:
            self.report({"ERROR"}, "Select at least one mesh object")
            return {"CANCELLED"}

        mats = []
        seen = set()
        for o in objs:
            for slot in o.material_slots:
                m = slot.material
                if m and m.name not in seen:
                    seen.add(m.name)
                    mats.append(m)

        if not mats:
            self.report({"ERROR"}, "No materials found on selected mesh objects")
            return {"CANCELLED"}

        _ensure_cycles(context)

        created_images = []
        plane = _create_temp_plane(context)

        try:
            ok = 0
            for mat in mats:
                safe = _safe_filename(mat.name)
                principled, _ = _find_principled_from_surface(mat)

                # Decide export resolution for this material
                W, H = _compute_export_size(props, mat)

                # base file paths
                f_basecolor = os.path.join(out_dir, f"{safe}_basecolor.png")
                f_metallic  = os.path.join(out_dir, f"{safe}_metallic.png")
                f_roughness = os.path.join(out_dir, f"{safe}_roughness.png")
                f_alpha     = os.path.join(out_dir, f"{safe}_alpha.png")
                f_emission  = os.path.join(out_dir, f"{safe}_emission.png")
                f_normal    = os.path.join(out_dir, f"{safe}_normal.png")

                def should_bake(path: str):
                    return props.overwrite_existing or (not os.path.exists(path))

                # Helpers: if socket is scalar and not linked -> create 64x64 solid map instead of baking
                def maybe_write_scalar_fallback(socket_name: str, out_path: str):
                    if not principled:
                        return False
                    sock = principled.inputs.get(socket_name)
                    if not sock:
                        return False
                    if sock.is_linked:
                        return False
                    if not _is_scalar_socket(sock):
                        return False

                    v = float(sock.default_value)
                    img = _new_solid_image(f"SOLID_{safe}_{socket_name}", 64, 64, rgba=(v, v, v, 1.0), colorspace="Non-Color")
                    created_images.append(img)
                    _save_image_png(img, out_path)
                    return True

                # Base Color (RGB) – bake (or solid at computed size if not linked)
                if should_bake(f_basecolor):
                    img = bpy.data.images.new(name=f"BAKE_{safe}_basecolor", width=W, height=H, alpha=True)
                    try:
                        img.colorspace_settings.name = "sRGB"
                    except:
                        pass
                    created_images.append(img)
                    _bake_channel_emit(context, plane, mat, principled, "Base Color", img, props.bake_margin)
                    _save_image_png(img, f_basecolor)

                # Metallic (VALUE) – 64x64 solid if not linked; else bake at computed size
                if should_bake(f_metallic):
                    if not maybe_write_scalar_fallback("Metallic", f_metallic):
                        img = bpy.data.images.new(name=f"BAKE_{safe}_metallic", width=W, height=H, alpha=True)
                        try:
                            img.colorspace_settings.name = "Non-Color"
                        except:
                            pass
                        created_images.append(img)
                        _bake_channel_emit(context, plane, mat, principled, "Metallic", img, props.bake_margin)
                        _save_image_png(img, f_metallic)

                # Roughness (VALUE) – 64x64 solid if not linked; else bake at computed size
                if should_bake(f_roughness):
                    if not maybe_write_scalar_fallback("Roughness", f_roughness):
                        img = bpy.data.images.new(name=f"BAKE_{safe}_roughness", width=W, height=H, alpha=True)
                        try:
                            img.colorspace_settings.name = "Non-Color"
                        except:
                            pass
                        created_images.append(img)
                        _bake_channel_emit(context, plane, mat, principled, "Roughness", img, props.bake_margin)
                        _save_image_png(img, f_roughness)

                # Alpha (VALUE) – 64x64 solid if not linked; else bake at computed size
                if should_bake(f_alpha):
                    if not maybe_write_scalar_fallback("Alpha", f_alpha):
                        img = bpy.data.images.new(name=f"BAKE_{safe}_alpha", width=W, height=H, alpha=True)
                        try:
                            img.colorspace_settings.name = "Non-Color"
                        except:
                            pass
                        created_images.append(img)
                        _bake_channel_emit(context, plane, mat, principled, "Alpha", img, props.bake_margin)
                        _save_image_png(img, f_alpha)

                # Emission (RGB) – bake Blender 5.x Emission Color × Emission Strength at computed size
                if should_bake(f_emission):
                    img = bpy.data.images.new(name=f"BAKE_{safe}_emission", width=W, height=H, alpha=True)
                    try:
                        img.colorspace_settings.name = "sRGB"
                    except:
                        pass
                    created_images.append(img)
                    _bake_channel_emit(context, plane, mat, principled, "Emission", img, props.bake_margin)
                    _save_image_png(img, f_emission)

                # Normal – bake at computed size (or fill #8080FF at that size if no input link)
                if should_bake(f_normal):
                    img = bpy.data.images.new(name=f"BAKE_{safe}_normal", width=W, height=H, alpha=True)
                    try:
                        img.colorspace_settings.name = "Non-Color"
                    except:
                        pass
                    created_images.append(img)

                    if props.bake_normal_from_input:
                        _bake_normal_from_principled_input(context, plane, mat, principled, img, props.bake_margin)
                    else:
                        _bake_to_image(context, plane, mat, img, bake_type="NORMAL", margin=props.bake_margin)

                    _save_image_png(img, f_normal)

                ok += 1

            self.report({"INFO"}, f"Bake done: {ok}/{len(mats)} materials. Saved to: {out_dir}")

        except Exception as e:
            print("\n[MBB] Bake failed:\n" + traceback.format_exc())
            self.report({"ERROR"}, f"{type(e).__name__}: {e}")
            return {"CANCELLED"}

        finally:
            try:
                _delete_object(plane)
            except:
                pass

            if props.remove_generated_images_from_blend:
                for img in list(created_images):
                    _remove_image_safe(img)

        return {"FINISHED"}


class MBB_OT_export_animated_threejs(bpy.types.Operator):
    bl_idname = "mbb.export_animated_threejs"
    bl_label = "Export animated mat JSON (three.js)"
    bl_description = "Bake animated Mix Shader materials and ordinary static Principled materials, then write a Three.js manifest"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        props = context.scene.mbb_props
        base_dir = bpy.path.abspath(props.save_path)
        if not base_dir:
            self.report({"ERROR"}, "Save path is empty")
            return {"CANCELLED"}

        selected = [obj for obj in context.selected_objects if obj.type == "MESH"]
        if not selected:
            self.report({"ERROR"}, "Select at least one mesh object")
            return {"CANCELLED"}

        candidates = []
        seen = set()
        rejected = []
        for obj in selected:
            for slot in obj.material_slots:
                material = slot.material
                if not material or material.as_pointer() in seen:
                    continue
                seen.add(material.as_pointer())
                found = _find_direct_animated_mix(material)
                if found:
                    mix, from_shader, to_shader, output = found
                    candidates.append(("animated", material, mix, from_shader, to_shader, output))
                else:
                    principled, output = _find_principled_from_surface(material)
                    if principled and output:
                        candidates.append(("static", material, None, principled, None, output))
                    else:
                        rejected.append(material.name)

        if not candidates:
            self.report({"ERROR"}, "No supported Principled BSDF materials found on selected objects")
            return {"CANCELLED"}

        out_dir = os.path.join(base_dir, "threejs")
        textures_dir = os.path.join(out_dir, "textures")
        _ensure_dir(textures_dir)
        selection_state = _fbx_capture_selection_state(context)
        created_images = []
        plane = None

        try:
            _ensure_cycles(context)
            plane = _create_temp_plane(context)
            manifest_materials = []
            used_dirs = set()

            animated_count = 0
            static_count = 0
            for kind, material, mix, from_shader, to_shader, output in candidates:
                base_safe = _safe_filename(material.name) or "Material"
                safe = base_safe
                suffix = 2
                while safe.lower() in used_dirs:
                    safe = f"{base_safe}_{suffix}"
                    suffix += 1
                used_dirs.add(safe.lower())
                material_dir = os.path.join(textures_dir, safe)
                states = [("from", from_shader)]
                if kind == "animated":
                    states.append(("to", to_shader))
                    animated_count += 1
                else:
                    static_count += 1

                baked_states = {}
                for state_name, shader in states:
                    baked_states[state_name] = _bake_principled_texture_set(
                        context, plane, props, material, shader, output,
                        os.path.join(material_dir, state_name), f"{safe}_{state_name}",
                        created_images,
                    )

                definition = {
                    "target": material.name,
                    "from": _manifest_state(
                        os.path.join("textures", safe, "from"), baked_states["from"],
                    ),
                }
                if kind == "animated":
                    definition["to"] = _manifest_state(
                        os.path.join("textures", safe, "to"), baked_states["to"],
                    )
                    blend = _mix_animation_track(material, mix, context.scene)
                    if blend:
                        definition["blend"] = blend
                glass_shader = (
                    _glass_shader_description(material, from_shader)
                    or (_glass_shader_description(material, to_shader) if to_shader else None)
                )
                if glass_shader:
                    definition["shader"] = glass_shader
                    definition["side"] = "double" if glass_shader["parameters"]["doubleSided"] else "front"
                manifest_materials.append(definition)

            scene = context.scene
            fps = float(scene.render.fps) / max(float(scene.render.fps_base), 0.000001)
            duration = max((float(scene.frame_end) - float(scene.frame_start)) / fps, 1.0 / fps)
            manifest = {
                "$schema": "/schemas/pbr-model-animation.schema.json",
                "version": 1,
                "timeline": {
                    "clips": "*",
                    "loop": "ping-pong",
                    "autoplay": True,
                    "speed": 1,
                    "duration": round(duration, 6),
                },
                "viewer": {
                    "background": "transparent",
                    "showEnvironment": False,
                    "environmentIntensity": 1,
                    "exposure": 1,
                    "autoRotate": False,
                },
                "materials": manifest_materials,
            }
            manifest_path = os.path.join(out_dir, "model-animation.json")
            with open(manifest_path, "w", encoding="utf-8") as handle:
                json.dump(manifest, handle, ensure_ascii=False, indent=2)
                handle.write("\n")
            legacy_manifest = os.path.join(out_dir, "pbr-model-animation.json")
            if os.path.isfile(legacy_manifest):
                os.remove(legacy_manifest)

            suffix = f"; skipped {len(rejected)} incompatible material(s)" if rejected else ""
            self.report(
                {"INFO"},
                f"Three.js export done: {animated_count} animated, {static_count} static material(s){suffix}. Output: {manifest_path}",
            )
            return {"FINISHED"}

        except Exception as exc:
            print("\n[MBB] Animated Three.js export failed:\n" + traceback.format_exc())
            self.report({"ERROR"}, f"{type(exc).__name__}: {exc}")
            return {"CANCELLED"}
        finally:
            _delete_object(plane)
            _fbx_restore_selection_state(context, selection_state)
            if props.remove_generated_images_from_blend:
                for image in list(created_images):
                    _remove_image_safe(image)


class MBB_OT_convert_web_textures(bpy.types.Operator):
    bl_idname = "mbb.convert_web_textures"
    bl_label = "Pack ORM + KTX2 / WebP"
    bl_description = "Pack AO/Roughness/Metalness into ORM, convert referenced textures, update manifests, and remove intermediates"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        props = context.scene.mbb_props
        base_dir = bpy.path.abspath(props.save_path)
        if not base_dir or not os.path.isdir(base_dir):
            self.report({"ERROR"}, "Save path folder does not exist")
            return {"CANCELLED"}
        try:
            count, manifests, packed_orm, removed = _convert_png_textures(
                context, base_dir, props.web_texture_format, props.webp_quality,
                props.ktx2_normal_encoding, props.ktx2_other_encoding,
                props.ktx2_normal_scale,
            )
            if not count and not packed_orm:
                self.report({"WARNING"}, "No PNG or unpacked ORM source textures found below Save path")
                return {"CANCELLED"}
            self.report(
                {"INFO"},
                f"Packed {packed_orm} ORM set(s), converted {count} texture(s) to "
                f"{props.web_texture_format}, updated {manifests} manifest(s), removed {removed} stale file(s)",
            )
            return {"FINISHED"}
        except Exception as exc:
            print("\n[MBB] Web texture conversion failed:\n" + traceback.format_exc())
            self.report({"ERROR"}, f"{type(exc).__name__}: {exc}")
            return {"CANCELLED"}


class MBB_OT_convert_unity_hdrp(bpy.types.Operator):
    bl_idname = "mbb.convert_unity_hdrp"
    bl_label = "Convert for Unity HDRP"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        props = context.scene.mbb_props
        base_dir = bpy.path.abspath(props.save_path)

        if not base_dir:
            self.report({"ERROR"}, "Save path is empty")
            return {"CANCELLED"}
        if not os.path.exists(base_dir):
            self.report({"ERROR"}, "Save path folder does not exist")
            return {"CANCELLED"}

        try:
            n = _convert_all_for_unity_variant(base_dir, "hdrp", remove_images=props.remove_generated_images_from_blend)
            out_dir = os.path.join(base_dir, "hdrp")
            self.report({"INFO"}, f"Unity HDRP conversion done for {n} material(s). Output: {out_dir}")
            return {"FINISHED"}
        except Exception as e:
            self.report({"ERROR"}, f"Error: {e}")
            return {"CANCELLED"}


class MBB_OT_convert_unity_urp(bpy.types.Operator):
    bl_idname = "mbb.convert_unity_urp"
    bl_label = "Convert for Unity URP"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        props = context.scene.mbb_props
        base_dir = bpy.path.abspath(props.save_path)

        if not base_dir:
            self.report({"ERROR"}, "Save path is empty")
            return {"CANCELLED"}
        if not os.path.exists(base_dir):
            self.report({"ERROR"}, "Save path folder does not exist")
            return {"CANCELLED"}

        try:
            n = _convert_all_for_unity_variant(base_dir, "urp", remove_images=props.remove_generated_images_from_blend)
            out_dir = os.path.join(base_dir, "urp")
            self.report({"INFO"}, f"Unity URP conversion done for {n} material(s). Output: {out_dir}")
            return {"FINISHED"}
        except Exception as e:
            self.report({"ERROR"}, f"Error: {e}")
            return {"CANCELLED"}


class MBB_OT_export_selected_hierarchies_fbx(bpy.types.Operator):
    bl_idname = "mbb.export_selected_hierarchies_fbx"
    bl_label = "Export Selected Hierarchies to FBX"
    bl_description = "Create one FBX for every selected root object and all of its children"
    bl_options = {"REGISTER", "UNDO"}

    def execute(self, context):
        roots = list(context.selected_objects)
        if not roots:
            self.report({"ERROR"}, "Select one or more root objects to export")
            return {"CANCELLED"}

        props = context.scene.mbb_props
        base_dir = bpy.path.abspath(props.save_path)
        if not base_dir:
            self.report({"ERROR"}, "Save path is empty")
            return {"CANCELLED"}

        fbx_dir = os.path.join(base_dir, "fbx")
        _ensure_dir(fbx_dir)

        # Preserve the original selection and viewport-hide state. Exporting a
        # hierarchy must not leave the scene in a different selection state.
        selection_state = _fbx_capture_selection_state(context)
        hide_state = {}
        for root in roots:
            for obj in _fbx_collect_hierarchy(root):
                if obj.as_pointer() not in hide_state:
                    try:
                        hide_state[obj.as_pointer()] = (obj, obj.hide_get())
                    except RuntimeError:
                        pass

        used_filenames = set()
        exported = 0

        try:
            for root in roots:
                objects = _fbx_collect_hierarchy(root)

                stem = _safe_filename(root.name) or "Untitled"
                unique_stem = stem
                suffix = 2
                while unique_stem.lower() in used_filenames:
                    unique_stem = f"{stem}_{suffix}"
                    suffix += 1
                used_filenames.add(unique_stem.lower())

                filepath = os.path.join(fbx_dir, f"{unique_stem}.fbx")
                _fbx_export_one(context, root, objects, filepath)
                exported += 1

            self.report({"INFO"}, f"FBX export done: {exported} file(s). Output: {fbx_dir}")
            return {"FINISHED"}

        except Exception as exc:
            print("[Material Bake + Unity Pack] FBX export failed:")
            traceback.print_exc()
            self.report({"ERROR"}, f"FBX export failed: {exc}")
            return {"CANCELLED"}

        finally:
            for obj, hidden in hide_state.values():
                try:
                    obj.hide_set(hidden)
                except (ReferenceError, RuntimeError):
                    pass
            _fbx_restore_selection_state(context, selection_state)


# ----------------------------
# UI
# ----------------------------

class MBB_PT_panel(bpy.types.Panel):
    bl_label = "Material Bake"
    bl_idname = "MBB_PT_panel"
    bl_space_type = "VIEW_3D"
    bl_region_type = "UI"
    bl_category = "Bake"

    def draw(self, context):
        layout = self.layout
        props = context.scene.mbb_props

        layout.prop(props, "save_path")
        layout.prop(props, "image_size")
        layout.prop(props, "bake_margin")
        layout.prop(props, "bake_normal_from_input")
        layout.prop(props, "overwrite_existing")
        layout.prop(props, "remove_generated_images_from_blend")

        layout.separator()

        layout.prop(props, "override_resolution")
        row = layout.row()
        row.enabled = props.override_resolution
        row.prop(props, "multiplier")

        layout.separator()

        col = layout.column(align=True)
        col.operator("mbb.bake_all", text="Bake All", icon="RENDER_STILL")
        col.operator(
            "mbb.export_animated_threejs",
            text="Export animated mat JSON (three.js)",
            icon="EXPORT",
        )
        col.separator()
        col.prop(props, "web_texture_format", text="Texture format")
        if props.web_texture_format == "WEBP":
            col.prop(props, "webp_quality")
        elif props.web_texture_format == "KTX2":
            col.prop(props, "ktx2_normal_encoding")
            col.prop(props, "ktx2_normal_scale")
            col.prop(props, "ktx2_other_encoding")
        col.operator(
            "mbb.convert_web_textures",
            text="Pack ORM + KTX2 / WebP",
            icon="FILE_REFRESH",
        )
        col.separator()
        col.operator("mbb.convert_unity_hdrp", text="Convert for Unity HDRP", icon="FILE_REFRESH")
        col.operator("mbb.convert_unity_urp", text="Convert for Unity URP", icon="FILE_REFRESH")
        col.separator()
        col.operator(
            "mbb.export_selected_hierarchies_fbx",
            text="Export Selected Hierarchies to FBX",
            icon="EXPORT",
        )


# ----------------------------
# Register
# ----------------------------

classes = (
    MBB_Props,
    MBB_OT_bake_all,
    MBB_OT_export_animated_threejs,
    MBB_OT_convert_web_textures,
    MBB_OT_convert_unity_hdrp,
    MBB_OT_convert_unity_urp,
    MBB_OT_export_selected_hierarchies_fbx,
    MBB_PT_panel,
)

def register():
    for c in classes:
        bpy.utils.register_class(c)
    bpy.types.Scene.mbb_props = bpy.props.PointerProperty(type=MBB_Props)

def unregister():
    if hasattr(bpy.types.Scene, "mbb_props"):
        del bpy.types.Scene.mbb_props
    for c in reversed(classes):
        bpy.utils.unregister_class(c)

if __name__ == "__main__":
    register()

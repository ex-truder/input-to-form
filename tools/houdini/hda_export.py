"""Export Houdini parameter descriptions and sampled animation for web playback.

No third-party dependencies. Import in Houdini, or run with hython. Importing this
module outside Houdini is supported for file validation and unit tests.
"""

import argparse
import contextlib
import datetime
from decimal import Decimal, ROUND_FLOOR
import hashlib
import json
import math
import os
from pathlib import Path
import platform
import re
import tempfile
import uuid

try:
    import hou
except ImportError:
    hou = None

VERSION = 1
EXPORTER_VERSION = "0.1.0"
_MISSING = object()


def _require_hou():
    if hou is None:
        raise RuntimeError("Run this function inside Houdini's Python Shell or with hython, not system Python.")


def _expand_string(value):
    text = getattr(hou, "text", None)
    expand = getattr(text, "expandString", None)
    return expand(value) if expand is not None else hou.expandString(value)


def _interrupted(exc):
    return hou is not None and isinstance(exc, getattr(hou, "OperationInterrupted", ()))


def _optional(obj, method, default=None):
    """Read an optional HOM property; never swallow user cancellation."""
    fn = getattr(obj, method, None)
    if not callable(fn):
        return default
    try:
        return fn()
    except Exception as exc:
        if _interrupted(exc):
            raise
        return default


def _enum(value):
    return str(value).rsplit(".", 1)[-1]


def _json_value(value):
    """Strict JSON, including explicit, reversible non-finite numeric markers."""
    if value is None or isinstance(value, (str, bool, int)):
        return value
    if isinstance(value, float):
        if math.isfinite(value):
            return value
        return {"$number": "NaN" if math.isnan(value) else ("Infinity" if value > 0 else "-Infinity")}
    if isinstance(value, (tuple, list)):
        return [_json_value(item) for item in value]
    if isinstance(value, dict):
        return {str(key): _json_value(item) for key, item in value.items()}
    enum_type = getattr(hou, "EnumValue", None) if hou is not None else None
    if enum_type is not None and isinstance(value, enum_type):
        return _enum(value)
    raise TypeError("Cannot serialize value of type {}".format(type(value).__name__))


def _canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)


def _identifier(prefix, value):
    return prefix + hashlib.sha256(_canonical(value).encode("utf-8")).hexdigest()[:24]


def sample_frames(start, end, step=1.0, max_samples=1000000):
    """Inclusive range with decimal arithmetic; include a non-aligned end frame."""
    numbers = [float(start), float(end), float(step)]
    if not all(math.isfinite(n) for n in numbers):
        raise ValueError("Frame range and step must be finite numbers.")
    if numbers[2] <= 0 or numbers[1] < numbers[0]:
        raise ValueError("Require end_frame >= start_frame and sample_step > 0.")
    first, last, stride = [Decimal(str(n)) for n in numbers]
    count = int(((last - first) / stride).to_integral_value(rounding=ROUND_FLOOR)) + 1
    tail = first + (count - 1) * stride != last
    if count + int(tail) > max_samples:
        raise ValueError("Sample count exceeds {}. Shorten the range or increase sample_step.".format(max_samples))
    frames = [float(first + i * stride) for i in range(count)]
    if tail:
        frames.append(float(last))
    return frames


class _Report:
    def __init__(self):
        self.issues = []
        self._index = {}

    def add(self, severity, code, location, message, frame=None):
        # Aggregate recurring failures rather than writing one warning per frame.
        key = (severity, code, location, str(message))
        if key in self._index:
            issue = self._index[key]
            issue["occurrences"] += 1
            issue["lastFrame"] = frame
            return
        issue = {"severity": severity, "code": code, "location": location,
                 "message": str(message), "occurrences": 1,
                 "firstFrame": frame, "lastFrame": frame}
        self._index[key] = issue
        self.issues.append(issue)


_TEMPLATE_METHODS = (
    "name", "label", "type", "dataType", "numComponents", "namingScheme", "look",
    "help", "tags", "conditionals", "isHidden", "isLabelHidden", "joinsWithNext",
    "defaultValue", "defaultExpression", "defaultExpressionLanguage",
    "minValue", "maxValue", "minIsStrict", "maxIsStrict", "hasMinValue", "hasMaxValue",
    "menuItems", "menuLabels", "menuType", "menuUseToken", "iconNames", "itemGeneratorScript",
    "itemGeneratorScriptLanguage", "scriptCallback", "scriptCallbackLanguage",
    "stringType", "fileType", "folderType", "isActualFolder", "endsTabGroup",
    "parmType", "defaultBasis", "colorType", "showControls", "isButtonStrip",
)
_ENUM_METHODS = {"type", "dataType", "namingScheme", "look", "menuType", "stringType",
                 "fileType", "folderType", "parmType", "defaultBasis", "colorType",
                 "scriptCallbackLanguage", "itemGeneratorScriptLanguage"}


class _Capture:
    def __init__(self, report, ramp_resolution, include_source):
        self.report = report
        self.ramp_resolution = ramp_resolution
        self.include_source = include_source
        self.templates = {}
        self.definitions = {}
        self.layouts = {}
        self.tracks = {}
        self.frame = None

    def template(self, template, location):
        data = {}
        for method in _TEMPLATE_METHODS:
            value = _optional(template, method, _MISSING)
            if value is _MISSING:
                continue
            try:
                data[method] = _enum(value) if method in _ENUM_METHODS else _json_value(value)
            except TypeError as exc:
                self.report.add("warning", "metadata_unavailable", location + "/" + method, exc, self.frame)
        children = _optional(template, "parmTemplates", ())
        if children:
            data["children"] = [self.template(child, location + "/" + child.name()) for child in children]
        if self.include_source:
            # This is archival text only. The web player must NEVER execute it.
            try:
                data["houdiniPythonSource"] = template.asCode()
            except Exception as exc:
                if _interrupted(exc):
                    raise
                self.report.add("warning", "template_source_unavailable", location, exc, self.frame)
        template_id = _identifier("tpl_", data)
        self.templates.setdefault(template_id, data)
        return template_id

    def _channel_source(self, parm):
        data = {"name": parm.name()}
        for method in ("rawValue", "unexpandedString", "expression", "expressionLanguage", "alias"):
            value = _optional(parm, method, _MISSING)
            if value is not _MISSING:
                data[method] = _enum(value) if method == "expressionLanguage" else _json_value(value)
        keys = []
        try:
            channel_keys = parm.keyframes()
        except Exception as exc:
            if _interrupted(exc):
                raise
            channel_keys = ()
            self.report.add("warning", "channel_source_unavailable", parm.path(), exc, self.frame)
        for key in channel_keys:
            try:
                keys.append(_json_value(key.asJSON()))
            except Exception as exc:
                if _interrupted(exc):
                    raise
                self.report.add("warning", "keyframe_source_unavailable", parm.path(), exc, self.frame)
        data["keyframes"] = keys
        if keys:
            for before, name in ((True, "before"), (False, "after")):
                try:
                    data.setdefault("extrapolation", {})[name] = _enum(parm.keyframeExtrapolation(before))
                except Exception as exc:
                    if _interrupted(exc):
                        raise
                    self.report.add("warning", "extrapolation_unavailable", parm.path(), exc, self.frame)
        return data

    def definition(self, node_id, parm_tuple):
        first = parm_tuple[0]
        parent = _optional(first, "parentMultiParm")
        data = {
            "nodeId": node_id,
            "name": parm_tuple.name(),
            "templateId": self.template(parm_tuple.parmTemplate(), first.path()),
            "componentNames": [p.name() for p in parm_tuple],
            "folders": list(_optional(first, "containingFolders", ())),
            "parentMultiparm": node_id + "/" + parent.tuple().name() if parent is not None else None,
            "multiparmIndices": list(_optional(first, "multiParmInstanceIndices", ())),
            "isMultiparmParent": _optional(first, "isMultiParmParent", False),
        }
        if data["isMultiparmParent"]:
            data["multiparmStartOffset"] = _optional(first, "multiParmStartOffset")
        definition_id = _identifier("def_", data)
        if definition_id not in self.definitions:
            data["firstSeenFrame"] = self.frame
            data["sourceChannels"] = [self._channel_source(p) for p in parm_tuple]
            self.definitions[definition_id] = data
        return definition_id

    def ramp(self, ramp):
        data = {
            "kind": "ramp", "positions": _json_value(ramp.keys()),
            "values": _json_value(ramp.values()),
            "basis": [_enum(b) for b in ramp.basis()],
        }
        color_type = _optional(ramp, "colorType", _MISSING)
        if color_type is not _MISSING:
            data["colorType"] = _enum(color_type)
        if self.ramp_resolution:
            positions = [i / float(self.ramp_resolution - 1) for i in range(self.ramp_resolution)]
            data["profile"] = {"positions": positions,
                               "values": [_json_value(ramp.lookup(x)) for x in positions]}
        return data

    def state(self, parm_tuple):
        template = parm_tuple.parmTemplate()
        kind = _enum(template.type())
        state = {"status": "ok", "components": []}
        for parm in parm_tuple:
            flags = {"name": parm.name()}
            for method in ("isHidden", "isDisabled", "isLocked"):
                value = _optional(parm, method, _MISSING)
                if value is not _MISSING:
                    flags[method] = value
            state["components"].append(flags)
        if kind in ("Button", "Label", "Separator"):
            state["status"] = "no_value"
            return state
        if kind not in ("Float", "Int", "String", "Toggle", "Menu", "Ramp", "Folder", "FolderSet"):
            state.update(status="unsupported", reason="Unsupported parameter type: " + kind)
            self.report.add("warning", "unsupported_type", parm_tuple[0].path(), state["reason"], self.frame)
            return state
        try:
            if kind == "Ramp":
                value = self.ramp(parm_tuple[0].evalAsRamp())
            else:
                values = []
                for parm in parm_tuple:
                    item = parm.evalAsString() if kind == "String" else parm.eval()
                    values.append(bool(item) if kind == "Toggle" else _json_value(item))
                value = values[0] if len(values) == 1 else values
            state["value"] = value
        except Exception as exc:
            if _interrupted(exc):
                raise
            state.update(status="error", reason=str(exc))
            self.report.add("error", "evaluation_failed", parm_tuple[0].path(), exc, self.frame)
        # Runtime menus can be generated by scripts; the list can change over time.
        has_menu = kind == "Menu" or bool(_optional(template, "menuItems", ()))
        has_menu = has_menu or bool(_optional(template, "itemGeneratorScript", ""))
        has_menu = has_menu or bool(_optional(parm_tuple[0], "isDynamicMenu", False))
        if has_menu:
            try:
                state["menu"] = {"tokens": list(parm_tuple[0].menuItems()),
                                 "labels": list(parm_tuple[0].menuLabels())}
            except Exception as exc:
                if _interrupted(exc):
                    raise
                state["menu"] = {"status": "error", "reason": str(exc)}
                self.report.add("warning", "menu_evaluation_failed", parm_tuple[0].path(), exc, self.frame)
        return state

    def node_sample(self, node_id, node, sample_index):
        node.updateParmStates()
        roots = [self.template(t, node.path() + "/" + t.name()) for t in node.parmTemplateGroup().entries()]
        active = {}
        states = {}
        for parm_tuple in node.parmTuples():
            if not len(parm_tuple):
                continue
            parameter_id = node_id + "/" + parm_tuple.name()
            active[parameter_id] = self.definition(node_id, parm_tuple)
            state = self.state(parm_tuple)
            states[parameter_id] = state
            track = self.tracks.setdefault(parameter_id, {"interpolation": "hold", "samples": []})
            samples = track["samples"]
            if not samples or samples[-1][1] != state:
                samples.append([sample_index, state])
        layout = {"nodeId": node_id, "templateIds": roots, "activeDefinitions": active}
        layout_id = _identifier("layout_", layout)
        self.layouts.setdefault(layout_id, layout)
        return layout_id, states


def _resolve_nodes(nodes):
    _require_hou()
    if nodes is None:
        nodes = hou.selectedNodes()
    elif isinstance(nodes, str) or hasattr(nodes, "parmTuples"):
        nodes = [nodes]
    resolved = {}
    for item in nodes:
        node = hou.node(item) if isinstance(item, str) else item
        if node is None or not hasattr(node, "parmTuples"):
            raise ValueError("Not a parameter-bearing Houdini node: {!r}".format(item))
        resolved[node.path()] = node
    if not resolved:
        raise ValueError("Select at least one node, or pass nodes=['/obj/path/to/node'].")
    # Stable IDs when selection order changes; paths remain in metadata.
    return [resolved[path] for path in sorted(resolved)]


def _output_paths(output_dir, name):
    if not isinstance(name, str) or not re.fullmatch(r"[\w-]+", name) or name in (".", ".."):
        raise ValueError("name must contain only letters, digits, underscores or hyphens.")
    if name.upper() in {"CON", "PRN", "AUX", "NUL"} | {"COM" + str(i) for i in range(1, 10)} | {"LPT" + str(i) for i in range(1, 10)}:
        raise ValueError("Reserved Windows filename: " + name)
    folder = Path(os.path.expandvars(os.path.expanduser(str(output_dir)))).resolve()
    return {key: folder / (name + suffix) for key, suffix in (
        ("parameters", ".parameters.json"), ("animation", ".animation.json"), ("report", ".report.json"))}


def _write_bundle(paths, documents, overwrite):
    for path in paths.values():
        if path.exists() and not overwrite:
            raise FileExistsError("{} exists. Use overwrite=True to replace this export.".format(path))
    next(iter(paths.values())).parent.mkdir(parents=True, exist_ok=True)
    staged = []
    try:
        for key, path in paths.items():
            with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", newline="\n", suffix=".tmp",
                                             prefix=".hda-export-", dir=str(path.parent), delete=False) as stream:
                staged.append((Path(stream.name), path))
                json.dump(documents[key], stream, ensure_ascii=False, indent=2, allow_nan=False)
                stream.write("\n")
        for source, target in staged:
            if overwrite:
                os.replace(str(source), str(target))
            else:
                # 'x' prevents overwriting a file created since the initial check.
                with target.open("x", encoding="utf-8", newline="\n") as dest:
                    dest.write(source.read_text(encoding="utf-8"))
                source.unlink()
    finally:
        for source, _ in staged:
            if source.exists():
                source.unlink()


def export_nodes(output_dir, nodes=None, name="demo", start_frame=None, end_frame=None,
                 sample_step=1.0, ramp_resolution=64, include_source=True,
                 overwrite=False, progress=True):
    """Export selected nodes or explicit node objects/paths. Return output paths.

    Samples ALL parameters, including hidden/default/non-keyed parameters. Frames
    advance sequentially, which may cook scene dependencies. Restores the current
    frame in finally. Does not save the HIP or change parameter values/keys.
    """
    selected = _resolve_nodes(nodes)
    if start_frame is None or end_frame is None:
        playback_start, playback_end = hou.playbar.playbackRange()
        start_frame = playback_start if start_frame is None else start_frame
        end_frame = playback_end if end_frame is None else end_frame
    frames = sample_frames(start_frame, end_frame, sample_step)
    if isinstance(ramp_resolution, bool) or not isinstance(ramp_resolution, int) or (ramp_resolution != 0 and not 2 <= ramp_resolution <= 4096):
        raise ValueError("ramp_resolution must be 0 (no profile), or an integer between 2 and 4096.")
    fps = float(hou.fps())
    if not math.isfinite(fps) or fps <= 0:
        raise ValueError("Scene FPS must be finite and greater than zero.")
    output_dir = _expand_string(str(output_dir))
    paths = _output_paths(output_dir, name)
    for path in paths.values():
        if path.exists() and not overwrite:
            raise FileExistsError("{} exists. Use overwrite=True to replace this export.".format(path))
    export_id = str(uuid.uuid4())
    created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    report = _Report()
    capture = _Capture(report, ramp_resolution, include_source)
    original_frame = hou.frame()
    timeline = {"fps": fps, "startFrame": frames[0], "endFrame": frames[-1],
                "sampleStep": float(sample_step), "sampleCount": len(frames),
                "timeOrigin": "first_sample", "lastSampleTime": (frames[-1] - frames[0]) / fps}
    nodes_data = []
    layout_tracks = {}
    for node in selected:
        node_id = _identifier("node_", node.path())
        node_type = node.type()
        nodes_data.append({"id": node_id, "path": node.path(), "name": node.name(),
                           "type": node_type.name(), "category": node_type.category().name(),
                           "description": node_type.description()})
        layout_tracks[node_id] = []
    operation = hou.InterruptableOperation("Export HDA parameters", open_interrupt_dialog=True) if progress else contextlib.nullcontext()
    try:
        with operation as op:
            for sample_index, frame in enumerate(frames):
                if op is not None:
                    op.updateProgress(sample_index / float(len(frames)))
                hou.setFrame(frame)
                capture.frame = frame
                for node_data, node in zip(nodes_data, selected):
                    layout_id, states = capture.node_sample(node_data["id"], node, sample_index)
                    changes = layout_tracks[node_data["id"]]
                    if not changes or changes[-1][1] != layout_id:
                        changes.append([sample_index, layout_id])
                    if sample_index == 0:
                        node_data["initialLayoutId"] = layout_id
                        node_data["initialStates"] = states
            if op is not None:
                op.updateProgress(1.0)
    finally:
        # Also restore after Esc or a fatal HOM exception. Never silently hide a
        # restoration failure, including deletion or scene changes by callbacks.
        hou.setFrame(original_frame)
        for node in selected:
            node.updateParmStates()
    common = {"version": VERSION, "exportId": export_id, "createdAt": created_at,
              "exporterVersion": EXPORTER_VERSION}
    parameters = dict(common, format="hda-demo.parameters", timeline=timeline,
                      source={"houdiniVersion": hou.applicationVersionString(), "pythonVersion": platform.python_version()},
                      nodes=nodes_data, templates=capture.templates,
                      definitions=capture.definitions, layouts=capture.layouts)
    animation = dict(common, format="hda-demo.animation", timeline=timeline,
                     sampleFrames=frames, sampleTimes=[(frame - frames[0]) / fps for frame in frames],
                     layoutTracks=layout_tracks, tracks=capture.tracks)
    errors = sum(i["severity"] == "error" for i in report.issues)
    warnings = sum(i["severity"] == "warning" for i in report.issues)
    export_report = dict(common, format="hda-demo.report", status="partial" if errors or warnings else "ok",
                         summary={"nodeCount": len(selected), "sampleCount": len(frames),
                                  "parameterTrackCount": len(capture.tracks), "errors": errors, "warnings": warnings},
                         issues=report.issues,
                         notes=["Time zero is the first sampled frame, not Houdini absolute time.",
                                "Tracks hold the last sample; use layoutTracks to filter active parameters.",
                                "Button presses are not events. Data parameters are explicitly unsupported.",
                                "Colors are raw Houdini parameter values; no OCIO/display conversion is applied.",
                                "Expression/menu evaluation may cook dependencies and run scene-provided scripts.",
                                "Exported callback/template source is archival text; never execute it in the web player."])
    documents = {"parameters": parameters, "animation": animation, "report": export_report}
    validate_bundle(parameters, animation)
    _write_bundle(paths, documents, overwrite)
    result = {key: str(path) for key, path in paths.items()}
    result["status"] = export_report["status"]
    result["summary"] = export_report["summary"]
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return result


def export_selected(output_dir, **kwargs):
    """Convenience alias for export_nodes(..., nodes=None)."""
    return export_nodes(output_dir, **kwargs)


def _held(samples, index):
    """Binary search for the state at or before a sample index."""
    low, high = 0, len(samples)
    while low < high:
        middle = (low + high) // 2
        if samples[middle][0] <= index:
            low = middle + 1
        else:
            high = middle
    return samples[low - 1][1] if low else _MISSING


def state_at_sample(parameters, animation, sample_index):
    """Reference decoder. Removed multiparm entries never leak into output."""
    if parameters["exportId"] != animation["exportId"]:
        raise ValueError("Files belong to different exports.")
    if not isinstance(sample_index, int) or not 0 <= sample_index < len(animation["sampleFrames"]):
        raise ValueError("sample_index outside exported range.")
    result = {}
    for node_id, changes in animation["layoutTracks"].items():
        layout_id = _held(changes, sample_index)
        layout = parameters["layouts"][layout_id]
        node_states = {}
        for parameter_id in layout["activeDefinitions"]:
            value = _held(animation["tracks"][parameter_id]["samples"], sample_index)
            if value is _MISSING:
                raise ValueError("Missing initial state for " + parameter_id)
            node_states[parameter_id] = value
        result[node_id] = node_states
    return result


def validate_bundle(parameters, animation):
    """Validate cross-file references and sparse-track ordering without hou."""
    for document, expected in ((parameters, "hda-demo.parameters"), (animation, "hda-demo.animation")):
        if document.get("format") != expected or document.get("version") != VERSION:
            raise ValueError("Unsupported document format/version.")
    if parameters["exportId"] != animation["exportId"] or parameters["timeline"] != animation["timeline"]:
        raise ValueError("Parameters and animation are from different exports.")
    count = animation["timeline"]["sampleCount"]
    frames, times = animation["sampleFrames"], animation["sampleTimes"]
    if not count or len(frames) != count or len(times) != count or times[0] != 0:
        raise ValueError("Invalid sample table.")
    if any(a >= b for a, b in zip(frames, frames[1:])) or any(a >= b for a, b in zip(times, times[1:])):
        raise ValueError("Sample frames and times must be strictly increasing.")
    node_ids = {node["id"] for node in parameters["nodes"]}
    if set(animation["layoutTracks"]) != node_ids:
        raise ValueError("Missing or unexpected node layout tracks.")
    for collection in (animation["tracks"], animation["layoutTracks"]):
        for key, track in collection.items():
            samples = track["samples"] if isinstance(track, dict) else track
            previous = -1
            if not samples:
                raise ValueError("Empty track: " + key)
            for index, _ in samples:
                if not isinstance(index, int) or not previous < index < count:
                    raise ValueError("Invalid sample indices for " + key)
                previous = index
    for template in parameters["templates"].values():
        for child_id in template.get("children", []):
            if child_id not in parameters["templates"]:
                raise ValueError("Missing child template: " + child_id)
    for definition in parameters["definitions"].values():
        if definition["templateId"] not in parameters["templates"] or definition["nodeId"] not in node_ids:
            raise ValueError("Invalid parameter definition.")
    for layout in parameters["layouts"].values():
        if layout["nodeId"] not in node_ids or any(t not in parameters["templates"] for t in layout["templateIds"]):
            raise ValueError("Invalid node layout.")
        for parameter_id, definition_id in layout["activeDefinitions"].items():
            if definition_id not in parameters["definitions"] or parameter_id not in animation["tracks"]:
                raise ValueError("Missing definition or track for " + parameter_id)
    for node in parameters["nodes"]:
        changes = animation["layoutTracks"][node["id"]]
        if changes[0] != [0, node["initialLayoutId"]]:
            raise ValueError("Invalid initial node layout.")
        for index, layout_id in changes:
            layout = parameters["layouts"][layout_id]
            if layout["nodeId"] != node["id"]:
                raise ValueError("Layout belongs to a different node.")
            for parameter_id in layout["activeDefinitions"]:
                if _held(animation["tracks"][parameter_id]["samples"], index) is _MISSING:
                    raise ValueError("Active parameter has no state: " + parameter_id)
    if state_at_sample(parameters, animation, 0) != {n["id"]: n["initialStates"] for n in parameters["nodes"]}:
        raise ValueError("Initial states disagree with animation.")
    # Catch unsupported Python objects and invalid JSON numbers before writing.
    _canonical(parameters)
    _canonical(animation)
    return True


def self_test(output_dir, overwrite=False, keep_node=False):
    """Run in Houdini. Build a disposable node and check real HOM evaluation."""
    _require_hou()
    original_frame = hou.frame()
    original_selection = hou.selectedNodes()
    node = hou.node("/obj").createNode("subnet", "hda_export_test_" + uuid.uuid4().hex[:8])
    try:
        group = node.parmTemplateGroup()
        fields = [
            hou.FloatParmTemplate("demo_amount", "Amount", 1, default_value=(0.0,)),
            hou.IntParmTemplate("demo_count", "Count", 1, default_value=(7,)),
            hou.FloatParmTemplate("demo_vector", "Vector", 3, default_value=(1.0, 2.0, 3.0)),
            hou.FloatParmTemplate("demo_color", "Color", 3, default_value=(0.2, 0.4, 0.6),
                                 look=hou.parmLook.ColorSquare, naming_scheme=hou.parmNamingScheme.RGBA),
            hou.ToggleParmTemplate("demo_enabled", "Enabled", default_value=True),
            hou.StringParmTemplate("demo_text", "Text", 1, default_value=("Тест $F",)),
            hou.StringParmTemplate("demo_choice", "String menu", 1, default_value=("a",),
                                   menu_items=("a", "b"), menu_labels=("First", "Second")),
            hou.MenuParmTemplate("demo_mode", "Mode", ("a", "b"), ("First", "Second")),
            hou.RampParmTemplate("demo_profile", "Profile", hou.rampParmType.Float),
            hou.RampParmTemplate("demo_gradient", "Gradient", hou.rampParmType.Color),
            hou.ButtonParmTemplate("demo_action", "Action"),
            hou.FolderParmTemplate("demo_items", "Items", (
                hou.FloatParmTemplate("demo_item#", "Item", 1),
            ), folder_type=hou.folderType.MultiparmBlock),
        ]
        group.append(hou.FolderParmTemplate("demo_folder", "Exporter test", fields))
        node.setParmTemplateGroup(group)
        for frame, value in ((1, 0.0), (3, 2.0)):
            key = hou.Keyframe()
            key.setFrame(frame)
            key.setValue(value)
            key.setExpression("linear()", hou.exprLanguage.Hscript)
            node.parm("demo_amount").setKeyframe(key)
        node.parm("demo_enabled").setExpression("$F >= 2", hou.exprLanguage.Hscript)
        node.parm("demo_profile").set(hou.Ramp((hou.rampBasis.Linear,) * 2, (0.0, 1.0), (0.0, 1.0)))
        node.parm("demo_gradient").set(hou.Ramp((hou.rampBasis.Linear,) * 2, (0.0, 1.0), ((1.0, 0.0, 0.0), (0.0, 0.0, 1.0))))
        node.parm("demo_profile2value").setExpression("$F", hou.exprLanguage.Hscript)
        node.parm("demo_items").set(2)
        node.parm("demo_item1").set(11.0)
        node.parm("demo_item2").set(22.0)
        result = export_nodes(output_dir, nodes=[node], name="self-test", start_frame=1,
                              end_frame=3, ramp_resolution=8, overwrite=overwrite, progress=False)
        parameters = json.loads(Path(result["parameters"]).read_text(encoding="utf-8"))
        animation = json.loads(Path(result["animation"]).read_text(encoding="utf-8"))
        node_id = parameters["nodes"][0]["id"]
        for index in range(3):
            states = state_at_sample(parameters, animation, index)[node_id]
            assert abs(states[node_id + "/demo_amount"]["value"] - index) < 1e-6
            assert states[node_id + "/demo_enabled"]["value"] == (index >= 1)
            assert states[node_id + "/demo_text"]["value"] == "Тест " + str(index + 1)
            assert states[node_id + "/demo_count"]["value"] == 7
            assert states[node_id + "/demo_vector"]["value"] == [1.0, 2.0, 3.0]
            assert states[node_id + "/demo_action"]["status"] == "no_value"
            assert states[node_id + "/demo_profile"]["value"]["positions"] == [0.0, 1.0]
            assert states[node_id + "/demo_profile"]["value"]["values"] == [0.0, float(index + 1)]
            assert abs(states[node_id + "/demo_profile"]["value"]["profile"]["values"][-1] - (index + 1)) < 1e-5
            assert states[node_id + "/demo_gradient"]["value"]["values"] == [[1.0, 0.0, 0.0], [0.0, 0.0, 1.0]]
            assert states[node_id + "/demo_choice"]["value"] == "a"
            assert states[node_id + "/demo_choice"]["menu"]["tokens"] == ["a", "b"]
            assert states[node_id + "/demo_mode"]["menu"]["labels"] == ["First", "Second"]
            assert all(abs(a - b) < 1e-6 for a, b in zip(states[node_id + "/demo_color"]["value"], (0.2, 0.4, 0.6)))
            assert states[node_id + "/demo_item2"]["value"] == 22.0
        assert hou.frame() == original_frame, "Exporter failed to restore the current frame"
        print("HDA exporter self-test PASSED")
        return result
    finally:
        hou.setFrame(original_frame)
        if not keep_node:
            node.destroy()
        for selected in original_selection:
            selected.setSelected(True)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, help="Output directory")
    parser.add_argument("--nodes", nargs="+", help="Node paths (otherwise current selection)")
    parser.add_argument("--name", default="demo")
    parser.add_argument("--start", type=float)
    parser.add_argument("--end", type=float)
    parser.add_argument("--step", type=float, default=1.0)
    parser.add_argument("--ramp-resolution", type=int, default=64)
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--no-source", action="store_true", help="Omit archival template Python source")
    parser.add_argument("--no-progress", action="store_true")
    parser.add_argument("--hip", help="Load a scene first (hython only; refuses to replace an unsaved scene)")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args(argv)
    _require_hou()
    if args.hip:
        if hou.isUIAvailable():
            parser.error("--hip is only allowed in hython. Use the already open scene in Houdini.")
        if hou.hipFile.hasUnsavedChanges():
            parser.error("Refusing to replace a scene with unsaved changes.")
        hou.hipFile.load(args.hip, suppress_save_prompt=True)
    if args.self_test:
        self_test(args.output, overwrite=args.overwrite)
    else:
        export_nodes(args.output, nodes=args.nodes, name=args.name, start_frame=args.start,
                     end_frame=args.end, sample_step=args.step, ramp_resolution=args.ramp_resolution,
                     include_source=not args.no_source, overwrite=args.overwrite, progress=not args.no_progress)


if __name__ == "__main__":
    main()

"""Run with Blender --background --factory-startup --python this-file."""
from pathlib import Path
import bpy
from pxr import Usd, UsdShade

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'ar-exports.local'
OUTPUT.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/projects/arthritis/model.glb'))
bpy.context.scene.render.fps = 24
bpy.context.scene.frame_start = 0
bpy.context.scene.frame_end = 104
bpy.ops.wm.usd_export(
    filepath=str(OUTPUT / 'spine.usdc'), export_animation=True,
    export_materials=True, export_textures_mode='KEEP',
    export_lights=False, export_cameras=False, convert_world_material=False, rename_uvmaps=True,
    generate_preview_surface=True, generate_materialx_network=False,
    export_shapekeys=True, export_armatures=True,
    root_prim_path='/Spine', convert_orientation=True,
    export_global_forward_selection='NEGATIVE_Z', export_global_up_selection='Y',
    convert_scene_units='METERS', meters_per_unit=1.0,
)
stage = Usd.Stage.Open(str(OUTPUT / 'spine.usdc'))
for prim in stage.Traverse():
    if prim.IsA(UsdShade.Material) or prim.IsA(UsdShade.Shader):
        print('USD_MATERIAL', prim.GetPath(), [(str(a.GetName()), str(a.Get())) for a in prim.GetAttributes() if a.GetName().startswith(('inputs:', 'info:'))])
print('USD_EXPORT_OK', stage.GetStartTimeCode(), stage.GetEndTimeCode())

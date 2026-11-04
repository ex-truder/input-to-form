"""Run in Blender's Python (pxr included), after bake-spine-sequence.py."""
from pathlib import Path
import json
import shutil
from pxr import Usd, UsdGeom, UsdShade, UsdUtils, Sdf, Gf

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'ar-exports.local/probe'
shutil.copyfile(ROOT / 'ar-exports.local/spine.usdc', OUT / 'spine.usdc')
stage = Usd.Stage.Open(str(OUT / 'spine.usdc'))
stage.SetDefaultPrim(stage.GetPrimAtPath('/Spine'))
stage.SetTimeCodesPerSecond(24)
stage.SetFramesPerSecond(24)
stage.SetStartTimeCode(0)
stage.SetEndTimeCode(208)
UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.y)
UsdGeom.SetStageMetersPerUnit(stage, 1)
stage.GetDefaultPrim().SetCustomDataByKey('testStatus', 'Experimental texture animation; unverified in Apple Quick Look')

# Mirror the authored GLB deformation to make a forward/backward loop.
for prim in stage.Traverse():
    for attr in prim.GetAttributes():
        for frame in attr.GetTimeSamples():
            attr.Set(attr.Get(frame), 208 - frame)

sequences = json.loads((OUT / 'sequence.json').read_text())
for name, samples in sequences.items():
    material = UsdShade.Material.Get(stage, f'/Spine/_materials/{name}')
    surface = UsdShade.Shader.Get(stage, f'{material.GetPath()}/Principled_BSDF')
    surface.GetInput('diffuseColor').Set(Gf.Vec3f(1))
    surface.GetInput('roughness').Set(1.0)
    surface.GetInput('metallic').Set(0.0)
    reader = UsdShade.Shader.Define(stage, f'{material.GetPath()}/UVReader')
    reader.CreateIdAttr('UsdPrimvarReader_float2')
    reader.CreateInput('varname', Sdf.ValueTypeNames.String).Set('st')
    reader.CreateOutput('result', Sdf.ValueTypeNames.Float2)
    for semantic in ('basecolor', 'normal', 'roughness', 'metallic', 'occlusion'):
        shader = UsdShade.Shader.Define(stage, f'{material.GetPath()}/{semantic}_sequence')
        shader.CreateIdAttr('UsdUVTexture')
        shader.CreateInput('st', Sdf.ValueTypeNames.Float2).ConnectToSource(reader.ConnectableAPI(), 'result')
        shader.CreateInput('sourceColorSpace', Sdf.ValueTypeNames.Token).Set('sRGB' if semantic == 'basecolor' else 'raw')
        source = shader.CreateInput('file', Sdf.ValueTypeNames.Asset)
        source.Set(Sdf.AssetPath(samples[0]['files'][semantic]))
        for sample in samples:
            asset = Sdf.AssetPath(sample['files'][semantic])
            source.Set(asset, sample['frame'])
            source.Set(asset, 208 - sample['frame'])
        if semantic == 'normal':
            shader.CreateInput('scale', Sdf.ValueTypeNames.Float4).Set(Gf.Vec4f(2, 2, 2, 1))
            shader.CreateInput('bias', Sdf.ValueTypeNames.Float4).Set(Gf.Vec4f(-1, -1, -1, 0))
        is_rgb = semantic in ('basecolor', 'normal')
        output = 'rgb' if is_rgb else 'r'
        shader.CreateOutput(output, Sdf.ValueTypeNames.Float3 if is_rgb else Sdf.ValueTypeNames.Float)
        input_name = 'diffuseColor' if semantic == 'basecolor' else semantic
        input_type = Sdf.ValueTypeNames.Color3f if semantic == 'basecolor' else Sdf.ValueTypeNames.Normal3f if semantic == 'normal' else Sdf.ValueTypeNames.Float
        surface.CreateInput(input_name, input_type).ConnectToSource(shader.ConnectableAPI(), output)

stage.GetRootLayer().Save()
target = ROOT / 'public/lab/models/arthritis-texture-probe.usdz'
with Sdf.ZipFileWriter.CreateNew(str(target)) as package:
    package.AddFile(str(OUT / 'spine.usdc'), 'spine.usdc')
    for texture in sorted(OUT.glob('*.png')):
        package.AddFile(str(texture), texture.name)
check = Usd.Stage.Open(str(target))
assert check and check.GetDefaultPrim() and check.GetEndTimeCode() == 208
animated_maps = [attr for prim in check.Traverse() for attr in prim.GetAttributes() if attr.GetName() == 'inputs:file' and attr.GetNumTimeSamples()]
assert len(animated_maps) == 10
missing = UsdUtils.ComputeAllDependencies(Sdf.AssetPath(str(target)))[2]
assert not missing, f'Unresolved dependencies: {missing}'
checker = UsdUtils.ComplianceChecker(arkit=True)
checker.CheckCompliance(str(target))
assert not checker.GetErrors(), checker.GetErrors()
assert not checker.GetFailedChecks(), checker.GetFailedChecks()
print('USDZ_PROBE_OK', target, target.stat().st_size, 'bytes;', len(animated_maps), 'animated texture inputs')

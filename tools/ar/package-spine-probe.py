"""Build native HQ geometry animation (--hq), or reproduce failed v2 probes."""
from pathlib import Path
import json
import shutil
import sys
from pxr import Usd, UsdGeom, UsdShade, UsdUtils, Sdf, Gf

ROOT = Path(__file__).resolve().parents[2]
HQ = '--hq' in sys.argv
OUT = ROOT / ('ar-exports.local/hq' if HQ else 'ar-exports.local/probe')
if HQ:
    HQ_MATERIALS = json.loads((OUT / 'materials.json').read_text())
    SEQUENCES = {name: [{'frame': 0, 'files': item['files']}] for name, item in HQ_MATERIALS.items()}
else:
    SEQUENCES = json.loads((OUT / 'sequence.json').read_text())
MANIFEST = json.loads((ROOT / 'public/projects/arthritis/model-animation.json').read_text())
DEFINITIONS = {item['target']: item for item in MANIFEST['materials']}


def build_package(animated_textures):
    stem = 'spine-hq-v3' if HQ else 'spine-v2' if animated_textures else 'spine-reference-v2'
    layer_path = OUT / f'{stem}.usdc'
    shutil.copyfile(ROOT / 'ar-exports.local/spine.usdc', layer_path)
    stage = Usd.Stage.Open(str(layer_path))
    stage.SetDefaultPrim(stage.GetPrimAtPath('/Spine'))
    stage.SetTimeCodesPerSecond(24)
    stage.SetFramesPerSecond(24)
    stage.SetStartTimeCode(0)
    stage.SetEndTimeCode(208)
    UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.y)
    UsdGeom.SetStageMetersPerUnit(stage, 1)
    stage.GetDefaultPrim().SetCustomDataByKey('testStatus', 'HQ v3: animated geometry with fixed full-resolution textures; no texture animation' if HQ else 'v2: texture sequence failed on tested iPhone; retained for reproduction only')

    # Both packages have identical geometry animation; only texture time samples differ.
    for prim in stage.Traverse():
        for attr in prim.GetAttributes():
            for frame in attr.GetTimeSamples():
                attr.Set(attr.Get(frame), 208 - frame)

    used_textures = set()
    for name, samples in SEQUENCES.items():
        material = UsdShade.Material.Get(stage, f'/Spine/_materials/{name}')
        surface = UsdShade.Shader.Get(stage, f'{material.GetPath()}/Principled_BSDF')
        surface.GetInput('diffuseColor').Set(Gf.Vec3f(1))
        surface.GetInput('roughness').Set(1.0)
        surface.GetInput('metallic').ClearSources()
        surface.GetInput('metallic').Set(0.0)
        surface.CreateInput('useSpecularWorkflow', Sdf.ValueTypeNames.Int).Set(0)
        reader = UsdShade.Shader.Define(stage, f'{material.GetPath()}/UVReader')
        reader.CreateIdAttr('UsdPrimvarReader_float2')
        reader.CreateInput('varname', Sdf.ValueTypeNames.String).Set('st')
        reader.CreateOutput('result', Sdf.ValueTypeNames.Float2)
        definition = DEFINITIONS[name]
        from_metallic = definition['from']['factors'].get('metalness', 1)
        to_metallic = definition.get('to', {}).get('factors', {}).get('metalness', from_metallic)
        semantics = ['basecolor', 'normal', 'roughness', 'occlusion']
        # Keep constant-zero metallic unconnected even if native texture loading fails.
        if from_metallic != 0 or to_metallic != 0:
            semantics.append('metallic')
        for semantic in semantics:
            shader = UsdShade.Shader.Define(stage, f'{material.GetPath()}/{semantic}_texture')
            shader.CreateIdAttr('UsdUVTexture')
            shader.CreateInput('st', Sdf.ValueTypeNames.Float2).ConnectToSource(reader.ConnectableAPI(), 'result')
            shader.CreateInput('sourceColorSpace', Sdf.ValueTypeNames.Token).Set('sRGB' if semantic == 'basecolor' else 'raw')
            shader.CreateInput('wrapS', Sdf.ValueTypeNames.Token).Set('repeat')
            shader.CreateInput('wrapT', Sdf.ValueTypeNames.Token).Set('repeat')
            fallback = Gf.Vec4f(.5, .5, 1, 1) if semantic == 'normal' else Gf.Vec4f(1)
            shader.CreateInput('fallback', Sdf.ValueTypeNames.Float4).Set(fallback)
            source = shader.CreateInput('file', Sdf.ValueTypeNames.Asset)
            source.Set(Sdf.AssetPath(samples[0]['files'][semantic]))
            used_textures.add(samples[0]['files'][semantic])
            if animated_textures:
                for sample in samples:
                    asset = Sdf.AssetPath(sample['files'][semantic])
                    used_textures.add(sample['files'][semantic])
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
    filename = 'arthritis-animated-hq-v3.usdz' if HQ else 'arthritis-texture-probe-v2.usdz' if animated_textures else 'arthritis-texture-reference-v2.usdz'
    target = ROOT / 'public/lab/models' / filename
    with Sdf.ZipFileWriter.CreateNew(str(target)) as package:
        package.AddFile(str(layer_path), layer_path.name)
        for filename in sorted(used_textures):
            package.AddFile(str(OUT / filename), filename)
    check = Usd.Stage.Open(str(target))
    assert check and check.GetDefaultPrim() and check.GetEndTimeCode() == 208
    animated_maps = [attr for prim in check.Traverse() for attr in prim.GetAttributes() if attr.GetName() == 'inputs:file' and attr.GetNumTimeSamples()]
    assert len(animated_maps) == (8 if animated_textures else 0)
    for name in SEQUENCES:
        metal = UsdShade.Shader.Get(check, f'/Spine/_materials/{name}/Principled_BSDF').GetInput('metallic')
        assert not metal.HasConnectedSource() and metal.Get() == 0, f'{name} must stay non-metallic'
    missing = UsdUtils.ComputeAllDependencies(Sdf.AssetPath(str(target)))[2]
    assert not missing, f'Unresolved dependencies: {missing}'
    checker = UsdUtils.ComplianceChecker(arkit=True)
    checker.CheckCompliance(str(target))
    assert not checker.GetErrors(), checker.GetErrors()
    assert not checker.GetFailedChecks(), checker.GetFailedChecks()
    print('USDZ_HQ_OK' if HQ else 'USDZ_V2_OK', target.name, target.stat().st_size, 'bytes;', len(animated_maps), 'animated texture inputs')


if HQ:
    build_package(animated_textures=False)
else:
    build_package(animated_textures=True)
    build_package(animated_textures=False)

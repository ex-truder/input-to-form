"""Prepare full-resolution native atlases, an Xcode project and a portable ZIP."""
from pathlib import Path
import hashlib
import json
import plistlib
import shutil
import struct
import zipfile
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
PROJECT = ROOT / 'ios/SpineAR'
GENERATED = PROJECT / 'Generated'
GENERATED.mkdir(parents=True, exist_ok=True)
DECODED = ROOT / 'ar-exports.local/decoded'
MANIFEST = json.loads((ROOT / 'public/projects/arthritis/model-animation.json').read_text())
HQ = ROOT / 'public/lab/models/arthritis-animated-hq-v3.usdz'
if not HQ.exists():
    raise SystemExit('Build the HQ USDZ first; see ios/SpineAR/README.md')

for target in ('lumbar_bone', 'lumbar_disk'):
    definition = next(item for item in MANIFEST['materials'] if item['target'] == target)
    atlas = Image.new('RGB', (4096, 5120))
    for state_index, state in enumerate(('from', 'to')):
        factors = definition[state]['factors']
        assert factors['baseColor'] == [1, 1, 1, 1]
        assert factors['roughness'] == 1 and factors['metalness'] == 0
        assert factors['normalScale'] == [1, 1]
        for kind, semantic in enumerate(('basecolor', 'orm', 'normal')):
            source = DECODED / target / state / semantic
            dimensions = json.loads(source.with_suffix('.json').read_text())
            side = 1024 if semantic == 'normal' else 2048
            assert (dimensions['width'], dimensions['height']) == (side, side)
            pixels = Image.frombytes('RGBA', (side, side), source.with_suffix('.rgba').read_bytes()).convert('RGB')
            origin = (state_index * 1024, 4096) if kind == 2 else (state_index * 2048, kind * 2048)
            atlas.paste(pixels, origin)
            # Verify every packed pixel against the original decoded texture.
            crop = atlas.crop((origin[0], origin[1], origin[0] + side, origin[1] + side))
            assert np.array_equal(np.asarray(pixels), np.asarray(crop))
    destination = GENERATED / f'{target}_atlas.png'
    atlas.save(destination, optimize=True)
    with Image.open(destination) as check:
        assert check.size == (4096, 5120)
    print('NATIVE_ATLAS_OK', destination.name, destination.stat().st_size, 'bytes')

shutil.copyfile(HQ, GENERATED / 'Spine.usdz')
shutil.copyfile(ROOT / 'public/projects/arthritis/model-animation.json', GENERATED / 'BlendManifest.json')
glb = (ROOT / 'public/projects/arthritis/model.glb').read_bytes()
gltf = json.loads(glb[20:20 + struct.unpack_from('<I', glb, 12)[0]])
bindings = {}
for mesh in gltf['meshes']:
    materials = {gltf['materials'][primitive['material']]['name'] for primitive in mesh['primitives']}
    if len(materials) == 1 and mesh.get('name'):
        bindings[mesh['name'].replace('.', '_')] = materials.pop()
for node in gltf['nodes']:
    if 'mesh' in node and node.get('name'):
        mesh = gltf['meshes'][node['mesh']]
        target = bindings.get(mesh.get('name', '').replace('.', '_'))
        if target:
            bindings[node['name'].replace('.', '_')] = target
assert {'lumbar_bone', 'lumbar_disk'}.issubset(set(bindings.values()))
half_duration = round(MANIFEST['timeline']['duration'] * 24) / 24
assert half_duration == 104 / 24, 'Re-export the native geometry for the changed timeline'
info = {'halfDuration': half_duration, 'cycleDuration': half_duration * 2, 'entityMaterials': bindings}
(GENERATED / 'NativeAssetInfo.json').write_text(json.dumps(info, indent=2))

app_info = {
    'CFBundleDevelopmentRegion': 'ru',
    'CFBundleDisplayName': 'Spine AR',
    'CFBundleExecutable': '$(EXECUTABLE_NAME)',
    'CFBundleIdentifier': '$(PRODUCT_BUNDLE_IDENTIFIER)',
    'CFBundleInfoDictionaryVersion': '6.0',
    'CFBundleName': '$(PRODUCT_NAME)',
    'CFBundlePackageType': 'APPL',
    'CFBundleShortVersionString': '0.1',
    'CFBundleVersion': '1',
    'LSRequiresIPhoneOS': True,
    'NSCameraUsageDescription': 'Камера нужна, чтобы разместить 3D-модель позвоночника в пространстве.',
    'UIRequiredDeviceCapabilities': ['arkit', 'metal'],
    'UILaunchScreen': {},
    'UIApplicationSceneManifest': {'UIApplicationSupportsMultipleScenes': False},
    'UISupportedInterfaceOrientations': ['UIInterfaceOrientationPortrait', 'UIInterfaceOrientationLandscapeLeft', 'UIInterfaceOrientationLandscapeRight'],
}
(PROJECT / 'Info.plist').write_bytes(plistlib.dumps(app_info))

# Use standard Xcode project objects; no project-generation dependency on the Mac.
objects = {}
def uid(name):
    return hashlib.sha256(name.encode()).hexdigest()[:24].upper()
def add(object_name, isa, **values):
    key = uid(object_name)
    objects[key] = {'isa': isa, **values}
    return key

source_builds, resource_builds, source_refs, resource_refs = [], [], [], []
for path in sorted((PROJECT / 'Sources').iterdir()):
    if path.suffix not in ('.swift', '.metal'):
        continue
    ref = add('file:' + path.name, 'PBXFileReference', lastKnownFileType='sourcecode.swift' if path.suffix == '.swift' else 'sourcecode.metal', path=path.name, sourceTree='<group>')
    source_refs.append(ref)
    source_builds.append(add('build:' + path.name, 'PBXBuildFile', fileRef=ref))
for path in sorted(GENERATED.iterdir()):
    if path.suffix not in ('.png', '.json', '.usdz'):
        continue
    file_type = {'.png': 'image.png', '.json': 'text.json', '.usdz': 'file.usdz'}[path.suffix]
    ref = add('file:' + path.name, 'PBXFileReference', lastKnownFileType=file_type, path=path.name, sourceTree='<group>')
    resource_refs.append(ref)
    resource_builds.append(add('build:' + path.name, 'PBXBuildFile', fileRef=ref))
sources = add('sources', 'PBXGroup', path='Sources', sourceTree='<group>', children=source_refs)
resources = add('resources', 'PBXGroup', path='Generated', sourceTree='<group>', children=resource_refs)
plist = add('plist', 'PBXFileReference', lastKnownFileType='text.plist.xml', path='Info.plist', sourceTree='<group>')
product = add('product', 'PBXFileReference', explicitFileType='wrapper.application', includeInIndex='0', path='SpineAR.app', sourceTree='BUILT_PRODUCTS_DIR')
products = add('products', 'PBXGroup', name='Products', sourceTree='<group>', children=[product])
main = add('main', 'PBXGroup', sourceTree='<group>', children=[sources, resources, plist, products])
source_phase = add('source-phase', 'PBXSourcesBuildPhase', buildActionMask='2147483647', files=source_builds, runOnlyForDeploymentPostprocessing='0')
resource_phase = add('resource-phase', 'PBXResourcesBuildPhase', buildActionMask='2147483647', files=resource_builds, runOnlyForDeploymentPostprocessing='0')
framework_phase = add('framework-phase', 'PBXFrameworksBuildPhase', buildActionMask='2147483647', files=[], runOnlyForDeploymentPostprocessing='0')

project_configs, target_configs = [], []
for mode in ('Debug', 'Release'):
    base = {'SDKROOT': 'iphoneos', 'IPHONEOS_DEPLOYMENT_TARGET': '17.0', 'SWIFT_VERSION': '5.0', 'CLANG_ENABLE_MODULES': 'YES', 'ENABLE_USER_SCRIPT_SANDBOXING': 'YES'}
    project_configs.append(add('project:' + mode, 'XCBuildConfiguration', name=mode, buildSettings=base))
    settings = {'PRODUCT_NAME': '$(TARGET_NAME)', 'PRODUCT_BUNDLE_IDENTIFIER': 'pro.kustart.spinearprototype', 'CODE_SIGN_STYLE': 'Automatic', 'DEVELOPMENT_TEAM': '', 'INFOPLIST_FILE': 'Info.plist', 'GENERATE_INFOPLIST_FILE': 'NO', 'TARGETED_DEVICE_FAMILY': '1,2', 'SWIFT_OPTIMIZATION_LEVEL': '-Onone' if mode == 'Debug' else '-O', 'SWIFT_ACTIVE_COMPILATION_CONDITIONS': 'DEBUG' if mode == 'Debug' else '', 'MTL_FAST_MATH': 'YES'}
    target_configs.append(add('target:' + mode, 'XCBuildConfiguration', name=mode, buildSettings=settings))
project_config_list = add('project-configs', 'XCConfigurationList', buildConfigurations=project_configs, defaultConfigurationIsVisible='0', defaultConfigurationName='Release')
target_config_list = add('target-configs', 'XCConfigurationList', buildConfigurations=target_configs, defaultConfigurationIsVisible='0', defaultConfigurationName='Release')
target = add('target', 'PBXNativeTarget', name='SpineAR', productName='SpineAR', productType='com.apple.product-type.application', productReference=product, buildConfigurationList=target_config_list, buildPhases=[source_phase, framework_phase, resource_phase], buildRules=[], dependencies=[])
project = add('project', 'PBXProject', attributes={'LastUpgradeCheck': '1600', 'TargetAttributes': {target: {'CreatedOnToolsVersion': '16.0'}}}, buildConfigurationList=project_config_list, compatibilityVersion='Xcode 14.0', developmentRegion='ru', knownRegions=['ru', 'en', 'Base'], mainGroup=main, productRefGroup=products, projectDirPath='', projectRoot='', targets=[target])

def openstep(value, depth=0):
    pad = '\t' * depth
    if isinstance(value, dict):
        return '{\n' + ''.join('\t' * (depth + 1) + json.dumps(key) + ' = ' + openstep(item, depth + 1) + ';\n' for key, item in value.items()) + pad + '}'
    if isinstance(value, list):
        return '(\n' + ''.join('\t' * (depth + 1) + openstep(item, depth + 1) + ',\n' for item in value) + pad + ')'
    return json.dumps(str(value))

document = {'archiveVersion': '1', 'classes': {}, 'objectVersion': '56', 'objects': objects, 'rootObject': project}
xcode = PROJECT / 'SpineAR.xcodeproj'
xcode.mkdir(exist_ok=True)
(xcode / 'project.pbxproj').write_text('// !$*UTF8*$!\n' + openstep(document) + '\n')
scheme_dir = xcode / 'xcshareddata/xcschemes'
scheme_dir.mkdir(parents=True, exist_ok=True)
reference = f'<BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="{target}" BuildableName="SpineAR.app" BlueprintName="SpineAR" ReferencedContainer="container:SpineAR.xcodeproj"/>'
scheme = f'''<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion="1600" version="1.3">
  <BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES"><BuildActionEntries><BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES">{reference}</BuildActionEntry></BuildActionEntries></BuildAction>
  <TestAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" shouldUseLaunchSchemeArgsEnv="YES"><Testables/></TestAction>
  <LaunchAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" launchStyle="0" useCustomWorkingDirectory="NO" ignoresPersistentStateOnLaunch="NO" debugDocumentVersioning="YES" debugServiceExtension="internal" allowLocationSimulation="YES"><BuildableProductRunnable runnableDebuggingMode="0">{reference}</BuildableProductRunnable></LaunchAction>
  <ProfileAction buildConfiguration="Release" shouldUseLaunchSchemeArgsEnv="YES" savedToolIdentifier="" useCustomWorkingDirectory="NO" debugDocumentVersioning="YES"><BuildableProductRunnable runnableDebuggingMode="0">{reference}</BuildableProductRunnable></ProfileAction>
  <AnalyzeAction buildConfiguration="Debug"/>
  <ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/>
</Scheme>'''
ET.fromstring(scheme)
(scheme_dir / 'SpineAR.xcscheme').write_text(scheme)

# Ensure all references in the generated object graph resolve before handoff.
assert document['rootObject'] in objects
for item in objects.values():
    for key in ('fileRef', 'mainGroup', 'productRefGroup', 'productReference', 'buildConfigurationList'):
        if key in item:
            assert item[key] in objects
    for key in ('children', 'buildPhases', 'files', 'buildConfigurations', 'targets'):
        assert all(reference in objects for reference in item.get(key, []))
assert plistlib.loads((PROJECT / 'Info.plist').read_bytes())['NSCameraUsageDescription']

artifact_dir = ROOT / 'artifacts'
artifact_dir.mkdir(exist_ok=True)
archive_path = artifact_dir / 'SpineAR-iOS-prototype.zip'
with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in PROJECT.rglob('*'):
        if path.is_file() and 'xcuserdata' not in path.parts:
            archive.write(path, Path('SpineAR') / path.relative_to(PROJECT))
with zipfile.ZipFile(archive_path) as archive:
    assert archive.testzip() is None
print('IOS_SOURCE_PACKAGE_OK', archive_path, archive_path.stat().st_size, 'bytes; Xcode compilation still required')

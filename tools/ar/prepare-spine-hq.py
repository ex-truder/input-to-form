"""Prepare fixed native-AR maps directly from full-resolution decoded KTX2."""
from pathlib import Path
import json
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'ar-exports.local/decoded'
OUT = ROOT / 'ar-exports.local/hq'
OUT.mkdir(parents=True, exist_ok=True)
manifest = json.loads((ROOT / 'public/projects/arthritis/model-animation.json').read_text())
materials = {}

for definition in manifest['materials']:
    name = definition['target']
    if not definition.get('from', {}).get('maps'):
        continue
    factors = definition['from']['factors']
    files = {}
    sizes = {}
    for semantic in ('basecolor', 'normal', 'orm'):
        source = SOURCE / name / 'from' / semantic
        dimensions = json.loads(source.with_suffix('.json').read_text())
        image = Image.frombytes('RGBA', (dimensions['width'], dimensions['height']), source.with_suffix('.rgba').read_bytes()).convert('RGB')
        # No intermediate web PNG, resizing or upscaling: preserve the original maps.
        if semantic == 'basecolor':
            color = factors.get('baseColor', [1, 1, 1, 1])[:3]
            if color != [1, 1, 1]:
                pixels = np.asarray(image, dtype=np.float32) / 255
                linear = np.where(pixels <= .04045, pixels / 12.92, ((pixels + .055) / 1.055) ** 2.4)
                linear *= np.asarray(color)
                pixels = np.where(linear <= .0031308, linear * 12.92, 1.055 * linear ** (1 / 2.4) - .055)
                image = Image.fromarray(np.clip(np.rint(pixels * 255), 0, 255).astype('uint8'))
            channels = {'basecolor': image}
        elif semantic == 'normal':
            assert factors.get('normalScale', [1, 1]) == [1, 1], 'Normal scaling must be baked before export'
            channels = {'normal': image}
        else:
            red, green, blue = image.split()
            def multiply(channel, factor):
                values = np.asarray(channel, dtype=np.float32) * factor
                return Image.fromarray(np.clip(np.rint(values), 0, 255).astype('uint8')).convert('RGB')
            channels = {
                'occlusion': red.convert('RGB'),
                'roughness': multiply(green, factors.get('roughness', 1)),
                'metallic': multiply(blue, factors.get('metalness', 1)),
            }
        for channel, result in channels.items():
            filename = f'{name}_{channel}_hq.png'
            destination = OUT / filename
            result.save(destination, optimize=True)
            with Image.open(destination) as check:
                assert check.size == (dimensions['width'], dimensions['height'])
                if channel == 'metallic':
                    assert factors['metalness'] == 0 and check.getextrema() == ((0, 0), (0, 0), (0, 0))
            files[channel] = filename
            sizes[channel] = list(result.size)
    materials[name] = {'files': files, 'sizes': sizes}
    print('HQ_MAPS', name, sizes)
(OUT / 'materials.json').write_text(json.dumps(materials, indent=2))

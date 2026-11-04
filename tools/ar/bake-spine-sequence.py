"""Bake a small texture-sequence compatibility probe, not a verified iOS asset."""
from pathlib import Path
import json
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'ar-exports.local/probe'
OUT.mkdir(parents=True, exist_ok=True)
manifest = json.loads((ROOT / 'public/projects/arthritis/model-animation.json').read_text())
sequences = {}

def evaluate(keys, progress):
    if progress <= keys[0]['progress']:
        return keys[0]['value']
    for left, right in zip(keys, keys[1:]):
        if progress <= right['progress']:
            t = (progress - left['progress']) / (right['progress'] - left['progress'])
            t = t * t * (3 - 2 * t)
            return left['value'] + (right['value'] - left['value']) * t
    return keys[-1]['value']

for definition in manifest['materials']:
    name = definition['target']
    if 'blend' not in definition:
        continue
    inputs = {}
    for semantic in ('basecolor', 'normal', 'orm'):
        inputs[semantic] = [np.asarray(Image.open(ROOT / f'public/projects/arthritis/textures-web/{name}/{state}/{semantic}.png').convert('RGB').resize((256, 256)), dtype=np.float32) / 255 for state in ('from', 'to')]
    samples = []
    generated = {}
    for frame in range(105):
        amount = round(evaluate(definition['blend']['keyframes'], frame / 104) * 24) / 24
        step = round(amount * 24)
        if step not in generated:
            paths = {}
            for semantic, (start, end) in inputs.items():
                if semantic == 'basecolor':
                    linear = lambda x: np.where(x <= .04045, x / 12.92, ((x + .055) / 1.055) ** 2.4)
                    mixed = linear(start) * (1 - amount) + linear(end) * amount
                    mixed = np.where(mixed <= .0031308, mixed * 12.92, 1.055 * mixed ** (1 / 2.4) - .055)
                else:
                    mixed = start * (1 - amount) + end * amount
                pixels = np.clip(np.rint(mixed * 255), 0, 255).astype('uint8')
                channels = {'basecolor': pixels} if semantic == 'basecolor' else {'normal': pixels} if semantic == 'normal' else {'occlusion': pixels[:, :, 0], 'roughness': pixels[:, :, 1], 'metallic': pixels[:, :, 2]}
                for channel, data in channels.items():
                    filename = f'{name}_{channel}_{step:02}.png'
                    Image.fromarray(data).save(OUT / filename, optimize=True)
                    paths[channel] = filename
            generated[step] = paths
        samples.append({'frame': frame, 'files': generated[step]})
    sequences[name] = samples
    print(name, len(generated), 'unique texture stages')
(OUT / 'sequence.json').write_text(json.dumps(sequences))

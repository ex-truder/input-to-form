"""Prepare browser PNGs from decoded KTX2 maps. Requires Pillow and numpy."""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'ar-exports.local/decoded'
DESTINATION = ROOT / 'public/projects/arthritis/textures-web'

for metadata in SOURCE.rglob('*.json'):
    size = json.loads(metadata.read_text())
    image = Image.frombytes('RGBA', (size['width'], size['height']), metadata.with_suffix('.rgba').read_bytes())
    image.thumbnail((512, 512), Image.Resampling.LANCZOS)
    destination = DESTINATION / metadata.relative_to(SOURCE).with_suffix('.png')
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, optimize=True)
    print(destination.relative_to(ROOT), image.size)

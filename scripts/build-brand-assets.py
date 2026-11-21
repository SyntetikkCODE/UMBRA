"""Prepare the supplied HEXAGONE logo for the app; no recoloring or redrawing."""
from pathlib import Path
from PIL import Image
import sys

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'assets/hexagone-source.png'
original = Image.open(source).convert('RGBA')
if source.resolve() != (root / 'assets/hexagone-source.png').resolve():
    (root / 'assets/hexagone-source.png').write_bytes(source.read_bytes())
# Ignore practically invisible alpha pixels when calculating the content bounds.
bounds = original.getchannel('A').point(lambda a: 255 if a >= 8 else 0).getbbox()
if not bounds:
    raise ValueError('The supplied logo is empty')
mark = original.crop(bounds)
canvas = Image.new('RGBA', (1024, 1024))
mark.thumbnail((960, 960), Image.Resampling.LANCZOS)
canvas.alpha_composite(mark, ((1024-mark.width)//2, (1024-mark.height)//2))
canvas.resize((512, 512), Image.Resampling.LANCZOS).save(root / 'assets/hexagone-logo.png')
canvas.save(root / 'assets/hexagone.ico', sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
print('Prepared HEXAGONE PNG and Windows icon from the original supplied logo.')

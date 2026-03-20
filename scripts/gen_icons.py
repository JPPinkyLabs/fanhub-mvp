"""
Generate FanHub PWA icons.
Logo: concentric star polygon (#39ff14 neon green) on dark background (#0a0a0a).
"""
import cairosvg
import os

OUT = '/home/user/workspace/fanhub-mvp/public/icons'
os.makedirs(OUT, exist_ok=True)

def make_svg(size: int) -> str:
    """
    Build the FanHub icon SVG at a given canvas size.
    Design mirrors the Sidebar SVG logo: circle + star polygon + center dot, all in brand-500 (#39ff14).
    """
    # Scale factors relative to original 32x32 viewBox
    scale = size / 32
    cx = size / 2
    cy = size / 2
    r_circle = 15 * scale        # outer circle radius
    r_center = 3 * scale         # center dot radius
    stroke = max(1.5, 1.5 * scale)

    # Star polygon points (original: 16,6 20,13 28,14 22,20 24,28 16,24 8,28 10,20 4,14 12,13)
    raw = [(16,6),(20,13),(28,14),(22,20),(24,28),(16,24),(8,28),(10,20),(4,14),(12,13)]
    pts = " ".join(f"{x*scale:.1f},{y*scale:.1f}" for x, y in raw)

    # Padding so strokes are not clipped
    pad = stroke
    vb_start = -pad
    vb_size = size + 2 * pad

    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="{vb_start} {vb_start} {vb_size} {vb_size}">
  <!-- Background -->
  <rect width="{size}" height="{size}" x="0" y="0" fill="#0a0a0a"/>
  <!-- Outer glow ring -->
  <circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r_circle:.1f}" fill="#39ff14" fill-opacity="0.08" stroke="#39ff14" stroke-width="{stroke:.1f}"/>
  <!-- Star polygon -->
  <polygon points="{pts}" fill="none" stroke="#39ff14" stroke-width="{stroke:.1f}" stroke-linejoin="round"/>
  <!-- Center dot -->
  <circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r_center:.1f}" fill="#39ff14"/>
</svg>'''


SIZES = {
    'icon-192x192.png': 192,
    'icon-512x512.png': 512,
    'apple-touch-icon.png': 180,
}

for fname, size in SIZES.items():
    svg = make_svg(size)
    out_path = os.path.join(OUT, fname)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=out_path, output_width=size, output_height=size)
    print(f"  ✓ {fname}  ({size}x{size}px)")

print("Done.")

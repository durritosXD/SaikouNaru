from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background rounded rectangle gradient simulation
    rect_margin = int(size * 0.05)
    corner_radius = int(size * 0.22)
    
    # Fill dark indigo/purple background
    draw.rounded_rectangle(
        [(rect_margin, rect_margin), (size - rect_margin, size - rect_margin)],
        radius=corner_radius,
        fill=(15, 23, 42, 255),
        outline=(99, 102, 241, 200),
        width=int(size * 0.03)
    )

    # Inner glowing circle
    circle_margin = int(size * 0.2)
    draw.ellipse(
        [(circle_margin, circle_margin), (size - circle_margin, size - circle_margin)],
        fill=(99, 102, 241, 60),
        outline=(168, 85, 247, 180),
        width=int(size * 0.02)
    )

    # Text / Kanji '成'
    try:
        font_size = int(size * 0.45)
        # Try MS Gothic or Arial Unicode
        font = ImageFont.truetype("msgothic.ttc", font_size)
    except Exception:
        font = ImageFont.load_default()

    text = "成"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    
    x = (size - text_w) // 2 - bbox[0]
    y = (size - text_h) // 2 - bbox[1]

    draw.text((x, y), text, font=font, fill=(243, 244, 246, 255))

    out_path = os.path.join("public", filename)
    img.save(out_path, "PNG")
    print(f"Generated {out_path} ({size}x{size})")

def main():
    os.makedirs("public", exist_ok=True)
    create_icon(192, "pwa-192x192.png")
    create_icon(512, "pwa-512x512.png")
    create_icon(180, "apple-touch-icon.png")

if __name__ == "__main__":
    main()

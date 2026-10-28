#!/usr/bin/env python3
"""
Downloads representative public-domain/CC0 real infrastructure test images
to tests/fixtures/real_images for offline, repeatable accuracy evaluation.
"""
import os
import urllib.request
from PIL import Image

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "tests", "fixtures", "real_images")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Curated real-world test images from Unsplash / Wikimedia (Royalty-free / CC0 / Open Access)
REAL_IMAGE_URLS = {
    # 1. Damaged Road with Potholes & Cracks
    "damaged_road_pothole.jpg": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=640&q=80",
    # 2. Undamaged Clean Road Surface
    "clean_road.jpg": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=640&q=80",
    # 3. Damaged Building / Structural Wall Fracture
    "damaged_building.jpg": "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?w=640&q=80",
    # 4. Urban Street with Yellow Vehicle / Maintenance Scene
    "yellow_vehicle_street.jpg": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=640&q=80",
    # 5. Unrelated Indoor Room (Domestic Living Room / Kitchen)
    "indoor_living_room.jpg": "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=640&q=80",
}

print(f"Downloading real benchmark images to {OUTPUT_DIR}...")
for filename, url in REAL_IMAGE_URLS.items():
    filepath = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(filepath) and os.path.getsize(filepath) > 1000:
        print(f"  [EXISTS] {filename} ({os.path.getsize(filepath):,} bytes)")
        continue
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (InfraLens Benchmark)'})
        with urllib.request.urlopen(req, timeout=15) as resp, open(filepath, 'wb') as out_file:
            out_file.write(resp.read())
        print(f"  [DOWNLOADED] {filename} ({os.path.getsize(filepath):,} bytes)")
    except Exception as e:
        print(f"  [ERROR] Failed to download {filename}: {e}")

# Generate Synthetic Baseline Edge Cases locally
# 6. Completely Blank White Canvas
white_path = os.path.join(OUTPUT_DIR, "blank_white.png")
Image.new("RGB", (640, 480), color=(255, 255, 255)).save(white_path)
print(f"  [GENERATED] blank_white.png ({os.path.getsize(white_path):,} bytes)")

# 7. Completely Blank Black Canvas
black_path = os.path.join(OUTPUT_DIR, "blank_black.png")
Image.new("RGB", (640, 480), color=(0, 0, 0)).save(black_path)
print(f"  [GENERATED] blank_black.png ({os.path.getsize(black_path):,} bytes)")

print("\nBenchmark real image preparation complete.")

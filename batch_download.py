#!/usr/bin/env python3
"""
Minecraft Texture Batch Downloader
Run this script to download all needed textures automatically
"""

import os
import requests
import time
from pathlib import Path

# Base URL for Minecraft Item Gallery
BASE_URL = "https://minecraftallimages.jemsire.com"

# Items to download with their search terms and expected filenames
ITEMS = {
    'book': 'book.png',
    'chest': 'chest.png',
    'sign': 'oak_sign.png',
    'pickaxe': 'wooden_pickaxe.png',
    'cookie': 'cookie.png',
    'feather': 'feather.png',
    'firework': 'firework_rocket.png',
    'golden_helmet': 'golden_helmet.png',
    'iron_pickaxe': 'iron_pickaxe.png',
    'poppy': 'poppy.png',
    'wheat': 'wheat.png',
    'bell': 'bell.png',
    'totem': 'totem_of_undying.png',
    'chain': 'chain.png',
    'cooked_chicken': 'cooked_chicken.png',
    'cake': 'cake.png',
    'banner': 'white_banner.png',
    'torch': 'torch.png',
    'redstone_dust': 'redstone_dust.png'
}

# File renaming mapping
RENAME_MAP = {
    'oak_sign.png': 'sign.png',
    'wooden_pickaxe.png': 'pickaxe.png',
    'firework_rocket.png': 'firework.png',
    'totem_of_undying.png': 'totem.png',
    'white_banner.png': 'banner.png'
}

def download_texture(item_name, filename, output_dir):
    """Download a single texture"""
    url = f"{BASE_URL}/images/{filename}"

    try:
        print(f"📥 Downloading {item_name}...")
        response = requests.get(url, timeout=10)

        if response.status_code == 200:
            # Use renamed filename if needed
            final_filename = RENAME_MAP.get(filename, filename)
            output_path = output_dir / final_filename

            with open(output_path, 'wb') as f:
                f.write(response.content)

            print(f"✅ Saved {item_name} as {final_filename}")
            return True
        else:
            print(f"❌ Failed to download {item_name} (HTTP {response.status_code})")
            return False

    except Exception as e:
        print(f"❌ Error downloading {item_name}: {e}")
        return False

def main():
    print("🎮 Minecraft Texture Batch Downloader")
    print("=====================================")

    # Create output directory
    output_dir = Path("public/textures")
    output_dir.mkdir(exist_ok=True)

    print(f"📁 Downloading to: {output_dir.absolute()}")
    print(f"📦 Downloading {len(ITEMS)} textures...")
    print()

    success_count = 0
    fail_count = 0

    for item_name, filename in ITEMS.items():
        if download_texture(item_name, filename, output_dir):
            success_count += 1
        else:
            fail_count += 1

        # Small delay to be respectful
        time.sleep(0.5)

    print()
    print("📊 Download Summary:")
    print(f"✅ Successful: {success_count}")
    print(f"❌ Failed: {fail_count}")

    if fail_count == 0:
        print()
        print("🎉 All textures downloaded successfully!")
        print("🔍 Run './verify_textures.sh' to confirm")
    else:
        print()
        print("⚠️  Some downloads failed. Try running again or use manual method.")
        print("📖 See 'manual_download_guide.md' for manual instructions")

if __name__ == "__main__":
    main()
import os
import json
from PIL import Image
from datetime import datetime

IMAGES_DIR = 'images'
THUMBNAIL_SIZE = (120, 80)



    process_raw_images()
    if not os.path.exists(IMAGES_DIR):
        print(f"Images directory '{IMAGES_DIR}' not found. Please create it and place your gallery subdirectories inside.")
        return

    gallery_dirs = [d for d in os.listdir(IMAGES_DIR) if os.path.isdir(os.path.join(IMAGES_DIR, d))]
    processed_galleries = []

    for gallery_name in gallery_dirs:
        gallery_path = os.path.join(IMAGES_DIR, gallery_name)
        print(f"Processing gallery: {gallery_name}")
        images_in_gallery = []
        for filename in os.listdir(gallery_path):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                image_path = os.path.join(gallery_path, filename)
                thumbnail_path = os.path.join(gallery_path, f"thumb_{filename}")

                # Create thumbnail
                try:
                    img = Image.open(image_path)
                    img.thumbnail(THUMBNAIL_SIZE)
                    img.save(thumbnail_path)
                    print(f"  Created thumbnail: thumb_{filename}")
                except Exception as e:
                    print(f"  Error creating thumbnail for {filename}: {e}")
                images_in_gallery.append(filename)

        # Create index.json for the gallery
        gallery_index_json_path = os.path.join(gallery_path, 'index.json')
        with open(gallery_index_json_path, 'w') as f:
            json.dump({"images": images_in_gallery}, f, indent=2)
        print(f"  Created {gallery_index_json_path}")
        processed_galleries.append(gallery_name)

    # Update main images/index.json
    main_index_json_path = os.path.join(IMAGES_DIR, 'index.json')
    with open(main_index_json_path, 'w') as f:
        json.dump({"galleries": processed_galleries}, f, indent=2)
    print(f"Updated main index.json: {main_index_json_path}")

if __name__ == "__main__":
    process_images()
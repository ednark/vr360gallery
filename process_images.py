import os
import json
from PIL import Image
import shutil
from datetime import datetime

RAW_DIR = 'raw'
IMAGES_DIR = 'images'
THUMBNAIL_SIZE = (120, 80)

def get_image_creation_date(image_path):
    try:
        img = Image.open(image_path)
        exif_data = img._getexif()
        if exif_data:
            # 36867 is the tag for DateTimeOriginal
            if 36867 in exif_data:
                date_str = exif_data[36867]
                # Format: YYYY:MM:DD HH:MM:SS
                return datetime.strptime(date_str, '%Y:%m:%d %H:%M:%S').strftime('%Y-%m-%d')
    except Exception as e:
        print(f"Could not get EXIF data for {image_path}: {e}")
    return None

def process_raw_images():
    if not os.path.exists(RAW_DIR):
        print(f"Raw directory '{RAW_DIR}' not found. Please create it and place your image subdirectories inside.")
        return

    if not os.path.exists(IMAGES_DIR):
        os.makedirs(IMAGES_DIR)

    processed_subdirectories = []

    for subdir_name in os.listdir(RAW_DIR):
        raw_subdir_path = os.path.join(RAW_DIR, subdir_name)
        if os.path.isdir(raw_subdir_path):
            print(f"Processing raw subdirectory: {subdir_name}")
            
            # Try to determine a meaningful name based on image creation date
            target_subdir_name = subdir_name # Fallback to original raw subdir name
            
            # Find the first image to get its creation date
            first_image_path = None
            for filename in os.listdir(raw_subdir_path):
                if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                    first_image_path = os.path.join(raw_subdir_path, filename)
                    break
            
            if first_image_path:
                creation_date = get_image_creation_date(first_image_path)
                if creation_date:
                    target_subdir_name = creation_date
                    print(f"  Using creation date '{creation_date}' for target subdirectory name.")
                else:
                    print(f"  Could not determine creation date for images in '{subdir_name}'. Using original raw subdirectory name.")
            else:
                print(f"  No images found in '{subdir_name}'. Using original raw subdirectory name.")

            target_subdir_path = os.path.join(IMAGES_DIR, target_subdir_name)
            os.makedirs(target_subdir_path, exist_ok=True)

            images_in_subdir = []
            for filename in os.listdir(raw_subdir_path):
                if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
                    raw_image_path = os.path.join(raw_subdir_path, filename)
                    target_image_path = os.path.join(target_subdir_path, filename)
                    thumbnail_path = os.path.join(target_subdir_path, f"thumb_{filename}")

                    # Copy original image
                    shutil.copy(raw_image_path, target_image_path)
                    print(f"  Copied: {filename}")

                    # Create thumbnail
                    try:
                        img = Image.open(raw_image_path)
                        img.thumbnail(THUMBNAIL_SIZE)
                        img.save(thumbnail_path)
                        print(f"  Created thumbnail: thumb_{filename}")
                    except Exception as e:
                        print(f"  Error creating thumbnail for {filename}: {e}")
                    
                    images_in_subdir.append(filename)
            
            # Create index.json for the subdirectory
            subdir_index_json_path = os.path.join(target_subdir_path, 'index.json')
            with open(subdir_index_json_path, 'w') as f:
                json.dump({"images": images_in_subdir}, f, indent=2)
            print(f"  Created {subdir_index_json_path}")
            processed_subdirectories.append(target_subdir_name)

    # Update main images/index.json
    main_index_json_path = os.path.join(IMAGES_DIR, 'index.json')
    with open(main_index_json_path, 'w') as f:
        json.dump({"subdirectories": processed_subdirectories}, f, indent=2)
    print(f"Updated main index.json: {main_index_json_path}")

if __name__ == "__main__":
    process_raw_images()
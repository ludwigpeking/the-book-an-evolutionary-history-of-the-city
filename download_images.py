import os
import re
import requests
from pathlib import Path
from bs4 import BeautifulSoup
import urllib.parse
import time

# Directories setup (using absolute paths)
base_dir = os.path.dirname(os.path.abspath(__file__))
chapters_dir = os.path.join(base_dir, 'chapters')
img_dir = os.path.join(base_dir, 'img')

# Ensure img directory exists
os.makedirs(img_dir, exist_ok=True)

# Mapping of downloaded URLs to local file paths
downloaded_images = {}

# Counter for images in each chapter
image_counters = {}

def download_image(url, chapter_num):
    """Download an image from the URL and save it with appropriate naming"""
    
    # Skip if already downloaded
    if url in downloaded_images:
        return downloaded_images[url]
    
    # Remove query parameters from URL for downloading
    clean_url = url.split('?')[0] if '?' in url else url
    
    # Initialize counter for this chapter if not exists
    if chapter_num not in image_counters:
        image_counters[chapter_num] = 1
    
    # Get file extension from URL
    parsed_url = urllib.parse.urlparse(clean_url)
    path = parsed_url.path
    
    # Get file extension (default to .jpg if can't determine)
    _, ext = os.path.splitext(path)
    if not ext or ext.lower() not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
        ext = '.jpg'
    
    # Format destination filename (xx is chapter number, yy is image number in chapter)
    img_num = image_counters[chapter_num]
    local_filename = f"{chapter_num:02d}{img_num:02d}{ext}"
    local_path = os.path.join(img_dir, local_filename)
    
    try:
        # Download the image
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        with open(local_path, 'wb') as out_file:
            out_file.write(response.content)
        
        print(f"Downloaded: {url} → {local_filename}")
        
        # Increment counter for next image in this chapter
        image_counters[chapter_num] += 1
        
        # Remember this mapping
        downloaded_images[url] = local_filename
        
        # Be nice to the server
        time.sleep(1)
        
        return local_filename
    
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return None

def process_html_content(content, chapter_num):
    """Process HTML content and update image references"""
    
    # Find WordPress image URLs using regex
    wp_img_pattern = r'(src|href)="(https://ludwigpeking\.files\.wordpress\.com/[^"]+)"'
    
    def replace_url(match):
        attr = match.group(1)  # src or href
        url = match.group(2)   # the actual URL
        
        # Download the image
        local_filename = download_image(url, chapter_num)
        if local_filename:
            return f'{attr}="./img/{local_filename}"'
        else:
            return match.group(0)  # Keep original if download failed
    
    # Replace all WordPress URLs
    modified_content = re.sub(wp_img_pattern, replace_url, content)
    
    return modified_content

def process_chapter_file(filepath):
    """Process a single chapter HTML file"""
    
    # Extract chapter number from filename
    chapter_num = int(os.path.splitext(os.path.basename(filepath))[0])
    
    print(f"Processing chapter {chapter_num}...")
    
    try:
        # Read file content
        with open(filepath, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Process content and get updated version
        modified_content = process_html_content(content, chapter_num)
        
        # Write back if modified
        if modified_content != content:
            with open(filepath, 'w', encoding='utf-8') as file:
                file.write(modified_content)
            print(f"Updated HTML file: {filepath}")
        else:
            print(f"No changes needed for: {filepath}")
            
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

def main():
    """Main function to process all chapter files"""
    
    # Process all HTML files in chapters directory
    chapter_files = sorted(Path(chapters_dir).glob('*.html'))
    
    print(f"Found {len(chapter_files)} chapter files")
    
    for filepath in chapter_files:
        process_chapter_file(filepath)
    
    print("\nSummary:")
    print(f"Total images downloaded: {len(downloaded_images)}")
    print(f"Images per chapter: {', '.join([f'Ch {ch}: {count-1}' for ch, count in sorted(image_counters.items()) if count > 1])}")

if __name__ == "__main__":
    print("Starting image download process...")
    main()
    print("Process completed!")

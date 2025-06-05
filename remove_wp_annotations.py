import os
import re
from pathlib import Path
import sys

print("Script started...")

# Get the directory of the script
script_dir = os.path.dirname(os.path.abspath(__file__))
print(f"Script directory: {script_dir}")

# Directory containing the HTML files
chapters_dir = os.path.join(script_dir, 'chapters')
print(f"Chapters directory: {chapters_dir}")

# Patterns to remove
patterns = [
    r'<!-- wp:[^>]+-->',  # WordPress opening tags like <!-- wp:paragraph -->
    r'<!-- /wp:[^>]+-->',  # WordPress closing tags like <!-- /wp:paragraph -->
    r' class="wp-block-[^"]*"',  # WordPress block classes with space before
    r' class="wp-image-[^"]*"',  # WordPress image classes with space before
    r' class="wp-element-[^"]*"',  # WordPress element classes with space before
    r' class="wp-embed[^"]*"',  # WordPress embed classes with space before
]

def process_file(file_path):
    """Process a single HTML file to remove WordPress annotations"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        print(f"Processing: {file_path}")
        original_content = content
        
        # Apply each pattern to remove WordPress annotations
        for pattern in patterns:
            content = re.sub(pattern, '', content)
        
        # Clean up empty class attributes
        content = re.sub(r'class=""', '', content)
        
        # Clean up specifically for wordpress blocks
        content = content.replace('<!-- wp-block-group -->', '')
        content = content.replace('<!-- /wp-block-group -->', '')
        content = content.replace('<!-- wp-group -->', '')
        content = content.replace('<!-- /wp-group -->', '')
        
        # If content changed, write it back to the file
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as file:
                file.write(content)
            print(f"Updated: {file_path}")
            return True
        else:
            print(f"No changes needed for: {file_path}")
            return False
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def process_content_directly(file_path):
    """Directly read and replace content without using regex for complex patterns"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            lines = file.readlines()
        
        new_lines = []
        modified = False
        
        for line in lines:
            # Remove WordPress comment tags
            if '<!-- wp:' in line or '<!-- /wp:' in line:
                modified = True
                continue
                
            # Remove WordPress classes
            if 'wp-block-' in line or 'wp-image-' in line or 'wp-element-' in line or 'wp-embed' in line:
                line = (line.replace(' class="wp-block-image size-large is-resized"', '')
                      .replace(' class="wp-block-image size-large"', '')
                      .replace(' class="wp-block-group"', '')
                      .replace(' class="wp-block-embed', '')
                      .replace(' wp-block-embed-youtube', '')
                      .replace(' wp-embed-aspect-4-3 wp-has-aspect-ratio"', '"')
                      .replace(' wp-embed-aspect-16-9 wp-has-aspect-ratio"', '"')
                      .replace(' class="wp-image-', ' class="image-'))
                modified = True
            
            new_lines.append(line)
        
        if modified:
            with open(file_path, 'w', encoding='utf-8') as file:
                file.writelines(new_lines)
            print(f"Updated file (direct method): {file_path}")
            return True
        else:
            print(f"No changes needed (direct method): {file_path}")
            return False
    
    except Exception as e:
        print(f"Error processing {file_path} (direct method): {e}")
        return False

def main():
    """Process all HTML files in the chapters directory"""
    chapter_files = sorted(Path(chapters_dir).glob('*.html'))
    
    print(f"Found {len(chapter_files)} chapter files to process")
    
    updated_count = 0
    for file_path in chapter_files:
        if process_content_directly(file_path):
            updated_count += 1
    
    print(f"Processing complete! Updated {updated_count} files out of {len(chapter_files)}")

if __name__ == "__main__":
    main()

import os
import re
from pathlib import Path
import html

# Directories
base_dir = os.path.dirname(os.path.abspath(__file__))
en_chapters_dir = os.path.join(base_dir, 'chapters')
cn_chapters_dir = os.path.join(base_dir, 'chapters_cn')

# Ensure Chinese chapters directory exists
os.makedirs(cn_chapters_dir, exist_ok=True)

def is_chinese(text):
    """Check if a string contains Chinese characters"""
    for char in text:
        if '\u4e00' <= char <= '\u9fff':
            return True
    return False

def find_chinese_title(content):
    """Find the first Chinese title in the content"""
    # Look for <p> tags with Chinese text that appear near the beginning
    p_tags = re.findall(r'<p>([^<]+)</p>', content[:1000])
    for p in p_tags:
        if is_chinese(p) and len(p.strip()) < 100:  # Title should be relatively short
            return p.strip()
    return "中文"  # Default if no title found

def extract_chinese_content(content):
    """Extract Chinese content from an HTML file"""
    
    # Try to find a separator line like <hr> or a series of dashes
    separators = [
        r'<hr[^>]*>',
        r'<p>[-—_]{3,}</p>',
        r'<p>[=]{3,}</p>'
    ]
    
    for separator in separators:
        parts = re.split(separator, content, 1)
        if len(parts) > 1:
            return parts[1]
    
    # If no clear separator, use a different approach
    # Collect all paragraphs that contain Chinese characters
    chinese_paragraphs = []
    paragraphs = re.findall(r'<p>([^<]+)</p>', content)
    chinese_found = False
    
    for p in paragraphs:
        if is_chinese(p):
            chinese_found = True
            chinese_paragraphs.append(f'<p>{p}</p>')
        elif chinese_found and p.strip():
            # After finding Chinese, keep collecting paragraphs until we hit a pure English section
            english_word_count = len(re.findall(r'\b[a-zA-Z]+\b', p))
            if english_word_count > 10:  # If paragraph has many English words, stop collecting
                break
            chinese_paragraphs.append(f'<p>{p}</p>')
    
    if chinese_paragraphs:
        return '\n'.join(chinese_paragraphs)
    
    return ""  # Return empty string if no Chinese content found

def process_chapter(chapter_file):
    """Extract Chinese content from a chapter and create a Chinese version"""
    try:
        with open(chapter_file, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Extract chapter number
        chapter_num = os.path.splitext(os.path.basename(chapter_file))[0]
        print(f"Processing chapter {chapter_num}...")
        
        # Find Chinese title
        chinese_title = find_chinese_title(content)
        
        # Extract Chinese content
        chinese_content = extract_chinese_content(content)
        
        if not chinese_content:
            print(f"No Chinese content found in chapter {chapter_num}.")
            return
        
        # Create HTML structure for Chinese version
        chinese_html = f"""<!-- filepath: {os.path.join(cn_chapters_dir, chapter_num + '.html')} -->
<h1>{chapter_num} {chinese_title}</h1>
{chinese_content}
"""
        
        # Write to Chinese chapter file
        cn_file_path = os.path.join(cn_chapters_dir, f"{chapter_num}.html")
        with open(cn_file_path, 'w', encoding='utf-8') as file:
            file.write(chinese_html)
        
        print(f"Successfully created Chinese version for chapter {chapter_num}")
        
    except Exception as e:
        print(f"Error processing {chapter_file}: {e}")

def main():
    """Process all chapter files in the English chapters directory"""
    chapter_files = sorted(Path(en_chapters_dir).glob('*.html'))
    
    print(f"Found {len(chapter_files)} chapter files to process")
    
    for file_path in chapter_files:
        process_chapter(file_path)
    
    print("Processing complete!")

if __name__ == "__main__":
    main()

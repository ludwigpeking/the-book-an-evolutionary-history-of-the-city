// Script to generate static table of contents from chapters
const fs = require('fs');
const path = require('path');

function extractTitle(html, chapterNum) {  // Try to find h1 tag
  const h1Match = html.match(/<h1[^>]*>([^]*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    let title = h1Match[1].replace(/<\/?[^>]+(>|$)/g, '').trim();
      // Remove chapter prefix without removing numbers inside the actual title
    title = title.replace(/^(?:\d{1,2}\s+)?(?:\d{1,2}[\s\.:\)\-]+|Chapter\s+\d+[\.:\)\-]?\s*)/i, '');
    
    // If the title is empty after removing numbers, keep the original
    if (!title.trim()) {
      title = h1Match[1].replace(/<\/?[^>]+(>|$)/g, '').trim();
    }
    
    return title;
  }

  // If no h1 found, try to find meta title tag
  const metaTitleMatch = html.match(/<meta[^>]*?name=["']title["'][^>]*?content=["']([^"']+)["']/i);
  if (metaTitleMatch && metaTitleMatch[1]) {
    return metaTitleMatch[1].trim();
  }

  // Try to find strong tag within first paragraph
  const strongMatch = html.match(/<p[^>]*>\s*<strong[^>]*>([^]*?)<\/strong>/i);
  if (strongMatch && strongMatch[1]) {
    return strongMatch[1].replace(/<\/?[^>]+(>|$)/g, '').trim();
  }

  // If still no title found, check for any non-empty paragraph
  const pMatch = html.match(/<p[^>]*>(?!<strong>)([^]*?)<\/p>/i);
  if (pMatch && pMatch[1]) {
    let title = pMatch[1].replace(/<\/?[^>]+(>|$)/g, '').trim();
    if (title.length > 10 && title.length < 200) { // Only use if it looks like a real title
      return title;
    }
  }

  return `Chapter ${chapterNum}`;
}

function generateStaticTOC(language = 'en') {
  console.log(`Generating static TOC for ${language} chapters...`);
  const chaptersDir = path.join(__dirname, language === 'en' ? 'chapters' : 'chapters_cn');
  
  // Read all chapter files and ensure proper numeric sorting
  const files = fs.readdirSync(chaptersDir)
    .filter(file => /^\d+\.html$/.test(file))
    .sort((a, b) => {
      const numA = parseInt(a.match(/^(\d+)/)[1]);
      const numB = parseInt(b.match(/^(\d+)/)[1]);
      return numA - numB;
    });

  console.log(`Found ${files.length} chapter files`);
  
  // Create UTF-8 encoded TOC header
  const tocHeader = `<!DOCTYPE html>
<html lang="${language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Table of Contents</title>    <style>
        .toc-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .toc-list li {
            margin: 0;
            padding: 0;
        }
        .toc-list a {
            display: block;
            padding: 5px 10px;
            text-decoration: none;            color: #fbe;
            cursor: pointer;
            font-family: Georgia, "Times New Roman", Times, serif;
            font-size: 18px;
        }
        .toc-list a:hover {
            background: rgba(255,255,255,0.1);
            color: magenta;
        }
        .nav-link.active {
            background: rgba(255,255,255,0.1);
        }
        .nav-link {
            transition: all 0.2s;
        }
    </style>
</head>
<body>
    <ul class="toc-list">`;

  // Process each file synchronously with UTF-8 encoding
  const chapters = files.map(file => {
    const chapterNum = parseInt(file.match(/^(\d+)/)[1]);
    const content = fs.readFileSync(path.join(chaptersDir, file), { encoding: 'utf-8' });
    const title = extractTitle(content, chapterNum);
    
    // Format chapter number with leading zero
    const paddedNum = String(chapterNum).padStart(2, '0');
    
    return {
      number: paddedNum,
      title,
      id: `chapter-${paddedNum}`,
      file: file
    };
  });  // Generate TOC content
  const tocContent = chapters.map(chapter => {    return `        <li>
            <a href="#" 
               data-chapter="${chapter.number}"
               class="nav-link"
               id="${chapter.id}">
                ${chapter.number}. ${chapter.title}
            </a>
        </li>`;
  }).join('\n');

  // Complete TOC HTML
  const tocFooter = `
    </ul>
</body>
</html>`;

  const tocFilePath = path.join(__dirname, language === 'en' ? 'toc.html' : 'toc_cn.html');
  
  // Write the complete TOC file with UTF-8 encoding
  fs.writeFileSync(tocFilePath, tocHeader + tocContent + tocFooter, { encoding: 'utf-8' });
  console.log(`Generated TOC file: ${tocFilePath}`);
  console.log(`Total chapters processed: ${chapters.length}`);
}

// Generate both English and Chinese TOCs
generateStaticTOC('en');
generateStaticTOC('cn');

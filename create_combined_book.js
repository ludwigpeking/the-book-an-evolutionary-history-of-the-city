const fs = require('fs');
const path = require('path');

// HTML template with CSS styling
const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>An Evolutionary History of the City</title>
  <style>    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    h1 { 
      page-break-before: always;
      font-size: 24px;
      margin-top: 40px;
      color: #2c3e50;
    }
    h1:first-of-type {
      page-break-before: avoid;
    }
    img {
      max-width: 90%;
      height: auto;
      margin: 20px auto;
      display: block;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    figure {
      text-align: center;
      margin: 20px 0;
    }
    figcaption {
      color: #666;
      font-style: italic;
      margin-top: 8px;
    }
    p {
      margin-bottom: 1.2em;
      color: #333;
    }
    .table-of-contents {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 4px;
      margin-bottom: 40px;
    }
    .table-of-contents h2 {
      color: #2c3e50;
      margin-bottom: 15px;
    }
    .table-of-contents ul {
      list-style-type: none;
      padding-left: 0;
    }
    .table-of-contents li {
      margin-bottom: 8px;
    }
    .table-of-contents a {
      color: #3498db;
      text-decoration: none;
    }
    .table-of-contents a:hover {
      text-decoration: underline;
    }
      margin: 20px 0;
    }
    .toc-list {
      list-style-type: none;
      padding-left: 10px;
    }
    .toc-list li {
      margin-bottom: 8px;
    }
    .chapter {
      page-break-before: always;
    }
    .chapter:first-of-type {
      page-break-before: avoid;
    }
    table {
      border-collapse: collapse;
      width: 90%;
      margin: 20px auto;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    #cover-page {
      height: 90vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
    }
    #cover-page h1 {
      font-size: 32px;
    }
  </style>
</head>
<body>
  <div id="cover-page">
    <h1>An Evolutionary History of the City</h1>
    <p>Complete Collection</p>
  </div>
`;

function compileBook() {
  try {
    // Create table of contents
    let toc = '<div class="table-of-contents"><h2>Table of Contents</h2>\n<ul>\n';
    let bookContent = '';

    // Read all chapter files
    const chaptersDir = path.join(__dirname, 'chapters');
    const files = fs.readdirSync(chaptersDir)
      .filter(file => /^\d+\.html$/.test(file))
      .sort((a, b) => parseInt(a) - parseInt(b));

    // Process each chapter
    for (const file of files) {
      const chapterNum = parseInt(file);
      let content = fs.readFileSync(path.join(chaptersDir, file), 'utf8');
      
      // Extract chapter title
      const titleMatch = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
      const title = titleMatch ? titleMatch[1].trim() : `Chapter ${chapterNum}`;
      
      // Fix image paths to be relative to the root
      content = content.replace(
        /(src=["'])((?!http|data:)[^"']+)(["'])/gi,
        (match, p1, p2, p3) => {
          const imgPath = path.relative(
            path.dirname(path.join(chaptersDir, file)),
            path.resolve(__dirname, p2)
          ).replace(/\\/g, '/');
          return `${p1}${imgPath}${p3}`;
        }
      );
      
      // Clean up any HTML comments
      content = content.replace(/<!--.*?-->/gs, '');
      
      // Add to table of contents with properly formatted numbering
      const paddedNum = chapterNum.toString().padStart(2, '0');
      toc += `  <li><a href="#chapter-${chapterNum}">${paddedNum}. ${title}</a></li>\n`;
      
      // Add chapter content with improved markup
      bookContent += `
        <div id="chapter-${chapterNum}" class="chapter">
          <h1><span class="chapter-number">${paddedNum}.</span> ${title}</h1>
          ${content}
        </div>\n`;
    }
    
    toc += '</ul></div>';    // Combine everything
    const fullContent = htmlTemplate + 
                       toc + 
                       '<div class="book-content">' + 
                       bookContent + 
                       '</div>' +
                       '</body>\n</html>';

    // Write to file with proper encoding
    fs.writeFileSync('combined_book.html', fullContent, 'utf8');
    console.log('Successfully generated combined_book.html');
  } catch (error) {    console.error('Error generating book:', error);
    process.exit(1);
  }
}

// Run the script
compileBook();
    fs.writeFileSync(path.join(__dirname, 'combined_book.html'), fullContent, 'utf8');
    console.log('Successfully created combined_book.html');

  } catch (error) {
    console.error('Error creating combined book:', error);
  }
}

compileBook();

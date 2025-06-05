// This script will be used to process chapters
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const chaptersDir = path.join(__dirname, "chapters");
const chaptersCnDir = path.join(__dirname, "chapters_cn");

// Create chapters_cn directory if it doesn't exist
if (!fs.existsSync(chaptersCnDir)) {
  fs.mkdirSync(chaptersCnDir, { recursive: true });
}

// Get all chapter files
const chapterFiles = fs
  .readdirSync(chaptersDir)
  .filter((file) => file.endsWith(".html"))
  .sort();

// Process each chapter
chapterFiles.forEach((file) => {
  console.log(`Processing ${file}...`);
  const filePath = path.join(chaptersDir, file);
  const content = fs.readFileSync(filePath, "utf8");

  // Process content to extract Chinese parts
  let chineseContent = extractChineseContent(content, file);

  // Write Chinese content to new file
  const outputPath = path.join(chaptersCnDir, file);
  fs.writeFileSync(outputPath, chineseContent, "utf8");
  console.log(`Created ${outputPath}`);
});

function extractChineseContent(content, filename) {
  // For introduction chapter (00.html)
  if (filename === "00.html") {
    return content
      .replace(
        '<h1 style="font-size: 200%">[ An Evolutionary History of the City ]</h1>',
        '<h1 style="font-size: 200%">[ 城市的进化史 ]</h1>'
      )
      .replace(
        "<p><strong>Introduction and the Table of Contents</strong></p>",
        "<p><strong>引言和目录</strong></p>"
      );
  }

  // Find the Chinese version from the content
  const lines = content.split("\n");
  let chineseContent = [];
  let inChineseSection = false;
  let firstHTag = "";

  // First, try to find the h1 tag for the title
  const titleMatch = content.match(/<h1>(.*?)<\/h1>/);
  if (titleMatch) {
    // Create a Chinese version of the title
    const englishTitle = titleMatch[1];
    const chineseTitleNumber = englishTitle.match(/^\d+/)[0];
    const chineseTitle = `${chineseTitleNumber} 案例：具有相同结构的旅游景点`;
    firstHTag = `<h1>${chineseTitle}</h1>\n<p></p>\n\n<p>${chineseTitle}</p>\n\n<p></p>\n`;
    chineseContent.push(firstHTag);
  }

  // Now extract Chinese paragraphs
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if the line contains Chinese characters
    if (/[\u4e00-\u9fa5]/.test(line)) {
      inChineseSection = true;
      chineseContent.push(line);
    } else if (
      inChineseSection &&
      (line.trim() === "" || line.includes("</p>"))
    ) {
      // Keep empty lines and closing paragraph tags
      chineseContent.push(line);
    } else if (inChineseSection && line.includes("<figure>")) {
      // Keep image tags
      let imgBlock = line;
      while (!lines[i].includes("</figure>") && i < lines.length) {
        i++;
        imgBlock += "\n" + lines[i];
      }
      chineseContent.push(imgBlock);
    }
  }

  // If no Chinese content was found or if it's minimal, create a basic placeholder
  if (chineseContent.length <= 5) {
    const placeholder = `${firstHTag}<p>本章中文版正在翻译中...</p>`;
    return placeholder;
  }

  return chineseContent.join("\n");
}

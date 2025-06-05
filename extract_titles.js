const fs = require("fs");
const path = require("path");

const chaptersDir = path.join(__dirname, "chapters_cn");
const chapterFiles = fs
  .readdirSync(chaptersDir)
  .filter((file) => file.endsWith(".html"))
  .sort();

const titles = {};
const resultArray = [];

// Extract titles from each chapter file
chapterFiles.forEach((file) => {
  try {
    const chapterNumber = parseInt(file.split(".")[0]);
    const content = fs.readFileSync(path.join(chaptersDir, file), "utf8");

    // Try different patterns to find the title
    let title = null;

    // Try to find h1 tag first (more comprehensive pattern)
    let match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (match) {
      title = match[1].trim();
      // Remove any HTML tags inside the h1
      title = title.replace(/<[^>]*>/g, "");
    } else {
      // If no h1, look for the first paragraph that might contain the title
      match = content.match(/<p>(\d+[^<]+)<\/p>/i);
      if (match) {
        title = match[1].trim();
      } else {
        // Try another pattern for first paragraphs
        match = content.match(/<p>([^<]+)<\/p>/i);
        if (
          match &&
          (match[1].includes(chapterNumber.toString()) ||
            match[1].includes("章"))
        ) {
          title = match[1].trim();
        }
      }
    }

    if (title) {
      console.log(`File ${file}: Found title "${title}"`);
      titles[chapterNumber] = title;
    } else {
      console.log(`File ${file}: No title found, using default`);
      titles[chapterNumber] = `未知章节 ${chapterNumber}`; // Unknown chapter
    }
  } catch (error) {
    console.error(`Error processing file ${file}:`, error.message);
  }
});

// Generate HTML links for links_cn.html
let linkHtml =
  "<!-- filepath: c:\\Users\\qli\\the-book-an-evolutionary-history-of-the-city\\links_cn.html -->\n";
Object.keys(titles)
  .sort((a, b) => a - b)
  .forEach((num) => {
    const paddedNum = num.toString().padStart(2, "0");
    linkHtml += `<a href="#" class="nav-link" data-chapter="${num}">${paddedNum}. ${titles[num]}</a><br /><br />\n`;
    console.log(`${paddedNum}: ${titles[num]}`);
  });

// Write the links to the file
try {
  fs.writeFileSync(path.join(__dirname, "links_cn.html"), linkHtml, "utf8");
  console.log("Successfully written links to links_cn.html");
} catch (error) {
  console.error("Error writing links_cn.html:", error);
}

// Write to links_cn.html
fs.writeFileSync("links_cn.html", linkHtml, "utf8");
console.log("links_cn.html has been updated with correct chapter titles.");

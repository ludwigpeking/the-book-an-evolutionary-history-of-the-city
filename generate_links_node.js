console.log("Script is starting...");

const fs = require("fs");
const path = require("path");

function generateLinks(language) {
  console.log(`Starting generateLinks for language: ${language}`);
  let linksHTML = "";
  const chapterFolder = language === "en" ? "chapters" : "chapters_cn";
  const baseDir = path.resolve(__dirname);
  console.log(`Base directory: ${baseDir}`);
  console.log(`Chapter folder: ${chapterFolder}`);

  // Loop through all potential chapters (0-38)
  for (let i = 0; i <= 38; i++) {
    const chapterNumber = i.toString().padStart(2, "0");
    const chapterPath = path.join(baseDir, chapterFolder, `${chapterNumber}.html`);

    if (!fs.existsSync(chapterPath)) {
      console.error(`File not found: ${chapterPath}`);
      continue;
    }

    try {
      const content = fs.readFileSync(chapterPath, "utf8");
      const match = content.match(/<h1[^>]*>(.*?)<\/h1>/is);

      if (match && match[1]) {
        const title = match[1].trim();
        const bracketMatch = title.match(/\[(.*?)\]/);

        if (bracketMatch) {
          const extractedTitle = bracketMatch[1].trim();
          linksHTML += `<a href="#" class="nav-link" data-chapter="${i}">${extractedTitle}</a><br /><br />\n`;
          console.log(`Chapter ${chapterNumber}: Added bracketed title: ${extractedTitle}`);
        } else {
          linksHTML += `<a href="#" class="nav-link" data-chapter="${i}">${title}</a><br /><br />\n`;
          console.log(`Chapter ${chapterNumber}: Added title: ${title}`);
        }
      } else {
        console.error(`No H1 tag found in chapter ${chapterNumber}`);
      }
    } catch (error) {
      console.error(`Error processing chapter ${chapterNumber}: ${error.message}`);
    }
  }

  const outputFile = language === "en" ? "links.html" : "links_cn.html";
  const outputPath = path.join(baseDir, outputFile);

  try {
    fs.writeFileSync(outputPath, linksHTML, "utf8");
    console.log(`Successfully generated ${outputPath}`);
    console.log(`Content written:\n${linksHTML}`);
  } catch (error) {
    console.error(`Error writing to ${outputPath}: ${error.message}`);
  }
}

console.log("Starting main function");
generateLinks("en");
generateLinks("cn");
console.log("Finished generating all links");

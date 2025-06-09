const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

async function generateLinks(language = "en") {
  const chaptersDir = path.join(__dirname, language === "en" ? "chapters" : "chapters_cn");
  let linksHTML =
    "<!-- filepath: " + path.join(__dirname, language === "en" ? "links.html" : "links_cn.html") + " -->\n";

  try {
    // Get and sort chapter files
    const files = fs
      .readdirSync(chaptersDir)
      .filter((file) => /^\d+\.html$/.test(file))
      .sort((a, b) => parseInt(a) - parseInt(b));

    for (const file of files) {
      const content = await readFileAsync(path.join(chaptersDir, file), "utf8");
      const match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
      if (match && match[1]) {
        const chapterNum = parseInt(file);
        let title;

        // Special handling for chapter 0
        if (chapterNum === 0) {
          title = "00. Introduction and the Table of Contents";
        } else {
          title = match[1].trim();
        }

        // Format link with exact same formatting as original
        linksHTML += `<a href="#" class="nav-link" data-chapter="${chapterNum}"
  >${title}</a
>${chapterNum < files.length - 1 ? "\n<br /><br />\n" : ""}`; // Add line breaks except for last item
      }
    }

    // Write to appropriate output file
    const outputFile = path.join(__dirname, language === "en" ? "links.html" : "links_cn.html");
    await writeFileAsync(outputFile, linksHTML, "utf8");
    console.log(`Successfully generated ${outputFile}`);
  } catch (error) {
    console.error("Error generating links:", error);
  }
}

// Generate both English and Chinese versions
async function main() {
  await generateLinks("en");
  await generateLinks("cn");
}

main().catch(console.error);

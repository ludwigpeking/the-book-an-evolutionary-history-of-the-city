// Common function to generate dynamic links for both languages
async function generateLinks(language) {
  let linksHTML = "";
  const chapterFolder = language === "en" ? "chapters" : "chapters_cn";
  const defaultTitlePrefix = language === "en" ? "Chapter" : "章节";

  // Loop through all potential chapters (0-38)
  for (let i = 0; i <= 38; i++) {
    const chapterNumber = i.toString().padStart(2, "0");
    const chapterUrl = `${chapterFolder}/${chapterNumber}.html`;

    try {
      // Fetch the chapter file
      const response = await fetch(chapterUrl);
      if (!response.ok) {
        console.log(`Chapter ${chapterNumber} not found or error loading`);
        continue;
      }

      const html = await response.text(); // Create a temporary element to parse the HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = html;

      // Just extract the H1 text for all chapters
      const h1Tag = tempDiv.querySelector("h1");
      if (!h1Tag) {
        console.log(`No H1 tag found in chapter ${chapterNumber}`);
        continue;
      }
      const title = h1Tag.textContent.trim();

      // Create the link HTML
      linksHTML += `<a href="#" class="nav-link" data-chapter="${i}">${title}</a><br /><br />\n`;
    } catch (error) {
      console.error(`Error processing chapter ${chapterNumber}:`, error);
    }
  }

  // Return the generated HTML
  return linksHTML;
}

// Function to generate English links (calls the common generator)
async function generateEnglishLinks() {
  return generateLinks("en");
}

// Function to generate Chinese links (calls the common generator)
async function generateChineseLinks() {
  return generateLinks("cn");
}

// Export the function for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = { generateChineseLinks };
}

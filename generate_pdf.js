// Script to generate a combined PDF of all English chapters
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

// Function to extract the title from HTML content
function extractTitle(html) {
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    // Remove any HTML tags from the title
    return h1Match[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
  }

  // If no h1 found, try to find the first paragraph with strong tag
  const strongMatch = html.match(/<p><strong>(.*?)<\/strong><\/p>/i);
  if (strongMatch && strongMatch[1]) {
    return strongMatch[1].trim();
  }

  return "Untitled Chapter";
}

// Function to read the chapter content
async function readChapter(chapterNumber) {
  const formattedNumber = chapterNumber.toString().padStart(2, "0");
  const filePath = path.join(__dirname, "chapters", `${formattedNumber}.html`);

  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`Error reading chapter ${formattedNumber}:`, error.message);
    return null;
  }
}

// Function to generate a table of contents
async function generateTableOfContents() {
  let toc = '<h1>Table of Contents</h1>\n<ul class="toc-list">\n';

  for (let i = 0; i <= 38; i++) {
    const content = await readChapter(i);
    if (content) {
      const title = extractTitle(content);
      toc += `  <li><a href="#chapter-${i}">${i
        .toString()
        .padStart(2, "0")}. ${title}</a></li>\n`;
    }
  }

  toc += "</ul>";
  return toc;
}

// Function to adjust image paths in HTML content and remove iframes
function adjustImagePaths(html) {
  // First, remove all iframes (YouTube videos)
  const htmlWithoutIframes = html.replace(
    /<iframe[^>]*>[\s\S]*?<\/iframe>/g,
    ""
  );

  // Create a regex to match image tags with relative paths
  const imgRegex = /<img[^>]*src="\.\/(img\/[^"]+)"[^>]*>/g;

  // Replace each image with its absolute path version
  let result = htmlWithoutIframes;
  let match;

  while ((match = imgRegex.exec(htmlWithoutIframes)) !== null) {
    const fullImgTag = match[0];
    const imgPath = match[1];
    const absolutePath = path.join(__dirname, imgPath).replace(/\\/g, "/");

    // Create a new img tag with absolute path
    const newImgTag = fullImgTag.replace(
      /src="\.\/(img\/[^"]+)"/g,
      `src="file://${absolutePath}"`
    );

    // Replace the old img tag with the new one
    result = result.replace(fullImgTag, newImgTag);
  }

  // Also update hyperlinks to images
  return result.replace(/href="\.\/(img\/[^"]+)"/g, (match, imgPath) => {
    const absolutePath = path.join(__dirname, imgPath).replace(/\\/g, "/");
    return `href="file://${absolutePath}"`;
  });
}

// Main function to generate the PDF
async function generatePDF() {
  try {
    console.log("Starting PDF generation process...");

    // Create a combined HTML document
    let combinedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>An Evolutionary History of the City</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 40px;
            line-height: 1.6;
          }
          h1 { 
            page-break-before: always;
            font-size: 24px;
            margin-top: 40px;
          }
          h1:first-of-type {
            page-break-before: avoid;
          }          img {
            max-width: 90%;
            max-height: 500px;
            height: auto;
            margin: 20px auto;
            display: block;
            object-fit: contain;
          }
          figure {
            text-align: center;
            margin: 30px 0;
            page-break-inside: avoid;
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

    // Add table of contents
    const toc = await generateTableOfContents();
    combinedHtml += `<div class="chapter">${toc}</div>`;

    // Add each chapter
    for (let i = 0; i <= 38; i++) {
      const content = await readChapter(i);
      if (content) {
        const adjustedContent = adjustImagePaths(content);
        combinedHtml += `<div id="chapter-${i}" class="chapter">${adjustedContent}</div>`;
      }
    }

    combinedHtml += `
      </body>
      </html>
    `;

    // Save the combined HTML first (useful for debugging)
    console.log("Creating combined HTML file...");
    const tempHtmlPath = path.join(__dirname, "combined_book.html");
    fs.writeFileSync(tempHtmlPath, combinedHtml);
    console.log(`Combined HTML saved to ${tempHtmlPath}`);
    // Launch a headless browser
    console.log("Launching headless browser...");
    const browser = await puppeteer.launch({
      headless: "new", // Use the new headless mode
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--allow-file-access-from-files",
      ], // Add file access permission
    });

    console.log("Creating new page...");
    const page = await browser.newPage();

    // Set permissions to allow loading local resources
    const client = await page.target().createCDPSession();
    await client.send("Page.setBypassCSP", { enabled: true });

    // Allow file access
    await page.setBypassCSP(true); // Load the HTML content
    console.log("Loading HTML content...");

    // Setup event listeners for request failures (helps debug image loading issues)
    page.on("requestfailed", (request) => {
      console.log(
        `Failed to load resource: ${request.url()} - ${
          request.failure()?.errorText || "Unknown error"
        }`
      );
    });

    // Track image loading
    const imageLoadErrors = [];
    page.on("response", (response) => {
      const url = response.url();
      if (url.includes("file://") && url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        if (!response.ok()) {
          imageLoadErrors.push(
            `Failed to load image: ${url} - Status: ${response.status()}`
          );
        }
      }
    });

    await page.setContent(combinedHtml, {
      waitUntil: ["load", "networkidle0"],
      timeout: 120000, // Increase timeout to 120 seconds to allow more time for images
    });

    // Add fallback for images that failed to load
    await page.evaluate(() => {
      const images = document.querySelectorAll("img");
      images.forEach((img) => {
        img.onerror = function () {
          this.style.border = "1px dashed #ccc";
          this.style.padding = "10px";
          this.style.height = "100px";
          this.alt = this.alt || "Image failed to load: " + this.src;
          this.title = "Failed to load image";

          // Create a fallback text node
          const fallbackText = document.createElement("div");
          fallbackText.textContent =
            "[Image: " + (this.alt || this.src.split("/").pop()) + "]";
          fallbackText.style.textAlign = "center";
          fallbackText.style.fontStyle = "italic";
          fallbackText.style.color = "#666";
          this.parentNode.insertBefore(fallbackText, this.nextSibling);
        };

        // Force re-evaluation of the image
        const currentSrc = img.src;
        img.src = "";
        img.src = currentSrc;
      });
    });

    // Give a little time for any image errors to be processed
    await page.waitForTimeout(2000);

    // Log any image loading errors
    if (imageLoadErrors.length > 0) {
      console.log("Some images failed to load:");
      imageLoadErrors.forEach((err) => console.log(err));
    }

    // Generate PDF
    console.log("Generating PDF...");
    const pdfPath = path.join(__dirname, "evolutionary_history_of_city.pdf");
    await page.pdf({
      path: pdfPath,
      format: "A4",
      margin: {
        top: "30mm",
        right: "20mm",
        bottom: "30mm",
        left: "20mm",
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate:
        '<div style="font-size: 10px; width: 100%; text-align: center;"></div>',
      footerTemplate:
        '<div style="font-size: 10px; width: 100%; text-align: center; margin: 0 auto;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    });

    console.log("Closing browser...");
    await browser.close();
    console.log(`PDF generated at: ${pdfPath}`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    // Show detailed error information
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    if (error.message) {
      console.error("Error message:", error.message);
    }
  }
}

// Run the PDF generation
generatePDF();

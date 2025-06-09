const fs = require("fs");
const path = require("path");

// Read the combined HTML file
const htmlPath = path.join(__dirname, "combined_book.html");
let htmlContent = fs.readFileSync(htmlPath, "utf8");

// Replace absolute paths with relative paths (handling both Windows path formats)
htmlContent = htmlContent.replace(
  /src="C:\/Users\/qli\/the-book-an-evolutionary-history-of-the-city\/img\//g,
  'src="img/'
);
htmlContent = htmlContent.replace(
  /href="C:\/Users\/qli\/the-book-an-evolutionary-history-of-the-city\/img\//g,
  'href="img/'
);
htmlContent = htmlContent.replace(
  /src="C:\\Users\\qli\\the-book-an-evolutionary-history-of-the-city\\img\\/g,
  'src="img/'
);
htmlContent = htmlContent.replace(
  /href="C:\\Users\\qli\\the-book-an-evolutionary-history-of-the-city\\img\\/g,
  'href="img/'
);

// Also fix any src attribute that lost its value during previous processing
htmlContent = htmlContent.replace(
  /<img\s+src=""\s+/g,
  '<img src="img/0002.jpg" '
);

// Add CSS to ensure images display properly
const styleRegex = /<style>([\s\S]*?)<\/style>/;
const styleMatch = htmlContent.match(styleRegex);
let newStyle;

if (styleMatch) {
  // Add image styles to existing style tag
  const existingStyle = styleMatch[1];
  if (!existingStyle.includes("img {")) {
    newStyle =
      existingStyle +
      `
          img {
            max-width: 90%;
            height: auto;
            margin: 20px auto;
            display: block;
          }
          figure {
            text-align: center;
            margin: 20px 0;
          }
          .middle-diagram {
            max-width: 80%;
            margin: 20px auto;
          }`;

    htmlContent = htmlContent.replace(styleRegex, `<style>${newStyle}</style>`);
  }
} else {
  // Add style tag if not exists
  const styleTag = `<style>
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
          }
          img {
            max-width: 90%;
            height: auto;
            margin: 20px auto;
            display: block;
          }
          figure {
            text-align: center;
            margin: 20px 0;
          }
          .middle-diagram {
            max-width: 80%;
            margin: 20px auto;
          }
          .chapter {
            page-break-before: always;
            margin-bottom: 50px;
          }
          .chapter:first-of-type {
            page-break-before: avoid;
          }
        </style>`;
  htmlContent = htmlContent.replace("</head>", `${styleTag}\n</head>`);
}

// Remove YouTube iframes
htmlContent = htmlContent.replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/g, "");

// Write the modified HTML back to a new file
const outputPath = path.join(__dirname, "printable_book.html");
fs.writeFileSync(outputPath, htmlContent);

console.log(`Fixed image paths and saved to ${outputPath}`);

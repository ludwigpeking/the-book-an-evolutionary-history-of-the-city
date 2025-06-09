const fs = require("fs").promises;
const fsSync = require("fs");
const path = require("path");

// Utility function to check if directory exists
function directoryExists(dirPath) {
  try {
    return fsSync.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
}

// Utility function to check if file exists
function fileExists(filePath) {
  try {
    return fsSync.statSync(filePath).isFile();
  } catch (err) {
    return false;
  }
}

function convertHtmlToMarkdown(html) {
  if (!html) {
    console.error("Warning: Empty HTML content received");
    return "";
  }

  try {
    console.log("Converting HTML to Markdown...");

    // Remove HTML comments
    html = html.replace(/<!--[\s\S]*?-->/g, "");

    // Convert multiline headings (h1-h6)
    for (let i = 1; i <= 6; i++) {
      const hashes = "#".repeat(i);
      html = html.replace(new RegExp(`<h${i}[^>]*>([^]*?)</h${i}>`, "gi"), (match, content) => {
        return `${hashes} ${content.replace(/\s+/g, " ").trim()}\n\n`;
      });
    }

    // Convert images with links (handling multiline and preserving paths)
    html = html.replace(
      /<figure>\s*<a[^>]*href="\.\/img\/([^"]+)"[^>]*>\s*<img[^>]*?>\s*<\/a>\s*<\/figure>/gi,
      (match, src) => `![](./img/${src})\n\n`
    );

    // Convert standalone images (handling multiline)
    html = html.replace(
      /<figure>\s*<img[^>]*src="\.\/img\/([^"]+)"[^>]*>\s*<\/figure>/gi,
      (match, src) => `![](./img/${src})\n\n`
    );

    // Convert blockquotes
    html = html.replace(/<blockquote[^>]*>([^]*?)<\/blockquote>/gi, (match, content) => {
      return (
        content
          .split(/\n/)
          .map((line) => `> ${line}`)
          .join("\n") + "\n\n"
      );
    });

    // Convert lists
    html = html.replace(/<ul[^>]*>([^]*?)<\/ul>/gi, "$1\n");
    html = html.replace(/<ol[^>]*>([^]*?)<\/ol>/gi, "$1\n");
    html = html.replace(/<li[^>]*>([^]*?)<\/li>/gi, "* $1\n");

    // Convert paragraphs with classes
    html = html.replace(/<p[^>]*class="[^"]*"[^>]*>([^]*?)<\/p>/gi, "$1\n\n");

    // Convert regular paragraphs (handling multiline)
    html = html.replace(/<p[^>]*>([^]*?)<\/p>/gi, "$1\n\n");

    // Convert inline formatting
    html = html.replace(/<strong>([^]*?)<\/strong>/gi, "**$1**");
    html = html.replace(/<b>([^]*?)<\/b>/gi, "**$1**");
    html = html.replace(/<em>([^]*?)<\/em>/gi, "*$1*");
    html = html.replace(/<i>([^]*?)<\/i>/gi, "*$1*");
    html = html.replace(/<code>([^]*?)<\/code>/gi, "`$1`");

    // Convert links
    html = html.replace(/<a[^>]*href="([^"]+)"[^>]*>([^]*?)<\/a>/gi, "[$2]($1)");

    // Handle horizontal rules
    html = html.replace(/<hr[^>]*>/gi, "\n\n---\n\n");

    // Convert tables
    html = html.replace(/<table[^>]*>([^]*?)<\/table>/gi, (match, content) => {
      const rows = content.match(/<tr[^>]*>([^]*?)<\/tr>/gi) || [];
      return (
        rows
          .map((row) => {
            const cells = row.match(/<t[dh][^>]*>([^]*?)<\/t[dh]>/gi) || [];
            return (
              "| " +
              cells
                .map((cell) => {
                  const cellContent = cell.replace(/<t[dh][^>]*>([^]*?)<\/t[dh]>/i, "$1").trim();
                  return cellContent;
                })
                .join(" | ") +
              " |"
            );
          })
          .join("\n") + "\n\n"
      );
    });

    // Remove any remaining HTML tags
    html = html.replace(/<[^>]+>/g, " ");

    // Clean up whitespace and special characters
    html = html.replace(/&nbsp;/g, " ");
    html = html.replace(/&quot;/g, '"');
    html = html.replace(/&amp;/g, "&");
    html = html.replace(/&lt;/g, "<");
    html = html.replace(/&gt;/g, ">");
    html = html.replace(/\s+/g, " ");
    html = html.replace(/\n\s+/g, "\n");
    html = html.replace(/\n{3,}/g, "\n\n");

    const result = html.trim();
    if (!result) {
      console.error("Warning: Conversion resulted in empty content");
    }
    return result;
  } catch (error) {
    console.error("Error converting HTML to Markdown:", error);
    return "";
  }
}

async function compileChapters() {
  try {
    // Get absolute paths
    const workDir = __dirname;
    const chaptersDir = path.join(workDir, "chapters");
    const outputPath = path.join(workDir, "book.md");

    console.log("Working directory:", workDir);
    console.log("Chapters directory:", chaptersDir);
    console.log("Output file:", outputPath);

    // Validate directory exists
    if (!directoryExists(chaptersDir)) {
      throw new Error(`Chapters directory not found at: ${chaptersDir}`);
    }

    let output = "# An Evolutionary History of the City\n\n";

    // List all files in the directory
    const allFiles = await fs.readdir(chaptersDir);
    console.log(`Found ${allFiles.length} total files`);

    // Filter and sort chapter files
    const files = allFiles
      .filter((file) => /^\d+\.html$/.test(file))
      .sort((a, b) => {
        const numA = parseInt(a.match(/^(\d+)/)[1]);
        const numB = parseInt(b.match(/^(\d+)/)[1]);
        return numA - numB;
      });

    if (files.length === 0) {
      throw new Error("No chapter files found");
    }

    console.log(`Processing ${files.length} chapter files:`, files);

    // Process each file
    for (const file of files) {
      console.log(`\nProcessing ${file}...`);
      const filePath = path.join(chaptersDir, file);

      if (!fileExists(filePath)) {
        console.error(`Warning: File does not exist: ${filePath}`);
        continue;
      }

      try {
        const content = await fs.readFile(filePath, "utf8");
        console.log(`Read ${content.length} bytes from ${file}`);

        if (!content) {
          console.error(`Warning: Empty file: ${file}`);
          continue;
        }

        const markdown = convertHtmlToMarkdown(content);
        console.log(`Converted ${file} to ${markdown.length} bytes of markdown`);

        if (markdown) {
          const chapterNum = file.replace(".html", "").padStart(2, "0");
          output += `\n\n## Chapter ${chapterNum}\n\n`;
          output += markdown;
          output += "\n\n---\n\n";
          console.log(`Added chapter ${chapterNum}`);
        } else {
          console.error(`Warning: No markdown content generated for ${file}`);
        }
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }

    // Write the output file
    console.log(`\nWriting output to ${outputPath}...`);
    await fs.writeFile(outputPath, output, "utf8");
    console.log(`Successfully wrote book.md (${output.length} bytes)`);

    // Verify the file was written
    if (!fileExists(outputPath)) {
      throw new Error("Failed to write output file");
    }

    const stats = fsSync.statSync(outputPath);
    console.log(`Verified output file: ${stats.size} bytes`);
  } catch (error) {
    console.error("Error compiling chapters:", error);
    process.exit(1);
  }
}

// Run the script
console.log("Starting compilation...");
compileChapters()
  .then(() => {
    console.log("Compilation complete!");
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

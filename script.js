let currentChapter = 0;

document.getElementById("tocButton").addEventListener("click", function () {
  currentChapter = 0; // Reset to the first chapter or Table of Contents
  loadChapter(currentChapter);
});

// Previous Chapter Button
document.getElementById("prevButton").addEventListener("click", function () {
  if (currentChapter > 0) {
    currentChapter -= 1;
    loadChapter(currentChapter);
  } else {
    console.log("Already at the first chapter");
  }
});

// Next Chapter Button
document.getElementById("nextButton").addEventListener("click", function () {
  currentChapter += 1;
  loadChapter(currentChapter);
});

function loadChapter(chapterNumber) {
  console.log("Loading chapter", chapterNumber);
  currentChapter = chapterNumber;
  const contentDiv = document.getElementById("content");
  // Format the chapter number as a two-digit string
  const formattedChapterNumber = chapterNumber.toString().padStart(2, "0");
  const chapterFile =
    chapterNumber === 0
      ? `chapters/${formattedChapterNumber}.html`
      : `chapters/${formattedChapterNumber}.html`;

  fetch(chapterFile)
    .then((response) => response.text())
    .then((data) => {
      contentDiv.innerHTML = data;
      contentDiv.scrollTop = 0;
      if (chapterNumber === 0) {
        // Load links.html into content after loading 00.html
        loadLinksIntoContent();
      }
    })
    .catch((error) => console.error("Error loading chapter:", error));
}

function loadLinksIntoContent() {
  fetch("links.html")
    .then((response) => response.text())
    .then((data) => {
      // Append the links to the content already loaded from 00.html
      document.getElementById("content").innerHTML += data;

      // Set up event listeners for each link
      document.querySelectorAll("#content .nav-link").forEach((link) => {
        link.addEventListener("click", function (event) {
          event.preventDefault();
          const chapterNumber = parseInt(this.getAttribute("data-chapter"), 10);
          loadChapter(chapterNumber);
        });
      });
    })
    .catch((error) => console.error("Error loading links:", error));
  fetch("intro.html")
    .then((response) => response.text())
    .then((data) => {
      // Append the links to the content already loaded from 00.html
      document.getElementById("content").innerHTML += data;

      // Set up event listeners for each link
      document.querySelectorAll("#content .nav-link").forEach((link) => {
        link.addEventListener("click", function (event) {
          event.preventDefault();
          const chapterNumber = parseInt(this.getAttribute("data-chapter"), 10);
          loadChapter(chapterNumber);
        });
      });
    })
    .catch((error) => console.error("Error loading links:", error));
}

// Example usage: Load chapter 00 initially
loadChapter(0);

// Add event listeners to your navigation links
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", function (event) {
    event.preventDefault();
    const chapterNumber = parseInt(this.getAttribute("data-chapter"), 10);
    loadChapter(chapterNumber);
  });
});

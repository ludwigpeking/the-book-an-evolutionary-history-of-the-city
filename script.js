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
  if (currentChapter < 38) {
    currentChapter += 1;
    loadChapter(currentChapter);
  } else {
    console.log("Already at the last chapter");
  }
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
    .then((linksData) => {
      const contentDiv = document.getElementById("content");
      contentDiv.innerHTML += linksData;

      return fetch("intro.html"); // Start fetching intro.html after links.html is loaded
    })
    .then((response) => response.text())
    .then((introData) => {
      const contentDiv = document.getElementById("content");
      contentDiv.innerHTML += introData;

      // Set up event listeners for each link
      document.querySelectorAll("#content .nav-link").forEach((link) => {
        link.addEventListener("click", function (event) {
          event.preventDefault();
          const chapterNumber = parseInt(this.getAttribute("data-chapter"), 10);
          loadChapter(chapterNumber);
        });
      });
    })
    .catch((error) => console.error("Error loading content:", error));
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

document.querySelectorAll(".left-column, .content").forEach((div) => {
  div.addEventListener(
    "wheel",
    function (e) {
      e.preventDefault(); // Prevent default scroll behavior

      var scrollAmount = e.deltaY * 0.6; // Adjust the 0.1 value to control the scroll speed
      this.scrollBy(0, scrollAmount);
    },
    { passive: false }
  );
});

document.addEventListener("keydown", function (event) {
  // Check if the left arrow key (key code 37) was pressed
  if (event.keyCode === 37) {
    // Trigger the click event for the Previous Chapter button
    if (currentChapter > 0) {
      currentChapter -= 1;
      loadChapter(currentChapter);
    } else {
      console.log("Already at the first chapter");
    }
  }

  // Check if the right arrow key (key code 39) was pressed
  if (event.keyCode === 39) {
    // Trigger the click event for the Next Chapter button
    if (currentChapter < 38) {
      currentChapter += 1;
      loadChapter(currentChapter);
    } else {
      console.log("Already at the last chapter");
    }
  }
});

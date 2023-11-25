let currentChapter = 0;

function getChapterFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const chapter = urlParams.get("chapter");
  return chapter ? parseInt(chapter, 10) : 0;
}

document.getElementById("tocButton").addEventListener("click", function () {
  currentChapter = 0;
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
  const formattedChapterNumber = chapterNumber.toString().padStart(2, "0");
  const chapterFile = `chapters/${formattedChapterNumber}.html`;

  fetch(chapterFile)
    .then((response) => response.text())
    .then((data) => {
      contentDiv.innerHTML = data;
      contentDiv.scrollTop = 0;
      if (chapterNumber === 0) {
        loadLinksIntoContent();
      }
      history.pushState({}, "", "?chapter=" + chapterNumber);
    })
    .catch((error) => console.error("Error loading chapter:", error));
}

function loadLinksIntoContent() {
  console.log("Loading links into content");
  fetch("links.html")
    .then((response) => response.text())
    .then((linksData) => {
      const linksContainer = document.getElementById("links-container");
      linksContainer.innerHTML = linksData; // Load links into links-container
      const contentElement = document.getElementById("content");
      contentElement.innerHTML += linksData;
      return fetch("intro.html"); // Fetch intro.html
    })
    .then((response) => response.text())
    .then((introData) => {
      const contentDiv = document.getElementById("content");
      contentDiv.innerHTML += introData; // Append intro.html to content
    })
    .catch((error) => console.error("Error loading content:", error));
}
document.getElementById("content").addEventListener("click", function (event) {
  if (event.target && event.target.matches(".nav-link")) {
    event.preventDefault();
    const chapterNumber = parseInt(
      event.target.getAttribute("data-chapter"),
      10
    );
    loadChapter(chapterNumber);
  }
});

document
  .getElementById("links-container")
  .addEventListener("click", function (event) {
    if (event.target && event.target.matches(".nav-link")) {
      event.preventDefault();
      const chapterNumber = parseInt(
        event.target.getAttribute("data-chapter"),
        10
      );
      loadChapter(chapterNumber);
    }
  });
document.addEventListener("DOMContentLoaded", function () {
  const initialChapter = getChapterFromURL();
  loadChapter(initialChapter);
});

// Example usage: Load chapter 00 initially
// loadChapter(0);

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

let currentChapter = 0;
let currentLanguage = "en"; // Default language is English

function getChapterFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const chapter = urlParams.get("chapter");
  const language = urlParams.get("lang");

  if (language) {
    currentLanguage = language;
    updateLanguageButton();
  }

  return chapter ? parseInt(chapter, 10) : 0;
}

function updateLanguageButton() {
  const languageButton = document.getElementById("languageButton");
  languageButton.textContent = currentLanguage === "en" ? "CN" : "EN";
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

// Function to update sidebar links based on current language
function updateSidebarLinks() {
  // Determine which link generation function to use based on language
  const generateLinksFunction =
    currentLanguage === "en" ? generateEnglishLinks : generateChineseLinks;

  // Dynamically generate links for the current language
  generateLinksFunction()
    .then((linksData) => {
      const linksContainer = document.getElementById("links-container");
      linksContainer.innerHTML = linksData;

      // Set up event listeners for the links
      setupNavLinksEventListeners();
    })
    .catch((error) =>
      console.error(`Error loading ${currentLanguage} sidebar links:`, error)
    );
}

// Language Button
document
  .getElementById("languageButton")
  .addEventListener("click", function () {
    // Toggle language
    currentLanguage = currentLanguage === "en" ? "cn" : "en";
    updateLanguageButton();
    // Update the sidebar links to match the new language
    updateSidebarLinks();
    // Load the current chapter in the new language
    loadChapter(currentChapter);
  });

function loadChapter(chapterNumber) {
  console.log("Loading chapter", chapterNumber, "in", currentLanguage);
  currentChapter = chapterNumber;
  const contentDiv = document.getElementById("content");
  const formattedChapterNumber = chapterNumber.toString().padStart(2, "0");

  // Determine which folder to load from based on language
  const chapterFolder = currentLanguage === "en" ? "chapters" : "chapters_cn";
  const chapterFile = `${chapterFolder}/${formattedChapterNumber}.html`;

  fetch(chapterFile)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.text();
    })
    .then((data) => {
      contentDiv.innerHTML = data;
      contentDiv.scrollTop = 0;
      if (chapterNumber === 0) {
        loadLinksIntoContent();
      }
      history.pushState(
        {},
        "",
        `?chapter=${chapterNumber}&lang=${currentLanguage}`
      );
    })
    .catch((error) => {
      console.error("Error loading chapter:", error);
      // If Chinese version doesn't exist, fallback to English
      if (currentLanguage === "cn") {
        currentLanguage = "en";
        updateLanguageButton();
        loadChapter(chapterNumber);
      }
    });
}

function loadLinksIntoContent() {
  console.log("Loading links into content");
  const introFile = currentLanguage === "en" ? "intro.html" : "intro_cn.html";

  // Determine which link generation function to use based on language
  const generateLinksFunction =
    currentLanguage === "en" ? generateEnglishLinks : generateChineseLinks;

  // Dynamically generate links for the current language
  generateLinksFunction()
    .then((linksData) => {
      const linksContainer = document.getElementById("links-container");
      linksContainer.innerHTML = linksData;
      const contentElement = document.getElementById("content");
      contentElement.innerHTML += linksData;
      return fetch(introFile);
    })
    .then((response) => response.text())
    .then((introData) => {
      const contentDiv = document.getElementById("content");
      contentDiv.innerHTML += introData; // Append intro.html to content
    })
    .catch((error) =>
      console.error(`Error loading ${currentLanguage} content:`, error)
    );
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

function setupNavLinksEventListeners() {
  // Add click event listeners to all navigation links
  document.querySelectorAll("#links-container .nav-link").forEach((link) => {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      const chapterNumber = parseInt(this.getAttribute("data-chapter"), 10);
      loadChapter(chapterNumber);
    });
  });
}

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
  updateLanguageButton();

  // Update sidebar links based on current language
  updateSidebarLinks();

  // Load the chapter after a slight delay to ensure links are loaded
  setTimeout(() => {
    loadChapter(initialChapter);
  }, 100);
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

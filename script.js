document.getElementById("tocButton").addEventListener("click", function () {
  // Logic to navigate to the table of contents
});

document.getElementById("prevButton").addEventListener("click", function () {
  // Logic to navigate to the previous chapter
});

document.getElementById("nextButton").addEventListener("click", function () {
  // Logic to navigate to the next chapter
});

// Additional JavaScript for loading and displaying chapters

function loadChapter(chapterNumber) {
  const contentDiv = document.getElementById("content");
  // Format the chapter number as a two-digit string
  const formattedChapterNumber = chapterNumber.toString().padStart(2, "0");
  fetch(`chapters/${formattedChapterNumber}.html`)
    .then((response) => response.text())
    .then((data) => {
      contentDiv.innerHTML = data;
    })
    .catch((error) => console.error("Error loading chapter:", error));
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

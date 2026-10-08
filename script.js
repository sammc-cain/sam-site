document.addEventListener("DOMContentLoaded", function () {

// -------------------------------- // Hamburger menu // --------------------------------

var menuButton = document.getElementById("menu-button"); var menu = document.getElementById("menu");

if (menuButton && menu) { menuButton.addEventListener("click", function () { menu.classList.toggle("open"); }); }

// -------------------------------- // Blog excerpt // --------------------------------

var blogPreview = document.getElementById("blog-preview");

if (!blogPreview) { return; }

var targetWords = 75; var minimumWords = 50; var maximumWords = 100;

fetch("blog.html") .then(function (response) { return response.text(); }) .then(function (html) {

var parser = new DOMParser();

var blogDocument = parser.parseFromString(html, "text/html");

var titleElement = blogDocument.querySelector("#post-title");

var dateElement = blogDocument.querySelector("#post-date");

var contentElement = blogDocument.querySelector("#post-content");

if (!titleElement || !contentElement) {

blogPreview.textContent = "Unable to load the latest post.";

return; }

var title = titleElement.textContent.trim();

var date = "";

if (dateElement) { date = dateElement.textContent.trim(); }

var fullText = contentElement.textContent .replace(/\s+/g, " ") .trim();

var words = fullText.split(" ");

var excerpt = fullText; var wasTruncated = false;

if (words.length > maximumWords) {

wasTruncated = true;

var textUpToMaximum = words .slice(0, maximumWords) .join(" ");

var sentenceMatches = textUpToMaximum.match( /.*?.!?/g );

if (sentenceMatches && sentenceMatches.length > 0) {

var possibleExcerpt = sentenceMatches[ sentenceMatches.length - 1 ].trim();

var possibleWordCount = possibleExcerpt .split(/\s+/) .length;

if (possibleWordCount >= minimumWords) {

excerpt = possibleExcerpt;

} else {

excerpt = words .slice(0, targetWords) .join(" "); }

} else {

excerpt = words .slice(0, targetWords) .join(" "); } }

// -------------------------------- // Create title // --------------------------------

var titleOnPage = document.createElement("h3");

titleOnPage.textContent = title;

// -------------------------------- // Create date // --------------------------------

if (date !== "") {

var dateOnPage = document.createElement("div");

dateOnPage.className = "post-date";

dateOnPage.textContent = date;

blogPreview.appendChild( titleOnPage );

blogPreview.appendChild( dateOnPage );

} else {

blogPreview.appendChild( titleOnPage ); }

// -------------------------------- // Create excerpt // --------------------------------

var excerptElement = document.createElement("p");

excerptElement.className = "post-excerpt";

excerptElement.textContent = excerpt;

if (wasTruncated) { excerptElement.textContent += "..."; }

// -------------------------------- // Read More // --------------------------------

var readMore = document.createElement("a");

readMore.className = "read-more";

readMore.href = "blog.html";

readMore.textContent = "[ Read More ]";

excerptElement.appendChild( document.createTextNode(" ") );

excerptElement.appendChild( readMore );

// -------------------------------- // Display // --------------------------------

blogPreview.appendChild( excerptElement );

})

.catch(function (error) {

console.error( "Error loading blog:", error );

blogPreview.textContent = "Unable to load the latest post.";

});

});
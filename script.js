document.addEventListener("DOMContentLoaded", function () {
    // ========================================
    // 1. Shared helpers
    // ========================================

    function createExcerpt(fullText) {
        var targetWords = 50;
        var minimumWords = 35;
        var maximumWords = 60;

        var words = fullText.split(/\s+/);

        if (words.length <= maximumWords) {
            return {
                text: fullText,
                truncated: false
            };
        }

        var textUpToMaximum = words.slice(0, maximumWords).join(" ");
        var sentenceMatches = textUpToMaximum.match(/[^.!?]+[.!?]+(?=\s|$)/g);
        var possibleExcerpt = sentenceMatches
            ? sentenceMatches.join("").trim()
            : "";

        var possibleWordCount = possibleExcerpt
            ? possibleExcerpt.split(/\s+/).length
            : 0;

        var excerpt;

        if (
            possibleWordCount >= minimumWords &&
            possibleWordCount <= maximumWords
        ) {
            excerpt = possibleExcerpt;
        } else {
            excerpt = words.slice(0, targetWords).join(" ");
        }

        return {
            text: excerpt,
            truncated: true
        };
    }

    function createReadMoreLink(href, openInNewTab) {
        var link = document.createElement("a");

        link.className = "read-more";
        link.href = href;
        link.textContent = "Read more →";

        if (openInNewTab) {
            link.target = "_blank";
            link.rel = "noopener noreferrer";
        }

        return link;
    }

    function showStatus(container, message) {
        var status = document.createElement("p");

        status.className = "preview-status";
        status.setAttribute("role", "status");
        status.textContent = message;

        container.replaceChildren(status);
    }


    // ========================================
    // 2. Hamburger menu and submenus
    // ========================================

    var menuButton = document.getElementById("menu-button");
    var menu = document.getElementById("menu");

    if (menuButton && menu) {
        var categoryButtons = menu.querySelectorAll(".menu-category");
        var menuItems = menu.querySelectorAll(".menu-item");

        function closeSubmenus() {
            menuItems.forEach(function (item) {
                item.classList.remove("submenu-open");

                var categoryButton = item.querySelector(".menu-category");

                if (categoryButton) {
                    categoryButton.setAttribute("aria-expanded", "false");
                }
            });
        }

        function closeMenu() {
            closeSubmenus();
            menu.classList.remove("open");
            menuButton.setAttribute("aria-expanded", "false");
            menuButton.setAttribute("aria-label", "Open menu");
        }

        function openMenu() {
            menu.classList.add("open");
            menuButton.setAttribute("aria-expanded", "true");
            menuButton.setAttribute("aria-label", "Close menu");
        }

        function toggleSubmenu(button) {
            var currentItem = button.closest(".menu-item");

            if (!currentItem) {
                return;
            }

            var shouldOpen = !currentItem.classList.contains("submenu-open");

            closeSubmenus();

            if (shouldOpen) {
                currentItem.classList.add("submenu-open");
                button.setAttribute("aria-expanded", "true");
            }
        }

        // Open and close the main menu.
        menuButton.addEventListener("click", function (event) {
            event.stopPropagation();

            if (menu.classList.contains("open")) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        // Expand a category when clicked or tapped.
        categoryButtons.forEach(function (button) {
            button.addEventListener("click", function (event) {
                event.stopPropagation();
                toggleSubmenu(button);
            });
        });

        // Close the menu when a link is selected.
        menu.addEventListener("click", function (event) {
            if (event.target.closest("a")) {
                closeMenu();
            }
        });

        // Close the menu when clicking outside it.
        document.addEventListener("click", function (event) {
            if (
                !menu.contains(event.target) &&
                !menuButton.contains(event.target)
            ) {
                closeMenu();
            }
        });

        // Escape closes the menu and restores focus to the hamburger.
        document.addEventListener("keydown", function (event) {
            if (event.key !== "Escape" || !menu.classList.contains("open")) {
                return;
            }

            closeMenu();
            menuButton.focus();
        });
    }


    // ========================================
    // 3. External article preview
    // ========================================

    var externalPreview = document.getElementById("external-preview");

    if (externalPreview) {
        var apiUrl =
            "https://kuntalganguly.com/wp-json/wp/v2/posts" +
            "?slug=ma-langue-sourit&_fields=date,link,title,content";

        fetch(apiUrl, {cache: "no-store"})
            .then(function (response) {
                if (!response.ok) {
                    throw new Error(
                        "WordPress API returned status " + response.status
                    );
                }

                return response.json();
            })
            .then(function (posts) {
                if (!Array.isArray(posts) || posts.length === 0) {
                    throw new Error("The requested article was not found.");
                }

                var post = posts[0];

                if (
                    !post.title ||
                    !post.title.rendered ||
                    !post.content ||
                    !post.content.rendered ||
                    !post.link ||
                    !post.date
                ) {
                    throw new Error("The article data is incomplete.");
                }

                var parser = new DOMParser();
                var titleDocument = parser.parseFromString(
                    post.title.rendered,
                    "text/html"
                );
                var contentDocument = parser.parseFromString(
                    post.content.rendered,
                    "text/html"
                );

                var title = titleDocument.body.textContent.trim();
                var fullText = contentDocument.body.textContent
                    .replace(/\s+/g, " ")
                    .trim();

                if (!title || !fullText) {
                    throw new Error(
                        "The article contains no readable text."
                    );
                }

                var excerptData = createExcerpt(fullText);

                // Article title
                var titleElement = document.createElement("h3");
                titleElement.textContent = title;

                // Publication date
                var publishedDate = new Date(post.date);

                if (Number.isNaN(publishedDate.getTime())) {
                    throw new Error(
                        "The article publication date is invalid."
                    );
                }

                var dateElement = document.createElement("div");
                dateElement.className = "external-date";
                dateElement.textContent = publishedDate.toLocaleDateString(
                    "en-GB",
                    {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        timeZone: "UTC"
                    }
                );

                // Article excerpt
                var excerptElement = document.createElement("p");
                excerptElement.className = "external-excerpt";
                excerptElement.textContent =
                    excerptData.text +
                    (excerptData.truncated ? "..." : "");

                // Read more link
                var readMore = createReadMoreLink(post.link, true);

                // Display the preview
                externalPreview.replaceChildren(
                    titleElement,
                    dateElement,
                    excerptElement,
                    readMore
                );
            })
            .catch(function (error) {
                console.error("External article error:", error);

                showStatus(
                    externalPreview,
                    "Unable to load the external article."
                );
            });
    }


    // ========================================
    // 4. Latest post preview
    // ========================================

    var blogPreview = document.getElementById("blog-preview");

    if (!blogPreview) {
        return;
    }

    fetch("blog.html")
        .then(function (response) {
            if (!response.ok) {
                throw new Error(
                    "Unable to retrieve blog.html. Status: " + response.status
                );
            }

            return response.text();
        })
        .then(function (html) {
            var parser = new DOMParser();
            var blogDocument = parser.parseFromString(html, "text/html");

            var titleElement = blogDocument.querySelector("#post-title");
            var dateElement = blogDocument.querySelector("#post-date");
            var contentElement = blogDocument.querySelector("#post-content");

            if (!titleElement || !contentElement) {
                throw new Error("The latest post content is incomplete.");
            }

            var title = titleElement.textContent.trim();
            var date = dateElement ? dateElement.textContent.trim() : "";
            var fullText = contentElement.textContent
                .replace(/\s+/g, " ")
                .trim();

            if (!title || !fullText) {
                throw new Error("The latest post contains no readable text.");
            }

            var excerptData = createExcerpt(fullText);

            // Article title
            var titleOnPage = document.createElement("h3");
            titleOnPage.textContent = title;

            var previewElements = [titleOnPage];

            // Publication date
            if (date !== "") {
                var dateOnPage = document.createElement("div");

                dateOnPage.className = "post-date";
                dateOnPage.textContent = date;

                previewElements.push(dateOnPage);
            }

            // Article excerpt
            var excerptElement = document.createElement("p");
            excerptElement.className = "post-excerpt";
            excerptElement.textContent =
                excerptData.text +
                (excerptData.truncated ? "..." : "");

            // Read more link
            var readMore = createReadMoreLink("blog.html", false);

            // Display the preview
            blogPreview.replaceChildren(
                ...previewElements,
                excerptElement,
                readMore
            );
        })
        .catch(function (error) {
            console.error("Error loading blog:", error);

            showStatus(
                blogPreview,
                "Unable to load the latest post."
            );
        });
});
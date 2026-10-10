(function () {
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

    function readCache(key) {
        try {
            var cachedValue = localStorage.getItem(key);

            if (!cachedValue) {
                return null;
            }

            var data = JSON.parse(cachedValue);

            if (
                !data ||
                typeof data.title !== "string" ||
                typeof data.date !== "string" ||
                typeof data.link !== "string" ||
                typeof data.fullText !== "string" ||
                !data.title ||
                !data.date ||
                !data.link ||
                !data.fullText
            ) {
                return null;
            }

            return data;
        } catch (error) {
            return null;
        }
    }

    function writeCache(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            // The preview still works if browser storage is unavailable.
        }
    }

    function sameArticle(first, second) {
        return (
            first.title === second.title &&
            first.date === second.date &&
            first.link === second.link &&
            first.fullText === second.fullText
        );
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

        menuButton.addEventListener("click", function (event) {
            event.stopPropagation();

            if (menu.classList.contains("open")) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        categoryButtons.forEach(function (button) {
            button.addEventListener("click", function (event) {
                event.stopPropagation();
                toggleSubmenu(button);
            });
        });

        menu.addEventListener("click", function (event) {
            if (event.target.closest("a")) {
                closeMenu();
            }
        });

        document.addEventListener("click", function (event) {
            if (
                !menu.contains(event.target) &&
                !menuButton.contains(event.target)
            ) {
                closeMenu();
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key !== "Escape" || !menu.classList.contains("open")) {
                return;
            }

            closeMenu();
            menuButton.focus();
        });
    }


    // ========================================
    // 3. Latest post from WordPress
    // ========================================

    var latestPreview = document.getElementById("external-preview");
    var latestCacheKey = "small-observations-external-article-v1";

    function renderLatestArticle(article) {
        var excerptData = createExcerpt(article.fullText);

        var titleElement = document.createElement("h3");
        titleElement.textContent = article.title;

        var publishedDate = new Date(article.date);

        if (Number.isNaN(publishedDate.getTime())) {
            throw new Error("The article publication date is invalid.");
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

        var excerptElement = document.createElement("p");
        excerptElement.className = "external-excerpt";
        excerptElement.textContent =
            excerptData.text +
            (excerptData.truncated ? "..." : "");

        var readMore = createReadMoreLink(article.link, true);

        latestPreview.replaceChildren(
            titleElement,
            dateElement,
            excerptElement,
            readMore
        );
    }

    if (latestPreview) {
        var cachedArticle = readCache(latestCacheKey);

        // Show the previously loaded article immediately, if available.
        if (cachedArticle) {
            try {
                renderLatestArticle(cachedArticle);
            } catch (error) {
                console.error("Cached latest article error:", error);
                cachedArticle = null;
            }
        }

        var apiUrl =
            "https://kuntalganguly.com/wp-json/wp/v2/posts" +
            "?slug=ma-langue-sourit&_fields=date,link,title,content";

        // Refresh the article in the background.
        fetch(apiUrl)
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

                var article = {
                    title: titleDocument.body.textContent.trim(),
                    date: post.date,
                    link: post.link,
                    fullText: contentDocument.body.textContent
                        .replace(/\s+/g, " ")
                        .trim()
                };

                if (!article.title || !article.fullText) {
                    throw new Error(
                        "The article contains no readable text."
                    );
                }

                // Save the article for the next visit.
                writeCache(latestCacheKey, article);

                // Redraw only if the article has changed.
                if (
                    !cachedArticle ||
                    !sameArticle(cachedArticle, article)
                ) {
                    renderLatestArticle(article);
                }
            })
            .catch(function (error) {
                console.error("Latest article error:", error);

                // Keep cached content visible if the refresh fails.
                if (!cachedArticle) {
                    showStatus(
                        latestPreview,
                        "Unable to load the latest post."
                    );
                }
            });
    }
})();
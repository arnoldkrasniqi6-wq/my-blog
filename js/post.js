// Theme Management
const themeToggleBtn = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'light';

document.documentElement.setAttribute('data-theme', currentTheme);

themeToggleBtn.addEventListener('click', () => {
  const activeTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = activeTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);

  // Sync with Giscus comments theme
  const iframe = document.querySelector('iframe.giscus-frame');
  if (iframe) {
    iframe.contentWindow.postMessage(
      { giscus: { setConfig: { theme: newTheme === 'dark' ? 'dark' : 'light' } } },
      'https://giscus.app'
    );
  }
});

// DOM Elements
const articleTitle = document.getElementById('article-title');
const articleDate = document.getElementById('article-date');
const articleReadingTime = document.getElementById('article-reading-time');
const articleTags = document.getElementById('article-tags');
const articleContent = document.getElementById('article-content');
const coverImageContainer = document.getElementById('cover-image-container');
const articleCoverImage = document.getElementById('article-cover-image');
const scrollProgressBar = document.getElementById('scroll-progress');

// Helper to parse frontmatter from markdown
function parseFrontmatter(fileContent) {
  const result = {
    metadata: {},
    content: ''
  };

  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = fileContent.match(frontmatterRegex);

  if (match) {
    const yamlBlock = match[1];
    result.content = match[2].trim();

    const lines = yamlBlock.split('\n');
    lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > -1) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

        if (key === 'tags') {
          if (value.startsWith('[') && value.endsWith(']')) {
            result.metadata[key] = value
              .slice(1, -1)
              .split(',')
              .map(t => t.trim().replace(/['"]/g, ''))
              .filter(t => t.length > 0);
          } else {
            result.metadata[key] = value
              .split(',')
              .map(t => t.trim())
              .filter(t => t.length > 0);
          }
        } else {
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          result.metadata[key] = value;
        }
      }
    });
  } else {
    result.content = fileContent.trim();
  }

  return result;
}

// Calculate reading time
function calculateReadingTime(text) {
  const wordsPerMinute = 200;
  const noOfWords = text.split(/\s+/).length;
  const minutes = noOfWords / wordsPerMinute;
  const readTime = Math.ceil(minutes);
  return `${readTime} min read`;
}

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', options);
}

// Initialize Article Loading
async function initArticle() {
  // Get post ID from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  if (!postId) {
    renderNotFound('No article specified.');
    return;
  }

  try {
    // Fetch markdown file from posts/ folder
    const response = await fetch(`posts/${postId}.md`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Article not found.');
      } else {
        throw new Error('Failed to load article.');
      }
    }

    const markdownText = await response.text();
    const { metadata, content } = parseFrontmatter(markdownText);

    // Populate Page Header & Metadata
    const title = metadata.title || postId.replace(/-/g, ' ');
    articleTitle.textContent = title;
    document.title = `${title} — Liveblogger`;
    
    // Update SEO Meta Description dynamically
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && metadata.description) {
      metaDescription.setAttribute('content', metadata.description);
    }

    const dateStr = metadata.date || new Date().toISOString().split('T')[0];
    articleDate.textContent = formatDate(dateStr);
    
    const readTime = metadata.readingTime || calculateReadingTime(content);
    articleReadingTime.textContent = readTime;

    // Tags
    articleTags.innerHTML = '';
    const tags = metadata.tags || ['General'];
    tags.forEach(tag => {
      const span = document.createElement('span');
      span.className = 'article-tag';
      span.textContent = `#${tag}`;
      articleTags.appendChild(span);
    });

    // Cover Image
    if (metadata.coverImage && metadata.coverImage.trim().length > 0) {
      articleCoverImage.src = metadata.coverImage;
      articleCoverImage.alt = title;
      coverImageContainer.style.display = 'block';
    } else {
      coverImageContainer.style.display = 'none';
    }

    // Parse and Render Markdown Content using Marked.js
    if (typeof marked !== 'undefined') {
      // Set marked options for security/rendering if needed
      marked.setOptions({
        breaks: true,
        gfm: true
      });
      articleContent.innerHTML = marked.parse(content);
    } else {
      // Fallback if marked is not loaded
      articleContent.innerHTML = `<pre style="white-space: pre-wrap;">${content}</pre>`;
    }

    // Scroll Progress Bar Event Listener
    window.addEventListener('scroll', updateScrollProgress);

    // Initialize AdSense for the page
    initAdSense();

  } catch (error) {
    console.error('Error loading article:', error);
    renderNotFound(error.message);
  }
}

// Render Not Found / Error State
function renderNotFound(message) {
  document.title = 'Article Not Found — Liveblogger';
  document.body.classList.add('error-page');
  
  // Hide header details and cover image
  articleDate.style.display = 'none';
  articleReadingTime.style.display = 'none';
  coverImageContainer.style.display = 'none';

  articleTitle.textContent = 'Post Not Found';
  articleContent.innerHTML = `
    <div class="not-found-container">
      <h2>404 — Article Not Found</h2>
      <p>${message || 'The article you are looking for does not exist or has been moved.'}</p>
      <p style="margin-top: 1.5rem;">
        <a href="index.html" class="tag-pill active" style="display: inline-block;">Return to Homepage</a>
      </p>
    </div>
  `;
}

// Update Scroll Progress Bar
function updateScrollProgress() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  
  if (docHeight > 0) {
    const scrollPercent = (scrollTop / docHeight) * 100;
    scrollProgressBar.style.width = `${scrollPercent}%`;
  } else {
    scrollProgressBar.style.width = '0%';
  }
}

// Push AdSense ads
function initAdSense() {
  try {
    // Collect all uninitialized ins.adsbygoogle units on the page
    const ads = document.querySelectorAll('ins.adsbygoogle');
    ads.forEach(ad => {
      if (!ad.getAttribute('data-adsbygoogle-status')) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    });
  } catch (e) {
    console.warn('AdSense initialization skipped or failed:', e);
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', initArticle);

// Theme Management
const themeToggleBtn = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'light';

document.documentElement.setAttribute('data-theme', currentTheme);

themeToggleBtn.addEventListener('click', () => {
  const activeTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = activeTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
});

// Blog App State
let allPosts = [];
let activeTag = 'all';
let searchQuery = '';

// DOM Elements
const blogFeed = document.getElementById('blog-feed');
const searchInput = document.getElementById('search-input');
const tagsWrapper = document.getElementById('tags-wrapper');
const sidebarTagsList = document.getElementById('sidebar-tags-list');

// Initialize App
async function init() {
  try {
    const response = await fetch('posts.json');
    if (!response.ok) {
      throw new Error('Failed to fetch posts.json');
    }
    allPosts = await response.json();
    
    setupTags();
    renderPosts();
    initAdSense();
  } catch (error) {
    console.error('Error initializing blog:', error);
    blogFeed.innerHTML = `
      <div class="no-posts">
        <h3>Oops! Something went wrong</h3>
        <p>We couldn't load the blog posts. Make sure you've run <code>npm run build-index</code> to generate the posts index.</p>
      </div>
    `;
  }

  // Setup Event Listeners
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderPosts();
  });
}

// Extract tags and build filters
function setupTags() {
  const tagCount = {};
  allPosts.forEach(post => {
    if (post.tags && Array.isArray(post.tags)) {
      post.tags.forEach(tag => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    }
  });

  // Get sorted unique tags
  const uniqueTags = Object.keys(tagCount).sort((a, b) => tagCount[b] - tagCount[a]);

  // Build Filter Pills (top)
  uniqueTags.forEach(tag => {
    const button = document.createElement('button');
    button.className = 'tag-pill';
    button.textContent = `${tag} (${tagCount[tag]})`;
    button.setAttribute('data-tag', tag);
    button.addEventListener('click', () => handleTagClick(tag));
    tagsWrapper.appendChild(button);
  });

  // Build Sidebar Tags Widget
  uniqueTags.forEach(tag => {
    const span = document.createElement('span');
    span.className = 'sidebar-tag';
    span.textContent = `${tag} (${tagCount[tag]})`;
    span.addEventListener('click', () => {
      // Scroll to controls and filter
      document.querySelector('.controls-container').scrollIntoView({ behavior: 'smooth' });
      handleTagClick(tag);
    });
    sidebarTagsList.appendChild(span);
  });
}

// Handle tag filter click
function handleTagClick(tag) {
  activeTag = tag;
  
  // Update active pill styling
  const pills = document.querySelectorAll('.tag-pill');
  pills.forEach(pill => {
    if (pill.getAttribute('data-tag') === tag) {
      pill.classList.add('active');
    } else {
      pill.classList.remove('active');
    }
  });

  renderPosts();
}

// Render filtered and searched posts
function renderPosts() {
  // Filter posts
  const filteredPosts = allPosts.filter(post => {
    const matchesTag = activeTag === 'all' || post.tags.includes(activeTag);
    const matchesSearch = post.title.toLowerCase().includes(searchQuery) ||
                          post.description.toLowerCase().includes(searchQuery) ||
                          post.tags.some(tag => tag.toLowerCase().includes(searchQuery));
    return matchesTag && matchesSearch;
  });

  // Clear feed
  blogFeed.innerHTML = '';

  if (filteredPosts.length === 0) {
    blogFeed.innerHTML = `
      <div class="no-posts">
        <h3>No articles found</h3>
        <p>Try adjusting your search query or selecting a different topic.</p>
      </div>
    `;
    return;
  }

  // Render cards
  filteredPosts.forEach(post => {
    const card = document.createElement('article');
    card.className = 'post-card';
    card.addEventListener('click', () => {
      window.location.href = `post.html?id=${post.id}`;
    });

    const hasImage = post.coverImage && post.coverImage.trim().length > 0;
    
    card.innerHTML = `
      ${hasImage ? `
        <div class="card-image-wrapper">
          <img src="${post.coverImage}" alt="${post.title}" class="card-image" loading="lazy">
        </div>
      ` : ''}
      <div class="card-content">
        <div class="card-meta">
          <time datetime="${post.date}">${formatDate(post.date)}</time>
          <span>&bull;</span>
          <span>${post.readingTime}</span>
        </div>
        <h2 class="card-title">${post.title}</h2>
        <p class="card-description">${post.description}</p>
        <div class="card-footer">
          <div class="card-tags">
            ${post.tags.map(tag => `<span class="card-tag">#${tag}</span>`).join('')}
          </div>
          <span class="read-more-btn">
            Read Post
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </span>
        </div>
      </div>
    `;

    blogFeed.appendChild(card);
  });
}

// Format date nicely (e.g. "June 28, 2026")
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', options);
}

// Push AdSense ads
function initAdSense() {
  try {
    // Collect all uninitialized ins.adsbygoogle units on the homepage
    const ads = document.querySelectorAll('ins.adsbygoogle');
    ads.forEach(ad => {
      // Only push if it has not been loaded yet
      if (!ad.getAttribute('data-adsbygoogle-status')) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    });
  } catch (e) {
    console.warn('AdSense initialization skipped or failed:', e);
  }
}

// Newsletter Form Handler
function setupNewsletter() {
  const form = document.getElementById('newsletter-form');
  const successMsg = document.getElementById('newsletter-success');
  const emailInput = document.getElementById('newsletter-email');

  if (form) {
    form.addEventListener('submit', (e) => {
      // If the form action is still "#", handle it locally as a demo.
      // Once the user puts their actual email service action URL, this can be removed or adapted.
      if (form.getAttribute('action') === '#') {
        e.preventDefault();
        successMsg.style.display = 'block';
        emailInput.value = '';
        setTimeout(() => {
          successMsg.style.display = 'none';
        }, 5000);
      }
    });
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
  init();
  setupNewsletter();
});

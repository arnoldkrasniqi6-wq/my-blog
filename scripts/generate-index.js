const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '../posts');
const OUTPUT_JSON = path.join(__dirname, '../posts.json');
const OUTPUT_SITEMAP = path.join(__dirname, '../sitemap.xml');
const SITE_URL = 'https://yourblogdomain.com'; // User can update this in their deployment

// Helper to parse frontmatter from markdown content
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

        // Handle arrays like [tag1, tag2] or tag1, tag2
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
          // Remove wrapping quotes if any
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

function generateIndex() {
  console.log('Generating posts index...');

  // Ensure posts directory exists
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
    console.log('Created posts/ directory.');
  }

  const files = fs.readdirSync(POSTS_DIR);
  const posts = [];

  files.forEach(file => {
    if (path.extname(file) === '.md') {
      const filePath = path.join(POSTS_DIR, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      
      const { metadata, content } = parseFrontmatter(fileContent);
      const id = path.basename(file, '.md');

      // Set defaults for missing metadata
      const title = metadata.title || id.replace(/-/g, ' ');
      const date = metadata.date || new Date().toISOString().split('T')[0];
      const tags = metadata.tags || ['General'];
      const coverImage = metadata.coverImage || '';
      
      // Fallback description from content
      let description = metadata.description;
      if (!description) {
        // Strip markdown formatting simple regex
        const plainText = content
          .replace(/[#*`_\-]/g, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .trim();
        description = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
      }

      const readingTime = metadata.readingTime || calculateReadingTime(content);

      posts.push({
        id,
        title,
        date,
        tags,
        description,
        coverImage,
        readingTime
      });
    }
  });

  // Sort posts by date (newest first)
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Write to posts.json
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(posts, null, 2), 'utf-8');
  console.log(`Successfully generated posts.json with ${posts.length} posts.`);

  // Generate sitemap.xml
  generateSitemap(posts);

  // Generate rss.xml
  generateRSS(posts);
}

function generateSitemap(posts) {
  console.log('Generating sitemap.xml...');
  
  let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/index.html</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

  posts.forEach(post => {
    sitemapContent += `  <url>
    <loc>${SITE_URL}/post.html?id=${post.id}</loc>
    <lastmod>${post.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
  });

  sitemapContent += `</urlset>`;

  fs.writeFileSync(OUTPUT_SITEMAP, sitemapContent, 'utf-8');
  console.log('Successfully generated sitemap.xml.');
}

function generateRSS(posts) {
  console.log('Generating rss.xml...');
  const rssPath = path.join(__dirname, '../rss.xml');
  
  let rssContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>LiveBlogger</title>
  <link>${SITE_URL}</link>
  <description>A daily writing journey</description>
  <language>en-us</language>
  <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
`;

  posts.forEach(post => {
    const pubDate = new Date(post.date).toUTCString();
    rssContent += `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${SITE_URL}/post.html?id=${post.id}</link>
    <guid>${SITE_URL}/post.html?id=${post.id}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${escapeXml(post.description)}</description>
  </item>\n`;
  });

  rssContent += `</channel>\n</rss>`;

  fs.writeFileSync(rssPath, rssContent, 'utf-8');
  console.log('Successfully generated rss.xml.');
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

generateIndex();

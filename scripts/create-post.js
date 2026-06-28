const fs = require('fs');
const path = require('path');

const POSTS_DIR = path.join(__dirname, '../posts');

// Helper to slugify a title
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')         // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

function createPost() {
  // Get title from command line arguments
  const args = process.argv.slice(2);
  const title = args.join(' ') || 'New Blog Post';
  
  const date = new Date().toISOString().split('T')[0];
  const slug = slugify(title);
  const fileName = `${date}-${slug || 'untitled'}.md`;
  const filePath = path.join(POSTS_DIR, fileName);

  // Ensure posts directory exists
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  // Check if file already exists
  if (fs.existsSync(filePath)) {
    console.error(`Error: A post with the name "${fileName}" already exists.`);
    process.exit(1);
  }

  const template = `---
title: "${title}"
date: "${date}"
tags: ["General", "Writing"]
description: "A short summary of this blog post. This will be shown on the home page and in search results."
coverImage: ""
---

Write your daily blog post content here in **Markdown**!

## Subheading

You can use standard markdown features like:
- **Bold text** or *italic text*.
- [Links](https://google.com) and images.
- Code blocks:
  \`\`\`javascript
  console.log("Hello, world!");
  \`\`\`

## Adding Google Ads
We've integrated Google AdSense slots. You can place manual ad units directly in your markdown using an HTML snippet if you wish, or rely on our page templates and Google Auto Ads.
`;

  fs.writeFileSync(filePath, template, 'utf-8');
  console.log(`Created new post template at: posts/${fileName}`);
  console.log('To update the index, run: npm run build-index');
}

createPost();

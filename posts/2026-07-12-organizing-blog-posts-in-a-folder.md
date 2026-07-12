---
title: "Organizing Blog Posts in a Folder"
date: "2026-07-12"
tags: ["Structure", "Markdown", "Tutorial"]
description: "A comprehensive guide on how our Markdown-based blogging system organizes posts in a single folder, parses frontmatter metadata, and dynamically updates the UI and feeds."
coverImage: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80"
---

Welcome to this tutorial on how the blogging framework organizes and displays your posts. As you write daily articles, keeping them structured is key to scaling your blog efficiently.

## The Folder Structure

All your blog posts are written in standard **Markdown (.md)** files and stored in the dedicated `/posts` folder:

```text
/posts
  ├── 2026-06-27-the-power-of-daily-writing.md
  ├── 2026-06-28-welcome-to-my-blog.md
  └── 2026-07-12-organizing-blog-posts-in-a-folder.md
```

Using a standard date prefix (e.g., `YYYY-MM-DD-slug.md`) ensures that:
- Files are sorted chronologically in your file explorer.
- The build script can accurately parse dates and create friendly slug-based URLs.
- Netlify and other static hosting environments can route the static files properly.

## Dynamic Parsing

Every time you build the site index using the build script, it scans this folder, extracts the YAML frontmatter, and auto-generates a global index (`posts.json`), a sitemap (`sitemap.xml`), and an RSS feed (`rss.xml`).

This keeps the user experience premium, extremely fast, and highly search engine friendly!

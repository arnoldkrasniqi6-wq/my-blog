# PowerShell script to create a new daily blog post template

param(
    [string]$Title = "New Blog Post"
)

$postsDir = Join-Path $PSScriptRoot "../posts"

# Helper function to slugify the title
function Get-Slug ($text) {
    $text = $text.ToString().ToLower().Trim()
    $text = $text -replace '\s+', '-'                     # Replace spaces with -
    $text = $text -replace '[^\w\-]+', ''                  # Remove all non-word chars
    $text = $text -replace '\-\-+', '-'                   # Replace multiple - with single -
    $text = $text -replace '^-+', ''                       # Trim - from start
    $text = $text -replace '-+$', ''                       # Trim - from end
    return $text
}

$date = (Get-Date).ToString("yyyy-MM-dd")
$slug = Get-Slug $Title
$fileName = "${date}-${slug}.md"
$filePath = Join-Path $postsDir $fileName

if (-not (Test-Path $postsDir)) {
    New-Item -ItemType Directory -Path $postsDir -Force | Out-Null
}

if (Test-Path $filePath) {
    Write-Error "Error: A post with the name '$fileName' already exists."
    exit 1
}

$template = @"
---
title: "$Title"
date: "$date"
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
  ```javascript
  console.log("Hello, world!");
  ```

## Adding Google Ads
We've integrated Google AdSense slots. You can place manual ad units directly in your markdown using an HTML snippet if you wish, or rely on our page templates and Google Auto Ads.
"@

[System.IO.File]::WriteAllText($filePath, $template)

Write-Host "Created new post template at: posts/$fileName"
Write-Host "To update your blog index, run: powershell -ExecutionPolicy Bypass -File scripts/generate-index.ps1"

# PowerShell script to generate posts.json and sitemap.xml

$postsDir = Join-Path $PSScriptRoot "../posts"
$outputJson = Join-Path $PSScriptRoot "../posts.json"
$outputSitemap = Join-Path $PSScriptRoot "../sitemap.xml"
$siteUrl = "https://yourblogdomain.com"

Write-Host "Generating posts index using PowerShell..."

if (-not (Test-Path $postsDir)) {
    New-Item -ItemType Directory -Path $postsDir -Force | Out-Null
    Write-Host "Created posts/ directory."
}

$files = Get-ChildItem -Path $postsDir -Filter "*.md"
$posts = [System.Collections.Generic.List[PSCustomObject]]::new()

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw
    $id = $file.BaseName
    
    # Parse Frontmatter
    # Regex to match frontmatter between triple dashes at the beginning of the file
    $pattern = "(?s)^---\r?\n(.*?)\r?\n---\r?\n(.*)$"
    $match = [regex]::Match($content, $pattern)
    
    $metadata = @{}
    $articleBody = ""
    
    if ($match.Success) {
        $yamlBlock = $match.Groups[1].Value
        $articleBody = $match.Groups[2].Value.Trim()
        
        # Parse key-value pairs from the yaml block
        $yamlLines = $yamlBlock -split "`n"
        foreach ($line in $yamlLines) {
            $line = $line.Trim()
            if ($line -match "^([^:]+):(.*)$") {
                $key = $Matches[1].Trim()
                $value = $Matches[2].Trim()
                
                # Strip quotes from value
                if (($value -like '"*"') -or ($value -like "'*'")) {
                    $value = $value.Substring(1, $value.Length - 2)
                }
                
                # Handle tags array
                if ($key -eq "tags") {
                    if ($value -like "[*]") {
                        $tagsArray = $value.Substring(1, $value.Length - 2) -split ","
                        $metadata[$key] = @()
                        foreach ($t in $tagsArray) {
                            $metadata[$key] += $t.Trim().Replace("'", "").Replace('"', "")
                        }
                    } else {
                        $tagsArray = $value -split ","
                        $metadata[$key] = @()
                        foreach ($t in $tagsArray) {
                            $metadata[$key] += $t.Trim()
                        }
                    }
                } else {
                    $metadata[$key] = $value
                }
            }
        }
    } else {
        $articleBody = $content.Trim()
    }
    
    # Set defaults
    $title = if ($metadata.ContainsKey("title")) { $metadata["title"] } else { $id -replace "-", " " }
    $date = if ($metadata.ContainsKey("date")) { $metadata["date"] } else { (Get-Date).ToString("yyyy-MM-dd") }
    $tags = if ($metadata.ContainsKey("tags")) { $metadata["tags"] } else { @("General") }
    $coverImage = if ($metadata.ContainsKey("coverImage")) { $metadata["coverImage"] } else { "" }
    
    # Description fallback
    $description = ""
    if ($metadata.ContainsKey("description")) {
        $description = $metadata["description"]
    } else {
        # Strip simple markdown characters
        $plainText = $articleBody -replace '[#*`_\-]', ''
        $plainText = $plainText -replace '\[([^\]]+)\]\([^)]+\)', '$1'
        $plainText = $plainText.Trim()
        if ($plainText.Length -gt 150) {
            $description = $plainText.Substring(0, 150) + "..."
        } else {
            $description = $plainText
        }
    }
    
    # Reading time calculation
    $readingTime = ""
    if ($metadata.ContainsKey("readingTime")) {
        $readingTime = $metadata["readingTime"]
    } else {
        $words = $articleBody -split "\s+"
        $wordCount = $words.Count
        $minutes = [Math]::Ceiling($wordCount / 200)
        $readingTime = "$minutes min read"
    }
    
    $postObj = [PSCustomObject]@{
        id          = $id
        title       = $title
        date        = $date
        tags        = $tags
        description = $description
        coverImage  = $coverImage
        readingTime = $readingTime
    }
    
    $posts.Add($postObj)
}

# Sort posts by date descending
$sortedPosts = $posts | Sort-Object { [datetime]$_.date } -Descending

# Convert to JSON (Depth 3 to handle tags array correctly)
$jsonOutput = ConvertTo-Json -InputObject $sortedPosts -Depth 3
[System.IO.File]::WriteAllText($outputJson, $jsonOutput)
Write-Host "Successfully generated posts.json with $($sortedPosts.Count) posts."

# Generate sitemap.xml
$sitemap = @"
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>$siteUrl/index.html</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
"@

foreach ($post in $sortedPosts) {
    $sitemap += @"

  <url>
    <loc>$siteUrl/post.html?id=$($post.id)</loc>
    <lastmod>$($post.date)</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
"@
}

$sitemap += "`n</urlset>"
[System.IO.File]::WriteAllText($outputSitemap, $sitemap)
Write-Host "Successfully generated sitemap.xml."

# Generate rss.xml
$rssPath = Join-Path $PSScriptRoot "../rss.xml"
$rss = @"
<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>LiveBlogger</title>
  <link>$siteUrl</link>
  <description>A daily writing journey</description>
  <language>en-us</language>
  <atom:link href="$siteUrl/rss.xml" rel="self" type="application/rss+xml" />
"@

foreach ($post in $sortedPosts) {
    $dateObj = [datetime]$post.date
    $pubDate = $dateObj.ToUniversalTime().ToString("r")
    
    $escapedTitle = $post.title -replace '&', '&amp;' -replace '<', '&lt;' -replace '>', '&gt;' -replace '"', '&quot;' -replace "'", '&apos;'
    $escapedDesc = $post.description -replace '&', '&amp;' -replace '<', '&lt;' -replace '>', '&gt;' -replace '"', '&quot;' -replace "'", '&apos;'

    $rss += @"

  <item>
    <title>$escapedTitle</title>
    <link>$siteUrl/post.html?id=$($post.id)</link>
    <guid>$siteUrl/post.html?id=$($post.id)</guid>
    <pubDate>$pubDate</pubDate>
    <description>$escapedDesc</description>
  </item>
"@
}

$rss += "`n</channel>`n</rss>"
[System.IO.File]::WriteAllText($rssPath, $rss)
Write-Host "Successfully generated rss.xml."

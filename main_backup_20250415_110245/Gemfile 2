source "https://rubygems.org"

# Use GitHub Pages - this will manage all dependencies properly
gem "github-pages", group: :jekyll_plugins

# Plugins explicitly mentioned in _config.yml should be listed here
group :jekyll_plugins do
  gem "jekyll-feed"
  gem "jekyll-seo-tag"
  gem "jekyll-sitemap"
  gem "jekyll-redirect-from"
  gem "jekyll-titles-from-headings"
  gem "jekyll-include-cache"
  gem "jekyll-remote-theme"
end

# Windows-specific gems only loaded on Windows
platforms :mingw, :x64_mingw, :mswin do
  gem "tzinfo", "~> 1.2"
  gem "tzinfo-data"
  gem "wdm", "~> 0.1.1"
end

# Lock webrick for Ruby 3.0+ compatibility
gem "webrick", "~> 1.7"

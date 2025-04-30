source "https://rubygems.org"

# Use a version of racc that's compatible with Ruby 2.7.7
gem "racc", "~> 1.6.0"  # Compatible with Ruby 2.7.x

# Add nokogiri with specific version
gem "nokogiri", "~> 1.15.5"

# GitHub Pages - this includes Jekyll with the correct version
gem "github-pages", group: :jekyll_plugins

# Don't specify Jekyll version separately as github-pages manages it
# gem "jekyll", "~> 3.9.3"

# Jekyll plugins
gem "jekyll-feed"
gem "jekyll-seo-tag"
gem "jekyll-sitemap" # Added for better SEO

# Required for Ruby 2.7 (WebRick was removed from stdlib)
gem "webrick", "~> 1.7"

# Process management - helps with port binding issues
gem "foreman", "~> 0.87.2"

# Windows and timezone dependencies - explicit requirements to fix issues
gem "tzinfo", "~> 1.2"
gem "tzinfo-data"  # Remove platform restriction to ensure it's always installed
gem "wdm", "~> 0.1.1", platforms: [:mingw, :mswin, :x64_mingw]

# Development dependencies
group :development do
  gem "rubocop", "~> 1.50.0"
  gem "solargraph", "~> 0.45.0" # Version compatible with Ruby 2.7.x
  gem "rake"

  # Additional gems for better IDE support
  gem "yard", "~> 0.9.34"
  gem "ruby-debug-ide"
end

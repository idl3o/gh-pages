source "https://rubygems.org"

# Comment out the Jekyll version since github-pages will provide its own version
# gem "jekyll", "~> 4.3.2"
gem "minima", "~> 2.5"

# GitHub Pages gem (this will use Jekyll 3.9.5)
gem "github-pages", group: :jekyll_plugins

# Specify nokogiri version compatible with Ruby 2.7
gem "nokogiri", "~> 1.15.0"

# Jekyll plugins
group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.17.0"
  gem "jekyll-seo-tag", "~> 2.8.0"
  gem "jekyll-sitemap", "~> 1.4.0"
  gem "jekyll-remote-theme", "~> 0.4.3"
end

# Windows and JRuby does not include zoneinfo files, so bundle the tzinfo-data gem
# and associated library.
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", ">= 1", "< 3"
  gem "tzinfo-data"
end

# Performance-booster for watching directories on Windows
gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]
gem "webrick", "~> 1.8"

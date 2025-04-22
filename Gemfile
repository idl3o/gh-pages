source "https://rubygems.org"

# Jekyll and related dependencies
gem "jekyll", "~> 4.2.0"
gem "webrick", "~> 1.7" # Required for Ruby 3.0+

# Jekyll plugins
group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.12"
  gem "jekyll-seo-tag", "~> 2.7"
  gem "jekyll-sitemap", "~> 1.4"
  gem "jekyll-remote-theme", "~> 0.4.3"
end

# Windows and JRuby does not include zoneinfo files
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", "~> 1.2"
  gem "tzinfo-data"
end

# Performance-booster for watching directories on Windows
gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]

# Lock jekyll-sass-converter to 2.x
gem "jekyll-sass-converter", "~> 2.0"

# Add explicit dependency on sassc
gem "sassc", "~> 2.4.0"

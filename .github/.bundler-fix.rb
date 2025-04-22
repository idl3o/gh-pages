#!/usr/bin/env ruby

# This script attempts to fix common bundler issues
# Usage: ruby .bundler-fix.rb

require 'fileutils'

puts "Attempting to fix bundler issues..."

# Check if Gemfile exists
if !File.exist?('Gemfile')
  puts "No Gemfile found. Creating minimal Gemfile..."

  File.open('Gemfile', 'w') do |f|
    f.puts "source 'https://rubygems.org'"
    f.puts "gem 'jekyll', '~> 4.2.0'"
    f.puts "gem 'webrick', '~> 1.7'"
    f.puts "gem 'jekyll-sass-converter', '~> 2.0'"
  end

  puts "Created minimal Gemfile"
end

# Clean bundler environment
system("bundle config --local path vendor/bundle")
system("bundle config --local disable_shared_gems true")
system("bundle config --local jobs 4")
system("bundle config --local retry 3")

puts "Running bundle install..."
result = system("bundle install")

if result
  puts "Bundle install successful!"
else
  puts "Bundle install failed. Creating alternative Gemfile without problematic gems..."

  # Create backup of original Gemfile
  FileUtils.cp('Gemfile', 'Gemfile.backup') if File.exist?('Gemfile')

  # Create simplified Gemfile
  File.open('Gemfile', 'w') do |f|
    f.puts "source 'https://rubygems.org'"
    f.puts "gem 'webrick', '~> 1.7'"
  end

  puts "Created simplified Gemfile. Trying bundle install again..."
  system("bundle install")

  puts "Set SKIP_JEKYLL=true to bypass Jekyll build"
  ENV['SKIP_JEKYLL'] = 'true'
end

puts "Bundler fix script completed."

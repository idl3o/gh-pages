#!/usr/bin/env ruby

puts "=== Fixing Bundler for Ruby 3.3 ==="

# Check Ruby version
ruby_version = RUBY_VERSION
puts "Detected Ruby version: #{ruby_version}"

if ruby_version >= "3.2.0"
  puts "Ruby #{ruby_version} detected. The 'untaint' method was removed in Ruby 3.2"
  puts "Your current bundler version is incompatible with this Ruby version."

  # Remove old bundler
  puts "\nRemoving old bundler versions..."
  system("gem uninstall bundler --all --executables")

  # Install compatible bundler
  puts "\nInstalling bundler 2.4.22 (compatible with Ruby 3.3)..."
  system("gem install bundler -v 2.4.22")

  # Remove vendor directory which might contain old bundler
  if Dir.exist?("../vendor")
    puts "\nRemoving vendor directory with old bundler installation..."
    require 'fileutils'
    FileUtils.rm_rf("../vendor")
  end

  puts "\nNow run these commands:"
  puts "1. bundle install"
  puts "2. bundle exec jekyll serve (or whatever command you need)"
else
  puts "Your Ruby version should be compatible with bundler 1.17.2"
  puts "If you're experiencing issues, consider upgrading bundler anyway:"
  puts "gem install bundler"
end

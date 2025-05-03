#!/usr/bin/env ruby

require 'pathname'
require 'fileutils'

def colorize(text, color_code)
  "\e[#{color_code}m#{text}\e[0m"
end

def red(text); colorize(text, 31); end
def green(text); colorize(text, 32); end
def yellow(text); colorize(text, 33); end
def blue(text); colorize(text, 34); end

def check_command_exists(command)
  system("where #{command} >nul 2>&1")
end

def install_bundler
  puts yellow("Installing Bundler...")
  system("gem install bundler")
  if $?.success?
    puts green("✓ Bundler installed successfully")
  else
    puts red("✗ Failed to install Bundler")
    exit 1
  end
end

def run_bundle_install
  puts yellow("Running bundle install...")
  system("bundle install")
  if $?.success?
    puts green("✓ Bundle install completed successfully")
  else
    puts red("✗ Failed to run bundle install")
    puts yellow("Troubleshooting tips:")
    puts "  1. Check internet connection"
    puts "  2. Try running 'bundle install --verbose' for more details"
    puts "  3. Check your Gemfile for any syntax errors"
    exit 1
  end
end

# Main execution
puts blue("==== Ruby Environment Setup ====")

# Check Ruby installation
if check_command_exists("ruby")
  ruby_version = `ruby -v`.strip
  puts green("✓ Ruby found: #{ruby_version}")
else
  puts red("✗ Ruby not found in PATH. Please install Ruby.")
  exit 1
end

# Check for bundler
if check_command_exists("bundler") || check_command_exists("bundle")
  bundler_version = `bundle -v`.strip
  puts green("✓ Bundler found: #{bundler_version}")
else
  puts yellow("! Bundler not found. Installing now...")
  install_bundler
end

# Run bundle install
run_bundle_install

# Create VSCode settings directory if it doesn't exist
project_dir = Pathname.new(__FILE__).dirname.parent
vscode_dir = project_dir.join(".vscode")
FileUtils.mkdir_p(vscode_dir) unless Dir.exist?(vscode_dir.to_s)

# Create or update settings.json
settings_file = vscode_dir.join("settings.json")
settings = {}

if File.exist?(settings_file)
  begin
    require 'json'
    settings = JSON.parse(File.read(settings_file))
  rescue => e
    puts yellow("! Could not parse existing settings.json: #{e.message}")
  end
end

# Update Ruby related settings
settings['ruby.useBundler'] = true
settings['ruby.useLanguageServer'] = true
settings['ruby.lint'] = { 'rubocop' => true }
settings['ruby.lintDebounceTime'] = 500
settings['ruby.format'] = true

# Write updated settings
File.write(settings_file, JSON.pretty_generate(settings))
puts green("✓ Updated VSCode settings for Ruby")

puts blue("\n==== All Done! ====")
puts "You should now be able to run 'RuboCop: Start Language Server' command in VSCode."
puts "If you still encounter issues, try restarting VSCode."

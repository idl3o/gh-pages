#!/usr/bin/env ruby

require 'pathname'

def find_ruby_version_file(start_dir)
  current_dir = Pathname.new(start_dir)

  while current_dir != current_dir.parent do
    ruby_version_file = current_dir + '.ruby-version'
    return ruby_version_file if ruby_version_file.exist?
    current_dir = current_dir.parent
  end

  nil
end

# Start from script directory and go up
script_dir = Pathname.new(File.dirname(__FILE__))
project_dir = script_dir.parent
ruby_version_file = find_ruby_version_file(project_dir)

if ruby_version_file
  puts "Found .ruby-version file at: #{ruby_version_file}"
  ruby_version = File.read(ruby_version_file).strip
  puts "Using Ruby version: #{ruby_version}"
else
  puts "No .ruby-version file found. Using system Ruby version."
end

# Setup additional Ruby environment here
# ...

exit 0

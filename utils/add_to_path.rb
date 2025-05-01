#!/usr/bin/env ruby

require 'fileutils'

class PathManager
  attr_reader :paths

  def initialize
    @paths = ENV['PATH'].split(File::PATH_SEPARATOR)
    @added_paths = []
    @project_dir = File.expand_path('../', __dir__)
  end

  def add_to_path(directory, description)
    if File.directory?(directory)
      puts "✓ #{description} directory exists: #{directory}"
      if @paths.any? { |p| p.downcase == directory.downcase }
        puts "  Already in PATH"
        return true
      else
        @added_paths << directory
        puts "  Added to PATH for this session"
        return true
      end
    else
      puts "✗ #{description} directory not found: #{directory}"
      return false
    end
  end

  def find_executable(name)
    result = `where #{name} 2>nul`.strip
    if result.empty?
      puts "✗ #{name} not found in PATH"
      return nil
    else
      puts "✓ #{name} found at: #{result.split("\n").first}"
      return result.split("\n").first
    end
  end

  def check_jekyll
    jekyll_path = find_executable('jekyll')

    unless jekyll_path
      bin_jekyll = File.join(@project_dir, 'bin', 'jekyll')
      bin_jekyll_bat = File.join(@project_dir, 'bin', 'jekyll.bat')

      if File.exist?(bin_jekyll) || File.exist?(bin_jekyll_bat)
        puts "✓ Jekyll found in project bin directory"
        add_to_path(File.join(@project_dir, 'bin'), "Jekyll bin")
      else
        puts "Trying to create Jekyll binstubs..."
        system("bundle binstubs jekyll --force")
        if File.exist?(bin_jekyll) || File.exist?(bin_jekyll_bat)
          puts "✓ Created Jekyll binstubs"
          add_to_path(File.join(@project_dir, 'bin'), "Jekyll bin")
        else
          puts "✗ Could not create Jekyll binstubs"
        end
      end
    end
  end

  def check_python
    python_path = find_executable('python')
    pip_path = find_executable('pip')

    scripts_dir = File.join(ENV['APPDATA'], 'Python', 'Python313', 'Scripts')
    if !pip_path && File.directory?(scripts_dir)
      add_to_path(scripts_dir, "Python Scripts")
    end
  end

  def update_path
    return if @added_paths.empty?

    # Update PATH for current process
    ENV['PATH'] = (@added_paths + @paths).join(File::PATH_SEPARATOR)
    puts "\nUpdated PATH for this session with:"
    @added_paths.each do |path|
      puts "  #{path}"
    end

    puts "\nTo make these changes permanent, you need to update your system PATH."
    puts "Would you like to create a script to do this? (y/n)"
    if gets.chomp.downcase == 'y'
      create_path_update_script
    end
  end

  def create_path_update_script
    script_content = <<~BAT
      @echo off
      echo Adding directories to PATH...
      setx PATH "#{@added_paths.join(';')};%PATH%"
      echo Done! Please restart your command prompt.
    BAT

    script_path = File.join(@project_dir, 'utils', 'update_path.bat')
    File.write(script_path, script_content)
    puts "Created script: #{script_path}"
    puts "Run this script as administrator to update your PATH permanently."
  end

  def run_checks
    puts "=== Checking Development Environment ==="
    check_jekyll
    check_python
    update_path

    puts "\n=== Verification ==="
    find_executable('jekyll')
    find_executable('pip')

    puts "\n=== How to Use Jekyll ==="
    puts "To run Jekyll with this project:"
    puts "  bundle exec jekyll serve"
  end
end

PathManager.new.run_checks

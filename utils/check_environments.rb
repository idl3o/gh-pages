#!/usr/bin/env ruby

# Environment checker for development tools
require 'json'

class EnvironmentChecker
  COLORS = {
    reset: "\e[0m",
    red: "\e[31m",
    green: "\e[32m",
    yellow: "\e[33m",
    blue: "\e[34m",
    bold: "\e[1m"
  }

  def initialize
    @issues = []
    @tools = {}
  end

  def colorize(text, color)
    "#{COLORS[color]}#{text}#{COLORS[:reset]}"
  end

  def check_command(command, name = nil)
    name ||= command
    version_command = case command
                      when 'ruby' then 'ruby -v'
                      when 'python' then 'python --version'
                      when 'pip' then 'pip --version'
                      when 'node' then 'node -v'
                      when 'npm' then 'npm -v'
                      when 'bundle' then 'bundle -v'
                      when 'jekyll' then 'jekyll -v'
                      else "#{command} --version"
                      end

    print "Checking #{name}... "
    output = `#{version_command} 2>&1`
    if $?.success?
      puts colorize("✓ Found: #{output.strip}", :green)
      @tools[name.to_s] = output.strip
      true
    else
      puts colorize("✗ Not found or not in PATH", :red)
      @issues << "#{name} is not installed or not in PATH"
      false
    end
  rescue => e
    puts colorize("✗ Error: #{e.message}", :red)
    @issues << "Error checking #{name}: #{e.message}"
    false
  end

  def check_path(directory, description = nil)
    description ||= directory
    print "Checking if #{description} is in PATH... "

    paths = ENV['PATH'].split(File::PATH_SEPARATOR)
    if paths.any? { |path| path.downcase == directory.downcase }
      puts colorize("✓ Directory found in PATH", :green)
      true
    else
      puts colorize("✗ Directory not in PATH", :yellow)
      @issues << "#{description} is not in PATH"
      false
    end
  end

  def run_checks
    puts colorize("\n=== Development Environment Check ===\n", :bold)

    # Ruby environment
    puts colorize("\nRuby Environment:", :blue)
    check_command('ruby')
    check_command('bundle')
    check_command('jekyll')

    # Python environment
    puts colorize("\nPython Environment:", :blue)
    python_found = check_command('python')
    pip_found = check_command('pip')

    if python_found && pip_found
      check_path('C:\\Users\\Sam\\AppData\\Roaming\\Python\\Python313\\Scripts', 'Python Scripts directory')
    end

    # Node environment
    puts colorize("\nNode Environment:", :blue)
    check_command('node')
    check_command('npm')

    # PATH environment
    puts colorize("\nPATH Environment Summary:", :blue)
    puts "Your PATH contains #{ENV['PATH'].split(File::PATH_SEPARATOR).count} directories"

    # Summary
    puts colorize("\n=== Summary ===", :bold)
    if @issues.empty?
      puts colorize("✓ No issues found!", :green)
    else
      puts colorize("#{@issues.count} issue(s) found:", :yellow)
      @issues.each do |issue|
        puts colorize("  • #{issue}", :yellow)
      end

      puts "\nRecommendations:"
      if @issues.any? { |i| i.include?('Python Scripts directory') }
        puts "  • Run utils\\add_python_to_path.bat to add Python scripts to PATH"
      end
    end

    # Save results to file
    save_results
  end

  def save_results
    result = {
      timestamp: Time.now.to_s,
      tools: @tools,
      path: ENV['PATH'].split(File::PATH_SEPARATOR),
      issues: @issues
    }

    File.write('environment_check_results.json', JSON.pretty_generate(result))
    puts "\nResults saved to environment_check_results.json"
  end
end

checker = EnvironmentChecker.new
checker.run_checks

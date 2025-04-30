require 'fileutils'

desc "List available scripts and how to run them"
task :scripts do
  puts "\n=== How to Run Scripts from Project Directory ==="

  # Find all scripts in the project
  ruby_scripts = Dir.glob("**/*.rb").sort
  batch_scripts = Dir.glob("**/*.{bat,cmd}").sort
  js_scripts = Dir.glob("**/*.js").select { |f| !f.include?("node_modules") }.sort

  puts "\nRuby scripts:"
  ruby_scripts.each do |script|
    puts "  ruby #{script}"
  end

  puts "\nBatch scripts:"
  batch_scripts.each do |script|
    puts "  #{script}"
  end

  puts "\nJavaScript scripts:"
  js_scripts.each do |script|
    puts "  node #{script}"
  end

  puts "\n=== Examples ==="
  puts "Ruby script:    ruby utils/ruby_env_setup.rb"
  puts "Batch script:   utils\\setup_ruby_env.bat"
  puts "JavaScript:     node utils/some_script.js"
  puts "Rake task:      bundle exec rake scripts"
  puts "\nNote: Run these commands from the project root directory (#{Dir.pwd})"
end

desc "Run Jekyll locally"
task :serve do
  sh "bundle exec jekyll serve"
end

desc "Build the site"
task :build do
  sh "bundle exec jekyll build"
end

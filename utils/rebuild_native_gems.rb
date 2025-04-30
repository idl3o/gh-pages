#!/usr/bin/env ruby

require 'json'

def rebuild_gem(gem_name)
  puts "Rebuilding #{gem_name}..."
  system("gem pristine #{gem_name}")
end

def list_broken_gems
  # Find gems with unbuilt extensions
  output = `gem list`
  broken_gems = []

  output.each_line do |line|
    if line.include?("extensions are not built")
      gem_name = line.split(" ").first
      broken_gems << gem_name
    end
  end

  broken_gems
end

puts "===== Ruby Native Gem Repair Tool ====="

puts "\nChecking for gems with unbuilt extensions..."
broken_gems = list_broken_gems

if broken_gems.empty?
  puts "No broken gems found!"
else
  puts "Found #{broken_gems.length} gem(s) with issues:"
  broken_gems.each do |gem|
    puts "  - #{gem}"
  end

  puts "\nAttempting to rebuild gems..."
  broken_gems.each do |gem|
    rebuild_gem(gem)
  end

  # Check if we fixed all gems
  remaining_broken = list_broken_gems
  if remaining_broken.empty?
    puts "\nSUCCESS! All gems fixed."
  else
    puts "\nSome gems still have issues:"
    remaining_broken.each do |gem|
      puts "  - #{gem}"
    end

    puts "\nAttempting more aggressive fix..."
    remaining_broken.each do |gem|
      puts "Reinstalling #{gem}..."
      system("gem uninstall #{gem} --all --executables --ignore-dependencies")
      system("gem install #{gem} --platform=ruby")
    end
  end
end

puts "\nUpdating bundler dependencies..."
system("bundle update")

puts "\nVerifying Jekyll installation..."
system("bundle exec jekyll -v")

puts "\nDone! You should now be able to run: bundle exec jekyll serve"

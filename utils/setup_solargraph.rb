#!/usr/bin/env ruby

require 'fileutils'

# Project root directory
root_dir = File.expand_path('..', __dir__)

# Create Solargraph configuration
solargraph_config = {
  "include" => [
    "**/*.rb"
  ],
  "exclude" => [
    "vendor/**/*",
    ".bundle/**/*",
    "_site/**/*"
  ],
  "require_paths" => [],
  "plugins" => [],
  "reporters" => [],
  "formatting" => true,
  "diagnostics" => true
}

# Create Solargraph config file
puts "Creating Solargraph configuration..."
File.write(File.join(root_dir, '.solargraph.yml'), solargraph_config.to_yaml)
puts "✓ Created .solargraph.yml"

# Create .vscode directory if it doesn't exist
vscode_dir = File.join(root_dir, '.vscode')
FileUtils.mkdir_p(vscode_dir) unless Dir.exist?(vscode_dir)

# Check if settings.json exists
settings_file = File.join(vscode_dir, 'settings.json')
settings = {}
if File.exist?(settings_file)
  require 'json'
  settings = JSON.parse(File.read(settings_file)) rescue {}
end

# Update VS Code settings for Solargraph
settings['solargraph.useBundler'] = true
settings['solargraph.formatting'] = true
settings['solargraph.diagnostics'] = true
settings['solargraph.completion'] = true
settings['solargraph.hover'] = true
settings['solargraph.references'] = true
settings['solargraph.rename'] = true
settings['solargraph.symbols'] = true
settings['editor.formatOnSave'] = true

# Write settings
File.write(settings_file, JSON.pretty_generate(settings))
puts "✓ Updated VS Code settings"

puts "\nInstalling Solargraph..."
system('bundle install')

puts "\nGenerating YARD documentation for Ruby core and gems..."
system('bundle exec yard gems')
system('bundle exec solargraph download-core')

puts "\n✅ Solargraph setup complete!"
puts "Restart VS Code for the changes to take effect."

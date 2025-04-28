# Ruby Setup Guide for RED X Project

This guide explains how to set up Ruby for the RED X project if you encounter issues with the automatic installation.

## Prerequisites

- Windows 10 or later
- Administrator privileges
- Internet connection

## Manual Ruby Installation

1. **Download the Ruby Installer**:

   - Go to [RubyInstaller website](https://rubyinstaller.org/downloads/)
   - Download the latest Ruby+Devkit x64 version (e.g., Ruby+Devkit 3.2.2-1 (x64))

2. **Run the installer**:

   - Launch the downloaded executable
   - Select the following options:
     - [x] Add Ruby executables to your PATH
     - [x] Associate .rb and .rbw files with Ruby
     - [x] Use UTF-8 as default external encoding
   - Complete the installation

3. **Verify installation**:

   - Open a new Command Prompt or PowerShell window
   - Type `ruby -v`
   - If installed correctly, this will show the Ruby version

4. **Install required gems**:
   ```
   gem install bundler jekyll webrick rouge sass-embedded
   ```

## Using Ruby with RED X

After installation, you can use Ruby with the RED X build process in two ways:

1. **Automatic usage**: Add the `-ruby` flag when running RedX-Build.cmd:

   ```
   RedX-Build.cmd -web -ruby
   ```

2. **Manual process**:
   - Navigate to your RED X project directory
   - Create a `Gemfile` with the required dependencies
   - Run `bundle install` to install dependencies
   - Run `bundle exec jekyll build` to process with Jekyll

## Troubleshooting

- **Ruby command not found**: Make sure Ruby is in your PATH. Reopen the command prompt after installing.
- **SSL certificate errors**: Download the RubyInstaller CA certificate and run `gem update --system`
- **Dependency errors**: Run `bundle update` to update all dependencies to their compatible versions

For additional help, consult the [Ruby documentation](https://www.ruby-lang.org/en/documentation/) or the [Jekyll documentation](https://jekyllrb.com/docs/).

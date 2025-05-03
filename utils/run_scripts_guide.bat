@echo off
echo === How to Run Scripts from Project Directory ===
echo.
echo 1. Make sure you're in the project root directory:
echo    cd c:\Users\Sam\Documents\GitHub\gh-pages
echo.
echo 2. Running different types of scripts:
echo.
echo    Ruby scripts:
echo    ruby utils/script_name.rb
echo.
echo    Batch scripts (Windows):
echo    utils\script_name.bat
echo.
echo    JavaScript scripts:
echo    node utils/script_name.js
echo.
echo    Rake tasks:
echo    bundle exec rake task_name
echo.
echo 3. Common project scripts:
echo    - List available scripts: bundle exec rake scripts
echo    - Run Jekyll server: bundle exec rake serve
echo    - Build the site: bundle exec rake build
echo.
echo 4. To see all available rake tasks:
echo    bundle exec rake -T
echo.
echo Note: Always run scripts from the project root directory for proper file path resolution.
echo.

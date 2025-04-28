@echo off
echo Starting GitHub Pages deployment...

REM Create deployment directory if it doesn't exist
if not exist "_site" mkdir _site

REM Copy all necessary files to the deployment directory
echo Copying web files...
xcopy /E /Y red_x\_site\* _site\

REM Ensure the font atlas files are included
echo Copying font atlas implementation...
copy red_x\font_atlas.c _site\src\
copy red_x\font_atlas.h _site\include\

REM Copy HTML template and assets
echo Copying HTML templates...
copy red_x\template.html _site\
copy red_x\index.html _site\

REM Deploy additional resources
echo Deploying additional resources...
xcopy /E /Y assets\* _site\assets\

echo Deployment preparation complete!
echo Files ready for GitHub Pages publishing.

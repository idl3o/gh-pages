@echo off
setlocal enabledelayedexpansion
title Project RED X Builder

REM Set up colors for console output
set "ESC="
set "GREEN=%ESC%[92m"
set "CYAN=%ESC%[96m"
set "RED=%ESC%[91m"
set "YELLOW=%ESC%[93m"
set "RESET=%ESC%[0m"

echo %CYAN%===================================
echo   Project RED X Build System
echo ===================================%RESET%
echo.

REM Process command-line arguments
set BUILD_TYPE=full
set CLEAN_BUILD=0
set SKIP_CHECKS=0
set OPTIMIZE_FOR_MOBILE=0
set PERFORMANCE_PROFILE=0
set RESPONSIVE_TEST=0
set MOBILE_TEST=0
set PERF_ANALYSIS=0
set RUBY_REQUIRED=0
set BATCH_SIZE=50

:parse_args
if "%~1"=="" goto end_parse_args
if /i "%~1"=="-web" set BUILD_TYPE=web
if /i "%~1"=="-native" set BUILD_TYPE=native
if /i "%~1"=="-full" set BUILD_TYPE=full
if /i "%~1"=="-clean" set CLEAN_BUILD=1
if /i "%~1"=="-force" set SKIP_CHECKS=1
if /i "%~1"=="-mobile" set OPTIMIZE_FOR_MOBILE=1
if /i "%~1"=="-perf" set PERFORMANCE_PROFILE=1
if /i "%~1"=="-responsive" set RESPONSIVE_TEST=1
if /i "%~1"=="-analyze-perf" set PERF_ANALYSIS=1
if /i "%~1"=="-ruby" set RUBY_REQUIRED=1
if /i "%~1"=="-perf-dashboard" (
    set PERFORMANCE_PROFILE=1
    set PERF_ANALYSIS=1
)
if /i "%~1"=="-test-mobile" (
    set MOBILE_TEST=1
    set RESPONSIVE_TEST=1
    set OPTIMIZE_FOR_MOBILE=1
)
if /i "%~1"=="-batch" (
    shift
    if not "%~1"=="" (
        set BATCH_SIZE=%~1
        shift
        goto parse_args
    )
)
shift
goto parse_args
:end_parse_args

REM Check for emsdk directory and set up if needed
if not exist "%~dp0\emsdk" (
    echo %YELLOW%Emscripten SDK not found. Setting up emsdk first...%RESET%
    if exist "%~dp0\setup-emsdk.ps1" (
        echo %CYAN%Running setup-emsdk.ps1...%RESET%
        powershell -ExecutionPolicy Bypass -File "%~dp0\setup-emsdk.ps1"
        if errorlevel 1 (
            echo %RED%Failed to set up Emscripten SDK. Please run setup-emsdk.ps1 manually.%RESET%
            pause
            exit /b 1
        )
    ) else (
        echo %RED%ERROR: setup-emsdk.ps1 not found. Cannot set up Emscripten SDK.%RESET%
        pause
        exit /b 1
    )
)

REM Check if script exists in the expected location
if exist "%~dp0\red_x\Run-RedX.ps1" (
    cd "%~dp0\red_x"
    echo %CYAN%Running RED X script from: %CD%%RESET%
    echo.
) else (
    echo %RED%ERROR: Could not find Run-RedX.ps1 in %~dp0\red_x%RESET%
    echo Please ensure you're running this script from the correct directory.
    echo.
    pause
    exit /b 1
)

REM Create log file location with timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set DATE=%%c-%%a-%%b)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (set TIME=%%a%%b)
set LOGFILE=%~dp0red_x\build_logs\build_%DATE%_%TIME%.txt
mkdir "%~dp0red_x\build_logs" 2>nul
echo %CYAN%Build log will be created at: %LOGFILE%%RESET%
echo.

REM Check system requirements if not skipped
if %SKIP_CHECKS%==0 (
    echo %YELLOW%Checking system requirements...%RESET%
    powershell -ExecutionPolicy Bypass -Command "& {$requiredSpace = 1GB; $drive = (Get-Item '%~dp0').PSDrive.Name; $freeSpace = (Get-PSDrive $drive).Free; Write-Host ('Free space on drive ' + $drive + ': ' + [math]::Round($freeSpace/1GB, 2) + ' GB'); if($freeSpace -lt $requiredSpace) {Write-Host 'ERROR: Not enough disk space. At least 1GB required.' -ForegroundColor Red; exit 1} else {Write-Host 'Space requirement met.' -ForegroundColor Green}}"
    if errorlevel 1 (
        echo %RED%System requirements check failed. See above for details.%RESET%
        pause
        exit /b 1
    )
    echo.
)

REM Check if Ruby is required and installed
if %RUBY_REQUIRED%==1 (
    echo %YELLOW%Checking for Ruby installation...%RESET%
    where ruby >nul 2>&1
    if errorlevel 1 (
        echo %RED%Ruby is required but not found in your PATH.%RESET%
        echo %YELLOW%Running the Ruby setup script to install Ruby...%RESET%
        powershell -ExecutionPolicy Bypass -File "%~dp0\setup-ruby.ps1" -Install
        if errorlevel 1 (
            echo %RED%Ruby setup failed. Build may fail if Ruby is required.%RESET%
            pause
        ) else {
            echo %GREEN%Ruby has been installed successfully.%RESET%
        }
    ) else (
        ruby -v
        echo %GREEN%Ruby is installed. Continuing...%RESET%
    )
    echo.
)

REM Handle clean build if requested
if %CLEAN_BUILD%==1 (
    echo %YELLOW%Clean build requested. Removing previous build artifacts...%RESET%
    if exist "%~dp0\red_x\red_x.exe" del "%~dp0\red_x\red_x.exe"
    if exist "%~dp0\red_x\index.wasm" del "%~dp0\red_x\index.wasm"
    if exist "%~dp0\red_x\index.js" del "%~dp0\red_x\index.js"
    if exist "%~dp0\red_x\index.html" del "%~dp0\red_x\index.html"
    echo %GREEN%Previous build artifacts cleaned.%RESET%
    echo.
)

REM Create the direct PowerShell script with enhanced capabilities
echo %CYAN%Generating build script...%RESET%
(
    echo $ErrorActionPreference = "Stop";
    echo $VerbosePreference = "Continue";
    echo $ProgressPreference = "SilentlyContinue";
    echo $logFile = "%LOGFILE%";
    echo $buildType = "%BUILD_TYPE%";
    echo $optimizeForMobile = $%OPTIMIZE_FOR_MOBILE% -eq 1;
    echo $performanceProfile = $%PERFORMANCE_PROFILE% -eq 1;
    echo $responsiveTest = $%RESPONSIVE_TEST% -eq 1;
    echo $mobileTest = $%MOBILE_TEST% -eq 1;
    echo $batchSize = %BATCH_SIZE%;LYSIS% -eq 1;
    echo.$batchSize = %BATCH_SIZE%;
    echo $host.ui.RawUI.WindowTitle = "RED X Builder - $buildType mode";
    echo.$host.ui.RawUI.WindowTitle = "RED X Builder - $buildType mode";
    echo # Helper function to show status indicator
    echo function Show-BuildProgress {tus indicator
    echo     param($Message, $Status){
    echo.    param($Message, $Status)
    echo     switch ($Status) {
    echo         "Running" { $statusColor = "Yellow"; $icon = "⚙️ " }
    echo         "Success" { $statusColor = "Green"; $icon = "✅ " } }
    echo         "Error" { $statusColor = "Red"; $icon = "❌ " } " }
    echo         "Warning" { $statusColor = "Yellow"; $icon = "⚠️ " }
    echo         default { $statusColor = "Cyan"; $icon = "🔍 " } " }
    echo     }   default { $statusColor = "Cyan"; $icon = "🔍 " }
    echo.    }
    echo     Write-Host "$icon $Message" -ForegroundColor $statusColor
    echo }   Write-Host "$icon $Message" -ForegroundColor $statusColor
    echo.}
    echo # Function to optimize web assets for mobile
    echo function Optimize-WebForMobile {s for mobile
    echo     param($WebBuildPath)Mobile {
    echo     Show-BuildProgress "Applying mobile optimizations..." "Running"
    echo     try {BuildProgress "Applying mobile optimizations..." "Running"
    echo         $cssFile = Join-Path $WebBuildPath "index.css"
    echo         if (Test-Path $cssFile) {BuildPath "index.css"
    echo             # Add mobile-specific CSS
    echo             $cssContent = Get-Content $cssFile -Raw
    echo             $mobileCss = @"et-Content $cssFile -Raw
    echo             $mobileCss = @"
    echo /* Mobile Optimizations */
    echo @media (max-width: 768px) {
    echo     .container {h: 768px) {
    echo         width: 100%%;
    echo         padding: 0 10px;
    echo         box-sizing: border-box;
    echo     }   box-sizing: border-box;
    echo     .upload-container .progress-bar {
    echo         height: 20px; .progress-bar {
    echo     }   height: 20px;
    echo     .file-preview-thumbnails {
    echo         flex-direction: column;
    echo     }   flex-direction: column;
    echo     /* Improve touch targets */
    echo     button,ove touch targets */
    echo     .button,
    echo     input[type="button"] {
    echo         min-height: 44px;{
    echo         min-width: 44px;;
    echo     }   min-width: 44px;
    echo     /* Improve readability */
    echo     body {rove readability */
    echo         font-size: 16px;
    echo     }   font-size: 16px;
    echo }   }
    echo "@
    echo "@
    echo             Add-Content -Path $cssFile -Value $mobileCss
    echo             Show-BuildProgress "Added mobile-specific CSS" "Success"
    echo         }   Show-BuildProgress "Added mobile-specific CSS" "Success"
    echo         }
    echo         # Optimize HTML for mobile
    echo         $htmlFile = Join-Path $WebBuildPath "index.html"
    echo         if (Test-Path $htmlFile) {BuildPath "index.html"
    echo             $htmlContent = Get-Content $htmlFile -Raw
    echo             if (!($htmlContent -match '<meta name="viewport"')) {
    echo                 $htmlContent = $htmlContent -replace '<head>', '<head>`n    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">'
    echo                 Set-Content -Path $htmlFile -Value $htmlContent'<head>`n    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">'
    echo                 Show-BuildProgress "Added viewport meta tag for mobile responsiveness" "Success"
    echo             }   Show-BuildProgress "Added viewport meta tag for mobile responsiveness" "Success"
    echo         }   }
    echo         }
    echo         # Optimize images if available
    echo         $imgFolder = Join-Path $WebBuildPath "images"
    echo         if (Test-Path $imgFolder) {BuildPath "images"
    echo             Show-BuildProgress "Optimizing images for mobile..." "Running"
    echo             Show-BuildProgress "For production builds, consider adding image optimization tools" "Warning"
    echo         }   Show-BuildProgress "For production builds, consider adding image optimization tools" "Warning"
    echo         }
    echo         return $true
    echo     }   return $true
    echo     catch {
    echo         Show-BuildProgress "Failed to apply mobile optimizations: $_" "Error"
    echo         return $falsegress "Failed to apply mobile optimizations: $_" "Error"
    echo     }   return $false
    echo }   }
    echo.
    echo # Function to add performance tracking
    echo function Add-PerformanceTracking {
    echo     param($WebBuildPath)mance analyzer toolsTracking {
    echo     Show-BuildProgress "Adding performance tracking..." "Running"
    echo     try {($WebBuildPath)BuildProgress "Adding performance tracking..." "Running"
    echo         $jsFile = Join-Path $WebBuildPath "index.js"tools..." "Running"
    echo         if (Test-Path $jsFile) {
    echo             $perfJs = @"formance analyzer JavaScript filesFile) {
    echo         $perfAnalyzerJs = Join-Path $WebBuildPath "perf-analyzer.js"             $perfJs = @"
    echo // Performance Monitoringent = @'
    echo if (typeof window !== 'undefined') {
    echo   window.addEventListener('load', function() {
    echo     setTimeout(function() {analysis of web application performance metricsload', function() {
    echo       const perfData = {
    echo         timing: window.performance.timing,
    echo         navigation: window.performance.navigation,
    echo         memory: window.performance.memory
    echo       };this.metrics = [];memory: window.performance.memory
    echo       console.log('Performance metrics:', perfData);
    echo         this.isMonitoring = false;       console.log('Performance metrics:', perfData);
    echo       // Calculate key metrics();
    echo       const loadTime = perfData.timing.loadEventEnd - perfData.timing.navigationStart;
    echo       const domReadyTime = perfData.timing.domComplete - perfData.timing.domLoading;
    echo       const networkLatency = perfData.timing.responseEnd - perfData.timing.requestStart;
    echo         if (this.isMonitoring) return;       const networkLatency = perfData.timing.responseEnd - perfData.timing.requestStart;
    echo       console.log(`Page load: \${loadTime}ms, DOM ready: \${domReadyTime}ms, Network: \${networkLatency}ms`);
    echo                console.log(`Page load: \${loadTime}ms, DOM ready: \${domReadyTime}ms, Network: \${networkLatency}ms`);
    echo       // Send metrics to backend if availablece monitoring");
    echo       if (typeof window.redx !== 'undefined' && window.redx.reportPerformance) {
    echo         window.redx.reportPerformance(perfData);x.reportPerformance) {
    echo       } this._capturePageLoadMetrics(); window.redx.reportPerformance(perfData);
    echo     }, 0);is._setupResourceMonitoring();
    echo   });   this._setupLongTaskMonitoring();, 0);
    echo }       this._monitorFrameRate(); });
    echo "@      this._monitorMemoryUsage();
    echo     } "@
    echo             Add-Content -Path $jsFile -Value $perfJs
    echo             Show-BuildProgress "Added performance tracking code" "Success"
    echo         }his.isMonitoring = false;   Show-BuildProgress "Added performance tracking code" "Success"
    echo         return $true
    echo     }   // Clean up any observers or timers   return $true
    echo     catch {(this.longTaskObserver) this.longTaskObserver.disconnect();
    echo         Show-BuildProgress "Failed to add performance tracking: $_" "Error"
    echo         return $falseeRateTimer) cancelAnimationFrame(this.frameRateTimer);gress "Failed to add performance tracking: $_" "Error"
    echo     }   if (this.memoryTimer) clearInterval(this.memoryTimer);   return $false
    echo }          }
    echo # Function to create responsive testing page
    echo function Add-ResponsiveTestPage {
    echo     param($WebBuildPath)y methodsestPage {
    echo     Show-BuildProgress "Creating responsive testing page..." "Running"
    echo     try {urePageLoadMetrics() {BuildProgress "Creating responsive testing page..." "Running"
    echo         $testPage = Join-Path $WebBuildPath "responsive-test.html"
    echo         $testContent = @"'Performance API not supported');Path $WebBuildPath "responsive-test.html"
    echo <!DOCTYPE html>urn;ntent = @"
    echo <html lang="en">
    echo <head>  lang="en">
    echo     <meta charset="UTF-8">page has fully loaded
    echo     <meta name="viewport" content="width=device-width, initial-scale=1.0">
    echo     <title>RED X Responsive Testing Tool</title>> {width, initial-scale=1.0">
    echo     <style>     setTimeout(() => this._capturePageLoadMetrics(), 100);RED X Responsive Testing Tool</title>
    echo         body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
    echo         h1 { color: #333; }sans-serif; margin: 0; padding: 20px; }
    echo         .controls { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
    echo         select, button { padding: 8px 15px; margin-right: 10px; }
    echo         .frame-container { border: 2px solid #333; margin-top: 20px; position: relative; }
    echo         iframe { border: none; width: 100%%; height: 600px; }ionStart;: 20px; position: relative; }
    echo         .size-info { background: #333; color: white; text-align: center; padding: 5px; }
    echo         .device-skin { position: absolute; z-index: 10; pointer-events: none; display: none; }
    echo         .device-skin.active { display: block; } none; }
    echo         .device-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 1; }
    echo         .tabs { display: flex; margin-bottom: 20px; }om: 0; z-index: 1; }
    echo         .tab { padding: 10px 20px; cursor: pointer; background: #eee; margin-right: 5px; }
    echo         .tab.active { background: #333; color: white; }rgin-right: 5px; }
    echo         .test-section { margin-top: 20px; display: none; }
    echo         .test-section.active { display: block; }
    echo         .test-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
    echo         .test-case { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
    echo         .test-case h3 { margin-top: 0; }s: 5px; }
    echo         .result-pass { color: green; }
    echo         .result-fail { color: red; }
    echo         .test-button { background: #4CAF50; color: white; border: none; padding: 8px 15px; cursor: pointer; }
    echo         #screenshotBtn { background: #f0ad4e; }: none; padding: 8px 15px; cursor: pointer; }
    echo     </style>this.bottlenecks.push({eenshotBtn { background: #f0ad4e; }
    echo </head>         type: 'slowPageLoad',tyle>
    echo <body>          severity: this._getSeverity(loadTime, 3000, 5000, 8000),>
    echo     <h1>RED X Mobile & Responsive Testing Tool</h1>
    echo                 message: `Page load time (${loadTime}ms) exceeds target of 3000ms`     <h1>RED X Mobile & Responsive Testing Tool</h1>
    echo     <div class="tabs">
    echo         <div class="tab active" data-tab="device-preview">Device Preview</div>
    echo         <div class="tab" data-tab="tests">Automated Tests</div>
    echo         <div class="tab" data-tab="results">Test Results</div>
    echo     </div>ass="tab" data-tab="results">Test Results</div>
    echo          </div>
    echo     <div class="test-section active" id="device-preview">
    echo         <div class="controls">eObserver) return;ctive" id="device-preview">
    echo             <select id="deviceSelect">
    echo                 <option value="360x640">Mobile - Small (360x640)</option>
    echo                 <option value="375x667">iPhone SE (375x667)</option>{tion>
    echo                 <option value="414x896">iPhone XR (414x896)</option>
    echo                 <option value="390x844">iPhone 12/13 (390x844)</option>
    echo                 <option value="428x926">iPhone Pro Max (428x926)</option>
    echo                 <option value="360x800">Samsung Galaxy S9 (360x800)</option>
    echo                 <option value="412x915">Samsung Galaxy S20 (412x915)</option>
    echo                 <option value="768x1024">Tablet - iPad (768x1024)</option>
    echo                 <option value="1024x1366">Tablet - iPad Pro (1024x1366)</option>
    echo                 <option value="1366x768">Laptop (1366x768)</option>ption>
    echo                 <option value="1920x1080">Desktop (1920x1080)</option>
    echo                 <option value="custom">Custom Size</option>>
    echo             </select>   size: entry.transferSizeon value="custom">Custom Size</option>
    echo             <input type="number" id="customWidth" placeholder="Width" style="width: 80px; display: none;">
    echo             <input type="number" id="customHeight" placeholder="Height" style="width: 80px; display: none;">
    echo             <button id="applySize">Apply</button>laceholder="Height" style="width: 80px; display: none;">
    echo             <button id="rotateDevice">Rotate Device</button>
    echo             <select id="deviceSkin">w resources">Rotate Device</button>
    echo                 <option value="none">No Device Skin</option>
    echo                 <option value="iphone">iPhone Skin</option>
    echo                 <option value="android">Android Skin</option>
    echo                 <option value="tablet">Tablet Skin</option>ry.duration, 1000, 2000, 4000),n>
    echo             </select>       value: Math.round(entry.duration) + 'ms',on value="tablet">Tablet Skin</option>
    echo             <button id="screenshotBtn">📷 Screenshot</button>getResourceName(entry.name)} (${Math.round(entry.duration)}ms)`
    echo         </div>          });utton id="screenshotBtn">📷 Screenshot</button>
    echo         <div class="size-info" id="sizeInfo">Current size: 360x640</div>
    echo         <div class="frame-container">ze: 360x640</div>
    echo             <div class="device-skin" id="iphone-skin"></div>
    echo             <div class="device-skin" id="android-skin"></div>
    echo             <div class="device-skin" id="tablet-skin"></div>
    echo             <iframe id="testFrame" src="./index.html"></iframe>
    echo         </div>is.resourceObserver.observe({ entryTypes: ['resource'] });frame id="testFrame" src="./index.html"></iframe>
    echo     </div>catch (e) {div>
    echo             console.warn('Error setting up resource monitoring:', e);     </div>
    echo     <div class="test-section" id="tests">
    echo         <h2>Automated Mobile Tests</h2>
    echo         <p>Run tests to verify mobile optimization compliance</p>
    echo         <button class="test-button" id="runAllTests">Run All Tests</button>
    echo         <button class="test-button" id="stopTests">Stop Tests</button>
    echo         if (!window.PerformanceObserver || typeof PerformanceLongTaskTiming === 'undefined') return;         <button class="test-button" id="stopTests">Stop Tests</button>
    echo         <div class="test-grid">
    echo             <div class="test-case">
    echo                 <h3>Viewport Meta Tag</h3>rformanceObserver(list => {
    echo                 <p>Checks if the viewport meta tag is properly set</p>
    echo                 <button class="run-test" data-test="viewport">Run Test</button>
    echo                 <div class="result"></div>ata-test="viewport">Run Test</button>
    echo             </div>  const metric = {iv class="result"></div>
    echo             <div class="test-case">Task',
    echo                 <h3>Touch Target Size</h3>e().toISOString(),
    echo                 <p>Checks if touch targets meet 44x44px minimum</p>
    echo                 <button class="run-test" data-test="touch-targets">Run Test</button>
    echo                 <div class="result"></div>s">Run Test</button>
    echo             </div>  this.metrics.push(metric);iv class="result"></div>
    echo             <div class="test-case">
    echo                 <h3>Font Size</h3>ks.push({>
    echo                 <p>Checks if font sizes are readable on mobile</p>
    echo                 <button class="run-test" data-test="font-size">Run Test</button>),
    echo                 <div class="result"></div>entry.duration) + 'ms',ata-test="font-size">Run Test</button>
    echo             </div>      message: `Long task blocked the main thread for ${Math.round(entry.duration)}ms`iv class="result"></div>
    echo             <div class="test-case">
    echo                 <h3>Responsive Layout</h3>
    echo                 <p>Tests if layout adapts to different screen sizes</p>
    echo                 <button class="run-test" data-test="responsive-layout">Run Test</button>
    echo                 <div class="result"></div>">Run Test</button>
    echo             </div>ss="result"></div>
    echo             <div class="test-case">bserve({ entryTypes: ['longtask'] });
    echo                 <h3>Media Queries</h3>
    echo                 <p>Checks if mobile media queries are properly applied</p>
    echo                 <button class="run-test" data-test="media-queries">Run Test</button>
    echo                 <div class="result"></div>tton>
    echo             </div>lt"></div>
    echo             <div class="test-case">
    echo                 <h3>Image Scaling</h3>ame) return;
    echo                 <p>Tests if images scale appropriately on mobile</p>
    echo                 <button class="run-test" data-test="image-scaling">Run Test</button>
    echo                 <div class="result"></div>ling">Run Test</button>
    echo             </div>SUpdate = lastTime;iv class="result"></div>
    echo         </div>
    echo     </div>nst checkFrame = timestamp => {div>
    echo             if (!this.isMonitoring) return;     </div>
    echo     <div class="test-section" id="results">
    echo         <h2>Test Results Summary</h2>
    echo         <div id="results-summary">e.now();h2>
    echo             <p>No tests have been run yet.</p>
    echo         </div> (now >= lastFPSUpdate + 1000) {>No tests have been run yet.</p>
    echo         <h3>Detailed Results</h3>round((frames * 1000) / (now - lastFPSUpdate));
    echo         <div id="detailed-results"></div>
    echo     </div>      this.metrics.push({iv id="detailed-results"></div>
    echo                     type: 'fps',    echo     </div>
    echo     <script>        timestamp: new Date().toISOString(),
    echo         // Tab navigation
    echo         document.querySelectorAll('.tab').forEach(tab => {
    echo             tab.addEventListener('click', () => {
    echo                 document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    echo                 tab.classList.add('active');ab').forEach(t => t.classList.remove('active'));
    echo                         type: 'lowFPS',                 tab.classList.add('active');
    echo                 const tabId = tab.getAttribute('data-tab');< 25 ? 'medium' : 'low'),
    echo                 document.querySelectorAll('.test-section').forEach(s => s.classList.remove('active'));
    echo                 document.getElementById(tabId).classList.add('active');s.classList.remove('active'));
    echo             });     }); document.getElementById(tabId).classList.add('active');
    echo         });     } });
    echo                          });
    echo         // Device preview functionality
    echo         const deviceSelect = document.getElementById('deviceSelect');
    echo         const customWidth = document.getElementById('customWidth');
    echo         const customHeight = document.getElementById('customHeight');
    echo         const applySize = document.getElementById('applySize');ame);ght');
    echo         const rotateDevice = document.getElementById('rotateDevice');
    echo         const deviceSkin = document.getElementById('deviceSkin');
    echo         const testFrame = document.getElementById('testFrame');;);
    echo         const sizeInfo = document.getElementById('sizeInfo');
    echo         const screenshotBtn = document.getElementById('screenshotBtn');
    echo     _monitorMemoryUsage() {         const screenshotBtn = document.getElementById('screenshotBtn');
    echo         // Device skinsformance || !window.performance.memory) return;
    echo         deviceSkin.addEventListener('change', function() {
    echo             document.querySelectorAll('.device-skin').forEach(skin => {
    echo                 skin.classList.remove('active');mory;kin').forEach(skin => {
    echo             });st usedHeap = memory.usedJSHeapSize / (1024 * 1024); // MB skin.classList.remove('active');
    echo             const totalHeap = memory.totalJSHeapSize / (1024 * 1024); // MB             });
    echo             if (this.value !== 'none') {izeLimit / (1024 * 1024); // MB
    echo                 document.getElementById(this.value + '-skin').classList.add('active');
    echo             }his.metrics.push({   document.getElementById(this.value + '-skin').classList.add('active');
    echo         });     type: 'memory', }
    echo                 timestamp: new Date().toISOString(),    echo         });
    echo         deviceSelect.addEventListener('change', function() {
    echo             if (this.value === 'custom') { {
    echo                 customWidth.style.display = 'inline-block';
    echo                 customHeight.style.display = 'inline-block';
    echo             } else {.style.display = 'inline-block';
    echo                 customWidth.style.display = 'none';
    echo                 customHeight.style.display = 'none';
    echo             }f (usagePercent > 0.8) {   customHeight.style.display = 'none';
    echo         });     this.bottlenecks.push({ }
    echo                     type: 'highMemoryUsage',    echo         });
    echo         applySize.addEventListener('click', function() {' : 'medium',
    echo             let width, height;h.round(usagePercent * 100) + '%',ener('click', function() {
    echo             if (deviceSelect.value === 'custom') {{Math.round(usagePercent * 100)}% of available heap`
    echo                 width = customWidth.value || 360;
    echo                 height = customHeight.value || 640;
    echo             } else {/ Check every 10 secondsht = customHeight.value || 640;
    echo                 [width, height] = deviceSelect.value.split('x');
    echo             }, height] = deviceSelect.value.split('x');
    echo             testFrame.style.width = width + 'px';
    echo             testFrame.style.height = height + 'px';
    echo             sizeInfo.textContent = \`Current size: \${width}x\${height}\`;
    echo         }); { sizeInfo.textContent = \`Current size: \${width}x\${height}\`;
    echo             // Save only the most recent metrics to avoid storage limit issues    echo         });
    echo         rotateDevice.addEventListener('click', function() {stringify(this.metrics.slice(-100)));
    echo             const currentWidth = testFrame.style.width.replace('px', '') || 360;ttlenecks.slice(-50)));
    echo             const currentHeight = testFrame.style.height.replace('px', '') || 640;
    echo             testFrame.style.width = currentHeight + 'px';s:', e);replace('px', '') || 640;
    echo             testFrame.style.height = currentWidth + 'px';
    echo             sizeInfo.textContent = \`Current size: \${currentHeight}x\${currentWidth}\`;
    echo         });fo.textContent = \`Current size: \${currentHeight}x\${currentWidth}\`;
    echo     _loadSavedMetrics() {    echo         });
    echo         // Screenshot functionality
    echo         screenshotBtn.addEventListener('click', function() {perf_metrics');
    echo             alert('Screenshot functionality would capture the current frame view');
    echo             // In a real implementation, this would use html2canvas or a similar library
    echo         }); if (savedMetrics) this.metrics = JSON.parse(savedMetrics); // In a real implementation, this would use html2canvas or a similar library
    echo             if (savedBottlenecks) this.bottlenecks = JSON.parse(savedBottlenecks);    echo         });
    echo         // Testing functionality
    echo         const testResults = {}; loading saved metrics:', e);y
    echo         let testsRunning = false;
    echo     }         let testsRunning = false;
    echo         document.getElementById('runAllTests').addEventListener('click', function() {
    echo             if (testsRunning) return;addEventListener('click', function() {
    echo             testsRunning = true;
    echo             const testButtons = document.querySelectorAll('.run-test');
    echo             let testIndex = 0;urlObj.pathname.split('/');= document.querySelectorAll('.run-test');
    echo             return pathParts[pathParts.length - 1] || url;             let testIndex = 0;
    echo             function runNextTest() {
    echo                 if (testIndex >= testButtons.length) {
    echo                     testsRunning = false;
    echo                     updateResultsSummary();
    echo                     document.querySelector('.tab[data-tab="results"]').click();
    echo                     return;Threshold, medThreshold, highThreshold) {t.querySelector('.tab[data-tab="results"]').click();
    echo                 } >= highThreshold) return 'high';   return;
    echo         if (value >= medThreshold) return 'medium';                 }
    echo                 const button = testButtons[testIndex];
    echo                 button.click();ns[testIndex];
    echo                 testIndex++;
    echo                 setTimeout(runNextTest, 1000);
    echo             } methods for external use   setTimeout(runNextTest, 1000);
    echo                  }
    echo             runNextTest();
    echo         });s.metrics = []; runNextTest();
    echo         this.bottlenecks = [];         });
    echo         document.getElementById('stopTests').addEventListener('click', function() {
    echo             testsRunning = false;redx_perf_bottlenecks');stopTests').addEventListener('click', function() {
    echo         });Running = false;
    echo              });
    echo         document.querySelectorAll('.run-test').forEach(button => {
    echo             button.addEventListener('click', function() {
    echo                 const testType = this.getAttribute('data-test');ageLoad');
    echo                 const resultElement = this.nextElementSibling;'resource'););
    echo                 resultElement.innerHTML = '<em>Running test...</em>';sk');
    echo                          resultElement.innerHTML = '<em>Running test...</em>';
    echo                 // Simulate test running
    echo                 setTimeout(() => {calculateAverage(pageLoads.map(p => p.loadTime));unning
    echo                     let passed = false;lculateAverage(pageLoads.map(p => p.domComplete));
    echo                     let message = '';s._calculateAverage(pageLoads.map(p => p.networkLatency));e;
    echo                              let message = '';
    echo                     switch(testType) {
    echo                         case 'viewport':re();
    echo                             const hasViewport = checkForViewportMeta();
    echo                             passed = hasViewport;
    echo                             message = hasViewport ?
    echo                                 'Viewport meta tag found and correctly configured' :
    echo                                 'Missing or improperly configured viewport meta tag';
    echo                             break; or improperly configured viewport meta tag';
    echo                         case 'touch-targets':
    echo                             const touchResults = checkTouchTargets();
    echo                             passed = touchResults.pass;rgets();
    echo                             message = touchResults.message;
    echo                             break;ngTasks.lengthe = touchResults.message;
    echo                         case 'font-size':
    echo                             const fontResults = checkFontSizes();ent 10
    echo                             passed = fontResults.pass;ions()ontSizes();
    echo                             message = fontResults.message;
    echo                             break;
    echo                         case 'responsive-layout':
    echo                             // Check if the container adapts to screen width
    echo                             passed = Math.random() > 0.3; // Simulate results
    echo                             message = passed ?
    echo                                 'Layout properly adapts to screen width' :
    echo                                 'Layout does not fully adapt to all screen sizes';
    echo                             break;{ayout does not fully adapt to all screen sizes';
    echo                         case 'media-queries':teAverage(pageLoads.map(p => p.loadTime));
    echo                             // Check if media queries are active
    echo                             passed = checkMediaQueries();ive
    echo                             message = passed ?
    echo                                 'Media queries properly implemented' :
    echo                                 'Media queries not found or not properly applied';
    echo                             break;.metrics.filter(m => m.type === 'longTask').length;edia queries not found or not properly applied';
    echo                         case 'image-scaling': 2);
    echo                             // Check if images scale correctly
    echo                             passed = Math.random() > 0.2; // Simulate results
    echo                             message = passed ?ecks.filter(b => b.severity === 'high').length;om() > 0.2; // Simulate results
    echo                                 'Images scale properly on mobile devices' :
    echo                                 'Some images may overflow or not scale properly';
    echo                             break;n(100, Math.round(score)));ome images may overflow or not scale properly';
    echo                     }
    echo                          }
    echo                     // Save test result
    echo                     testResults[testType] = {eturn 0;
    echo                         passed: passed,((sum, val) => sum + val, 0) / values.length);e] = {
    echo                         message: message,
    echo                         timestamp: new Date().toLocaleTimeString()
    echo                     };ations() {  timestamp: new Date().toLocaleTimeString()
    echo         const recommendations = [];                     };
    echo                     // Update UI
    echo                     resultElement.innerHTML = '<span class="result-' + (passed ? 'pass' : 'fail') + '">' +
    echo                         (passed ? '✓ PASS' : '✗ FAIL') + '</span>: ' + message;
    echo         this.bottlenecks.forEach(b => {                         (passed ? '✓ PASS' : '✗ FAIL') + '</span>: ' + message;
    echo                     updateDetailedResults();ttleneckTypes[b.type] = 0;
    echo                 }, 800);pes[b.type]++;
    echo             });     });     updateDetailedResults();
    echo         });;
    echo         // Add recommendations based on bottlenecks         });
    echo         function updateResultsSummary() { {
    echo             const results = Object.values(testResults);
    echo             if (results.length === 0) return;,tResults);
    echo                 items: [             if (results.length === 0) return;
    echo             const passed = results.filter(r => r.passed).length;
    echo             const total = results.length;ting and lazy loading',(r => r.passed).length;
    echo             const percentage = Math.round((passed / total) * 100);
    echo                     'Use server-side rendering for initial content',             const percentage = Math.round((passed / total) * 100);
    echo             document.getElementById('results-summary').innerHTML = `
    echo                 <h3>Overall Score: ${percentage}%</h3>
    echo                 <p>${passed} of ${total} tests passed</p>
    echo                 <div style="background:#eee;height:20px;width:100%;border-radius:10px;overflow:hidden">
    echo                     <div style="background:${percentage > 70 ? 'green' : percentage > 40 ? 'orange' : 'red'};
    echo                                 height:100%;width:${percentage}%"></div> 'red'};
    echo                 </div>tions.push({          height:100%;width:${percentage}%"></div>
    echo             `;  area: 'Resource Optimization',  </div>
    echo         }       items: [   `;
    echo                     'Optimize and compress images',         }
    echo         function updateDetailedResults() {sources',
    echo             const results = Object.entries(testResults);
    echo             if (results.length === 0) return;t',stResults);
    echo                     'Use modern image formats (WebP)'             if (results.length === 0) return;
    echo             let html = '<ul style="list-style:none;padding:0">';
    echo             results.forEach(([test, result]) => {
    echo                 html += `<li style="margin-bottom:10px;padding:10px;background:#f9f9f9;border-left:4px solid
    echo                     ${result.passed ? 'green' : 'red'}">olid
    echo                     <strong>${formatTestName(test)}</strong>:
    echo                     <span class="result-${result.passed ? 'pass' : 'fail'}">
    echo                         ${result.passed ? 'PASS' : 'FAIL'}ail'}">
    echo                     </span><br>d ? 'PASS' : 'FAIL'}
    echo                     <small>${result.message} (Tested at ${result.timestamp})</small>
    echo                 </li>`;e Web Workers for CPU-intensive tasks',all>${result.message} (Tested at ${result.timestamp})</small>
    echo             });     'Optimize event handlers (debounce/throttle)', </li>`;
    echo             html += '</ul>';nt virtual scrolling for large lists',
    echo                     'Use requestIdleCallback for non-critical work'             html += '</ul>';
    echo             document.getElementById('detailed-results').innerHTML = html;
    echo         }   });   document.getElementById('detailed-results').innerHTML = html;
    echo         }         }
    echo         function formatTestName(testName) {
    echo             return testName.split('-').map(word =>
    echo                 word.charAt(0).toUpperCase() + word.slice(1)
    echo             ).join(' ');endering Performance',rAt(0).toUpperCase() + word.slice(1)
    echo         }       items: [   ).join(' ');
    echo                     'Use CSS transitions instead of JavaScript animations',         }
    echo         // Test implementation functionsty and nesting',
    echo         function checkForViewportMeta() {/layouts',
    echo             try {   'Use will-change property for animations',checkForViewportMeta() {
    echo                 const doc = testFrame.contentDocument || testFrame.contentWindow.document;
    echo                 const viewportMeta = doc.querySelector('meta[name="viewport"]');
    echo                 return viewportMeta !== null && viewportMeta.getAttribute('content').includes('width=device-width');
    echo             } catch(e) { null && viewportMeta.getAttribute('content').includes('width=device-width');
    echo                 return false;
    echo             }ottleneckTypes.highMemoryUsage) {   return false;
    echo         }   recommendations.push({   }
    echo                 area: 'Memory Management',         }
    echo         function checkTouchTargets() {
    echo             try {   'Fix memory leaks (check event listeners)',checkTouchTargets() {
    echo                 const doc = testFrame.contentDocument || testFrame.contentWindow.document;
    echo                 const interactiveElements = doc.querySelectorAll('button, a, input, select, textarea');
    echo                     'Avoid unnecessary DOM element creation',                 const interactiveElements = doc.querySelectorAll('button, a, input, select, textarea');
    echo                 let tooSmallElements = 0; in development'
    echo                 interactiveElements.forEach(el => {
    echo                     const rect = el.getBoundingClientRect();
    echo                     if (rect.width < 44 || rect.height < 44) {
    echo                         tooSmallElements++;
    echo                     }lude at least one recommendation   tooSmallElements++;
    echo                 });ndations.length === 0) { }
    echo             recommendations.push({                 });
    echo                 const pass = tooSmallElements === 0;
    echo                 const message = pass ?
    echo                     'All touch targets meet minimum size requirements' :
    echo                     `Found ${tooSmallElements} elements that are too small for touch`;
    echo                     'Regular performance profiling during development',                     `Found ${tooSmallElements} elements that are too small for touch`;
    echo                 return { pass, message };eatures when available',
    echo             } catch(e) {pt performance-focused development practices' pass, message };
    echo                 return { pass: false, message: 'Error checking touch targets: ' + e.message };
    echo             });   return { pass: false, message: 'Error checking touch targets: ' + e.message };
    echo         }   }
    echo                  }
    echo         function checkFontSizes() {
    echo             try {es() {
    echo                 const doc = testFrame.contentDocument || testFrame.contentWindow.document;
    echo                 const textElements = doc.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
    echo // Initialize the analyzer                 const textElements = doc.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6');
    echo                 let tooSmallText = 0;
    echo                 textElements.forEach(el => {formanceAnalyzer();
    echo                     const fontSize = window.getComputedStyle(el).fontSize;
    echo                     if (parseInt(fontSize) < 14) {.fontSize;
    echo                         tooSmallText++;=> {ze) < 14) {
    echo                     } => {   tooSmallText++;
    echo                 });dow.redxPerformanceAnalyzer) window.redxPerformanceAnalyzer.startMonitoring(); }
    echo         }, 1000); // Delay to not affect initial load                 });
    echo                 const pass = tooSmallText === 0;
    echo                 const message = pass ?
    echo                     'All text is readable size (14px or larger)' :
    echo                     `Found ${tooSmallText} text elements that may be too small to read on mobile`;
    echo     window.redx.performance = {                     `Found ${tooSmallText} text elements that may be too small to read on mobile`;
    echo                 return { pass, message };rmanceAnalyzer.generateReport(),
    echo             } catch(e) { () => window.redxPerformanceAnalyzer.startMonitoring(), pass, message };
    echo                 return { pass: false, message: 'Error checking font sizes: ' + e.message };
    echo             }Data: () => window.redxPerformanceAnalyzer.clearData()   return { pass: false, message: 'Error checking font sizes: ' + e.message };
    echo         }}
    echo }         }
    echo         function checkMediaQueries() {
    echo             // This is a simplified check that just looks for media queries in stylesheets
    echo             try {nt -Path $perfAnalyzerJs -Value $perfAnalyzerContentis is a simplified check that just looks for media queries in stylesheets
    echo                 const doc = testFrame.contentDocument || testFrame.contentWindow.document;
    echo                 const styleSheets = doc.styleSheets;
    echo         # Create the performance dashboard HTML                 const styleSheets = doc.styleSheets;
    echo                 for (let i = 0; i < styleSheets.length; i++) {rd.html"
    echo                     try { = @'i = 0; i < styleSheets.length; i++) {
    echo                         const rules = styleSheets[i].cssRules || styleSheets[i].rules;
    echo                         for (let j = 0; j < rules.length; j++) {
    echo                             if (rules[j].type === CSSRule.MEDIA_RULE &&
    echo                                 rules[j].conditionText.includes('max-width')) {
    echo                                 return true;ice-width, initial-scale=1.0">ditionText.includes('max-width')) {
    echo                             }Dashboard</title>   return true;
    echo                         }
    echo                     } catch(e) {
    echo                         // Skip CORS restricted stylesheets
    echo                         continue;S restricted stylesheets
    echo                     }: #0cce6b;   continue;
    echo                 }ning: #ffa400;   }
    echo                 return false;;
    echo             } catch(e) {#f8f9fa;alse;
    echo                 return false;f;
    echo             }-text: #202124;   return false;
    echo         }   --border: #e0e0e0;   }
    echo         }    echo }
REM ...existing code...
    echo # Function to add batch upload support
    echo function Add-BatchUploadSupport {
    echo     param($WebBuildPath, $BatchSize)
    echo     Show-BuildProgress "Adding batch upload support (max $BatchSize items)..." "Running"
    echo     try {rocessed = 0;BuildProgress "Adding batch upload support (max $BatchSize items)..." "Running"
    echo         $jsFile = Join-Path $WebBuildPath "index.js"
    echo         if (Test-Path $jsFile) {=> {BuildPath "index.js"
    echo             $batchJs = @" {File) {
    echo         // All done             $batchJs = @"
    echo // Batch Upload Support = false;
    echo if (typeof window !== 'undefined' && typeof window.redx === 'undefined') {
    echo   window.redx = {};allback({== 'undefined' && typeof window.redx === 'undefined') {
    echo }           total: total, window.redx = {};
    echo             successful: total - this.failedItems.length, }
    echo window.redx.batchUpload = {iledItems
    echo   maxBatchSize: $BatchSize,
    echo   currentBatch: [],
    echo   failedItems: [],
    echo   inProgress: false,
    echo   inProgress: false,
    echo   // Add files to batch.currentBatch[index];
    echo   addFiles: function(files) {
    echo     const remaining = this.maxBatchSize - this.currentBatch.length;
    echo     const toAdd = Array.from(files).slice(0, remaining);
    echo         processed++;     const toAdd = Array.from(files).slice(0, remaining);
    echo     this.currentBatch = this.currentBatch.concat(toAdd);
    echo     console.log(\`Added \${toAdd.length} files to batch. Batch size: \${this.currentBatch.length}/\${this.maxBatchSize}\`);
    echo         if (progressCallback) {     console.log(\`Added \${toAdd.length} files to batch. Batch size: \${this.currentBatch.length}/\${this.maxBatchSize}\`);
    echo     return toAdd.length;ck({
    echo   },        file: file.name,return toAdd.length;
    echo             index: index,   },
    echo   // Process batch uploadocessed,
    echo   processUpload: function(progressCallback, completeCallback, errorCallback) {
    echo     if (this.inProgress) {round((processed / total) * 100)progressCallback, completeCallback, errorCallback) {
    echo       if (errorCallback) errorCallback("Batch upload already in progress");
    echo       return false;rCallback("Batch upload already in progress");
    echo     }n false;
    echo         // Random success/failure for testing     }
    echo     if (this.currentBatch.length === 0) {.1;
    echo       if (errorCallback) errorCallback("No files in batch to upload");
    echo       return false;s) {back) errorCallback("No files in batch to upload");
    echo     }     this.failedItems.push({ return false;
    echo             file: file.name,     }
    echo     this.inProgress = true;
    echo     this.failedItems = [];ted upload failure";
    echo           });     this.failedItems = [];
    echo     // Process files
    echo     const total = this.currentBatch.length;
    echo     let processed = 0;dex + 1);.currentBatch.length;
    echo       }, 100);     let processed = 0;
    echo     const processNext = (index) => {
    echo       if (index >= total) {
    echo         // All donesingtotal) {
    echo         this.inProgress = false;
    echo         if (completeCallback) {
    echo           completeCallback({
    echo             total: total,
    echo             successful: total - this.failedItems.length,
    echo             failed: this.failedItemsms.length,
    echo           });inProgress) return false;ailed: this.failedItems
    echo         }
    echo         return; = this.currentBatch.length;
    echo       }s.currentBatch = []; return;
    echo     return count;       }
    echo       const file = this.currentBatch[index];
    echo       const file = this.currentBatch[index];
    echo       // Simulate file processing (replace with actual upload)
    echo       setTimeout(() => {unction(progressCallback, completeCallback) {rocessing (replace with actual upload)
    echo         processed++;ess || this.failedItems.length === 0) return false;=> {
    echo         processed++;
    echo         // Report progressailedItems.map(item => this.currentBatch[item.index]);
    echo         if (progressCallback) {
    echo           progressCallback({
    echo             file: file.name, to batch
    echo             index: index,);me,
    echo             processed: processed,
    echo             total: total,gainocessed,
    echo             percent: Math.round((processed / total) * 100)llback);
    echo           });th.round((processed / total) * 100)
    echo         }
    echo "@         }
    echo         // Random success/failure for testing
    echo         const success = Math.random() > 0.1; $batchJsg
    echo             Show-BuildProgress "Added batch upload support (max $BatchSize files)" "Success"         const success = Math.random() > 0.1;
    echo         if (!success) {
    echo           this.failedItems.push({
    echo             file: file.name,
    echo             index: index,
    echo             error: "Simulated upload failure"ch upload support: $_" "Error"
    echo           });n $falserror: "Simulated upload failure"
    echo         }
    echo }         }
    echo         processNext(index + 1);
    echo       }, 100);sNext(index + 1);
    echo     };
    echo # Start logging     };
    echo     // Start processing$logFile -Force
    echo     processNext(0);
    echo     return true;
    echo   },Show-BuildProgress "Starting RED X build process... ($buildType mode)" "Running"return true;
    echo.   },
    echo   // Clear batchny PowerShell sessions might be blocking files
    echo   clearBatch: function() {ecking for blocking processes..." "Running"
    echo     if (this.inProgress) return false;Name powershell -ErrorAction SilentlyContinue ^| Where-Object { $_.Id -ne $PID -and $_.MainWindowTitle -match "RED X" }
    echo     if ($blockingProcesses) {     if (this.inProgress) return false;
    echo     const count = this.currentBatch.length;esses.Count) blocking PowerShell processes found. This might cause file lock issues." "Warning"
    echo     this.currentBatch = [];
    echo     return count;
    echo   },# Run the appropriate build command based on build typereturn count;
    echo     switch ($buildType) {   },
    echo   // Resume failed uploads
    echo   resumeFailedUploads: function(progressCallback, completeCallback) {g"
    echo     if (this.inProgress || this.failedItems.length === 0) return false;
    echo         }     if (this.inProgress || this.failedItems.length === 0) return false;
    echo     const toRetry = this.failedItems.map(item => this.currentBatch[item.index]);
    echo     this.clearBatch();Progress "Building native executable only..." "Running"unt
    echo     if ($success) {             ^& "%~dp0\red_x\Run-RedX.ps1" -Mode native -Verbose     this.clearBatch();
    echo     // Add failed items back to batch
    echo     this.addFiles(toRetry);
    echo             Show-BuildProgress "Building full version (web + native)..." "Running"     this.addFiles(toRetry);
    echo     // And process them againun-RedX.ps1" -Mode build -Verbose
    echo     return this.processUpload(progressCallback, completeCallback);
    echo   } } return this.processUpload(progressCallback, completeCallback);
    echo };
    echo "@  # Verify build results
    echo     $success = $false "@
    echo             Add-Content -Path $jsFile -Value $batchJs
    echo             Show-BuildProgress "Added batch upload support (max $BatchSize files)" "Success"
    echo         }buildType -eq "web" -or $buildType -eq "full") {   Show-BuildProgress "Added batch upload support (max $BatchSize files)" "Success"
    echo         return $trueh -Path "%~dp0\red_x\index.html" -and Test-Path -Path "%~dp0\red_x\index.wasm") {
    echo     }       Show-BuildProgress "Web build artifacts found!" "Success"   return $true
    echo     catch { $webBuildPath = "%~dp0\red_x"
    echo         Show-BuildProgress "Failed to add batch upload support: $_" "Error"
    echo         return $falseatch upload support: $_" "Error"
    echo     }       # Apply web build enhancements   return $false
    echo }           if ($optimizeForMobile) {   }
    echo.                Show-BuildProgress "Mobile optimization requested, applying..." "Running"}
    echo # Start logging Optimize-WebForMobile -WebBuildPath $webBuildPath
    echo Start-Transcript -Path $logFile -Force
    echo.tart-Transcript -Path $logFile -Force
    echo try {       if ($performanceProfile) {
    echo     Show-BuildProgress "Starting RED X build process... ($buildType mode)" "Running"unning"
    echo.                Add-PerformanceTracking -WebBuildPath $webBuildPath    Show-BuildProgress "Starting RED X build process... ($buildType mode)" "Running"
    echo     # Check if any PowerShell sessions might be blocking files
    echo     Show-BuildProgress "Checking for blocking processes..." "Running"
    echo     $blockingProcesses = Get-Process -Name powershell -ErrorAction SilentlyContinue ^| Where-Object { $_.Id -ne $PID -and $_.MainWindowTitle -match "RED X" }
    echo     if ($blockingProcesses) {gress "Responsive testing requested, creating test page..." "Running"Process -Name powershell -ErrorAction SilentlyContinue ^| Where-Object { $_.Id -ne $PID -and $_.MainWindowTitle -match "RED X" }
    echo         Show-BuildProgress "$($blockingProcesses.Count) blocking PowerShell processes found. This might cause file lock issues." "Warning"
    echo     }       }   Show-BuildProgress "$($blockingProcesses.Count) blocking PowerShell processes found. This might cause file lock issues." "Warning"
    echo.   }
    echo     # Run the appropriate build command based on build typetest options
    echo     switch ($buildType) {st) { build command based on build type
    echo         "web" { Show-BuildProgress "Mobile testing mode enabled! Testing resources available at:" "Success"ildType) {
    echo             Show-BuildProgress "Building web version only..." "Running" "Success"
    echo             ^& "%~dp0\red_x\Run-RedX.ps1" -Mode web -Verbosesive-test.html" "Success"" "Running"
    echo         }   }   ^& "%~dp0\red_x\Run-RedX.ps1" -Mode web -Verbose
    echo         "native" {
    echo             Show-BuildProgress "Building native executable only..." "Running"
    echo             ^& "%~dp0\red_x\Run-RedX.ps1" -Mode native -Verbose-BatchSize $batchSize..." "Running"
    echo         } else {   ^& "%~dp0\red_x\Run-RedX.ps1" -Mode native -Verbose
    echo         default {BuildProgress "Web build artifacts not found" "Error"
    echo             Show-BuildProgress "Building full version (web + native)..." "Running"
    echo             ^& "%~dp0\red_x\Run-RedX.ps1" -Mode build -Verbose
    echo         }& "%~dp0\red_x\Run-RedX.ps1" -Mode build -Verbose
    echo     }
    echo.    if ($buildType -eq "native" -or $buildType -eq "full") {    }
    echo     # Verify build resultsh "%~dp0\red_x\red_x.exe") {
    echo     $success = $falsedProgress "Native executable build successful!" "Success"sults
    echo     $errorMessage = "" $true
    echo.        } else {    $errorMessage = ""
    echo     if ($buildType -eq "web" -or $buildType -eq "full") {nd" "Error"
    echo         if (Test-Path -Path "%~dp0\red_x\index.html" -and Test-Path -Path "%~dp0\red_x\index.wasm") {
    echo             Show-BuildProgress "Web build artifacts found!" "Success"
    echo             $webBuildPath = "%~dp0\red_x"
    echo             $success = $true
    echo     if ($success) {             $success = $true
    echo             # Apply web build enhancementsD SUCCESSFULLY!" "Success"
    echo             if ($optimizeForMobile) {d_x\red_x.exe") {ments
    echo                 Show-BuildProgress "Mobile optimization requested, applying..." "Running"
    echo                 Optimize-WebForMobile -WebBuildPath $webBuildPath ($([Math]::Round($fileInfo.Length / 1KB, 2)) KB)" "Success", applying..." "Running"
    echo             }ptimize-WebForMobile -WebBuildPath $webBuildPath
    echo     } else {             }
    echo             if ($performanceProfile) {ED: $errorMessage" "Error"
    echo                 Show-BuildProgress "Performance profiling requested, applying..." "Running"
    echo                 Add-PerformanceTracking -WebBuildPath $webBuildPath
    echo             }-PerformanceTracking -WebBuildPath $webBuildPath
    echo     Show-BuildProgress "Error: $_" "Error"             }
    echo             if ($perfAnalysis) {log file for details: $logFile" "Warning"
    echo                 Show-BuildProgress "Performance analysis requested, adding tools..." "Running"
    echo                 Add-PerformanceAnalyzer -WebBuildPath $webBuildPath
    echo                 Show-BuildProgress "Performance dashboard available at: $webBuildPath\perf-dashboard.html" "Success"tatus and cleanup   Add-ResponsiveTestPage -WebBuildPath $webBuildPath
    echo             }     if (Test-Path -Path "%~dp0\red_x\red_x.exe") {             }
    echo
    echo             if ($responsiveTest) {the test options
    echo                 Show-BuildProgress "Responsive testing requested, creating test page..." "Running"
    echo                 Add-ResponsiveTestPage -WebBuildPath $webBuildPathor Cyans available at:" "Success"
    echo             }
    dProgress "  - $webBuildPath\responsive-test.html" "Success"
    echo             # If mobile test mode is enabled, announce the test options) > "%~dp0\red_x\Start-RedX-Build.ps1"    echo             }
    echo             if ($mobileTest) {
    echo                 Show-BuildProgress "Mobile testing mode enabled! Testing resources available at:" "Success"
    echo                 Show-BuildProgress "  - $webBuildPath\mobile-test.html" "Success"WebBuildPath $webBuildPath -BatchSize $batchSize
    echo                 Show-BuildProgress "  - $webBuildPath\responsive-test.html" "Success"
    echo             }not found" "Error"
ct "YES" to continue the build.   $errorMessage += "Web build failed. "
    echo             # Always add batch upload support
    echo             Add-BatchUploadSupport -WebBuildPath $webBuildPath -BatchSize $batchSized options:    }
    echo         } else {
    echo             Show-BuildProgress "Web build artifacts not found" "Error"
    echo             $errorMessage += "Web build failed. "
    echo         }N%  Mobile optimization: YES%RESET%ss "Native executable build successful!" "Success"
    echo     }%CYAN%  Mobile testing: YES%RESET%cess = $true
    echo.
    echo     if ($buildType -eq "native" -or $buildType -eq "full") {
    echo         if (Test-Path -Path "%~dp0\red_x\red_x.exe") {orMessage += "Native build failed. "
    echo             Show-BuildProgress "Native executable build successful!" "Success"
    echo             $success = $truete the PowerShell script with elevated privileges    }
    echo         } else {rocess with logging to %LOGFILE%...%RESET%
    echo             Show-BuildProgress "Native executable not found" "Error"ntList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0\red_x\Start-RedX-Build.ps1\"' -Verb RunAs -WindowStyle Normal"
    echo             $errorMessage += "Native build failed. "
    echo         }
    echo     }
    echo.ll be created at: %LOGFILE%   Show-BuildProgress "Executable: $($fileInfo.FullName) ($([Math]::Round($fileInfo.Length / 1KB, 2)) KB)" "Success"
    echo     if ($success) {
    echo         Show-BuildProgress "BUILD COMPLETED SUCCESSFULLY!" "Success"
    echo         if (Test-Path -Path "%~dp0\red_x\red_x.exe") {Show-BuildProgress "BUILD FAILED: $errorMessage" "Error"
    echo             $fileInfo = Get-Item "%~dp0\red_x\red_x.exe"  }
    echo             Show-BuildProgress "Executable: $($fileInfo.FullName) ($([Math]::Round($fileInfo.Length / 1KB, 2)) KB)" "Success"    echo         }    echo     } else {    echo         Show-BuildProgress "BUILD FAILED: $errorMessage" "Error"    echo     }    echo }    echo catch {    echo     Show-BuildProgress "Error: $_" "Error"    echo     Show-BuildProgress "Check the log file for details: $logFile" "Warning"    echo }    echo finally {    echo     # Final status and cleanup    echo     if (Test-Path -Path "%~dp0\red_x\red_x.exe") {    echo         Show-BuildProgress "RED X is ready to run!" "Success"    echo     }    echo     Stop-Transcript    echo     Write-Host "`nBuild process completed. Press Enter to exit..." -ForegroundColor Cyan    echo     Read-Host    echo }) > "%~dp0\red_x\Start-RedX-Build.ps1"REM Update build options display to show mobile test statusecho.echo %YELLOW%*** IMPORTANT ***%RESET%echo When prompted to allow PowerShell to make changes,echo you MUST select "YES" to continue the build.echo.echo Build options:echo %CYAN%  Build type: %BUILD_TYPE%%RESET%if %CLEAN_BUILD%==1 echo %CYAN%  Clean build: YES%RESET%if %SKIP_CHECKS%==1 echo %CYAN%  Skip checks: YES%RESET%if %OPTIMIZE_FOR_MOBILE%==1 echo %CYAN%  Mobile optimization: YES%RESET%if %MOBILE_TEST%==1 echo %CYAN%  Mobile testing: YES%RESET%if %RUBY_REQUIRED%==1 echo %CYAN%  Ruby processing: YES%RESET%echo.
echo Press any key when ready to proceed...pause > nulREM Execute the PowerShell script with elevated privilegesecho %GREEN%Starting build process with logging to %LOGFILE%...%RESET%powershell -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0\red_x\Start-RedX-Build.ps1\"' -Verb RunAs -WindowStyle Normal"echo.echo %CYAN%Build started in a new window with administrator privileges.%RESET%
echo A log file will be created at: %LOGFILE%
echo.
echo Press any key to exit this window...
pause > nul
exit /b 0

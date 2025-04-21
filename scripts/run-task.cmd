@echo off
:: Consolidated task runner script
:: Usage: run-task.cmd [task_name]

IF "%1"=="" (
  echo Available tasks:
  echo   build      - Build the project
  echo   deploy     - Deploy to GitHub Pages
  echo   dev        - Start development server
  echo   test       - Run tests
  echo   clean      - Clean build artifacts
  echo   lint       - Run linter and formatter
  echo   docs       - Generate documentation
  echo   branch     - Branch management utilities
  exit /b
)

IF "%1"=="build" (
  echo Running build...
  cd %~dp0.. && call run-vs-code-task shell: make_web
  exit /b
)

IF "%1"=="deploy" (
  echo Deploying to GitHub Pages...
  cd %~dp0.. && call run-vs-code-task shell: deploy
  exit /b
)

IF "%1"=="dev" (
  echo Starting development server...
  cd %~dp0.. && call run-vs-code-task shell: start_server
  exit /b
)

IF "%1"=="test" (
  echo Running tests...
  cd %~dp0.. && npm test
  exit /b
)

IF "%1"=="clean" (
  echo Cleaning build artifacts...
  cd %~dp0.. && call run-vs-code-task shell: clean
  exit /b
)

IF "%1"=="lint" (
  echo Running linter and formatter...
  cd %~dp0.. && npm run lint
  exit /b
)

IF "%1"=="docs" (
  echo Generating documentation...
  cd %~dp0.. && call run-vs-code-task shell: generate_contract_docs
  exit /b
)

IF "%1"=="branch" (
  IF "%2"=="" (
    echo Branch management commands:
    echo   branch info     - Get branch information
    echo   branch switch   - Switch to a branch (main/docs)
    echo   branch sync     - Sync branches
    exit /b
  )
  
  IF "%2"=="info" (
    echo Getting branch information...
    cd %~dp0.. && call run-vs-code-task shell: branch_info
    exit /b
  )
  
  IF "%2"=="switch" (
    IF "%3"=="main" (
      echo Switching to main branch...
      cd %~dp0.. && call run-vs-code-task shell: switch_to_main
      exit /b
    )
    
    IF "%3"=="docs" (
      echo Switching to docs branch...
      cd %~dp0.. && call run-vs-code-task shell: switch_to_docs
      exit /b
    )
  )
  
  IF "%2"=="sync" (
    echo Syncing branches...
    cd %~dp0.. && call run-vs-code-task shell: sync_branches
    exit /b
  )
)

echo Unknown task: %1
echo Run without arguments to see available tasks.
exit /b 1
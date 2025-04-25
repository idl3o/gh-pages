#!/bin/bash
# SXS CLI - Simple eXtensible Shell
# A bash-based CLI for project management with cross-platform capabilities

VERSION="1.0.0"
WORKSPACE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NO_LOGO=false
COMMAND=""
COMMAND_ARGS=()

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --no-logo)
      NO_LOGO=true
      shift
      ;;
    --command)
      COMMAND="$2"
      shift 2
      ;;
    --command=*)
      COMMAND="${1#*=}"
      shift
      ;;
    *)
      COMMAND_ARGS+=("$1")
      shift
      ;;
  esac
done

# Color definitions
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
GRAY='\033[0;37m'
RESET='\033[0m'

# Function to execute a chain of commands using && operator
# Each command will only run if the previous command succeeded
# Example: try_command_chain "mkdir temp" "cd temp" "touch test.txt"
try_command_chain() {
  local commands=("$@")
  local result=0
  
  for cmd in "${commands[@]}"; do
    echo -e "${YELLOW}Executing: ${cmd}${RESET}"
    eval "$cmd"
    result=$?
    
    if [ $result -ne 0 ]; then
      echo -e "${RED}Command failed with exit code: $result${RESET}"
      return $result
    fi
  done
  
  echo -e "${GREEN}All commands in chain executed successfully!${RESET}"
  return 0
}

show_header() {
  echo ""
  echo -e "${CYAN}§§§§§  ✧✧✧✧✧  §§§§§${RESET}"
  echo -e "${CYAN}§      ✧   ✧  §   §${RESET}"
  echo -e "${CYAN}§§§§§  ✧   ✧  §§§§§${RESET}"
  echo -e "${CYAN}    §  ✧   ✧  §   §${RESET}"
  echo -e "${CYAN}§§§§§  ✧✧✧✧✧  §   §${RESET}"
  echo ""
  echo -e "${YELLOW}Simple eXtensible Shell (SXS) v${VERSION}${RESET}"
  echo -e "${GRAY}Type 'help' to see available commands${RESET}"
  echo ""
}

show_help() {
  echo -e "${YELLOW}Available commands:${RESET}"

  # Core commands
  echo -e "${MAGENTA}  Core Commands:${RESET}"
  echo -e "${GRAY}    help         - Show this help menu${RESET}"
  echo -e "${GRAY}    clear        - Clear the console${RESET}"
  echo -e "${GRAY}    exit         - Exit SXS CLI${RESET}"
  echo -e "${GRAY}    status       - Show current branch and repository status${RESET}"

  # Build commands
  echo -e "${MAGENTA}  Build Commands:${RESET}"
  echo -e "${GRAY}    build web    - Build the web version (uses Emscripten)${RESET}"
  echo -e "${GRAY}    build native - Build the native version${RESET}"
  echo -e "${GRAY}    clean        - Clean build artifacts${RESET}"

  # Serve/Deploy commands
  echo -e "${MAGENTA}  Server & Deploy Commands:${RESET}"
  echo -e "${GRAY}    server       - Start the development server${RESET}"
  echo -e "${GRAY}    deploy       - Deploy to GitHub Pages${RESET}"

  # Branch management
  echo -e "${MAGENTA}  Branch Management:${RESET}"
  echo -e "${GRAY}    branch info  - Show branch information${RESET}"
  echo -e "${GRAY}    branch main  - Switch to main branch${RESET}"
  echo -e "${GRAY}    branch docs  - Switch to docs branch${RESET}"
  echo -e "${GRAY}    branch sync  - Sync all branches${RESET}"

  # Fix and Repair commands
  echo -e "${MAGENTA}  Fixes & Repairs:${RESET}"
  echo -e "${GRAY}    fix hooks    - Fix git hooks issues${RESET}"
  echo -e "${GRAY}    fix deps     - Fix Node.js dependencies${RESET}"
  echo -e "${GRAY}    setup        - Set up Emscripten SDK${RESET}"

  # Commit and workarounds
  echo -e "${MAGENTA}  Git Operations:${RESET}"
  echo -e "${GRAY}    safe-commit \"message\" - Commit changes safely (bypassing hooks)${RESET}"
  echo -e "${GRAY}    restore-hooks - Restore git hooks to normal operation${RESET}"
  echo ""

  echo -e "${GRAY}To run a command directly, use: ./sxs-cli.sh --command=\"command name\"${RESET}"
}

run_task() {
  local task_name="$1"

  case "$task_name" in
    "build web")
      echo -e "${CYAN}Building web version...${RESET}"
      build_web
      ;;
    "build native")
      echo -e "${CYAN}Building native version...${RESET}"
      build_native
      ;;
    "clean")
      echo -e "${CYAN}Cleaning build artifacts...${RESET}"
      clean_project
      ;;
    "server")
      echo -e "${CYAN}Starting development server...${RESET}"
      start_server
      ;;
    "deploy")
      echo -e "${CYAN}Deploying to GitHub Pages...${RESET}"
      deploy_to_github_pages
      ;;
    "branch info")
      echo -e "${CYAN}Getting branch info...${RESET}"
      branch_info
      ;;
    "branch main")
      echo -e "${CYAN}Switching to main branch...${RESET}"
      branch_switch_to_main
      ;;
    "branch docs")
      echo -e "${CYAN}Switching to docs branch...${RESET}"
      branch_switch_to_docs
      ;;
    "branch sync")
      echo -e "${CYAN}Syncing branches...${RESET}"
      branch_sync
      ;;
    "setup")
      echo -e "${CYAN}Setting up Emscripten SDK...${RESET}"
      setup_emsdk
      ;;
    "status")
      echo -e "${CYAN}Current project status:${RESET}"
      git status
      ;;
    "fix hooks")
      echo -e "${CYAN}Fixing git hooks...${RESET}"
      fix_git_hooks
      ;;
    "fix deps")
      echo -e "${CYAN}Fixing Node.js dependencies...${RESET}"
      fix_node_dependencies
      ;;
    "restore-hooks")
      echo -e "${CYAN}Restoring git hooks...${RESET}"
      restore_git_hooks
      ;;
    "try-chain")
      echo -e "${CYAN}Demonstrating command chaining with && operator...${RESET}"
      
      # Example with try_command_chain function
      try_command_chain \
        "echo 'Step 1: Creating temporary directory...' && mkdir -p ./temp_demo" \
        "echo 'Step 2: Changing to directory...' && cd ./temp_demo" \
        "echo 'Step 3: Creating test file...' && echo 'This is a test' > test.txt" \
        "echo 'Step 4: Showing file contents...' && cat test.txt"
      
      # Cleanup
      rm -rf ./temp_demo
      
      # Example with direct && usage
      echo -e "\n${CYAN}Direct && operator example:${RESET}"
      echo -e "${YELLOW}mkdir -p ./temp_demo2 && echo 'Created directory' && touch ./temp_demo2/test2.txt && echo 'Created file'${RESET}"
      mkdir -p ./temp_demo2 && echo -e "${GREEN}Created directory${RESET}" && \
      touch ./temp_demo2/test2.txt && echo -e "${GREEN}Created file${RESET}"
      
      # Show what happens when a command fails
      echo -e "\n${CYAN}Example with failing command:${RESET}"
      echo -e "${YELLOW}mkdir -p ./temp_demo2 && cd ./non_existent_dir && echo 'This will not execute'${RESET}"
      mkdir -p ./temp_demo2 && cd ./non_existent_dir 2>/dev/null && echo "This will not execute"
      echo -e "${RED}As expected, the last command didn't execute because a command in the chain failed${RESET}"
      
      # Final cleanup
      rm -rf ./temp_demo2
      ;;
    "and-operator")
      echo -e "${CYAN}About the && operator in bash${RESET}"
      echo -e "The ${GREEN}&&${RESET} operator in bash is used to chain commands."
      echo -e "A command following ${GREEN}&&${RESET} will only run if the previous command succeeds (returns exit code 0)."
      echo ""
      echo -e "Example syntax:"
      echo -e "  ${YELLOW}command1 && command2 && command3${RESET}"
      echo ""
      echo -e "This is equivalent to:"
      echo -e "  ${YELLOW}if command1; then"
      echo -e "    if command2; then"
      echo -e "      command3"
      echo -e "    fi"
      echo -e "  fi${RESET}"
      echo ""
      echo -e "Try the ${GREEN}try-chain${RESET} command to see practical examples."
      ;;
    *)
      if [[ "$task_name" =~ ^safe-commit ]]; then
        local message="${task_name#safe-commit }"
        echo -e "${CYAN}Committing changes safely: ${message}${RESET}"
        safe_commit "$message"
      else
        echo -e "${RED}Unknown command: ${task_name}${RESET}"
        echo -e "${GRAY}Type 'help' to see available commands${RESET}"
        return 1
      fi
      ;;
  esac

  return 0
}

# Function implementations
build_web() {
  local red_x_dir="$WORKSPACE_ROOT/red_x"
  local emsdk_dir="$WORKSPACE_ROOT/emsdk"

  # Use && for command chaining
  if [ -d "$emsdk_dir" ]; then
    # Source the Emscripten environment and build in one chain
    (source "$emsdk_dir/emsdk_env.sh" && \
     cd "$red_x_dir" && \
     make web) && echo -e "${GREEN}✅ Web build completed successfully!${RESET}" || \
    echo -e "${RED}❌ Web build failed.${RESET}"
  else
    echo -e "${RED}emsdk not found. Please run the setup_emsdk task first.${RESET}"
    return 1
  fi
}

build_native() {
  local red_x_dir="$WORKSPACE_ROOT/red_x"
  
  # Use && for command chaining
  (cd "$red_x_dir" && make) && \
  echo -e "${GREEN}✅ Native build completed successfully!${RESET}" || \
  echo -e "${RED}❌ Native build failed.${RESET}"
}

clean_project() {
  local red_x_dir="$WORKSPACE_ROOT/red_x"
  
  # Use && for command chaining
  (cd "$red_x_dir" && make clean) && \
  echo -e "${GREEN}✅ Clean completed successfully!${RESET}" || \
  echo -e "${RED}❌ Clean operation failed.${RESET}"
}

start_server() {
  local red_x_dir="$WORKSPACE_ROOT/red_x"

  # Navigate to the red_x directory and start server
  pushd "$red_x_dir" > /dev/null

  # Start the server in the background
  node server.js &

  # Wait a bit for the server to start
  sleep 2

  # Open browser (OS-dependent)
  if command -v open > /dev/null; then
    # macOS
    open http://localhost:8080
  elif command -v xdg-open > /dev/null; then
    # Linux
    xdg-open http://localhost:8080
  elif command -v wslview > /dev/null; then
    # WSL
    wslview http://localhost:8080
  else
    echo -e "${YELLOW}Server started at http://localhost:8080${RESET}"
    echo -e "${YELLOW}Please open your browser manually${RESET}"
  fi

  # Keep the server running by waiting for the process
  wait %1

  popd > /dev/null
}

deploy_to_github_pages() {
  local deploy_script="$WORKSPACE_ROOT/deploy-gh-pages.sh"

  if [ -f "$deploy_script" ]; then
    bash "$deploy_script"
  else
    echo -e "${RED}deploy-gh-pages.sh not found.${RESET}"
    echo -e "${YELLOW}Attempting to deploy using a general approach...${RESET}"

    # Build the project
    build_web

    # Create or use existing gh-pages branch
    if ! git rev-parse --verify gh-pages > /dev/null 2>&1; then
      git checkout --orphan gh-pages
    else
      git checkout gh-pages
    fi

    # Remove existing files
    git rm -rf . > /dev/null 2>&1 || true

    # Copy build files
    BUILD_DIR="_site"
    if [ ! -d "$BUILD_DIR" ]; then
      # Try to find the build directory
      if [ -d "dist" ]; then
        BUILD_DIR="dist"
      elif [ -d "build" ]; then
        BUILD_DIR="build"
      elif [ -d "public" ]; then
        BUILD_DIR="public"
      else
        echo -e "${RED}Error: Could not find build directory${RESET}"
        return 1
      fi
    fi

    cp -r $BUILD_DIR/* .
    rm -rf $BUILD_DIR

    # Add .nojekyll to bypass Jekyll processing
    touch .nojekyll

    # Commit and push
    git add -A
    git commit -m "Deploy to GitHub Pages" --no-verify
    git push origin gh-pages -f

    # Return to previous branch
    git checkout -
  fi
}

branch_info() {
  local branch_manager="$WORKSPACE_ROOT/branch-manager.cmd"

  if [ -f "$branch_manager" ]; then
    "$branch_manager" info
  else
    echo -e "${YELLOW}branch-manager.cmd not found. Showing branch info using git commands...${RESET}"

    echo "Current branch:"
    git branch --show-current

    echo -e "\nAll branches:"
    git branch -a

    echo -e "\nRemote branches:"
    git branch -r
  fi
}

branch_switch_to_main() {
  local branch_manager="$WORKSPACE_ROOT/branch-manager.cmd"

  if [ -f "$branch_manager" ]; then
    "$branch_manager" switch 001
  else
    echo -e "${YELLOW}branch-manager.cmd not found. Switching to main branch using git...${RESET}"
    git checkout main 2> /dev/null || git checkout master
  fi
}

branch_switch_to_docs() {
  local branch_manager="$WORKSPACE_ROOT/branch-manager.cmd"

  if [ -f "$branch_manager" ]; then
    "$branch_manager" switch temp-check-actions
  else
    echo -e "${YELLOW}branch-manager.cmd not found. Switching to docs branch using git...${RESET}"
    git checkout temp-check-actions
  fi
}

branch_sync() {
  local branch_manager="$WORKSPACE_ROOT/branch-manager.cmd"

  if [ -f "$branch_manager" ]; then
    "$branch_manager" sync
  else
    echo -e "${YELLOW}branch-manager.cmd not found. Syncing branches using git...${RESET}"

    # Store current branch
    local current_branch=$(git branch --show-current)

    # Fetch from remote
    git fetch --all

    # Update main branch
    git checkout main 2> /dev/null || git checkout master
    git pull

    # Try to update other branches
    git checkout temp-check-actions 2> /dev/null && git pull

    # Return to original branch
    git checkout "$current_branch"
  fi
}

setup_emsdk() {
  local emsdk_dir="$WORKSPACE_ROOT/emsdk"

  if [ -d "$emsdk_dir" ]; then
    echo "Updating existing Emscripten SDK..."
    pushd "$emsdk_dir" > /dev/null
    git pull
  else
    echo "Cloning Emscripten SDK repository..."
    git clone https://github.com/emscripten-core/emsdk.git "$emsdk_dir"
    pushd "$emsdk_dir" > /dev/null
  fi

  # Install the latest SDK tools
  echo "Installing the latest SDK tools (this may take several minutes)..."
  ./emsdk install latest

  # Make the latest SDK active
  echo "Activating the latest SDK..."
  ./emsdk activate latest

  # Setup environment variables
  echo "Setting up environment variables..."
  source ./emsdk_env.sh

  # Verify installation
  echo "Verifying the installation..."
  emcc --version

  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Emscripten SDK has been successfully installed and configured!${RESET}"
    echo -e "You can now use 'build web' command to build the web version of your project."
  else
    echo -e "${RED}Failed to run emcc. Please make sure the installation completed successfully.${RESET}"
  fi

  popd > /dev/null
}

fix_git_hooks() {
  # Disable git hooks
  git config --local core.hooksPath /dev/null
  echo -e "${GREEN}Git hooks disabled.${RESET}"

  # Create safe-commit.sh if it doesn't exist
  local safe_commit_path="$WORKSPACE_ROOT/safe-commit.sh"
  if [ ! -f "$safe_commit_path" ]; then
    cat > "$safe_commit_path" << 'EOF'
#!/bin/bash
# Safe commit script that bypasses hooks

if [ $# -eq 0 ]; then
  echo "Usage: ./safe-commit.sh \"Your commit message\""
  exit 1
fi

# Add all changed files
git add .

# Always bypass hooks when committing
git commit --no-verify -m "$1"

echo "Changes committed successfully!"
EOF
    chmod +x "$safe_commit_path"
    echo -e "${GREEN}Created safe-commit.sh script for bypassing hooks.${RESET}"
  fi

  # Create restore-hooks.sh if it doesn't exist
  local restore_hooks_path="$WORKSPACE_ROOT/restore-hooks.sh"
  if [ ! -f "$restore_hooks_path" ]; then
    cat > "$restore_hooks_path" << 'EOF'
#!/bin/bash
# Script to restore git hooks

echo "Restoring git hooks configuration..."
git config --local --unset core.hooksPath
echo "Git hooks restored!"
EOF
    chmod +x "$restore_hooks_path"
    echo -e "${GREEN}Created restore-hooks.sh script for restoring hooks.${RESET}"
  fi
}

fix_node_dependencies() {
  local fix_node_deps="$WORKSPACE_ROOT/fix-node-deps.sh.bak"

  if [ -f "$fix_node_deps" ]; then
    bash "$fix_node_deps"
  else
    echo -e "${YELLOW}fix-node-deps.sh.bak not found. Using direct implementation...${RESET}"

    # Check if package.json exists
    if [ -f "package.json" ]; then
      # Backup package.json
      cp package.json package.json.bak

      # Update chalk to a CommonJS compatible version and remove type:module if present
      sed -i 's/"chalk": "\^[0-9.]*"/"chalk": "^4.1.2"/' package.json
      sed -i '/"type": "module"/d' package.json

      # Remove node_modules to force clean install
      rm -rf node_modules
      rm -f package-lock.json

      echo "Node.js package configuration updated"
      echo "Installing dependencies..."
      npm install --silent || { echo "Error: npm install failed"; exit 1; }
    else
      echo -e "${RED}No package.json found.${RESET}"
    fi
  fi
}

safe_commit() {
  local message="$1"
  
  if [ -z "$message" ]; then
    echo -e "${RED}Error: Commit message is required.${RESET}"
    return 1
  fi
  
  # Use && for command chaining
  git add . && \
  git commit --no-verify -m "$message" && \
  echo -e "${GREEN}Changes committed successfully!${RESET}" || \
  echo -e "${RED}Commit failed with exit code: $?${RESET}"
}

restore_git_hooks() {
  git config --local --unset core.hooksPath
  echo -e "${GREEN}Git hooks restored!${RESET}"
}

# Main function
main() {
  # Show header unless --no-logo is specified
  if [ "$NO_LOGO" != "true" ]; then
    clear
    show_header
  fi

  # If --command was specified, run it and exit
  if [ -n "$COMMAND" ]; then
    if [ ${#COMMAND_ARGS[@]} -gt 0 ]; then
      run_task "$COMMAND ${COMMAND_ARGS[*]}"
    else
      run_task "$COMMAND"
    fi
    return
  fi

  # Interactive loop
  while true; do
    echo -ne "${GREEN}sxs>${RESET} "
    read -r command

    # Skip empty commands
    if [ -z "$command" ]; then
      continue
    fi

    case "$command" in
      "exit")
        echo -e "${YELLOW}Exiting SXS CLI. Goodbye!${RESET}"
        break
        ;;
      "clear")
        clear
        show_header
        ;;
      "help")
        show_help
        ;;
      *)
        run_task "$command"
        ;;
    esac

    echo "" # Add blank line after each command
  done
}

# Start the CLI
main

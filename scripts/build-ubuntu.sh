#!/bin/bash
# build-ubuntu.sh
# Script to build Red X for Ubuntu
# Created: April 28, 2025

# Error handling
set -e

# Define color codes for console output
COLOR_INFO="\033[0;36m"    # Cyan
COLOR_SUCCESS="\033[0;32m" # Green
COLOR_WARNING="\033[0;33m" # Yellow
COLOR_ERROR="\033[0;31m"   # Red
COLOR_RESET="\033[0m"      # Reset color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Functions
function write_status_message() {
    local message="$1"
    local color="$2"
    echo -e "${color}${message}${COLOR_RESET}"
}

function check_dependencies() {
    write_status_message "Checking build dependencies..." "$COLOR_INFO"

    # Check for GCC
    if ! command -v gcc &> /dev/null; then
        write_status_message "GCC not found. Please install build-essential package." "$COLOR_ERROR"
        write_status_message "Run: sudo apt-get install build-essential" "$COLOR_INFO"
        return 1
    fi

    # Check for SDL2
    if ! pkg-config --exists sdl2; then
        write_status_message "SDL2 development libraries not found." "$COLOR_ERROR"
        write_status_message "Run: sudo apt-get install libsdl2-dev" "$COLOR_INFO"
        return 1
    fi

    # Check for make
    if ! command -v make &> /dev/null; then
        write_status_message "Make not found. Please install make package." "$COLOR_ERROR"
        write_status_message "Run: sudo apt-get install make" "$COLOR_INFO"
        return 1
    fi

    write_status_message "All dependencies satisfied!" "$COLOR_SUCCESS"
    return 0
}

function build_native_ubuntu() {
    write_status_message "Building native version for Ubuntu..." "$COLOR_INFO"

    pushd "$SCRIPT_DIR" > /dev/null

    # Try to build with native make
    make
    local build_result=$?

    if [[ $build_result -ne 0 ]]; then
        # Try a direct gcc build as fallback
        write_status_message "Make failed, trying direct gcc build..." "$COLOR_WARNING"
        gcc -o red_x main.c font_atlas.c -lSDL2 -lm
        build_result=$?
    fi

    # Check for native executable
    local native_build_success=false
    if [[ -f "${SCRIPT_DIR}/red_x" ]]; then
        # Make it executable
        chmod +x "${SCRIPT_DIR}/red_x"
        native_build_success=true
    fi

    if [[ "$native_build_success" == "true" ]]; then
        write_status_message "Native Ubuntu build completed successfully!" "$COLOR_SUCCESS"
        write_status_message "You can run the executable with: ./red_x" "$COLOR_INFO"
    else
        write_status_message "Native Ubuntu build failed - executable not found." "$COLOR_ERROR"
    fi

    popd > /dev/null
    return $([[ "$native_build_success" == "true" ]] && echo 0 || echo 1)
}

# Main script execution
write_status_message "RED X Ubuntu Build Script" "$COLOR_INFO"
write_status_message "======================" "$COLOR_INFO"

# Check dependencies
if ! check_dependencies; then
    write_status_message "Please install the required dependencies and try again." "$COLOR_ERROR"
    exit 1
fi

# Build native version
if ! build_native_ubuntu; then
    write_status_message "Build process failed." "$COLOR_ERROR"
    exit 1
fi

write_status_message "RED X Ubuntu build process completed successfully!" "$COLOR_SUCCESS"
exit 0

#!/bin/bash
# deploy-to-ubuntu.sh
# Script to deploy and test Red X on an Ubuntu system
# Created: April 28, 2025

# Error handling
set -e

# Define color codes for console output
COLOR_INFO="\033[0;36m"    # Cyan
COLOR_SUCCESS="\033[0;32m" # Green
COLOR_WARNING="\033[0;33m" # Yellow
COLOR_ERROR="\033[0;31m"   # Red
COLOR_RESET="\033[0m"      # Reset color

# Default parameters
REMOTE_HOST=""
REMOTE_USER="ubuntu"
REMOTE_PATH="/home/ubuntu/red_x"
SSH_KEY=""
PORT=22

# Functions
function write_status_message() {
    local message="$1"
    local color="$2"
    echo -e "${color}${message}${COLOR_RESET}"
}

function show_usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  --host, -h HOSTNAME       Remote host to deploy to (required)"
    echo "  --user, -u USERNAME       Remote username (default: ubuntu)"
    echo "  --path, -p PATH           Remote path for deployment (default: /home/ubuntu/red_x)"
    echo "  --key, -k KEY_FILE        SSH private key file (required if not using ssh-agent)"
    echo "  --port PORT               SSH port (default: 22)"
    echo "  --help                    Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 --host 192.168.1.100 --key ~/.ssh/id_rsa"
}

# Parse command line options
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        --host|-h)
            REMOTE_HOST="$2"
            shift 2
            ;;
        --user|-u)
            REMOTE_USER="$2"
            shift 2
            ;;
        --path|-p)
            REMOTE_PATH="$2"
            shift 2
            ;;
        --key|-k)
            SSH_KEY="$2"
            shift 2
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $key"
            show_usage
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$REMOTE_HOST" ]]; then
    write_status_message "Error: Remote host is required" "$COLOR_ERROR"
    show_usage
    exit 1
fi

# Build SSH command based on provided options
SSH_CMD="ssh"
if [[ -n "$SSH_KEY" ]]; then
    SSH_CMD+=" -i $SSH_KEY"
fi
SSH_CMD+=" -p $PORT $REMOTE_USER@$REMOTE_HOST"

# SCP command for file transfer
SCP_CMD="scp"
if [[ -n "$SSH_KEY" ]]; then
    SCP_CMD+=" -i $SSH_KEY"
fi
SCP_CMD+=" -P $PORT"

# Build Red X for Ubuntu
write_status_message "Building Red X for Ubuntu..." "$COLOR_INFO"
./build-ubuntu.sh
if [[ $? -ne 0 ]]; then
    write_status_message "Build failed. Cannot continue with deployment." "$COLOR_ERROR"
    exit 1
fi

write_status_message "Testing connection to remote host..." "$COLOR_INFO"
$SSH_CMD "echo 'Connection successful'" || {
    write_status_message "Failed to connect to remote host. Check your SSH settings." "$COLOR_ERROR"
    exit 1
}

# Create remote directory if it doesn't exist
write_status_message "Creating remote directory..." "$COLOR_INFO"
$SSH_CMD "mkdir -p $REMOTE_PATH"

# Copy executable and necessary files
write_status_message "Copying Red X files to remote host..." "$COLOR_INFO"
$SCP_CMD red_x $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/
$SCP_CMD font_atlas.* $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH/

# Set executable permissions and run test
write_status_message "Setting up executable permissions..." "$COLOR_INFO"
$SSH_CMD "chmod +x $REMOTE_PATH/red_x"

# Check remote host for SDL2 installation
write_status_message "Checking remote host for SDL2..." "$COLOR_INFO"
$SSH_CMD "if ! command -v sdl2-config &> /dev/null; then echo 'SDL2 not found, attempting to install...'; sudo apt-get update && sudo apt-get install -y libsdl2-dev; fi"

# Run the executable
write_status_message "Testing Red X on remote host..." "$COLOR_INFO"
$SSH_CMD "cd $REMOTE_PATH && ./red_x --headless-test" || {
    write_status_message "Test run failed. Check if SDL2 is properly installed on the remote host." "$COLOR_ERROR"
    write_status_message "You can try installing SDL2 manually with: sudo apt-get install libsdl2-dev" "$COLOR_INFO"
    exit 1
}

write_status_message "Deployment successful!" "$COLOR_SUCCESS"
write_status_message "Red X is installed at $REMOTE_PATH on the remote host" "$COLOR_INFO"
write_status_message "You can run it with: $SSH_CMD \"cd $REMOTE_PATH && ./red_x\"" "$COLOR_INFO"

exit 0

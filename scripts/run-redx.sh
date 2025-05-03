#!/bin/bash
# run-redx.sh
# Bash script to run Project RED X in various modes with complete native functionality
# Created: April 26, 2025

# Error handling
set -e

# Default parameters
MODE="web"
NO_WINDOW=false
PORT=8080
VERBOSE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        --mode|-m)
            MODE="$2"
            shift 2
            ;;
        --no-window|-n)
            NO_WINDOW=true
            shift
            ;;
        --port|-p)
            PORT="$2"
            shift 2
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
            echo "Usage: run-redx.sh [options]"
            echo "Options:"
            echo "  --mode, -m      Select mode: web, native, server, dev, afk (default: web)"
            echo "  --no-window, -n Don't open a new terminal window for the server (default: false)"
            echo "  --port, -p      Set server port (default: 8080)"
            echo "  --verbose, -v   Enable verbose output (default: false)"
            echo "  --help, -h      Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $key"
            exit 1
            ;;
    esac
done

# Define color codes for console output
COLOR_INFO="\033[0;36m"    # Cyan
COLOR_SUCCESS="\033[0;32m" # Green
COLOR_WARNING="\033[0;33m" # Yellow
COLOR_ERROR="\033[0;31m"   # Red
COLOR_RESET="\033[0m"      # Reset color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Functions
function write_status_message() {
    local message="$1"
    local color="$2"
    local no_newline="$3"

    if [[ "$VERBOSE" == "true" || "$color" == "$COLOR_ERROR" || "$color" == "$COLOR_WARNING" ]]; then
        if [[ "$no_newline" == "true" ]]; then
            echo -ne "${color}${message}${COLOR_RESET}"
        else
            echo -e "${color}${message}${COLOR_RESET}"
        fi
    fi
}

function test_emscripten_setup() {
    local emsdk_dir="${PROJECT_DIR}/emsdk"

    if [[ ! -d "$emsdk_dir" ]]; then
        write_status_message "Emscripten SDK not found. Setting it up now..." "$COLOR_WARNING"

        if [[ -f "${PROJECT_DIR}/setup-emsdk.sh" ]]; then
            bash "${PROJECT_DIR}/setup-emsdk.sh"
        else
            # Fallback to directly installing emsdk if the setup script doesn't exist
            cd "$PROJECT_DIR"
            git clone https://github.com/emscripten-core/emsdk.git
            cd emsdk
            ./emsdk install latest
            ./emsdk activate latest
        fi

        if [[ $? -ne 0 ]]; then
            write_status_message "Failed to set up Emscripten SDK." "$COLOR_ERROR"
            return 1
        fi
    fi

    return 0
}

function build_web_version() {
    write_status_message "Building web version..." "$COLOR_INFO"

    # Activate Emscripten environment
    local emsdk_dir="${PROJECT_DIR}/emsdk"
    source "${emsdk_dir}/emsdk_env.sh" > /dev/null

    # Change to red_x directory and run make web
    pushd "$SCRIPT_DIR" > /dev/null
    local make_result=0

    # Try using native make command first
    make web 2>&1 || make_result=$?

    if [[ $make_result -ne 0 ]]; then
        write_status_message "Attempting with emcmake..." "$COLOR_WARNING"

        # First ensure we have a template.html
        if [[ ! -f "template.html" ]]; then
            if [[ -f "index.html" ]]; then
                cp "index.html" "template.html"
                # Remove any server-dependent references
                sed -i 's|/api/version|#|g' "template.html"
                sed -i 's|/socket.io/socket.io.js|https://cdn.socket.io/4.5.0/socket.io.min.js|g' "template.html"
            else
                write_status_message "No template.html or index.html found for building." "$COLOR_ERROR"
                popd > /dev/null
                return 1
            fi
        fi

        # Use emcc directly for building
        emcc main.c -o index.html -s USE_SDL=2 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 \
            --shell-file template.html -s NO_EXIT_RUNTIME=1 -s "EXPORTED_RUNTIME_METHODS=cwrap" \
            -s ENVIRONMENT=web -s MODULARIZE=1 -s "EXPORT_NAME=RedXModule"

        make_result=$?
        if [[ $make_result -ne 0 ]]; then
            write_status_message "Build failed with emcc." "$COLOR_ERROR"
            popd > /dev/null
            return 1
        fi
    fi

    # Verify build artifacts exist
    local build_success=false
    if [[ -f "${SCRIPT_DIR}/index.html" && -f "${SCRIPT_DIR}/index.js" && -f "${SCRIPT_DIR}/index.wasm" ]]; then
        build_success=true
    fi

    if [[ "$build_success" == "true" ]]; then
        write_status_message "Web build completed successfully!" "$COLOR_SUCCESS"
    else
        write_status_message "Web build failed - artifacts not found." "$COLOR_ERROR"
    fi

    popd > /dev/null
    return $([[ "$build_success" == "true" ]] && echo 0 || echo 1)
}

function build_native_version() {
    write_status_message "Building native version..." "$COLOR_INFO"

    pushd "$SCRIPT_DIR" > /dev/null

    # Try to build with native make
    make
    local build_result=$?

    if [[ $build_result -ne 0 ]]; then
        # Try a direct gcc build as fallback
        write_status_message "Make failed, trying direct gcc build..." "$COLOR_WARNING"
        gcc -o red_x main.c -lSDL2 -lm
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
        write_status_message "Native build completed successfully!" "$COLOR_SUCCESS"
    else
        write_status_message "Native build failed - executable not found." "$COLOR_ERROR"
    fi

    popd > /dev/null
    return $([[ "$native_build_success" == "true" ]] && echo 0 || echo 1)
}

function start_web_server() {
    local port="${1:-8080}"
    local mode="${2:-normal}"

    write_status_message "Starting web server on port $port..." "$COLOR_INFO"

    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        write_status_message "Node.js not found. Please install Node.js to run the web server." "$COLOR_ERROR"
        return 1
    fi

    # Check if server.js exists
    if [[ ! -f "${SCRIPT_DIR}/server.js" ]]; then
        write_status_message "server.js not found." "$COLOR_ERROR"
        return 1
    fi

    # Configure AFK mode if requested
    if [[ "$mode" == "afk" ]]; then
        export RED_X_MODE="afk"
        export RED_X_TITLE="AFK Downloader Hub"
        export RED_X_STARTUP_PAGE="afk-downloader.html"
    else
        export RED_X_MODE="normal"
        export RED_X_TITLE="Project RED X"
        export RED_X_STARTUP_PAGE="index.html"
    fi

    # Set port environment variable
    export PORT="$port"

    # Start web server
    pushd "$SCRIPT_DIR" > /dev/null

    if [[ "$NO_WINDOW" == "true" ]]; then
        # Start without opening a new terminal window
        node server.js &
        SERVER_PID=$!
    else
        # Start in new window - choose the right terminal based on environment
        if [[ "$TERM_PROGRAM" == "Apple_Terminal" ]]; then
            # macOS Terminal
            osascript -e "tell application \"Terminal\" to do script \"cd '$SCRIPT_DIR' && node server.js\""
        elif [[ -n "$GNOME_TERMINAL_SERVICE" ]]; then
            # GNOME Terminal
            gnome-terminal -- bash -c "cd '$SCRIPT_DIR' && node server.js; read -p 'Press Enter to exit'"
        elif [[ -n "$KONSOLE_DBUS_SERVICE" ]]; then
            # KDE Konsole
            konsole -e bash -c "cd '$SCRIPT_DIR' && node server.js; read -p 'Press Enter to exit'"
        elif command -v xterm &> /dev/null; then
            # xterm as fallback
            xterm -e "cd '$SCRIPT_DIR' && node server.js; read -p 'Press Enter to exit'" &
        else
            # Last resort - run in current terminal
            write_status_message "Could not detect terminal type. Running in current window." "$COLOR_WARNING"
            node server.js &
            SERVER_PID=$!
        fi
    fi

    popd > /dev/null

    # Wait a bit for server to start
    sleep 2

    # Launch browser
    local url="http://localhost:${port}/${RED_X_STARTUP_PAGE}"
    write_status_message "Opening browser at $url" "$COLOR_SUCCESS"

    # Open URL in browser based on platform
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "$url"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v xdg-open &> /dev/null; then
            xdg-open "$url"
        elif command -v gnome-open &> /dev/null; then
            gnome-open "$url"
        elif command -v firefox &> /dev/null; then
            firefox "$url" &
        elif command -v chromium &> /dev/null; then
            chromium "$url" &
        elif command -v google-chrome &> /dev/null; then
            google-chrome "$url" &
        else
            write_status_message "Could not open browser automatically. Please navigate to $url" "$COLOR_WARNING"
        fi
    fi

    if [[ "$NO_WINDOW" == "false" ]]; then
        return 0
    else
        # Return the process ID for later termination
        echo "$SERVER_PID"
    fi
}

function run_native_executable() {
    write_status_message "Running native executable..." "$COLOR_INFO"

    # Check if native executable exists
    local native_exe=""
    if [[ -f "${SCRIPT_DIR}/red_x" ]]; then
        native_exe="${SCRIPT_DIR}/red_x"
    else
        write_status_message "Native executable not found." "$COLOR_ERROR"
        return 1
    fi

    # Make sure it's executable
    chmod +x "$native_exe"

    # Execute the native program
    "$native_exe"
    local exit_code=$?

    if [[ $exit_code -ne 0 ]]; then
        write_status_message "Native execution failed with exit code $exit_code." "$COLOR_ERROR"
        return 1
    fi

    return 0
}

function start_dev_environment() {
    write_status_message "Starting development environment..." "$COLOR_INFO"

    # Check if npx/nodemon is available
    if ! command -v npx &> /dev/null; then
        write_status_message "NPX not found. Installing nodemon locally..." "$COLOR_WARNING"
        pushd "$SCRIPT_DIR" > /dev/null
        npm install --save-dev nodemon
        popd > /dev/null
    fi

    # Create nodemon config if it doesn't exist
    local nodemon_config="${SCRIPT_DIR}/nodemon.json"
    if [[ ! -f "$nodemon_config" ]]; then
        cat > "$nodemon_config" << EOF
{
  "watch": ["*.js", "*.html", "*.css"],
  "ext": "js,html,css",
  "ignore": ["*.wasm", "node_modules/*"],
  "delay": "1000"
}
EOF
    fi

    # Start nodemon for hot reloading
    pushd "$SCRIPT_DIR" > /dev/null
    npx nodemon server.js &
    local process_id=$!
    popd > /dev/null

    # Return the process ID
    echo "$process_id"
}

function run_afk_downloading_hub() {
    write_status_message "Starting AFK Downloading Hub..." "$COLOR_INFO"

    # Start the server with the AFK mode
    start_web_server "$PORT" "afk"
}

# Main execution
write_status_message "Project RED X Runner" "$COLOR_INFO"
write_status_message "=====================" "$COLOR_INFO"
write_status_message "Mode: $MODE" "$COLOR_INFO"
write_status_message "Port: $PORT" "$COLOR_INFO"
write_status_message "NoWindow: $NO_WINDOW" "$COLOR_INFO"
write_status_message "Verbose: $VERBOSE" "$COLOR_INFO"
write_status_message "" "$COLOR_INFO"

# Main logic based on mode
case "$MODE" in
    "web")
        if [[ ! -f "${SCRIPT_DIR}/index.html" || ! -f "${SCRIPT_DIR}/index.js" || ! -f "${SCRIPT_DIR}/index.wasm" ]]; then
            write_status_message "Web version not found or incomplete. Building..." "$COLOR_WARNING"
            if test_emscripten_setup; then
                if ! build_web_version; then
                    write_status_message "Failed to build web version." "$COLOR_ERROR"
                    exit 1
                fi
            else
                write_status_message "Emscripten setup failed." "$COLOR_ERROR"
                exit 1
            fi
        fi

        start_web_server "$PORT" "normal"
        ;;

    "native")
        if [[ ! -f "${SCRIPT_DIR}/red_x" ]]; then
            write_status_message "Native version not found. Building..." "$COLOR_WARNING"
            if ! build_native_version; then
                write_status_message "Native build failed. Falling back to web version." "$COLOR_WARNING"
                MODE="web"
                if test_emscripten_setup; then
                    build_web_version > /dev/null
                fi
                start_web_server "$PORT" "normal"
                exit 0
            fi
        fi

        run_native_executable
        ;;

    "server")
        start_web_server "$PORT" "normal"
        ;;

    "dev")
        start_dev_environment
        ;;

    "afk")
        run_afk_downloading_hub
        ;;

    *)
        write_status_message "Invalid mode: $MODE. Valid options are: web, native, server, dev, afk" "$COLOR_ERROR"
        exit 1
        ;;
esac

write_status_message "Project RED X successfully launched in $MODE mode." "$COLOR_SUCCESS"
exit 0

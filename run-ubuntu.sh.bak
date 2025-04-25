#!/bin/bash

# Script to run commands in Ubuntu Docker container

# Ensure Docker is running and the container exists
ensure_container() {
  # Check if the container is already running
  if docker-compose ps | grep -q "ubuntu-dev.*Up"; then
    echo "Docker container is already running."
  else
    echo "Starting Docker container..."
    docker-compose up -d
    echo "Docker container started."
  fi
}

# Command to build the red_x web version
build_web() {
  echo "Building web version in Ubuntu environment..."
  docker-compose exec ubuntu-dev bash -c "cd /app/red_x && make web"
  echo "Build completed."
}

# Command to build the red_x native version
build_native() {
  echo "Building native version in Ubuntu environment..."
  docker-compose exec ubuntu-dev bash -c "cd /app/red_x && make"
  echo "Build completed."
}

# Command to start the server
start_server() {
  echo "Starting server in Ubuntu environment..."
  docker-compose exec -d ubuntu-dev bash -c "cd /app/red_x && node server.js"
  echo "Server started at http://localhost:8080"
}

# Command to clean the project
clean() {
  echo "Cleaning project in Ubuntu environment..."
  docker-compose exec ubuntu-dev bash -c "cd /app/red_x && make clean"
  echo "Clean completed."
}

# Command to open a shell in the container
shell() {
  echo "Opening shell in Ubuntu environment..."
  docker-compose exec ubuntu-dev bash
}

# Command to stop the Docker container
stop() {
  echo "Stopping Docker container..."
  docker-compose down
  echo "Docker container stopped."
}

# Help message
show_help() {
  echo "Usage: ./run-ubuntu.sh [command]"
  echo "Commands:"
  echo "  build-web    - Build the web version of the project"
  echo "  build-native - Build the native version of the project"
  echo "  start-server - Start the web server"
  echo "  clean        - Clean the project build files"
  echo "  shell        - Open a shell in the Ubuntu environment"
  echo "  stop         - Stop the Docker container"
  echo "  help         - Show this help message"
  echo ""
}

# Main script execution
ensure_container

# Parse command line arguments
if [ $# -eq 0 ]; then
  show_help
else
  case $1 in
    build-web)
      build_web
      ;;
    build-native)
      build_native
      ;;
    start-server)
      start_server
      ;;
    clean)
      clean
      ;;
    shell)
      shell
      ;;
    stop)
      stop
      ;;
    help|--help|-h)
      show_help
      ;;
    *)
      echo "Unknown command: $1"
      show_help
      exit 1
      ;;
  esac
fi

exit 0

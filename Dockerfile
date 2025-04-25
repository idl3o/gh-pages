FROM ubuntu:22.04

# Avoid prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    make \
    nodejs \
    npm \
    git \
    curl \
    wget \
    python3 \
    python3-pip \
    libsdl2-dev \
    emscripten \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN useradd -ms /bin/bash developer

# Set the working directory
WORKDIR /app

# Copy the project files into the container
COPY . /app

# Give permissions to the developer user
RUN chown -R developer:developer /app

# Switch to the developer user
USER developer

# Set up node environment
RUN npm install

# Expose the default port for the web server
EXPOSE 8080

# Default command to run when the container starts
CMD ["/bin/bash"]

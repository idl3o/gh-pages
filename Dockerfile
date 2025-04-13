FROM node:18-slim

# Set working directory
WORKDIR /app

# Install dependencies needed for IPFS
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    curl \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install IPFS
RUN wget https://dist.ipfs.io/go-ipfs/v0.17.0/go-ipfs_v0.17.0_linux-amd64.tar.gz && \
    tar -xvzf go-ipfs_v0.17.0_linux-amd64.tar.gz && \
    cd go-ipfs && \
    ./install.sh && \
    cd .. && \
    rm -rf go-ipfs*

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy app source code
COPY . .

# Expose ports for the application, IPFS API and gateway
EXPOSE 3000 4001 5001 8080

# Initialize IPFS with default settings
RUN mkdir -p /data/ipfs && \
    ipfs init --profile=server

# Create startup script
RUN echo '#!/bin/bash\n\
# Start IPFS daemon in the background\n\
ipfs daemon --enable-pubsub-experiment &\n\
IPFS_PID=$!\n\
\n\
# Give IPFS time to start up\n\
sleep 5\n\
\n\
# Start the application\n\
node red_x/server.js\n\
\n\
# If the application process exits, kill IPFS daemon\n\
kill $IPFS_PID\n\
' > /app/start.sh && chmod +x /app/start.sh

# Run the startup script with bash explicitly
CMD ["/bin/bash", "/app/start.sh"]
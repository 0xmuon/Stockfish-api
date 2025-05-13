FROM node:18

# Install Stockfish and required dependencies
RUN apt-get update && \
    apt-get install -y stockfish && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy files and install dependencies
COPY . .
RUN npm install

# Make sure Stockfish is executable
RUN chmod +x /usr/games/stockfish

# Expose the port
EXPOSE 5000

# Run the server
CMD ["node", "server.js"] 
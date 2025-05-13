FROM node:18

# Install Stockfish
RUN apt update && apt install -y stockfish

# Create app directory
WORKDIR /app

# Copy files and install dependencies
COPY . .
RUN npm install

# Expose the port
EXPOSE 5000

CMD ["node", "server.js"] 
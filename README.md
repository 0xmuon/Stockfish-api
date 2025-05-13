# Stockfish Chess API

A simple Express API that uses Stockfish chess engine to calculate the best move for a given position.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run locally:
```bash
npm start
```

## API Usage

### Get Best Move

```bash
curl -X POST http://localhost:5000/api/bestmove \
  -H "Content-Type: application/json" \
  -d '{"moves": ["e2e4", "e7e5"]}'
```

Response:
```json
{
  "bestMove": "g1f3"
}
```

## Docker

Build and run with Docker:

```bash
docker build -t stockfish-api .
docker run -p 5000:5000 stockfish-api
```

## Deployment

This API is configured for deployment on Render.com:

1. Push to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Select Docker as the environment
5. Deploy!

Note: The free tier of Render will sleep after 15 minutes of inactivity. 
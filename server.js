const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json());

// Add health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Stockfish API is running" });
});

// Add info endpoint
app.get("/info", (req, res) => {
  res.json({
    version: "Stockfish 15.1",
    cores: 1,
    status: "ok"
  });
});

// Add evaluate position endpoint
app.post("/evaluate", (req, res) => {
  const { fen, timeLimit = 1000 } = req.body;
  
  if (!fen) {
    return res.status(400).json({ error: "FEN position is required" });
  }

  const stockfish = spawn("/usr/games/stockfish");
  let output = "";
  let isGameOver = false;
  let winner = null;
  let reason = "";
  let bestMove = null;

  stockfish.on('error', (error) => {
    console.error('Failed to start Stockfish:', error);
    res.status(500).json({ error: 'Failed to start Stockfish engine' });
  });

  stockfish.stdout.on("data", (data) => {
    output += data.toString();
    
    // Check for checkmate
    if (output.includes("mate 0")) {
      isGameOver = true;
      winner = fen.includes("w") ? 2 : 1; // If white's turn, black won
      reason = "Checkmate";
    }
    // Check for stalemate
    else if (output.includes("bestmove (none)")) {
      isGameOver = true;
      winner = 0;
      reason = "Stalemate";
    }
    // Get best move
    else if (output.includes("bestmove")) {
      bestMove = output.match(/bestmove (\w+)/)?.[1] || null;
    }
  });

  // Add timeout
  const timeout = setTimeout(() => {
    stockfish.kill();
    res.status(500).json({ error: 'Stockfish engine timed out' });
  }, timeLimit);

  stockfish.stdin.write("uci\n");
  stockfish.stdin.write("isready\n");
  stockfish.stdin.write(`position fen ${fen}\n`);
  stockfish.stdin.write(`go depth 20 movetime ${timeLimit}\n`);

  // Clear timeout if we get a response
  stockfish.on('close', () => {
    clearTimeout(timeout);
    res.json({
      isGameOver,
      winner: winner !== null ? winner : undefined,
      reason,
      bestMove
    });
  });
});

// Add update position endpoint
app.post("/update-position", (req, res) => {
  const { fen, move } = req.body;
  
  if (!fen || !move) {
    return res.status(400).json({ error: "FEN position and move are required" });
  }

  const stockfish = spawn("/usr/games/stockfish");
  let output = "";
  let newFen = fen;

  stockfish.on('error', (error) => {
    console.error('Failed to start Stockfish:', error);
    res.status(500).json({ error: 'Failed to start Stockfish engine' });
  });

  stockfish.stdout.on("data", (data) => {
    output += data.toString();
  });

  // Add timeout
  const timeout = setTimeout(() => {
    stockfish.kill();
    res.status(500).json({ error: 'Stockfish engine timed out' });
  }, 5000);

  stockfish.stdin.write("uci\n");
  stockfish.stdin.write("isready\n");
  stockfish.stdin.write(`position fen ${fen} moves ${move}\n`);
  stockfish.stdin.write("d\n"); // Display current position

  // Clear timeout if we get a response
  stockfish.on('close', () => {
    clearTimeout(timeout);
    // Extract new FEN from output
    const fenMatch = output.match(/Fen: ([^\n]+)/);
    if (fenMatch) {
      newFen = fenMatch[1];
    }
    res.json({ newFen });
  });
});

// Keep the existing bestmove endpoint
app.post("/api/bestmove", (req, res) => {
  const moves = req.body.moves || [];

  const stockfish = spawn("/usr/games/stockfish");
  let output = "";

  stockfish.on('error', (error) => {
    console.error('Failed to start Stockfish:', error);
    res.status(500).json({ error: 'Failed to start Stockfish engine' });
  });

  stockfish.stdout.on("data", (data) => {
    output += data.toString();
    if (output.includes("bestmove")) {
      const bestMove = output.match(/bestmove (\w+)/)?.[1] || "none";
      res.json({ bestMove });
      stockfish.kill();
    }
  });

  // Add timeout
  const timeout = setTimeout(() => {
    stockfish.kill();
    res.status(500).json({ error: 'Stockfish engine timed out' });
  }, 10000);

  stockfish.stdin.write("uci\n");
  stockfish.stdin.write("isready\n");
  stockfish.stdin.write(`position startpos moves ${moves.join(" ")}\n`);
  stockfish.stdin.write("go depth 10\n");

  // Clear timeout if we get a response
  stockfish.on('close', () => {
    clearTimeout(timeout);
  });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
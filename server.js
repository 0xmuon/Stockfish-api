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

app.post("/api/bestmove", (req, res) => {
  const moves = req.body.moves || [];

  // Use full path to Stockfish
  const stockfish = spawn("/usr/games/stockfish");
  let output = "";

  // Add error handling
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
const express = require("express");
const cors = require("cors");
const { spawn } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/bestmove", (req, res) => {
  const moves = req.body.moves || [];

  const stockfish = spawn("stockfish");
  let output = "";

  stockfish.stdout.on("data", (data) => {
    output += data.toString();
    if (output.includes("bestmove")) {
      const bestMove = output.match(/bestmove (\w+)/)?.[1] || "none";
      res.json({ bestMove });
      stockfish.kill();
    }
  });

  stockfish.stdin.write("uci\n");
  stockfish.stdin.write("isready\n");
  stockfish.stdin.write(`position startpos moves ${moves.join(" ")}\n`);
  stockfish.stdin.write("go depth 10\n");
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`)); 
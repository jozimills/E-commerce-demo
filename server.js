const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

// Enable CORS and JSON parsing
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the public directory
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

// Test route
app.get("/", (req, res) => {
  res.send("Ace Gaming Equipment Backend is Running!");
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🛒 Server running at http://localhost:${PORT}`);
});

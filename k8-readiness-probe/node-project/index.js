const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
const users = [];

app.get("/", (req, res) => {
  res.json({
    message: "OK"
  });
});

app.get("/node/health", (req, res) => {
  res.json({
    message: "health OK"
  });
});

// GET endpoint to fetch all users
app.get("/node/users", (req, res) => {
  res.json({
    message: "users fetched successfully",
    data: users,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

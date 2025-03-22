const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
const users = [];

// GET endpoint to fetch all users
app.get("/api/users", (req, res) => {
  res.json({
    message: "users fetched successfully",
    data: users,
  });
});

// POST endpoint to create a new user
app.post("/api/users", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "username and password are required" });
  }

  // Check if username already exists
  if (users.some((user) => user.username === username)) {
    return res.status(400).json({ error: "Username already exists" });
  }

  const newUser = {
    id: users.length + 1,
    username,
    password,
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

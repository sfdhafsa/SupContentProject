
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const users = require("../models/user.model");

const register = async (req, res) => {
  const { email, password } = req.body;
  
  // Vérifier si l’utilisateur existe déjà
  const existingUser = users.find(u => u.email === email);
  if (existingUser) return res.status(400).json({ message: "User already exists" });

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = { email, password: hashedPassword };
  users.push(user);

  res.status(201).json({ message: "User registered successfully" });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  // Générer le JWT
  const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

  res.json({ token });
};

module.exports = { register, login };
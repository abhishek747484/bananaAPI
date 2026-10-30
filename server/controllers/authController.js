const bcrypt = require("bcryptjs");
const User = require("../models/User");

function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email
  };
}

async function register(req, res) {
  try {
    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (username.length < 3 || username.length > 24) {
      return res.status(400).json({ message: "Username must be 3–24 characters." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, passwordHash });

    req.session.user = publicUser(user);
    req.session.game = null;

    return res.status(201).json({
      message: "Account created successfully.",
      user: publicUser(user)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "That email is already registered." });
    }
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Could not create your account." });
  }
}

async function login(req, res) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Email or password is incorrect." });
    }

    req.session.regenerate((error) => {
      if (error) {
        console.error("Session regeneration error:", error);
        return res.status(500).json({ message: "Could not start your session." });
      }

      req.session.user = publicUser(user);
      req.session.game = null;
      return res.json({
        message: "Welcome back.",
        user: publicUser(user)
      });
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Could not log in." });
  }
}

function me(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Not logged in." });
  }
  return res.json({ user: req.session.user });
}

function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ message: "Could not log out." });
    }

    res.clearCookie("bmq.sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
    return res.json({ message: "You have been logged out." });
  });
}

module.exports = { register, login, me, logout };

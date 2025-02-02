const express = require("express");
const jwt = require("jsonwebtoken");
const { body } = require("express-validator");

const User = require("../../models/User");
const Parent = require("../../models/parent");

const validateRequest = require("../../middleware/validateRequest");
const { BadRequestError } = require("../../errors");

const router = express.Router();

const validators = [
  body("username").not().isEmpty().withMessage("Username is required"),
  body("password")
    .trim()
    .isLength({ min: 4, max: 20 })
    .withMessage("Password must be between 4 and 20 characters"),
  body("Pname").not().isEmpty().withMessage("Parent name is required"),
  body("email").isEmail().withMessage("Email must be valid"),
];

router.post("/signup", validators, validateRequest, async (req, res, next) => {
  const { username, password, Pname, email } = req.body;

  // Check for existing user
  const existingUser = await User.findOne({ username });

  if (existingUser) return next(BadRequestError("Username is taken"));

  // Create a user
  const user = await User.create({ username, password });

  // Create a parent associated with the user
  const parent = new Parent({
    Pname,
    email,
    user: user._id,
    role: "parent",
  });
  await parent.save();

  // Update the user with the parent reference
  user.parent = parent._id;
  await user.save();

  // Generate a token
  const token = jwt.sign(
    { id: user.id, username: user.username, role: "parent" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION }
  );

  // Respond with the token
  res.status(201).json({ token });
});

module.exports = { signupRouter: router };

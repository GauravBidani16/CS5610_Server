import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

// Generate Access & Refresh Tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      userId: user._id,
      username: user.username,
      role: user.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );

  const refreshToken = jwt.sign(
    { userId: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

// User Registration
export const registerUser = asyncHandler(async (req, res) => {
  const { username, firstname, lastname, email, password, role, bio } = req.body;
  
  if (!req.file) throw new ApiError(400, "Profile picture is required");

  // Check if username already exists
  const userExists = await User.findOne({ username });
  if (userExists) throw new ApiError(400, "Username already taken");

  // Upload profile picture to Cloudinary
  const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
  if (!cloudinaryResponse) throw new ApiError(500, "Profile picture upload failed");

  // Create new user
  const newUser = await User.create({
    username,
    firstname,
    lastname,
    email,
    password,
    role,
    profilepic: cloudinaryResponse.url, // Store Cloudinary URL for profile picture
    bio,
  });

  res.status(201).json(new ApiResponse(201, newUser, "User registered successfully"));
});

// User Login
export const loginUser = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await user.isPasswordCorrect(password))) {
    throw new ApiError(401, "Invalid username or password");
  }

  const { accessToken, refreshToken } = generateTokens(user);

  user.refreshToken = refreshToken;
  await user.save();

  res
    .status(200)
    .json(
      new ApiResponse(200, { accessToken, refreshToken }, "Login successful")
    );
});

// Refresh Token Handling
export const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) throw new ApiError(400, "Refresh token is required");

  const user = await User.findOne({ refreshToken: token });

  if (!user) throw new ApiError(403, "Invalid refresh token");

  try {
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    const { accessToken, refreshToken } = generateTokens(user);

    user.refreshToken = refreshToken;
    await user.save();

    res
      .status(200)
      .json(
        new ApiResponse(200, { accessToken, refreshToken }, "Token refreshed")
      );
  } catch {
    throw new ApiError(403, "Expired or invalid refresh token");
  }
});

// User Logout
export const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) throw new ApiError(404, "User not found");

  user.refreshToken = null; // Clear stored refresh token
  await user.save();

  res.status(200).json(new ApiResponse(200, {}, "Logged out successfully"));
});
  
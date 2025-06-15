import express from "express";
import { registerUser, loginUser, refreshToken, logoutUser } from "../controllers/auth.controller.js";
import authenticateUser from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// User Authentication Routes
router.post("/register", upload.single("file"), registerUser); // Register new user
router.post("/login", loginUser); // Login with username
router.post("/refresh", refreshToken); // Refresh access token
router.post("/logout", authenticateUser, logoutUser); // Logout (requires authentication)

export default router;
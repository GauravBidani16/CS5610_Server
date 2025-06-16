import express from "express";
import authenticateUser from "../middlewares/auth.middleware.js";
import authorizeRole from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  getUserProfile,
  getAllUsers,
  followUser,
  unfollowUser,
  updateUserProfile,
  deleteUser,
} from "../controllers/user.controller.js";

const router = express.Router();

// Public access: Get user profile
router.get("/:username", getUserProfile);

// Admin-only access: Get all users
router.get("/", authenticateUser, authorizeRole(["ADMIN"]), getAllUsers);

// Follow/unfollow a user
router.post("/follow/:username", authenticateUser, followUser);
router.delete("/unfollow/:username", authenticateUser, unfollowUser);

// Update profile with optional profile picture upload
router.put("/update", authenticateUser, upload.single("file"), updateUserProfile);

// User deletion: Self or ADMIN action
router.delete("/:username", authenticateUser, deleteUser);

export default router;
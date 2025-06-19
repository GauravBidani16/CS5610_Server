import express from "express";
import authenticateUser from "../middlewares/auth.middleware.js";
import {
  createComment,
  getCommentsForPost,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller.js";

const router = express.Router();

// Create a new comment on a post
router.post("/:postId", authenticateUser, createComment);

// Get all comments for a specific post
router.get("/:postId", authenticateUser, getCommentsForPost);

// Update a comment (Only by the author)
router.put("/:commentId", authenticateUser, updateComment);

// Delete a comment (Only by the author or an admin)
router.delete("/:commentId", authenticateUser, deleteComment);

export default router;
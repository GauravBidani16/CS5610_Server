import express from "express";
import authenticateUser from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  createPost,
  getUserPosts,
  likePost,
  unlikePost,
  commentOnPost,
  deletePost,
  updatePostCaption,
  getPublicPosts,
  getFeedPosts
} from "../controllers/post.controller.js";

const router = express.Router();

// Create a new post (Authenticated users only)
router.post("/", authenticateUser, upload.single("file"), createPost);

router.get("/public", getPublicPosts);
router.get("/feed", authenticateUser, getFeedPosts);

// Get posts of a specific user
router.get("/:username", authenticateUser, getUserPosts);

router.put("/:postId/caption", authenticateUser, updatePostCaption);

// Like & Unlike a post
router.post("/:postId/like", authenticateUser, likePost);
router.delete("/:postId/unlike", authenticateUser, unlikePost);

// Comment on a post
router.post("/:postId/comment", authenticateUser, commentOnPost);

// Delete a post (Only by the owner)
router.delete("/:postId", authenticateUser, deletePost);

export default router;
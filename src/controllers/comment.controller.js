import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

// Create a new comment on a post
export const createComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;

  const post = await Post.findById(postId);
  if (!post) throw new ApiError(404, "Post not found");

  const newComment = await Comment.create({
    postId,
    author: req.user._id,
    text
  });

  post.comments.push(newComment._id);
  await post.save();

  res.status(201).json(new ApiResponse(201, newComment, "Comment added successfully"));
});

// Get all comments for a post
export const getCommentsForPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  const postExists = await Post.findById(postId);
  if (!postExists) throw new ApiError(404, "Post not found");

  const comments = await Comment.find({ postId })
    .populate("author", "username profilepic")
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

// Update a comment (Only by the author)
export const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { text } = req.body;

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  if (req.user._id.toString() !== comment.author.toString()) {
    throw new ApiError(403, "Unauthorized to update this comment");
  }

  comment.text = text;
  await comment.save();

  res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"));
});

// Delete a comment (Only by the author or an admin)
export const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) throw new ApiError(404, "Comment not found");

  if (req.user._id.toString() !== comment.author.toString() && req.user.role !== "ADMIN") {
    throw new ApiError(403, "Unauthorized to delete this comment");
  }

  await Post.updateOne({ comments: commentId }, { $pull: { comments: commentId } });
  await Comment.findByIdAndDelete(commentId);

  res.status(200).json(new ApiResponse(200, {}, "Comment deleted successfully and post updated"));
});
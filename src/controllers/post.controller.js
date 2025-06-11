import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

// Create a new post (file upload required)
export const createPost = asyncHandler(async (req, res) => {
  const { file } = req;

  if (!file) throw new ApiError(400, "No file uploaded");

  // Upload file to Cloudinary
  const cloudinaryResponse = await uploadOnCloudinary(file.path);
  if (!cloudinaryResponse) throw new ApiError(500, "File upload failed");

  // Create post entry in database
  const newPost = await Post.create({
    author: req.user.userId,
    postUrl: cloudinaryResponse.url,
  });

  res.status(201).json(new ApiResponse(201, newPost, "Post created successfully"));
});

// Get posts of a specific user
export const getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const requestingUser = await User.findById(req.user.userId);
  const userProfile = await User.findById(userId);

  if (!userProfile) throw new ApiError(404, "User not found");

  let posts = [];

  if (userProfile.role === "PUBLIC_USER") {
    posts = await Post.find({ author: userId });
  } else if (requestingUser.following.includes(userId) || req.user.role === "ADMIN") {
    posts = await Post.find({ author: userId });
  } else {
    throw new ApiError(403, "You must follow this user to view their posts.");
  }

  res.status(200).json(new ApiResponse(200, posts, "Posts retrieved successfully"));
});

// Like a post
export const likePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);

  if (!post) throw new ApiError(404, "Post not found");

  if (post.likes.includes(req.user.userId)) {
    throw new ApiError(400, "You have already liked this post");
  }

  post.likes.push(req.user.userId);
  await post.save();

  res.status(200).json(new ApiResponse(200, {}, "Post liked successfully"));
});

// Unlike a post
export const unlikePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);

  if (!post) throw new ApiError(404, "Post not found");

  post.likes = post.likes.filter((id) => id.toString() !== req.user.userId);
  await post.save();

  res.status(200).json(new ApiResponse(200, {}, "Post unliked successfully"));
});

// Comment on a post
export const commentOnPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;
  const post = await Post.findById(postId);

  if (!post) throw new ApiError(404, "Post not found");

  post.comments.push({ author: req.user.userId, text });
  await post.save();

  res.status(201).json(new ApiResponse(201, {}, "Comment added successfully"));
});

// Delete a post (Only by the owner)
export const deletePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);

  if (!post) throw new ApiError(404, "Post not found");

  if (req.user.userId !== post.author.toString() && req.user.role !== "ADMIN") {
    throw new ApiError(403, "Unauthorized to delete this post");
  }

  await Post.findByIdAndDelete(postId);

  res.status(200).json(new ApiResponse(200, {}, "Post deleted successfully"));
});
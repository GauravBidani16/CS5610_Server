import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

// Create a new post (file upload required)
export const createPost = asyncHandler(async (req, res) => {
  const { file } = req;
  const { postCaption } = req.body;

  if (!file) throw new ApiError(400, "No file uploaded");
  console.log("FILEE", file);
  

  // Upload file to Cloudinary
  const cloudinaryResponse = await uploadOnCloudinary(file.path);

  console.log("clouddd", cloudinaryResponse);
  
  if (!cloudinaryResponse) throw new ApiError(500, "File upload failed");

  // Create post entry in database
  const newPost = await Post.create({
    author: req.user._id,
    postUrl: cloudinaryResponse.url,
    postCaption: postCaption || "",
  });

  res.status(201).json(new ApiResponse(201, newPost, "Post created successfully"));
});

// Get posts of a specific user
export const getUserPosts = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const requestingUser = await User.findById(req.user._id);
  const userProfile = await User.findById(username);

  if (!userProfile) throw new ApiError(404, "User not found");

  let posts = [];

  if (userProfile.role === "PUBLIC_USER") {
    posts = await Post.find({ author: userProfile._id });
  } else if (requestingUser.following.includes(userProfile._id) || req.user.role === "ADMIN") {
    posts = await Post.find({ author: userProfile._id })
  } else {
    throw new ApiError(403, "You must follow this user to view their posts.");
  }

  res.status(200).json(new ApiResponse(200, posts, "Posts retrieved successfully"));
});

// Get posts from all the users, the current user is following
export const getFeedPosts = asyncHandler(async (req, res) => {
  const currentUser = await User.findById(req.user._id);

  if (!currentUser) throw new ApiError(404, "User not found");

  if (!currentUser.following || currentUser.following.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No followings. Feed is empty."));
  }

  const posts = await Post.find({ author: { $in: currentUser.following } })
    .populate("author", "username profilepic")
    .populate({
      path: "comments",
      model: "Comment",
      populate: { path: "author", model: "User", select: "username profilepic" }
    })
    .sort({ updatedAt: -1 });

  res.status(200).json(new ApiResponse(200, posts, "Feed posts fetched successfully"));
});


// Update post caption (Only by post owner)
export const updatePostCaption = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { postCaption } = req.body;

  const post = await Post.findById(postId);

  if (!post) throw new ApiError(404, "Post not found");
  if (req.user._id.toString() !== post.author.toString()) {
    throw new ApiError(403, "Unauthorized to update this post");
  }

  post.postCaption = postCaption;
  await post.save();

  res.status(200).json(new ApiResponse(200, post, "Post caption updated successfully"));
});


// Like a post
export const likePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);

  if (!post) throw new ApiError(404, "Post not found");

  if (post.likes.includes(req.user._id)) {
    throw new ApiError(400, "You have already liked this post");
  }

  post.likes.push(req.user._id);
  await post.save();

  res.status(200).json(new ApiResponse(200, {}, "Post liked successfully"));
});

// Unlike a post
export const unlikePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await Post.findById(postId);

  if (!post) throw new ApiError(404, "Post not found");

  post.likes = post.likes.filter((id) => id.toString() !== req.user._id);
  await post.save();

  res.status(200).json(new ApiResponse(200, {}, "Post unliked successfully"));
});

// Comment on a post
export const commentOnPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body;
  const post = await Post.findById(postId);

  if (!post) throw new ApiError(404, "Post not found");

  post.comments.push({ author: req.user._id, text });
  await post.save();

  res.status(201).json(new ApiResponse(201, {}, "Comment added successfully"));
});

// Delete a post (Only by the owner)
export const deletePost = asyncHandler(async (req, res) => {
  console.log("Delete post request received");
  
  const { postId } = req.params;
  const post = await Post.findById(postId);

  if (!post) throw new ApiError(404, "Post not found");

  if (req.user._id.toString() !== post.author.toString() && req.user.role !== "ADMIN") {
    throw new ApiError(403, "Unauthorized to delete this post");
  }

  await Post.findByIdAndDelete(postId);

  console.log("Post deleted successfully:", postId);
  res.status(200).json(new ApiResponse(200, {}, "Post deleted successfully"));
});

export const getPublicPosts = asyncHandler(async (req, res) => {
  // Fetch only public user IDs once to avoid multiple DB queries
  const publicUserIds = await User.find({ role: "PUBLIC_USER" }).distinct("_id");

  console.log("Public Ids", publicUserIds);
  if (publicUserIds.length === 0) {
    res.status(200).json(new ApiResponse(200, [], "No Public posts available"));
  }
  // Fetch posts efficiently, ensuring comments are fully populated
  const posts = await Post.find({ author: { $in: publicUserIds } })
    .populate("author", "username profilepic")
    .populate({
      path: "comments",
      model: "Comment",
      populate: { path: "author", model: "User", select: "username profilepic" }
    })
    .sort({ updatedAt: -1 });

  if (posts.length === 0) throw new ApiError(404, "No public posts available");

  res.status(200).json(new ApiResponse(200, posts, "Public posts fetched successfully"));
});

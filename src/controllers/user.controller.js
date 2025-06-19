import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

// Get user profile (public access)
export const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  console.log(username);
  // Fetch user details excluding password & refreshToken
  const user = await User.findOne({ username }).select("-password -refreshToken");

  if (!user) throw new ApiError(404, "User not found");

  // Count posts, followers, and following
  const postCount = await Post.countDocuments({ author: user._id });
  const followerCount = user.followers.length;
  const followingCount = user.following.length;

  let userPosts = [];
  if (user.role === "PUBLIC_USER") {
    userPosts = await Post.find({ author: user._id });
  }

  res.status(200).json(
    new ApiResponse(200, {
      user,
      postCount,
      followerCount,
      followingCount,
      posts: user.role === "PUBLIC_USER" ? userPosts : [],
    }, "User profile fetched successfully")
  );
});


// Get all users (restricted to ADMIN)
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password -refreshToken");

  res.status(200).json(new ApiResponse(200, users, "Users retrieved successfully"));
});

// Follow another user
export const followUser = asyncHandler(async (req, res) => {
  const { username } = req.params;
  console.log("req", req);
  console.log("req.params:", req.params);
  
  
  console.log("username", username);
  
  const loggedInUser = await User.findById(req.user._id);
  const userToFollow = await User.findOne({username});

  console.log("userToFollow", userToFollow);
  if (!userToFollow) throw new ApiError(404, "User not found");

  if (loggedInUser.following.includes(userToFollow._id.toString())) {
    throw new ApiError(400, "You are already following this user");
  }

  loggedInUser.following.push(userToFollow._id);
  userToFollow.followers.push(req.user._id);

  await loggedInUser.save();
  await userToFollow.save();

  res.status(200).json(new ApiResponse(200, {}, `Successfully followed user: + ${username}`));
});

// Unfollow a user
export const unfollowUser = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const loggedInUser = await User.findById(req.user._id);
  const userToUnfollow = await User.findOne({ username });

  if (!userToUnfollow) throw new ApiError(404, "User not found");

  if (!loggedInUser.following.includes(userToUnfollow._id.toString())) {
    throw new ApiError(400, "You are not following this user");
  }

  loggedInUser.following = loggedInUser.following.filter((id) => id.toString() !== userId);
  userToUnfollow.followers = userToUnfollow.followers.filter((id) => id.toString() !== req.user._id);

  await loggedInUser.save();
  await userToUnfollow.save();

  res.status(200).json(new ApiResponse(200, {}, `Successfully unfollowed user + ${username}`));
});

// Update user profile (only by the user themselves)
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) throw new ApiError(404, "User not found");

  const { firstname, lastname, bio } = req.body;

  // If a new profile picture is uploaded, store it on Cloudinary
  let profilepic = user.profilepic;
  if (req.file) {
    const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
    if (!cloudinaryResponse) throw new ApiError(500, "Profile picture upload failed");
    profilepic = cloudinaryResponse.url;
  }

  // Update fields
  if (firstname) user.firstname = firstname;
  if (lastname) user.lastname = lastname;
  if (bio) user.bio = bio;
  user.profilepic = profilepic;

  await user.save();

  res.status(200).json(new ApiResponse(200, user, "Profile updated successfully"));
});


// Delete user (self or ADMIN action)
export const deleteUser = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findById({ username });

  if (!user) throw new ApiError(404, "User not found");

  if (req.user._id !== username && req.user.role !== "ADMIN") {
    throw new ApiError(403, "Unauthorized to delete this account");
  }

  await User.findByIdAndDelete(username);

  res.status(200).json(new ApiResponse(200, {}, "User deleted successfully"));
});

export const getFollowers = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username }).populate('followers', 'username profilepic');

  if (!user) throw new ApiError(404, "User not found");

  res.status(200).json(new ApiResponse(200, user.followers, "Followers fetched successfully"));
});

export const getFollowing = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ username }).populate('following', 'username profilepic');

  if (!user) throw new ApiError(404, "User not found");

  res.status(200).json(new ApiResponse(200, user.following, "Following fetched successfully"));
});

export const getCurrentUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.user._id })
    .select("-password -refreshToken")
    .populate("followers", "username profilepic")
    .populate("following", "username profilepic");

  if (!user) throw new ApiError(404, "User not found");

  const posts = await Post.find({ author: user._id });

  res.status(200).json(new ApiResponse(200, { ...user._doc, posts }, "User profile fetched successfully"));
});


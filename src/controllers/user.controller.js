import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";

// Get user profile (public access)
export const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

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
  const { userId } = req.params;
  const follower = await User.findById(req.user.userId);
  const userToFollow = await User.findById(userId);

  if (!userToFollow) throw new ApiError(404, "User not found");

  if (follower.following.includes(userId)) {
    throw new ApiError(400, "You are already following this user");
  }

  follower.following.push(userId);
  userToFollow.followers.push(req.user.userId);

  await follower.save();
  await userToFollow.save();

  res.status(200).json(new ApiResponse(200, {}, "Successfully followed user"));
});

// Unfollow a user
export const unfollowUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const follower = await User.findById(req.user.userId);
  const userToUnfollow = await User.findById(userId);

  if (!userToUnfollow) throw new ApiError(404, "User not found");

  follower.following = follower.following.filter((id) => id.toString() !== userId);
  userToUnfollow.followers = userToUnfollow.followers.filter((id) => id.toString() !== req.user.userId);

  await follower.save();
  await userToUnfollow.save();

  res.status(200).json(new ApiResponse(200, {}, "Successfully unfollowed user"));
});

// Update user profile (only by the user themselves)
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId);

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
  const { userId } = req.params;
  const user = await User.findById(userId);

  if (!user) throw new ApiError(404, "User not found");

  if (req.user.userId !== userId && req.user.role !== "ADMIN") {
    throw new ApiError(403, "Unauthorized to delete this account");
  }

  await User.findByIdAndDelete(userId);

  res.status(200).json(new ApiResponse(200, {}, "User deleted successfully"));
});
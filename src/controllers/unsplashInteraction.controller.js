import UnsplashInteraction from "../models/unsplashInteraction.model.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

// Create a new interaction
export const createInteraction = asyncHandler(async (req, res) => {
  const { unsplashId, comment } = req.body;

  if (!unsplashId) throw new ApiError(400, "unsplashId is required");

  const interaction = await UnsplashInteraction.create({
    user: req.user._id,
    unsplashId,
    comment
  });

  res.status(201).json(new ApiResponse(201, interaction, "Interaction created successfully"));
});

// Get all interactions for a user + unsplashId
export const getInteractionsByUserAndUnsplashId = asyncHandler(async (req, res) => {
  const { unsplashId } = req.params;

  const interactions = await UnsplashInteraction.find({
    user: req.user._id,
    unsplashId
  });

  res.status(200).json(new ApiResponse(200, interactions, "User interactions for Unsplash ID retrieved"));
});

// Get all interactions for a specific unsplashId (across all users)
export const getAllInteractionsByUnsplashId = asyncHandler(async (req, res) => {
  const { unsplashId } = req.params;

  const interactions = await UnsplashInteraction.find({ unsplashId }).populate("user", "username profilepic");

  res.status(200).json(new ApiResponse(200, interactions, "All interactions for Unsplash ID retrieved"));
});


export const getAllInteractionsByUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const interactions = await UnsplashInteraction.find({ user: userId })
    .populate("user", "username profilepic");

  if (!interactions || interactions.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No interactions found for this user"));
  }

  res.status(200).json(new ApiResponse(200, interactions, "User interactions retrieved successfully"));
});



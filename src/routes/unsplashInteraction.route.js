import express from "express";
import authenticateUser from "../middlewares/auth.middleware.js";
import {
  createInteraction,
  getInteractionsByUserAndUnsplashId,
  getAllInteractionsByUnsplashId,
  getAllInteractionsByUser
} from "../controllers/unsplashInteraction.controller.js";

const router = express.Router();

router.post("/", authenticateUser, createInteraction);
router.get("/mine/:unsplashId", authenticateUser, getInteractionsByUserAndUnsplashId);
router.get("/all/:unsplashId", authenticateUser, getAllInteractionsByUnsplashId);
router.get("/user/:userId", authenticateUser, getAllInteractionsByUser);

export default router;

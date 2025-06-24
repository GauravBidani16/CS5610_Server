import mongoose from "mongoose";

const UnsplashInteractionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  unsplashId: {
    type: String,
    required: true,
    index: true
  },
  comment: {
    type: String,
    trim: true,
  }
}, { timestamps: true });

const UnsplashInteraction = mongoose.model("UnsplashInteraction", UnsplashInteractionSchema);
export default UnsplashInteraction;
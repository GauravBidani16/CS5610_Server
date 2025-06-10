import mongoose from "mongoose";
import bcrypt from "bcrypt";
import isEmail from "validator/lib/isEmail";

const userSchema = new mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
      trim: true,
    },
    lastname: {
      type: String,
      trim: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [isEmail, "Invalid email address"]
    },
    password: {
      type: String,
      required: [true, "Password is required"]
    },
    profilePicture: {
      type: String, //Cloudinary url
      required: true
    },
    role: {
      type: String,
      emum: ["admin", "user", "controller"],
      default: "user"
    },
    followers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User"
    },
    following: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User"
    },
    likes: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Post"
    }
  },
  {timestamps: true}
);

userSchema.pre("save", async function(next) {
  if(!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 5)
  next();  
})

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password)
}

export const User = mongoose.model("User", userSchema)
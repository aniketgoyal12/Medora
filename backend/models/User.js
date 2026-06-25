import mongoose, { model } from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    mobileno: {
      type: Number,
      required: true,
    },
    whatsapp: { type: Number, required: false },
    role: {
      type: String,
      enum: ["superAdmin", "admin", "doctor", "patient"],
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", UserSchema);

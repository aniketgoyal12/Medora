import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bio: {
      type: String,
      required: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    qualifications: {
      type: String,
      required: true,
    },
    experience: {
      type: Number,
      required: true,
      min: 0,
    },
    consultationFee: {
      type: Number,
      required: true,
    },

    languageSpoken: [String],
    clinicAddress: {
      type: String,
      required: true,
      trim: true,
    },
    teleMedicineEnabled: {
      type: Boolean,
      default: true,
    },
    profileImage: {
      type: String,
      default: "",
      trim: true,
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    publicId:{
      type:String,
      trim: true,
    }
  },
  { timestamps: true },
);

export default mongoose.model("Doctor", doctorSchema);

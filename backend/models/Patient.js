import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Other"],
    },
    dob: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value < new Date();
        },
        message: "Date of birth cannot be in the future",
      },
    },
    address: {
      type: String,
      required: true,
      trim: true,
      min: 5,
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
    },
    allergies: {
      type: [String],
      default: [],
    },
    emergencyContact: {
      name: { type: String, required: true },
      relation: {
        type: String,
        required: true,
        enum: [
          "Father",
          "Mother",
          "Brother",
          "Sister",
          "Spouse",
          "Friend",
          "Wife",
          "Husband",
          "Other",
        ],
      },
      phone: { type: String, required: true, match: /^[0-9]{10}$/ },
    },
  },
  { timestamps: true },
);

export default mongoose.model("Patient", patientSchema);

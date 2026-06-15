import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
    doctorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Doctor",
          required: true,
        },
    day: {
      type: String,
      required: true,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },

    slots: [
      {
        startTime: {
          type: String,
          required: true,
        },

        endTime: {
          type: String,
          required: true,
        },
      },
    ],
},
{timestamps:true},
);

export default mongoose.model("Availability",availabilitySchema);
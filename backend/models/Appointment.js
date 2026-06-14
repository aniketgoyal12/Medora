import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },

    appointmentDate: {
      type: Date,
      required: true,
    },

    timeSlot: {
      startTime: {
        type: String,
        required: true,
      },
      endTime: {
        type: String,
        required: true,
      },
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Completed",
        "Cancelled",
        "Rescheduled",
        "No-Show",
      ],
      default: "Pending",
    },

    reasonForVisit: {
      type: String,
      required: true,
      trim: true,
    },

    consultationType: {
      type: String,
      enum: ["In-Person", "TeleMedicine"],
      default: "In-Person",
    },
    meetingLink :{
      type:String
    },
    cancellationReason:{
      type:String,
      trim:true
    },
    doctorNotes :{
      type:String,
      trim:true
    },prescription :{
      type:String,
      trim:true
    },
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
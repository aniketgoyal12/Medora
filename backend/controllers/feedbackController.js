import mongoose from "mongoose";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import Feedback from "../models/Feedback.js";

const createFeedback = async (req, res) => {
  try {
    const { appointmentId, review, rating } = req.body;

    if (!appointmentId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID and rating are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Appointment ID",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.patientId.toString() !== patient._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Patient not authorized",
      });
    }

    if (appointment.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "Feedback can only be given for completed appointments",
      });
    }

    const existingFeedback = await Feedback.findOne({ appointmentId });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: "Feedback already submitted for this appointment",
      });
    }

    const feedback = await Feedback.create({
      doctorId: appointment.doctorId,
      patientId: patient._id,
      appointmentId,
      review,
      rating,
    });

    const allFeedbacks = await Feedback.find({
      doctorId: appointment.doctorId,
    });

    const averageRating =
      allFeedbacks.reduce((sum, item) => sum + item.rating, 0) /
      allFeedbacks.length;

    await Doctor.findByIdAndUpdate(appointment.doctorId, {
      ratingAverage: Number(averageRating.toFixed(1)),
    });

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      feedback: feedback,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getDoctorFeedback = async (req, res) => {
  try {
    const { doctorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const feedbacks = await Feedback.find({
      doctorId,
    })
      .populate({
        path: "patientId",
        select: "userId",
        populate: {
          path: "userId",
          select: "name",
        },
      })
      .sort({ createdAt: -1 });

    const totalReviews = feedbacks.length;
    const averageRating =
      totalReviews === 0
        ? 0
        : (
            feedbacks.reduce((sum, item) => sum + item.rating, 0) / totalReviews
          ).toFixed(1);

    return res.status(200).json({
      success: true,
      totalReviews: totalReviews,
      averageRating: averageRating,
      feedbacks: feedbacks,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const deleteDoctorFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID",
      });
    }

    const feedback = await Feedback.findById(id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    const patient = await Patient.findOne({
      userId: req.user._id,
    });

    if (!patient || feedback.patientId.toString() !== patient._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this feedback",
      });
    }

    const doctorId = feedback.doctorId;

    await feedback.deleteOne();

    const remainingFeedbacks = await Feedback.find({
      doctorId,
    });

    const averageRating =
      remainingFeedbacks.length === 0
        ? 0
        : remainingFeedbacks.reduce((sum, item) => sum + item.rating, 0) /
          remainingFeedbacks.length;

    await Doctor.findByIdAndUpdate(doctorId, {
      ratingAverage: Number(averageRating.toFixed(1)),
    });

    return res.status(200).json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export { createFeedback, gerDoctorFeedback, deleteDoctorFeedback };

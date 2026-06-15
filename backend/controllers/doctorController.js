import Doctor from "../models/Doctor.js";
import mongoose from "mongoose";

const createDoctorProfile = async (req, res) => {
  try {
    const {
      specialization,
      experience,
      qualifications,
      bio,
      clinicAddress,
      consultationFee,
      languageSpoken,
      teleMedicineEnabled,
    } = req.body;

    const missingFields = [];

    if (!specialization) missingFields.push("specialization");
    if (!experience) missingFields.push("experience");
    if (!qualifications) missingFields.push("qualifications");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${missingFields.join(", ")} ${
          missingFields.length > 1 ? "are" : "is"
        } missing`,
      });
    }
    const existingDoctor = await Doctor.findOne({
      userId: req.user._id,
    });
    if (existingDoctor) {
      return res.staus(400).json({
        success: false,
        message: "Doctor Already Exists",
      });
    }

    const doctor = await Doctor.create({
      userId: req.user._id,
      specialization,
      experience,
      bio,
      qualifications,
      clinicAddress,
      consultationFee,
      languageSpoken,
      teleMedicineEnabled,
    });
    return res.status(201).json({
      success: true,
      message: "Details added successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getAllDoctors = async (req, res) => {
  try {
    const doctor = await Doctor.find().populate("userId", "name email");

    return res.status(200).json({
      success: true,
      message: doctor,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getDoctorById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Doctor ID",
      });
    }
    const doctor = await Doctor.findById(req.params.id).populate(
      "userId",
      "name email",
    );
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      doctor,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getMyDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      userId: req.user._id,
    }).populate("userId", "name email");

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor Profile Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      doctor,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const updateMyDoctorProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const allowedUpdates = {
      specialization: req.body.specialization,
      experience: req.body.experience,
      consultationFee: req.body.consultationFee,
      qualification: req.body.qualification,
      bio: req.body.bio,
    };

    Object.keys(allowedUpdates).forEach((key) => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });
    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const doctor = await Doctor.findOneAndUpdate(
      { userId },
      { $set: allowedUpdates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor profile updated successfully",
      doctor:doctor,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to update doctor profile",
      error: err.message,
    });
  }
};

export {
  createDoctorProfile,
  getAllDoctors,
  getDoctorById,
  getMyDoctorProfile,
  updateMyDoctorProfile,
};

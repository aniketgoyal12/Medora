import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import mongoose from "mongoose";


const createPatientProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const existingPatient = await Patient.findOne({ userId });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: "Patient Already Exists",
      });
    }
    const { gender, dob, bloodGroup, address, allergies, emergencyContact } =
      req.body;
    const missingFields = [];

    if (!gender) missingFields.push("gender");
    if (!dob) missingFields.push("dob");
    if (!bloodGroup) missingFields.push("bloodGroup");
    if (!emergencyContact) missingFields.push("emergencyContact");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${missingFields.join(", ")} ${missingFields.length > 1 ? "are" : "is"} missing`,
      });
    }
    const patient = await Patient.create({
      userId,
      gender,
      dob,
      bloodGroup,
      address,
      allergies,
      emergencyContact,
    });
    return res.status(201).json({
      success: true,
      message: "Patient details added successfully",
      patient,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getMyPatientProfile = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id }).populate(
      "userId",
      "name email",
    );
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }
    return res.status(200).json({
      success: true,
      patient,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getPatientById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Patient Id",
      });
    }
    const patient = await Patient.findOne({ userId: req.params.id }).populate(
      "userId",
      "name email",
    );
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }
    return res.status(200).json({
      success: true,
      patient,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getAllPatients = async(req,res) =>{
  try{
    const patients = await Patient.find().populate("userId","name email");

    if(!patients){
      return res.status(404).json({
        success:false,
        message:"Patients not found"
      })
    }
    return res.status(200).json({
      success:true,
      message:patients
    })
  }catch(err){
    return res.status(500).json({
      success:true,
      message:err.message
    })
  }
}
const updatePatientProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const allowedUpdates = {
      gender: req.body.gender,
      dob: req.body.dob,
      address: req.body.address,
      bloodGroup: req.body.bloodGroup,
      allergies: req.body.allergies,
      emergencyContact: req.body.emergencyContact,
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

    const patient = await Patient.findOneAndUpdate(
      { userId },
      { $set: allowedUpdates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient profile updated successfully",
      patient,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export { createPatientProfile,getAllPatients, getMyPatientProfile, getPatientById, updatePatientProfile};

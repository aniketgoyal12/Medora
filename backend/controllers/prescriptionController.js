import Doctor from "../models/Doctor.js";
import Prescription from "../models/Prescription.js";
import mongoose from "mongoose";

const createPrescription = async (req, res) => {
  try {
    const { appointmentId, medicines, instruction } = req.body;
    const userId = req.user._id;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const appointment = Appointment.findOne(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    const prescription = await Prescription.create({
      appointmentId: appointment._id,
      doctorId: doctor._id,
      patientId: appointment.patientId,
      medicines,
      instruction,
    });

    return res.status(201).json({
      success: true,
      message: "Prescription created successfully",
      prescription,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getPrescription = async (req, res) => {
  try {
    const prescriptionId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(prescriptionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });
    }
    const prescription = await Prescription.findById(prescriptionId)
      .populate("doctorId")
      .populate("patientId")
      .populate("appointmentid");
    4;
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Prescription found",
      prescription: prescription,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const updatePrescription = async (req, res) => {
  try {
    const prescriptionId = req.params.id;
    const { medicines, instruction, updationReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(prescriptionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid prescription ID",
      });
    }

    const prescription = await Prescription.findById(prescriptionId);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    if (prescription.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorised to update this prescription",
      });
    }

    if (!updationReason) {
      return res.status(400).json({
        success: false,
        message: "Updation reason is required",
      });
    }

    if (!medicines && !instruction) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required to update",
      });
    }

    if (medicines) {
      prescription.medicines = medicines;
    }

    if (instruction) {
      prescription.instruction = instruction;
    }

    prescription.updateHistory.push({
      reason: updationReason,
      updatedAt: new Date(),
    });

    await prescription.save();

    return res.status(200).json({
      success: true,
      message: "Prescription updated successfully",
      prescription,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export { createPrescription, getPrescription, updatePrescription };

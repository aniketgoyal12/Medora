import Doctor from "../models/Doctor.js";
import Prescription from "../models/Prescription.js";
import Appointment from "../models/Appointment.js";
import mongoose from "mongoose";
import Patient from "../models/Patient.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";
import cloudinary from "../config/cloudinary.js";

const createPrescription = async (req, res) => {
  try {
    const { appointmentId, medicines, instruction } = req.body;
    const attachment = req.file;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });
    }
    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one medicine is required",
      });
    }
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized appointment access",
      });
    }
    if (appointment.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "Prescription can only be created for completed appointments",
      });
    }

    const existingPrescription = await Prescription.findOne({
      appointmentId,
    });

    if (existingPrescription) {
      return res.status(400).json({
        success: false,
        message: "Prescription already exists for this appointment",
      });
    }

    let attachmentUrl = "";
    let publicId = "";

    if (attachment) {
      const uploadResult = await uploadToCloudinary(
        attachment.path,
        "prescriptions",
      );

      attachmentUrl = uploadResult.secure_url;
      publicId = uploadResult.public_id;
    }
    const prescription = await Prescription.create({
      appointmentId: appointment._id,
      doctorId: doctor._id,
      patientId: appointment.patientId,
      medicines,
      instruction,
      attachmentUrl,
      publicId,
    });

    appointment.prescription = prescription._id;
    await appointment.save();

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
      .populate("doctorId", "specialization experience")
      .populate("patientId")
      .populate("appointmentId");
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }
    if (req.user.role === "patient") {
      const patient = await Patient.findOne({
        userId: req.user._id,
      });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      if (prescription.patientId._id.toString() !== patient._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access",
        });
      }
    }
    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({
        userId: req.user._id,
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      if (prescription.doctorId._id.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access",
        });
      }
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
    const attachment = req.file;

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

    if (!medicines && !instruction && !attachment) {
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

    let oldPublicId = null;

    if (attachment) {
      const uploadResult = await uploadToCloudinary(
        attachment.path,
        "prescriptions",
      );

      oldPublicId = prescription.publicId;

      prescription.attachmentUrl = uploadResult.secure_url;
      prescription.publicId = uploadResult.public_id;
    }

    prescription.updationHistory.push({
      reason: updationReason,
      updatedAt: new Date(),
    });

    await prescription.save();

    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId);
      } catch (deleteError) {
        console.error(
          "Failed to delete old prescription attachment:",
          deleteError.message,
        );
      }
    }

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

const deletePrescription = async (req, res) => {
  try {
    const prescriptionId = req.params.id;
    if(!mongoose.Types.ObjectId.isValid(prescriptionId)){
      return res.status(400).json({
        success:false,
        message:"Invalid Prescription Id"
      })
    }

    const prescription = await Prescription.findById(prescriptionId);

    if(!prescription){
      return res.status(404).json({
        success:false,
        message:"Prescription not found"
      })
    }

    const doctor = await Doctor.findOne({userId : req.user._id});

    if(!doctor){
      return res.status(404).json({
        success:false,
        message:"Doctor not found"
      })
    }

    if(prescription.doctorId.toString() !== doctor._id.toString()){
      return res.status(403).json({
        success:false,
        message:"Unauthorized access"
      })
    }

    if(prescription.publicId){
      try{
        await cloudinary.uploader.destroy(prescription.publicId);
      }catch(deleteError){
        console.error(
          "Failed to delete prescription attachment:",
          deleteError.message
        );
      }
    }
    if (prescription.appointmentId) {
      await Appointment.findByIdAndUpdate(prescription.appointmentId, {
        $unset: { prescription: 1 }
      });
    }

    await prescription.deleteOne();

    return res.status(200).json({
      success:true,
      message:"Prescription deleted successfully"
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

const getMyPrescriptions = async (req, res) => {
  try {
    const patient = await Patient.findOne({
      userId: req.user._id,
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const prescriptions = await Prescription.find({
      patientId: patient._id,
    })
      .populate("doctorId", "specialization experience")
      .populate("appointmentId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      prescriptions,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getPatientPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Patient ID",
      });
    }

    const doctor = await Doctor.findOne({
      userId: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const patient = await Patient.findById(patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const prescriptions = await Prescription.find({
      patientId,
      doctorId: doctor._id,
    })
      .populate("appointmentId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: prescriptions.length,
      prescriptions,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export { createPrescription, getPrescription, getMyPrescriptions, getPatientPrescriptions, updatePrescription, deletePrescription };

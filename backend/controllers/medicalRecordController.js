import Doctor from "../models/Doctor.js";
import MedicalRecord from "../models/medicalRecords.js";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import mongoose from "mongoose";

const createMedicalRecord = async (req, res) => {
  try {
    const {
      patientId,
      appointmentId,
      title,
      description,
      recordType,
      fileUrl,
    } = req.body;
    if (!patientId || !title || !recordType) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({
        success: false,
        message: "Enter valid patient ID",
      });
    }

    const doctor = await Doctor.findOne({ userId: req.user._id });
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
    if (appointmentId) {
      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        return res.status(400).json({
          success: false,
          message: "Enter valid appointment ID",
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

      if (appointment.patientId.toString() !== patient._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Patient does not belong to appointment",
        });
      }
      const existingRecord = await MedicalRecord.findOne({
        appointmentId,
      });

      if (existingRecord) {
        return res.status(400).json({
          success: false,
          message: "Medical record already exists for this appointment",
        });
      }
    }

    const medicalRecord = await MedicalRecord.create({
      patientId,
      doctorId: doctor._id,
      appointmentId,
      title,
      description,
      recordType,
      fileUrl,
    });
    res.status(201).json({
      success: true,
      message: "Medical Record created",
      medicalRecord: medicalRecord,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getMyMedicalRecord = async (req, res) => {
  try {
    const patient = await Patiend.findOne({ userId: req.user._id });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const medicalRecords = await MedicalRecord.find({
      patientId: patient._id,
    })
      .populate("doctorId", "specialization experience")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: medicalRecords.length,
      medicalRecords,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getMedicalRecordById = async (req, res) => {
  try {
    const recordId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Record ID",
      });
    }

    const medicalRecord = await MedicalRecord.findById(recordId);

    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: "Medical Record not found",
      });
    }

    if (req.user.role === "patient") {
      const patient = await Patient.findOne({
        userId: req.user._id,
      });

      if (medicalRecord.patientId.toString() !== patient._id.toString()) {
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

      if (medicalRecord.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized access",
        });
      }
    }

    return res.status(200).json({
      success: true,
      medicalRecord: medicalRecord,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getPatientMedicalRecords = async (req, res) => {
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

    const medicalRecords = await MedicalRecord.find({
      patientId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: medicalRecords.length,
      medicalRecords: medicalRecords,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const updateMedicalRecords = async (req, res) => {
  try {
    const recordId = req.params.id;

    const { title, description, recordType, fileUrl } = req.body;
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Record ID",
      });
    }
    if (!title && !description && !recordType && !fileUrl) {
      return res.status(400).json({
        success: false,
        message: "At least one field is required for update",
      });
    }

    const medicalRecord = await MedicalRecord.findById(recordId);

    if (!medicalRecord) {
      return res.status(404).json({
        success: false,
        message: "Medical Record not found",
      });
    }

    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    if (medicalRecord.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Doctor not authorised",
      });
    }


    if (title) {
      medicalRecord.title = title;
    }

    if (description) {
      medicalRecord.description = description;
    }

    if (recordType) {
      medicalRecord.recordType = recordType;
    }

    if (fileUrl) {
      medicalRecord.fileUrl = fileUrl;
    }

    await medicalRecord.save();

    return res.status(200).json({
      success: true,
      message: "Record updated successfully",
      medicalRecord: medicalRecord,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export {
  createMedicalRecord,
  getMyMedicalRecord,
  getMedicalRecordById,
  getPatientMedicalRecords,
  updateMedicalRecords,
};

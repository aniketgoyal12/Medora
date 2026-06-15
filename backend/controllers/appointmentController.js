import Appointment from "../models/Appointment.js";
import Availability from "../models/Availability.js";
import mongoose from "mongoose";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";

const createAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      appointmentDate,
      timeSlot,
      reasonForVisit,
      consultationType,
    } = req.body;

    const missingFields = [];

    if (!doctorId) missingFields.push("doctorId");
    if (!appointmentDate) missingFields.push("appointmentDate");
    if (!timeSlot) missingFields.push("timeSlot");
    if (!reasonForVisit) missingFields.push("reasonForVisit");

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${missingFields.join(", ")} ${
          missingFields.length > 1 ? "are" : "is"
        } missing`,
      });
    }

    if (!timeSlot.startTime || !timeSlot.endTime) {
      return res.status(400).json({
        success: false,
        message: "Start time and end time are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor id",
      });
    }

    const appointmentDateObj = new Date(appointmentDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDateObj < today) {
      return res.status(400).json({
        success: false,
        message: "Appointment date must be in the future",
      });
    }

    const patient = await Patient.findOne({
      userId: req.user._id,
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found",
      });
    }

    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const day = appointmentDateObj.toLocaleDateString("en-US", {
      weekday: "long",
    });

    const availability = await Availability.findOne({
      doctorId: doctor._id,
      day,
    });

    if (!availability) {
      return res.status(400).json({
        success: false,
        message: `Doctor is not available on ${day}`,
      });
    }

    const slotExists = availability.slots.some(
      (slot) =>
        slot.startTime === timeSlot.startTime &&
        slot.endTime === timeSlot.endTime,
    );

    if (!slotExists) {
      return res.status(400).json({
        success: false,
        message: "Selected slot is not available",
      });
    }
    const existingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate,
      "timeSlot.startTime": timeSlot.startTime,
      "timeSlot.endTime": timeSlot.endTime,
      status: { $nin: ["cancelled", "rejected"] },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked",
      });
    }

    const patientAppointment = await Appointment.findOne({
      patientId: patient._id,
      appointmentDate,
      "timeSlot.startTime": timeSlot.startTime,
      "timeSlot.endTime": timeSlot.endTime,
      status: { $nin: ["cancelled", "rejected"] },
    });

    if (patientAppointment) {
      return res.status(400).json({
        success: false,
        message: "You already have an appointment in this time slot",
      });
    }

    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId,
      appointmentDate,
      timeSlot,
      reasonForVisit,
      consultationType,
    });

    return res.status(201).json({
      success: true,
      message: "Appointment scheduled successfully",
      appointment,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getAllAppointment = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patientId")
      .populate("doctorId")
      .sort({ appointmentDate: -1 });

    return res.status(200).json({
      success: true,
      appointments,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getMyAppointment = async (req, res) => {
  try {
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found",
      });
    }
    const appointment = await Appointment.find({ patientId: patient._id })
      .populate("doctorId")
      .sort({ appointmentDate: -1 });
    if (appointment.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No appointments found",
      });
    }
    return res.status(200).json({
      success: true,
      appointments: appointment,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const appointmentId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment id",
      });
    }

    const appointment = await Appointment.findById(appointmentId)
      .populate("patientId")
      .populate("doctorId");
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }
    return res.status(200).json({
      success: true,
      appointment: appointment,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getDoctorAppointment = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      userId: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const appointments = await Appointment.find({
      doctorId: doctor._id,
    })
      .populate({
        path: "patientId",
        populate: {
          path: "userId",
          select: "name email",
        },
      })
      .sort({ appointmentDate: -1 });

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No appointments found",
      });
    }

    return res.status(200).json({
      success: true,
      appointments,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }
    const appointmentId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Appointment Id",
      });
    }
    const allowedStatuses = [
      "pending",
      "confirmed",
      "completed",
      "cancelled",
      "rejected",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: appointmentId,
        doctorId: doctor._id,
      },
      { status },
      { new: true },
    );
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Appointment status updated successfully",
      appointment: appointment,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const { appointmentDate, reasonForVisit } = req.body;
    const appointmentId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appointment ID",
      });
    }

    let query = { _id: appointmentId };

    if (req.user.role === "patient") {
      const patient = await Patient.findOne({ userId: req.user._id });

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient not found",
        });
      }

      query.patientId = patient._id;
    }

    if (req.user.role === "doctor") {
      const doctor = await Doctor.findOne({ userId: req.user._id });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }

      query.doctorId = doctor._id;
    }

    const appointment = await Appointment.findOne(query);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (["completed", "cancelled", "rejected"].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot update a ${appointment.status} appointment`,
      });
    }

    const updates = {};

    if (appointmentDate) {
      const newDate = new Date(appointmentDate);
      const today =new Date();
      today.setHours(0,0,0,0);

      if (newDate < today) {
        return res.status(400).json({
          success: false,
          message: "Appointment date cannot be in the past",
        });
      }
      const day = newDate.toLocaleDateString("en-US",{
        weekday : "long"
      });

      const availability = await Availability.findOne({
        doctorId: appointment.doctorId,
        day,
      })

      if(!availability){
        return res.status(400).json({
          success:false,
          message:`Doctor is not available on ${day}`
        })
      }

      const slotExists = availability.slots.some(
        (slot) =>
          slot.startTime === appointment.timeSlot.startTime && 
          slot.endTime === appointment.timeSlot.endTime
      );

      if(!slotExists) {
        return res.status(400).json({
          success:false,
          message: "Current slot is not available on selected date"
        })
      }

      updates.appointmentDate = newDate;
    }

    if (req.user.role === "patient" && reasonForVisit) {
      updates.reasonForVisit = reasonForVisit;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      updates,
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      appointment: updatedAppointment,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    if(!mongoose.Types.ObjectId.isValid(id)){
      return res.status(400).json({
        success:false,
        message:"Invalid appointment ID"
      })
    }

    let query = { _id:id};
    
    if(req.user.role === "patient"){
      const patient = await Patient.findOne({
        userId:req.user._id
      });
      if(!patient){
        return res.status(404).json({
          success:false,
          message:"Patient not found"
        })
      }

      query.patientId = patient._id;
    }

    if(req.user.role === "doctor"){
      const doctor = await Doctor.findOne({
        userId:req.user._id
      });

      if(!doctor){
        return res.status(404).json({
          success:false,
          message:"Doctor not found"
        })
      }

      query.doctorId  = doctor._id;
    }

    const appointment = await Appointment.findOne(query);

    if(!appointment){
      return res.status(404).json({
        success:false,
        messgae:"Appointment not found"
      })
    }

    if(
      ["cancelled","completed","rejected"].includes(appointment.status)
    ){
      return res.status(400).json({
        success:false,
        message: `Cannot cancel ${appointment.status} appointment`
      })
    }

    appointment.status = "cancelled";

    await appointment.save();

    return res.status(200).json({
      success:true,
      message:"Appointment cancelled successfully"
    })

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export {
  createAppointment,
  getAllAppointment,
  getAppointmentById,
  getMyAppointment,
  getDoctorAppointment,
  updateAppointmentStatus,
  updateAppointment,
  cancelAppointment
};

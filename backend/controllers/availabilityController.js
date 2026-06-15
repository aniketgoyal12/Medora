import Availability from "../models/Availability.js";
import mongoose from "mongoose";
import Doctor from "../models/Doctor.js";

const createAvailability = async (req, res) => {
  try {
    const { day, slots } = req.body;

    const doctor = await Doctor.findOne({
      userId: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    if (!day) {
      return res.status(400).json({
        success: false,
        message: "Day is required",
      });
    }

    const validDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    if (!validDays.includes(day)) {
      return res.status(400).json({
        success: false,
        message: "Invalid day",
      });
    }

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one slot is required",
      });
    }

    for (const slot of slots) {
      if (!slot.startTime || !slot.endTime) {
        return res.status(400).json({
          success: false,
          message: "Each slot must have startTime and endTime",
        });
      }

      if (slot.startTime >= slot.endTime) {
        return res.status(400).json({
          success: false,
          message: "startTime must be earlier than endTime",
        });
      }
    }

    const existingAvailability = await Availability.findOne({
      doctorId: doctor._id,
      day,
    });

    if (existingAvailability) {
      return res.status(409).json({
        success: false,
        message: "Availability for this day already exists",
      });
    }

    const sortedSlots = [...slots].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );

    for (let i = 0; i < sortedSlots.length - 1; i++) {
      if (sortedSlots[i].endTime > sortedSlots[i + 1].startTime) {
        return res.status(400).json({
          success: false,
          message: "Overlapping slots are not allowed",
        });
      }
    }

    const availability = await Availability.create({
      doctorId: doctor._id,
      day,
      slots,
    });

    return res.status(201).json({
      success: true,
      message: "Availability created successfully",
      availability,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getDoctorAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }
    const availability = await Availability.find({ doctorId: doctor._id });
    if (availability.length === 0) {
      return res.status(404).json({
        success: false,
        message: "NO slots available",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Slot available",
      availability: availability,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const updateDoctorAvailability = async (req, res) => {
  try {
    const { availabilityId } = req.params;
    const { day, slots } = req.body;
    if (!mongoose.Types.ObjectId.isValid(availabilityId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid availability ID",
      });
    }
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }
    const availability = await Availability.findOne({
      _id: availabilityId,
      doctorId: doctor._id,
    });
    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "NO slots available",
      });
    }
    if (day) {
      const validDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];

      if (!validDays.includes(day)) {
        return res.status(400).json({
          success: false,
          message: "Invalid day",
        });
      }
    }
    if (slots) {
      if (slots.length === 0) {
        return res.status(400).json({
          success: false,
          message: "At least one slot is required",
        });
      }

      for (const slot of slots) {
        if (slot.startTime >= slot.endTime) {
          return res.status(400).json({
            success: false,
            message: "Start time must be before end time",
          });
        }
      }

      const sortedSlots = [...slots].sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );

      for (let i = 0; i < sortedSlots.length - 1; i++) {
        if (sortedSlots[i].endTime > sortedSlots[i + 1].startTime) {
          return res.status(400).json({
            success: false,
            message: "Overlapping slots are not allowed",
          });
        }
      }
    }
    if (day) {
      const existingAvailability = await Availability.findOne({
        doctorId: doctor._id,
        day,
        _id: { $ne: availabilityId },
      });

      if (existingAvailability) {
        return res.status(409).json({
          success: false,
          message: "Availability for this day already exists",
        });
      }
    }
    if (day) availability.day = day;
    if (slots) availability.slots = slots;

    await availability.save();
    return res.status(200).json({
      success: true,
      message: "Availability updated successfully",
      availability: availability,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const deleteAvailability = async (req, res) => {
  try {
    const { availabilityId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(availabilityId)) {
      return res.status(400).json({
        success: false,
        message: "No slots found",
      });
    }

    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const availability = await Availability.findOne({
      _id: availabilityId,
      doctorId: doctor._id,
    });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: "Availability not found",
      });
    }

    await Availability.findByIdAndDelete(availabilityId );

    return res.status(200).json({
      success: true,
      message: "Availability Deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getAvailabilityForPatient = async (req, res) => {
  try {
    const {doctorId} = req.params;
    if(!mongoose.Types.ObjectId.isValid(doctorId)){
      return res.status(400).json({
        success:false,
        message:"Invalid doctor id"
      })
    }

    const doctor = await Doctor.findById(doctorId);
    if(!doctor){
      return res.status(404).json({
        success:false,
        message:"Doctor not found"
      })
    }

    const availability = await Availability.find({doctorId: doctorId});
    if(availability.length === 0){
      return res.status(404).json({
        success:false,
        message:"Availability not found"
      })
    }

    return res.status(200).json({
      success:true,
      message:"Availability found",
      availability:availability
    })
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

export {
  createAvailability,
  getDoctorAvailability,
  updateDoctorAvailability,
  deleteAvailability,
  getAvailabilityForPatient
};

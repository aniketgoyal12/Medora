import express from "express";
import {
  createAppointment,
  getAllAppointment,
  getAppointmentById,
  getDoctorAppointment,
  getMyAppointment,
  updateAppointment,
  updateAppointmentStatus,
} from "../controllers/appointmentController.js";

import {
  auth,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/",
  auth,
  authorizeRoles("patient"),
  createAppointment
);

router.get(
  "/",
  auth,
  authorizeRoles("admin"),
  getAllAppointment
);

router.get(
  "/patient/my",
  auth,
  authorizeRoles("patient"),
  getMyAppointment
);

router.get(
  "/:id",
  auth,
  authorizeRoles("doctor", "admin"),
  getAppointmentById
);

router.get("/doctor/my",
    auth,
    authorizeRoles("doctor"),
    getDoctorAppointment
);

router.patch(
  "/:id/status",
  auth,
  authorizeRoles("doctor"),
  updateAppointmentStatus
);

router.patch(
  "/:id",
  auth,
  authorizeRoles("patient"),
  updateAppointment
);


export default router;
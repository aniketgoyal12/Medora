import express from "express";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  createAvailability,
  deleteAvailability,
  getAvailabilityForPatient,
  getDoctorAvailability,
  updateDoctorAvailability,
} from "../controllers/availabilityController.js";

const router = express.Router();

router.post("/create", auth, authorizeRoles("doctor"), createAvailability);

router.get("/me", auth, authorizeRoles("doctor"), getDoctorAvailability);

router.put(
  "/:availabilityId",
  auth,
  authorizeRoles("doctor"),
  updateDoctorAvailability,
);

router.delete(
  "/:availabilityId",
  auth,
  authorizeRoles("doctor"),
  deleteAvailability,
);

router.get(
  "/doctor/:doctorId",
  auth,
  authorizeRoles("patient"),
  getAvailabilityForPatient
)

export default router;

import {
  createPatientProfile,
  getAllPatients,
  getMyPatientProfile,
  getPatientById,
  updatePatientProfile,
} from "../controllers/patientController.js";

import { auth, authorizeRoles } from "../middleware/authMiddleware.js";
import express from "express";

const router = express.Router();

router.post("/create", auth, authorizeRoles("patient"), createPatientProfile);

router.get("/get", auth, authorizeRoles("doctor", "admin"), getAllPatients);

router.get("/me", auth, authorizeRoles("patient"), getMyPatientProfile);

router.get(
  "/:id",
  auth,
  authorizeRoles("doctor", "patient", "admin"),
  getPatientById,
);

router.put("/me", auth, authorizeRoles("patient"), updatePatientProfile);

export default router;
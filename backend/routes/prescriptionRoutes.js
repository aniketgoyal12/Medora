import express from "express";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  createPrescription,
  getPrescription,
  updatePrescription,
  getMyPrescriptions,
  getPatientPrescriptions,
  deletePrescription,
} from "../controllers/prescriptionController.js";
import { documentUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/",
  auth,
  authorizeRoles("doctor"),
  documentUpload.single("attachment"),
  createPrescription,
);

router.get("/me", auth, authorizeRoles("patient"), getMyPrescriptions);

router.get(
  "/:id",
  auth,
  authorizeRoles("doctor", "patient", "admin"),
  getPrescription,
);

router.get(
  "/patient/:patientId",
  auth,
  authorizeRoles("doctor", "admin"),
  getPatientPrescriptions,
);  

router.put(
  "/:id",
  auth,
  authorizeRoles("doctor"),
  documentUpload.single("attachment"),
  updatePrescription,
);

router.delete("/:id", auth, authorizeRoles("doctor"), deletePrescription);

export default router;

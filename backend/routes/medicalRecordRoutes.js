import express from "express";
import {createMedicalRecord, getMyMedicalRecord, getMedicalRecordById, getPatientMedicalRecords, updateMedicalRecord, deleteMedicalRecord} from "../controllers/medicalRecordController.js";
import {auth, authorizeRoles} from "../middleware/authMiddleware.js";
import { documentUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post(
  "/",
  auth,
  authorizeRoles("doctor"),
  documentUpload.single("document"),
  createMedicalRecord
);

router.get("/me",
    auth,
    authorizeRoles("patient"),
    getMyMedicalRecord
);

router.get(
  "/:id",
  auth,
  authorizeRoles("patient", "doctor", "admin"),
  getMedicalRecordById
);

router.get(
  "/patient/:patientId",
  auth,
  authorizeRoles("doctor", "admin"),
  getPatientMedicalRecords
);

router.patch(
  "/:id",
  auth,
  authorizeRoles("doctor"),
  documentUpload.single("document"),
  updateMedicalRecord
);

router.delete("/:id",
  auth,
  authorizeRoles("doctor"),
  deleteMedicalRecord
);

export default router;
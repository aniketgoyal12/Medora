import express from "express";
import {createMedicalRecord, getMyMedicalRecord, getMedicalRecordById, getPatientMedicalRecords, updateMedicalRecords} from "../controllers/medicalRecordController.js";
import {auth, authorizeRoles} from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create",
    auth,
    authorizeRoles("doctor"),
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

router.put(
  "/:id",
  auth,
  authorizeRoles("doctor"),
  updateMedicalRecords
);

export default router;
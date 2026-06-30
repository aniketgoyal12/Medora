import express from "express";
import { auth, authorizeRoles } from "../middleware/authMiddleware.js";

import {
  createFeedback,
  getDoctorFeedbacks,
  deleteDoctorFeedback,
} from "../controllers/feedbackController.js";

const router = express.Router();

router.post("/", auth, authorizeRoles("patient"), createFeedback);

router.get("/doctor/:doctorId", getDoctorFeedbacks);

router.delete("/:id", auth, authorizeRoles("patient"), deleteDoctorFeedback);

export default router;

import express from "express";
import { auth, authorizeRoles } from "../middlewares/auth.js";

import {
  createFeedback,
  getDoctorFeedbacks,
  deleteFeedback,
} from "../controllers/feedbackController.js";

const router = express.Router();

router.post("/", auth, authorizeRoles("patient"), createFeedback);

router.get("/doctor/:doctorId", getDoctorFeedbacks);

router.delete("/:id", auth, authorizeRoles("patient"), deleteFeedback);

export default router;

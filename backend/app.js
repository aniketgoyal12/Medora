import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
dotenv.config();
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from './routes/authRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import appoointmentRoutes from './routes/appointmentRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import medicalRecordRoutes from "./routes/medicalRecordRoutes.js";
import feedbackRoutes from './routes/feedbackRoutes.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
connectDB();

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/auth",authRoutes);
app.use("/api/v1/doctor",doctorRoutes);
app.use("/api/v1/patient",patientRoutes);
app.use("/api/v1/appointment",appoointmentRoutes);
app.use("/api/v1/availability",availabilityRoutes);
app.use("/api/v1/prescription" , prescriptionRoutes);
app.use("/api/v1/medicalRecords",medicalRecordRoutes);
app.use("/api/v1/feedback", feedbackRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});

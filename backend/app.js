import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
dotenv.config();

import authRoutes from './routes/authRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import appoointmentRoutes from './routes/appointmentRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';


const app = express();
app.use(express.json());
connectDB();


app.use("/api/v1/auth",authRoutes);
app.use("/api/v1/doctor",doctorRoutes);
app.use("/api/v1/patient",patientRoutes);
app.use("/api/v1/appointment",appoointmentRoutes);
app.use("/api/v1/availability",availabilityRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});

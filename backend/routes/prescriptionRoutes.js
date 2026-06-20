import express from 'express';
import {auth, authorizeRoles} from "../middleware/authMiddleware.js";
import { createPrescription, getPrescription, updatePrescription }  from "../controllers/prescriptionController.js";

const router = express.Router();

router.post(
    "/create",
    auth,
    authorizeRoles("doctor"),
    createPrescription
);

router.get(
    "/:id",
    auth,
    authorizeRoles("doctor","patient"),
    getPrescription
)


router.put(
    "/:id",
    auth,
    authorizeRoles("doctor"),
    updatePrescription
)

export default router;
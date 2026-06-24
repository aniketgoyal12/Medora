import mongoose from "mongoose";

const feedbackSchema = new mongoose.model({
    doctorId :{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Doctor",
        required:true,
    },
    patientId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Patient",
        required:true,
    },
    appointmentId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Appointment",
        required:true,
        unique:true,
    },
    rating:{
        type:Number,
        min:1,
        max:5,
        required:true,
    },

},
{timestamps:true},)

export default mongoose.model("Feedback",feedbackSchema);
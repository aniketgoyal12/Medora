import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    userId:{type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },
    otpHash:{
        type:String,
        required:true,
    },
    type:{
        type:String,
        enum: ["EMAIL_VERIFICATION", "PASSWORD_RESET"],
        required:true,
    },
    expiresAt:{
        type:Date,
        required:true,
    },
    isUsed:{
        type:Boolean,
        default:false,
    },
},
{timestamps:true},
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ userId: 1, type: 1 });

export default mongoose.model("OTP",otpSchema);
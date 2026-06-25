import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import OTP from "../models/OTP.js";
import { compareOTP, generateOTP, hashOTP } from "../utils/otp.js";
import {
  sendVerificationOTP,
  sendPasswordResetOTP,
} from "../services/emailService.js";

const registerUser = async (req, res) => {
  try {
    const { name, username, email, password, mobileno, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).josn({
        success: false,
        message: "User already exists",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      mobileno,
      role,
    });

    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);

    await OTP.create({
      userId: user._id,
      otpHash: hashedOTP,
      type: "EMAIL_VERIFICATION",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    sendVerificationOTP(email, otp);

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Please verify your email using the OTP sent to your email.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
      });
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect Password!",
      });
    }

    const token = jwt.sign(
      {
        _id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );
    res.status(200).json({
      success: true,
      message: "Login Successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    const otpDoc = await OTP.findOne({
      userId: user._id,
      type: "EMAIL_VERIFICATION",
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(404).json({
        success: false,
        message: "OTP not found. Please request a new OTP",
      });
    }

    if (otpDoc.isUsed) {
      return res.status(400).json({
        success: false,
        message: "OTP already used",
      });
    }

    if (otpDoc.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP is expired",
      });
    }

    const isMatch = await compareOTP(otp, otpDoc.otpHash);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    otpDoc.isUsed = true;
    await otpDoc.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now login.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    await OTP.deleteMany({
      userId: user._id,
      type: "EMAIL_VERIFICATION",
      isUsed: false,
    });

    const otp = generateOTP();

    const hashedOTP = await hashOTP(otp);

    await OTP.create({
      userId: user._id,
      type: "EMAIL_VERIFICATION",
      otpHash: hasehdOTP,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendVerificationOTP(user.email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email not verified",
      });
    }

    await OTP.deleteMany({
      userId: user._id,
      type: "PASSWORD_RESET",
      isUsed: false,
    });

    const otp = generateOTP();

    const hashedOTP = await hashOTP(otp);

    await OTP.create({
      userId: user._id,
      type: "PASSWORD_RESET",
      otpHash: hasehdOTP,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendPasswordResetOTP(user.email, otp);

    return res.status(200).json({
      success: true,
      message: "Reset Password OTP sent successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email not verified",
      });
    }

    const otpDoc = await OTP.findOne({
      userId: user._id,
      type: "PASSWORD_RESET",
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(404).json({
        success: false,
        message: "OTP not found. Please request a new OTP.",
      });
    }

    if (otpDoc.isUsed) {
      return res.status(400).json({
        success: false,
        message: "OTP has already been used",
      });
    }

    if (otpDoc.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    const isMatch = await compareOTP(otp, otpDoc.otpHash);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP and new Password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email not verified",
      });
    }

    const otpDoc = await OTP.findOne({
      userId: user._id,
      type: "PASSWORD_RESET",
    }).sort({ createdAt: -1 });

    if (!otpDoc) {
      return res.status(404).json({
        success: false,
        message: "OTP not found. Please request a new OTP",
      });
    }

    if (otpDoc.isUsed) {
      return res.status(400).json({
        success: false,
        message: "OTP has already been used",
      });
    }

    if (otpDoc.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    const isMatch = compareOTP(otp, otpDoc.otpHash);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invlaid OTP",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword);

    user.passsword = hasehdPassword;
    await user.save();

    otpDoc.isUsed = true;
    await otpDoc.save();

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please login with your new password.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export {
  registerUser,
  loginUser,
  getMe,
  verifyEmail,
  resendOTP,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
};

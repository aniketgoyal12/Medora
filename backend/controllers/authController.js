import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import OTP from "../models/OTP.js";
import { compareOTP, generateOTP, hashOTP } from "../utils/otp.js";
import {
  sendVerificationOTP,
  sendPasswordResetOTP,
} from "../services/emailService.js";
import RefreshToken from "../models/RefreshToken.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

const registerUser = async (req, res) => {
  try {
    const { name, username, email, password, mobileno } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
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
      role: "patient",
    });

    const otp = generateOTP();
    const hashedOTP = await hashOTP(otp);

    await OTP.create({
      userId: user._id,
      otpHash: hashedOTP,
      type: "EMAIL_VERIFICATION",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    await sendVerificationOTP(email, otp);

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

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in ",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await RefreshToken.create({
      userId: user._id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login Successful",
      accessToken: accessToken,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const storedToken = await RefreshToken.findOne({
      token,
    });

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.deleteOne({ token });

      return res.status(401).json({
        success: false,
        message: "Refresh token expired. Please login again.",
      });
    }

    const decoded = verifyRefreshToken(token);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Rotate Refresh Token
    await RefreshToken.deleteOne({ token });

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    await RefreshToken.create({
      userId: user._id,
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Refresh token expired. Please login again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: err.message,
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

    user.isEmailVerified = true;
    otpDoc.isUsed = true;

    await Promise.all([user.save(), otpDoc.save()]);

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
    });

    const otp = generateOTP();

    const hashedOTP = await hashOTP(otp);

    await OTP.create({
      userId: user._id,
      type: "EMAIL_VERIFICATION",
      otpHash: hashedOTP,
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
    });

    const otp = generateOTP();

    const hashedOTP = await hashOTP(otp);

    await OTP.create({
      userId: user._id,
      type: "PASSWORD_RESET",
      otpHash: hashedOTP,
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
        message: "Email, OTP and new password are required",
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

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    otpDoc.isUsed = true;
    await otpDoc.save();

    await RefreshToken.deleteMany({
      userId: user._id,
    });

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

const logOut = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const storedToken = await RefreshToken.findOne({
      token,
    });

    if (!storedToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    await RefreshToken.deleteOne({
      token,
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const assignRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: "User ID and role are required",
      });
    }

    const requesterRole = req.user.role;

    if (role === "superAdmin") {
      return res.status(400).json({
        success: false,
        message: "Cannot assign superAdmin role through API",
      });
    }

    if (requesterRole === "admin") {
      if (role === "admin") {
        return res.status(403).json({
          success: false,
          message: "Admins are not authorized to assign the admin role",
        });
      }
      if (!["doctor", "patient"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Admin can only assign doctor or patient roles",
        });
      }
    } else if (requesterRole === "superAdmin") {
      if (!["doctor", "patient", "admin"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role selected",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role assignment",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Role successfully updated to ${role}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
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
  refreshToken,
  logOut,
  assignRole,
};

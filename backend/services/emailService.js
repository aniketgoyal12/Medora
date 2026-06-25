import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationOTP = async (receiverEmail, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: receiverEmail,
      subject: "Verify Your Medora Account",
      text: `Hello,

Your OTP for verifying your Medora account is: ${otp}

This OTP is valid for 10 minutes.

If you did not request this, please ignore this email.

Regards,
Team Medora`,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error("Failed to send verification email");
  }
};

export const sendPasswordResetOTP = async (receiverEmail, otp) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: receiverEmail,
      subject: "Medora Password Reset OTP",
      html: `
        <h2>Reset Your Password</h2>

        <p>Hello,</p>

        <p>We received a request to reset your Medora account password.</p>

        <p>Your OTP is:</p>

        <h1>${otp}</h1>

        <p>This OTP is valid for 10 minutes.</p>

        <p>If you did not request a password reset, please ignore this email.</p>

        <p>Thank you,<br>Team Medora</p>
      `,
    });
  } catch (err) {
    throw new Error("Failed to send password reset OTP email");
  }
};
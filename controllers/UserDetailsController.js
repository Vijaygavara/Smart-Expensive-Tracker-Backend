import User from "../models/UserDetails.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { sendOtpEmail,sendPasswordEmail } from "../config/mail.js";

export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      dob,
      gender,
      education,
      occupation,
    } = req.body;

    // Check required fields
    // if (!name || !email || !mobile || !dob || !gender || !education) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Please provide all required fields",
    //   });
    // }

    // Check user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Generate random password
    const randomPassword =
      Math.random().toString(36).slice(-8) +
      Math.floor(Math.random() * 100);

    // Hash password before storing in DB
    const hashedPassword = await bcrypt.hash(
      randomPassword,
      10
    );

    // Create user
    const user = await User.create({
      name,
      email,
      mobile,
      dob,
      gender,
      education,
      occupation,
      password: hashedPassword,
    });

    // Send random password to user's email
    await sendPasswordEmail(
      user.email,
      user.name,
      randomPassword
    );

    return res.status(201).json({
      success: true,
      message:
        "User registered successfully. Password sent to email.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.log("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


// export const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Check user
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Email or Password",
//       });
//     }

//     // Compare password
//     const isMatch = await bcrypt.compare(
//       password,
//       user.password
//     );

//     if (!isMatch) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Email or Password",
//       });
//     }

//     // Create unique session ID
//     const sessionId = uuidv4();

//     // Store session ID in user
//     user.sessionId = sessionId;
//     await user.save();

//     // Generate JWT
//     const token = jwt.sign(
//       {
//         id: user._id,
//         sessionId,
//       },
//       process.env.JWT_SECRET,
//       {
//         expiresIn: "1d",
//       }
//     );

//     // Send response
//     res.status(200).json({
//       success: true,
//       message: "Login Successful",
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//       },
//     });
//   } catch (error) {
//     console.log(error);

//     res.status(500).json({
//       success: false,
//       message: "Server Error",
//     });
//   }
// };


export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // OTP expires in 5 minutes
    const otpExpiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // Store OTP in User document
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;

    await user.save();

    // Send OTP to user's email
    await sendOtpEmail(user.email, otp);

    // Generate temporary token
    const tempToken = jwt.sign(
      {
        id: user._id,
        purpose: "otp_verification",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "5m",
      }
    );

    console.log("OTP:", otp);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otpRequired: true,
      tempToken,
    });
  } catch (error) {
    console.log("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};



export const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Temporary token not provided",
      });
    }

    const tempToken = authHeader.split(" ")[1];

    if (!tempToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid Authorization header",
      });
    }

    // Verify temporary token
    const decoded = jwt.verify(
      tempToken,
      process.env.JWT_SECRET
    );

    // Make sure token is only for OTP verification
    if (decoded.purpose !== "otp_verification") {
      return res.status(401).json({
        success: false,
        message: "Invalid temporary token",
      });
    }

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if OTP exists
    if (!user.otp || !user.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: "OTP not found",
      });
    }

    // Check OTP expiry
    if (user.otpExpiresAt < new Date()) {
      user.otp = null;
      user.otpExpiresAt = null;

      await user.save();

      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // Check OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // OTP verified successfully
    user.otp = null;
    user.otpExpiresAt = null;

    // Create unique session ID
    const sessionId = uuidv4();

    // Store session ID
    user.sessionId = sessionId;

    await user.save();

    // Generate actual 24-hour JWT
    const token = jwt.sign(
      {
        id: user._id,
        sessionId,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired temporary token",
    });
  }
};
export const resendOtp = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Temporary token not provided",
      });
    }

    const tempToken = authHeader.split(" ")[1];

    if (!tempToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid Authorization header",
      });
    }

    // Verify temporary token
    const decoded = jwt.verify(
      tempToken,
      process.env.JWT_SECRET
    );

    // Make sure token is only for OTP verification
    if (decoded.purpose !== "otp_verification") {
      return res.status(401).json({
        success: false,
        message: "Invalid temporary token",
      });
    }

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Generate new OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // New OTP expires in 5 minutes
    const otpExpiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // Update OTP
    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;

    await user.save();

    // Send new OTP
    await sendOtpEmail(user.email, otp);

    // console.log("Resent OTP:", otp);

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully",
    });

  } catch (error) {
    console.log("Resend OTP error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired temporary token",
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    console.log("logoutUser called");

    await User.findOneAndUpdate(
      { _id: req.user.id },
      { sessionId: null }
    );

    console.log("Session ID set to null");

    res.status(200).json({
      success: true,
      message: "Logout Successful",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email not registered",
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // OTP expires in 5 minutes
    const otpExpiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // Store forgot password OTP
    user.forgotPasswordOtp = otp;
    user.forgotPasswordOtpExpiresAt = otpExpiresAt;

    await user.save();

    // Send OTP to user's email
    await sendOtpEmail(user.email, otp);

    // Generate temporary reset token
    const resetToken = jwt.sign(
      {
        id: user._id,
        purpose: "forgot_password",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "5m",
      }
    );

    console.log("Forgot Password OTP:", otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otpRequired: true,
      resetToken,
    });

  } catch (error) {
    console.log("Forgot password error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Reset token not provided",
      });
    }

    const resetToken = authHeader.split(" ")[1];

    if (!resetToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid Authorization header",
      });
    }

    // Verify temporary reset token
    const decoded = jwt.verify(
      resetToken,
      process.env.JWT_SECRET
    );

    // Make sure token is only for forgot password
    if (decoded.purpose !== "forgot_password") {
      return res.status(401).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if OTP exists
    if (
      !user.forgotPasswordOtp ||
      !user.forgotPasswordOtpExpiresAt
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP not found",
      });
    }

    // Check OTP expiry
    if (user.forgotPasswordOtpExpiresAt < new Date()) {
      user.forgotPasswordOtp = null;
      user.forgotPasswordOtpExpiresAt = null;

      await user.save();

      return res.status(400).json({
        success: false,
        message: "OTP has expired",
      });
    }

    // Check OTP
    if (user.forgotPasswordOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // OTP verified
    user.forgotPasswordOtp = null;
    user.forgotPasswordOtpExpiresAt = null;

    await user.save();

    // Generate token for password reset
    const passwordResetToken = jwt.sign(
      {
        id: user._id,
        purpose: "password_reset",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
      }
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      passwordResetToken,
    });

  } catch (error) {
    console.log("Verify forgot password OTP error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired reset token",
    });
  }
};
export const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Password reset token not provided",
      });
    }

    const passwordResetToken = authHeader.split(" ")[1];

    if (!passwordResetToken) {
      return res.status(401).json({
        success: false,
        message: "Invalid Authorization header",
      });
    }

    // Verify password reset token
    const decoded = jwt.verify(
      passwordResetToken,
      process.env.JWT_SECRET
    );

    // Make sure token is only for password reset
    if (decoded.purpose !== "password_reset") {
      return res.status(401).json({
        success: false,
        message: "Invalid password reset token",
      });
    }

    // Validate new password
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    // Find user
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      10
    );

    // Update password
    user.password = hashedPassword;

    // Invalidate existing session
    user.sessionId = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });

  } catch (error) {
    console.log("Reset password error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired password reset token",
    });
  }
};


export const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Protected Route Accessed",
      user: req.user,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
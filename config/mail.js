import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("PASSWORD EXISTS:", !!process.env.EMAIL_PASSWORD);
console.log("PASSWORD LENGTH:", process.env.EMAIL_PASSWORD?.length);

export const sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Login OTP",
    html: `
      <h2>Expense Tracker Login</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP will expire in 5 minutes.</p>
      <p>Please do not share this OTP with anyone.</p>
    `,
  });
};

export const sendPasswordEmail = async (
  email,
  name,
  password
) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your Expense Tracker Password",
    html: `
      <h2>Welcome to Expense Tracker</h2>

      <p>Hello ${name},</p>

      <p>Your account has been created successfully.</p>

      <p>Your temporary password is:</p>

      <h2>${password}</h2>

      <p>
        Please login using this password and change it
        after your first login.
      </p>

      <p>Do not share your password with anyone.</p>
    `,
  });
};

export const sendForgotPasswordOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Reset Your Expense Tracker Password",
    html: `
      <h2>Expense Tracker - Password Reset</h2>

      <p>You requested to reset your password.</p>

      <p>Your password reset OTP is:</p>

      <h1>${otp}</h1>

      <p>This OTP will expire in 5 minutes.</p>

      <p>If you did not request a password reset, please ignore this email.</p>

      <p>Do not share this OTP with anyone.</p>
    `,
  });
};
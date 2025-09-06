import { transporter } from "./mailer.js";
import {
  WELLCOME_TEMPLATE,
  VERIFICATION_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
} from "./emailTemplate.js";

// ===== WELCOME EMAIL =====
export const sendWellcomeEmail = async (email, username) => {
  try {
    const info = await transporter.sendMail({
		from: '"JudgX" <noreply@yourdomain.com>',
		to: email,
		subject: "Welcome to JudgX",
		html: WELLCOME_TEMPLATE.replace("{username}", username).replace("{clientUrl}", process.env.CLIENT_URL),
	  });

    console.log("Wellcome email sent:", info.messageId);
  } catch (err) {
    console.error("Error sending wellcome", err);
    throw new Error(`Error sending wellcome email: ${err}`);
  }
};

// ===== VERIFICATION EMAIL =====
export const sendVerificationEmail = async (email, code) => {
  try {
    const info = await transporter.sendMail({
      from: '"JudgX" <noreply@demomailtrap.co>',
      to: email,
      subject: "Verify your email",
      html: VERIFICATION_TEMPLATE.replace("{verificationCode}", code),
    });

    console.log("Verification email sent:", info.messageId);
  } catch (err) {
    console.error("Error sending verification", err);
    throw new Error(`Error sending verification email: ${err}`);
  }
};

// ===== RESET PASSWORD REQUEST =====
export const sendResetPasswordRequestEmail = async (email, resetURL) => {
  try {
    const info = await transporter.sendMail({
      from: '"JudgX" <noreply@demomailtrap.co>',
      to: email,
      subject: "Reset your password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
    });

    console.log("Reset password request email sent:", info.messageId);
  } catch (err) {
    console.error("Error sending reset password request", err);
    throw new Error(`Error sending reset password request email: ${err}`);
  }
};

// ===== RESET PASSWORD SUCCESS =====
export const sendResetPasswordSuccessEmail = async (email) => {
  try {
    const info = await transporter.sendMail({
      from: '"JudgX" <noreply@demomailtrap.co>',
      to: email,
      subject: "Password Reset Successful",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
    });

    console.log("Reset password success email sent:", info.messageId);
  } catch (err) {
    console.error("Error sending reset password success", err);
    throw new Error(`Error sending reset password success email: ${err}`);
  }
};

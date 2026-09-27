import dotenv from "dotenv";

dotenv.config();

export const CONFIG = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",

  // Mentor Working Rules
  MENTOR_DEFAULT_TIMEZONE: process.env.MENTOR_DEFAULT_TIMEZONE || "Asia/Kolkata",
  MENTOR_WORK_START_HOUR: parseInt(process.env.MENTOR_WORK_START_HOUR || "10", 10), // 10:00 AM
  MENTOR_WORK_END_HOUR: parseInt(process.env.MENTOR_WORK_END_HOUR || "21", 10),     // 9:00 PM (21:00)
  MENTOR_WORK_DAYS: [1, 2, 3, 4, 5], // Monday (1) to Friday (5)
  MENTOR_MAX_DAILY_CLASSES: parseInt(process.env.MENTOR_MAX_DAILY_CLASSES || "2", 10), // Max 2 demo classes / calendar day
  CLASS_DURATION_MINUTES: parseInt(process.env.CLASS_DURATION_MINUTES || "45", 10),   // 45 minutes trial class

  // Email Config — Gmail SMTP (primary, no domain needed)
  GMAIL_USER: process.env.GMAIL_USER || "",
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || "",
  MENTOR_NOTIFICATION_EMAIL: process.env.MENTOR_NOTIFICATION_EMAIL || "tahashariff2@gmail.com",

  // Email Config — Resend API (supports separate parent and mentor senders)
  PARENT_RESEND_API_KEY: process.env.PARENT_RESEND_API_KEY || process.env.RESEND_API_KEY,
  PARENT_RESEND_FROM: process.env.PARENT_RESEND_FROM || process.env.RESEND_FROM || "Codeyoung <onboarding@resend.dev>",
  MENTOR_RESEND_API_KEY: process.env.MENTOR_RESEND_API_KEY || process.env.RESEND_API_KEY,
  MENTOR_RESEND_FROM: process.env.MENTOR_RESEND_FROM || process.env.RESEND_FROM || "Codeyoung <onboarding@resend.dev>",
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM: process.env.RESEND_FROM || "Codeyoung <onboarding@resend.dev>",

  // Email Config — Generic SMTP (optional)
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_SECURE: process.env.SMTP_SECURE === "true",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || "",
  EMAIL_FROM: process.env.EMAIL_FROM || "",
};

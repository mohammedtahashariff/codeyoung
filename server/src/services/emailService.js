import nodemailer from "nodemailer";
import { CONFIG } from "../config/constants.js";
import { TimezoneService } from "./timezoneService.js";

class EmailService {
  constructor() {
    this.transporter = null;
    this.fromEmail = null;
    this.mode = null; // "gmail" | "resend" | "none"
    this.init();
  }

  init() {
    // ── Priority 1: Resend API ─────────────────────────────────────────────
    if (CONFIG.RESEND_API_KEY) {
      this.fromEmail = CONFIG.RESEND_FROM || "Codeyoung <onboarding@resend.dev>";
      this.mode = "resend";
      console.log(`[EmailService] ✅ Resend API ready (from: ${this.fromEmail})`);
      return;
    }

    // ── Priority 2: Gmail SMTP (App Password) ──────────────────────────────
    if (CONFIG.GMAIL_USER && CONFIG.GMAIL_APP_PASSWORD) {
      try {
        this.transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: CONFIG.GMAIL_USER,
            pass: CONFIG.GMAIL_APP_PASSWORD,
          },
        });
        this.fromEmail = `Codeyoung <${CONFIG.GMAIL_USER}>`;
        this.mode = "gmail";
        console.log(`[EmailService] ✅ Gmail SMTP ready (${CONFIG.GMAIL_USER})`);
        return;
      } catch (err) {
        console.warn("[EmailService] Gmail SMTP init failed:", err.message);
      }
    }

    // ── Priority 3: Generic SMTP ───────────────────────────────────────────
    if (CONFIG.SMTP_USER && CONFIG.SMTP_PASSWORD) {
      try {
        this.transporter = nodemailer.createTransport({
          host: CONFIG.SMTP_HOST || "smtp.gmail.com",
          port: CONFIG.SMTP_PORT || 587,
          secure: CONFIG.SMTP_SECURE || false,
          auth: {
            user: CONFIG.SMTP_USER,
            pass: CONFIG.SMTP_PASSWORD,
          },
        });
        this.fromEmail = CONFIG.EMAIL_FROM || `Codeyoung <${CONFIG.SMTP_USER}>`;
        this.mode = "smtp";
        console.log(`[EmailService] ✅ SMTP ready (${CONFIG.SMTP_HOST})`);
        return;
      } catch (err) {
        console.warn("[EmailService] Generic SMTP init failed:", err.message);
      }
    }

    this.mode = "none";
    console.warn("[EmailService] ⚠️  No email transport configured. Emails will be logged only.");
  }

  /**
   * Core send method — routes to the correct transport
   */
  async send({ to, subject, html, text }) {
    if (this.mode === "gmail" || this.mode === "smtp") {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        html,
        text,
      });
      return { messageId: info.messageId, provider: this.mode };
    }

    if (this.mode === "resend") {
      return this.sendViaResend({ to, subject, html, text });
    }

    // No transport — just log
    console.log(`[EmailService] 📧 [DRY RUN] Would send to: ${to}\nSubject: ${subject}`);
    return { provider: "dry-run" };
  }

  async sendViaResend({ to, subject, html, text, replyTo }) {
    const toList = Array.isArray(to) ? to : [to];

    // Resend sandbox (onboarding@resend.dev) can ONLY deliver to the Resend
    // account owner's email. In sandbox mode, all emails are redirected to
    // the admin inbox. The subject is kept clean — no email addresses shown.
    const isSandbox = this.fromEmail.includes("onboarding@resend.dev");
    if (isSandbox && CONFIG.NODE_ENV === "production") {
      throw new Error(
        "Resend sandbox sender cannot deliver to parents in production. Verify a sending domain and set RESEND_FROM to its sender address."
      );
    }

    const adminEmail = CONFIG.RESEND_ADMIN_EMAIL || CONFIG.MENTOR_NOTIFICATION_EMAIL || "tahashariff2@gmail.com";

    const body = {
      from: this.fromEmail,
      to: isSandbox ? [adminEmail] : toList,
      // Keep subject clean — do NOT expose recipient email in the subject
      subject: subject,
      html,
      text,
      reply_to: replyTo || (isSandbox ? toList[0] : undefined),
    };

    if (isSandbox && toList[0] !== adminEmail) {
      console.log(`[EmailService] ⚠️  Sandbox mode: redirecting email from ${toList.join(", ")} → ${adminEmail}`);
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CONFIG.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || `Resend HTTP ${response.status}`);
    }
    return { messageId: data.id, provider: "resend", sandboxRedirected: isSandbox };
  }

  // ────────────────────────────────────────────────────────────────────────
  // Parent Confirmation Email
  // ────────────────────────────────────────────────────────────────────────
  async sendParentConfirmationEmail({ parent, student, mentor, booking }) {
    try {
      const parentLocal = TimezoneService.formatLocalizedDetails(
        booking.startTimeUtc,
        booking.parentTimezone || parent.timezone
      );

      const subject = `✅ Your Codeyoung Trial Class is Confirmed — ${student.firstName}`;

      const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.7; background: #f8fafc; padding: 20px; border-radius: 16px;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 28px; border-radius: 12px 12px 0 0; color: white; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 8px;">🎉</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Trial Class Confirmed!</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 15px;">Your child's live coding adventure is officially booked.</p>
          </div>

          <!-- Body -->
          <div style="background: #ffffff; padding: 28px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="margin: 0 0 16px 0;">Dear <strong>${parent.fullName}</strong>,</p>
            <p style="margin: 0 0 20px 0;">
              We're thrilled to confirm the <strong>free trial class</strong> for <strong>${student.firstName}</strong> (Grade ${student.grade})!
              Your assigned mentor is ready to make it a fantastic experience. 🚀
            </p>

            <!-- Session Details Card -->
            <div style="background: #f0f4ff; border: 1.5px solid #c7d2fe; border-radius: 10px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 14px 0; color: #4338ca; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">📅 Session Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 5px 0; color: #64748b; width: 140px;">Date</td><td style="padding: 5px 0; font-weight: 600;">${parentLocal.dateDisplay}</td></tr>
                <tr><td style="padding: 5px 0; color: #64748b;">Your Time</td><td style="padding: 5px 0; font-weight: 600;">${parentLocal.timeDisplay} (${parentLocal.zoneAbbr})</td></tr>
                <tr><td style="padding: 5px 0; color: #64748b;">Duration</td><td style="padding: 5px 0; font-weight: 600;">45 minutes</td></tr>
                <tr><td style="padding: 5px 0; color: #64748b;">Mentor</td><td style="padding: 5px 0; font-weight: 600;">${mentor.name}</td></tr>
                <tr><td style="padding: 5px 0; color: #64748b;">Booking ID</td><td style="padding: 5px 0; font-weight: 600; font-family: monospace;">#${booking.id.slice(0, 8).toUpperCase()}</td></tr>
              </table>
            </div>

            <!-- Join Button -->
            <div style="text-align: center; margin: 28px 0;">
              <a href="${booking.classLink}" style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; display: inline-block; letter-spacing: 0.3px;">
                🎓 Join Live Class
              </a>
              <p style="font-size: 12px; color: #94a3b8; margin-top: 10px;">Can't click the button? <a href="${booking.classLink}" style="color: #4f46e5;">${booking.classLink}</a></p>
            </div>

            <!-- Tips -->
            <div style="background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 14px 18px; font-size: 13px; color: #854d0e;">
              <strong>💡 Pro Tips:</strong> Have your child join from a <strong>laptop or desktop</strong> with Chrome or Firefox for the best interactive coding experience. Keep a stable internet connection!
            </div>

            <p style="margin: 24px 0 0 0; font-size: 14px; color: #64748b;">See you in class! 🙌<br><strong>The Codeyoung Team</strong></p>
          </div>
        </div>
      `;

      const text = `
Codeyoung Trial Class Confirmed! 🎉

Dear ${parent.fullName},

Your child ${student.firstName}'s trial class is officially booked!

SESSION DETAILS
───────────────
Date:       ${parentLocal.dateDisplay}
Your Time:  ${parentLocal.timeDisplay} (${parentLocal.zoneAbbr} · ${booking.parentTimezone || parent.timezone})
Duration:   45 minutes
Mentor:     ${mentor.name}
Class Link: ${booking.classLink}
Booking ID: #${booking.id.slice(0, 8).toUpperCase()}

Join using Chrome or Firefox on a laptop/desktop for the best experience.

See you in class!
The Codeyoung Team
      `.trim();

      const result = await this.send({ to: parent.email, subject, html, text });
      console.log(`[EmailService] ✅ Parent confirmation sent to ${parent.email} via ${result.provider} (${result.messageId || ""})`);
      return { success: true, ...result };
    } catch (err) {
      console.error("[EmailService] ❌ Parent confirmation email FAILED:", err.message);
      return { success: false, error: err.message };
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // Mentor Notification Email
  // ────────────────────────────────────────────────────────────────────────
  async sendMentorNotificationEmail({ parent, student, mentor, booking }) {
    try {
      const mentorLocal = TimezoneService.formatLocalizedDetails(
        booking.startTimeUtc,
        booking.mentorTimezone || mentor.timezone
      );

      // Always send to the actual assigned mentor's email.
      // In Resend sandbox mode, sendViaResend() will redirect to adminEmail automatically.
      const mentorEmail = mentor.email;

      const subject = `📚 New Trial Class: ${student.firstName} on ${mentorLocal.dateDisplay}`;

      const html = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.7; background: #f0f9ff; padding: 20px; border-radius: 16px;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 32px 28px; border-radius: 12px 12px 0 0; color: white; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 8px;">📚</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 700;">New Trial Class Assigned!</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 15px;">A student has been matched to your session.</p>
          </div>

          <!-- Body -->
          <div style="background: #ffffff; padding: 28px; border: 1px solid #bae6fd; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="margin: 0 0 16px 0;">Hi <strong>${mentor.name}</strong>,</p>
            <p style="margin: 0 0 20px 0;">
              You have been assigned a trial class with <strong>${student.firstName}</strong>. 
              The parent has already received their confirmation. Please review the details below.
            </p>

            <!-- Session Details -->
            <div style="background: #e0f2fe; border: 1.5px solid #7dd3fc; border-radius: 10px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 14px 0; color: #0369a1; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">📅 Session Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 5px 0; color: #64748b; width: 160px;">Date</td><td style="padding: 5px 0; font-weight: 600;">${mentorLocal.dateDisplay}</td></tr>
                <tr><td style="padding: 5px 0; color: #64748b;">Your Time (IST)</td><td style="padding: 5px 0; font-weight: 600;">${mentorLocal.timeDisplay}</td></tr>
                <tr><td style="padding: 5px 0; color: #64748b;">Duration</td><td style="padding: 5px 0; font-weight: 600;">45 minutes</td></tr>
                <tr><td style="padding: 5px 0; color: #64748b;">Booking ID</td><td style="padding: 5px 0; font-weight: 600; font-family: monospace;">#${booking.id.slice(0, 8).toUpperCase()}</td></tr>
              </table>
            </div>

            <!-- Student Details -->
            <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 10px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 14px 0; color: #166534; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">🧒 Student Profile</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 5px 0; color: #64748b; width: 160px;">Name</td><td style="padding: 5px 0; font-weight: 600;">${student.firstName}</td></tr>
                <tr><td style="padding: 5px 0; color: #64748b;">Age / Grade</td><td style="padding: 5px 0; font-weight: 600;">${student.age} years · Grade ${student.grade}</td></tr>
                <tr><td style="padding: 5px 0; color: #64748b;">Experience</td><td style="padding: 5px 0; font-weight: 600;">${student.codingExperience || "New to coding"}</td></tr>
              </table>
            </div>

            <!-- Parent Contact -->
            <div style="background: #fff7ed; border: 1.5px solid #fdba74; border-radius: 10px; padding: 20px; margin: 20px 0;">
              <h3 style="margin: 0 0 14px 0; color: #9a3412; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px;">👨‍👩‍👧 Parent Contact</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 5px 0; color: #64748b; width: 160px;">Name</td><td style="padding: 5px 0; font-weight: 600;">${parent.fullName}</td></tr>
                <tr><td style="padding: 5px 0; color: #64748b;">Email</td><td style="padding: 5px 0; font-weight: 600;">${parent.email}</td></tr>
                ${parent.phone ? `<tr><td style="padding: 5px 0; color: #64748b;">Phone</td><td style="padding: 5px 0; font-weight: 600;">${parent.phone}</td></tr>` : ""}
              </table>
            </div>

            <!-- Launch Button -->
            <div style="text-align: center; margin: 28px 0;">
              <a href="${booking.classLink}" style="background: linear-gradient(135deg, #0ea5e9, #0284c7); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; display: inline-block;">
                🚀 Launch Class Session
              </a>
              <p style="font-size: 12px; color: #94a3b8; margin-top: 10px;"><a href="${booking.classLink}" style="color: #0284c7;">${booking.classLink}</a></p>
            </div>

            <p style="margin: 0; font-size: 14px; color: #64748b;">Happy teaching! 💻<br><strong>Codeyoung Operations</strong></p>
          </div>
        </div>
      `;

      const text = `
New Trial Class Assigned!

Hi ${mentor.name},

You have been assigned a trial class with ${student.firstName}.

SESSION DETAILS
───────────────
Date:         ${mentorLocal.dateDisplay}
Your Time:    ${mentorLocal.timeDisplay} IST
Duration:     45 minutes
Class Link:   ${booking.classLink}
Booking ID:   #${booking.id.slice(0, 8).toUpperCase()}

STUDENT PROFILE
───────────────
Name:         ${student.firstName}
Age / Grade:  ${student.age} yrs · Grade ${student.grade}
Experience:   ${student.codingExperience || "New to coding"}

PARENT CONTACT
───────────────
Name:         ${parent.fullName}
Email:        ${parent.email}
${parent.phone ? `Phone:        ${parent.phone}` : ""}

Happy teaching!
Codeyoung Operations
      `.trim();

      const result = await this.send({ to: mentorEmail, subject, html, text });
      console.log(`[EmailService] ✅ Mentor notification sent to ${mentorEmail} via ${result.provider} (${result.messageId || ""})`);
      return { success: true, ...result };
    } catch (err) {
      console.error("[EmailService] ❌ Mentor notification email FAILED:", err.message);
      return { success: false, error: err.message };
    }
  }
}

export const emailService = new EmailService();
export default emailService;

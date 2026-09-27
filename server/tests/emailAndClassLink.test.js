import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ClassLinkService } from "../src/services/classLinkService.js";
import { CONFIG } from "../src/config/constants.js";
import { emailService } from "../src/services/emailService.js";

describe("ClassLink and Email Service Tests", () => {
  it("generates unique live-class links for different bookings", () => {
    const link1 = ClassLinkService.generateClassLink("123e4567-e89b-12d3-a456-426614174000");
    const link2 = ClassLinkService.generateClassLink("987fcdeb-51a2-43f7-9876-543210fedcba");

    assert.ok(link1.startsWith("https://live.codeyoung.com/trial/"));
    assert.ok(link2.startsWith("https://live.codeyoung.com/trial/"));
    assert.notStrictEqual(link1, link2);
  });

  it("handles email dispatch errors safely without throwing", async () => {
    // Stub the transport so tests never send email or depend on API credentials.
    const originalSend = emailService.send;
    emailService.send = async () => {
      throw new Error("simulated email provider failure");
    };

    try {
      const result = await emailService.sendParentConfirmationEmail({
        parent: { fullName: "Jane Doe", email: "jane@example.com", timezone: "America/New_York" },
        student: { firstName: "Tim", grade: "Grade 4" },
        mentor: { name: "Alex", timezone: "Asia/Kolkata" },
        booking: {
          id: "test-booking-id",
          startTimeUtc: new Date(),
          classLink: "https://live.codeyoung.com/trial/test",
          parentTimezone: "America/New_York",
        },
      });

      assert.equal(result.success, false);
      assert.match(result.error, /simulated email provider failure/);
    } finally {
      emailService.send = originalSend;
    }
  });

  it("refuses to silently redirect production parent email through the Resend sandbox", async () => {
    const originalNodeEnv = CONFIG.NODE_ENV;
    const originalFromEmail = emailService.fromEmail;
    CONFIG.NODE_ENV = "production";
    emailService.fromEmail = "Codeyoung <onboarding@resend.dev>";

    try {
      await assert.rejects(
        emailService.sendViaResend({
          to: "parent@example.com",
          subject: "Booking confirmed",
          html: "<p>Confirmed</p>",
          text: "Confirmed",
        }),
        /Verify a sending domain and set RESEND_FROM/
      );
    } finally {
      CONFIG.NODE_ENV = originalNodeEnv;
      emailService.fromEmail = originalFromEmail;
    }
  });

  it("sends production email directly to the requested parent with a verified sender", async () => {
    const originalNodeEnv = CONFIG.NODE_ENV;
    const originalFromEmail = emailService.fromEmail;
    const originalApiKey = CONFIG.RESEND_API_KEY;
    const originalFetch = globalThis.fetch;
    let requestBody;

    CONFIG.NODE_ENV = "production";
    CONFIG.RESEND_API_KEY = "test-resend-key";
    emailService.fromEmail = "Codeyoung <bookings@example.com>";
    globalThis.fetch = async (_url, options) => {
      requestBody = JSON.parse(options.body);
      return { ok: true, json: async () => ({ id: "test-email-id" }) };
    };

    try {
      const result = await emailService.sendViaResend({
        to: "parent@example.com",
        subject: "Booking confirmed",
        html: "<p>Confirmed</p>",
        text: "Confirmed",
      });

      assert.deepEqual(requestBody.to, ["parent@example.com"]);
      assert.equal(requestBody.from, "Codeyoung <bookings@example.com>");
      assert.equal(result.sandboxRedirected, false);
    } finally {
      CONFIG.NODE_ENV = originalNodeEnv;
      CONFIG.RESEND_API_KEY = originalApiKey;
      emailService.fromEmail = originalFromEmail;
      globalThis.fetch = originalFetch;
    }
  });

  it("uses separate parent and mentor Resend credentials and sender identities", async () => {
    const originalNodeEnv = CONFIG.NODE_ENV;
    const originalParentKey = CONFIG.PARENT_RESEND_API_KEY;
    const originalMentorKey = CONFIG.MENTOR_RESEND_API_KEY;
    const originalParentFrom = CONFIG.PARENT_RESEND_FROM;
    const originalMentorFrom = CONFIG.MENTOR_RESEND_FROM;
    const originalFetch = globalThis.fetch;
    const authCalls = [];
    const requestBodies = [];

    CONFIG.NODE_ENV = "production";
    CONFIG.PARENT_RESEND_API_KEY = "parent-resend-key";
    CONFIG.MENTOR_RESEND_API_KEY = "mentor-resend-key";
    CONFIG.PARENT_RESEND_FROM = "Codeyoung <bookings@codeyoung.com>";
    CONFIG.MENTOR_RESEND_FROM = "Codeyoung Mentors <mentors@codeyoung.com>";

    globalThis.fetch = async (_url, options) => {
      authCalls.push(options.headers.Authorization);
      requestBodies.push(JSON.parse(options.body));
      return { ok: true, json: async () => ({ id: "test-email-id" }) };
    };

    try {
      await emailService.sendViaResend({
        to: "parent@example.com",
        subject: "Parent booking",
        html: "<p>Parent</p>",
        text: "Parent",
        provider: "parent",
      });

      await emailService.sendViaResend({
        to: "mentor@example.com",
        subject: "Mentor booking",
        html: "<p>Mentor</p>",
        text: "Mentor",
        provider: "mentor",
      });

      assert.deepEqual(authCalls, ["Bearer parent-resend-key", "Bearer mentor-resend-key"]);
      assert.deepEqual(requestBodies[0].to, ["parent@example.com"]);
      assert.deepEqual(requestBodies[1].to, ["mentor@example.com"]);
      assert.equal(requestBodies[0].from, "Codeyoung <bookings@codeyoung.com>");
      assert.equal(requestBodies[1].from, "Codeyoung Mentors <mentors@codeyoung.com>");
    } finally {
      CONFIG.NODE_ENV = originalNodeEnv;
      CONFIG.PARENT_RESEND_API_KEY = originalParentKey;
      CONFIG.MENTOR_RESEND_API_KEY = originalMentorKey;
      CONFIG.PARENT_RESEND_FROM = originalParentFrom;
      CONFIG.MENTOR_RESEND_FROM = originalMentorFrom;
      globalThis.fetch = originalFetch;
    }
  });
});

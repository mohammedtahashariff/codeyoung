import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ClassLinkService } from "../src/services/classLinkService.js";
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
});

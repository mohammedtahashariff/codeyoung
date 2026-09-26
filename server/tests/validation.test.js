import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createBookingSchema } from "../src/validators/bookingValidator.js";
import { getAvailabilitySchema } from "../src/validators/availabilityValidator.js";

describe("Validation Schemas Tests", () => {
  it("validates successful booking payload with required parent and student data", () => {
    const validPayload = {
      parent: {
        fullName: "Sarah Connor",
        email: "sarah@example.com",
        phone: "+1 555 123 4567",
        timezone: "America/New_York",
      },
      student: {
        firstName: "John",
        age: 12,
        grade: "Grade 7",
        codingExperience: "Beginner",
      },
      date: "2026-09-30",
      time: "10:00 AM",
      timezone: "America/New_York",
    };

    const parsed = createBookingSchema.parse(validPayload);
    assert.strictEqual(parsed.parent.fullName, "Sarah Connor");
    assert.strictEqual(parsed.student.firstName, "John");
    assert.strictEqual(parsed.student.age, 12);
  });

  it("passes when student email is omitted (student email is optional)", () => {
    const payload = {
      parent: {
        fullName: "David Miller",
        email: "david@example.com",
        timezone: "Europe/London",
      },
      student: {
        firstName: "Emma",
        age: "10", // String convertible to number
        grade: "Grade 5",
        // student email omitted!
      },
      date: "2026-09-30",
      time: "10:00 AM",
      timezone: "Europe/London",
    };

    const parsed = createBookingSchema.parse(payload);
    assert.strictEqual(parsed.student.age, 10);
    assert.strictEqual(parsed.student.email, undefined);
  });

  it("rejects when parent email is missing or invalid", () => {
    const payload = {
      parent: {
        fullName: "David Miller",
        email: "not-an-email",
        timezone: "America/New_York",
      },
      student: {
        firstName: "Emma",
        age: 10,
        grade: "Grade 5",
      },
      date: "2026-09-30",
      time: "10:00 AM",
      timezone: "America/New_York",
    };

    assert.throws(() => createBookingSchema.parse(payload), (err) => {
      return err.errors.some((e) => e.path.includes("email"));
    });
  });

  it("rejects when timezone is invalid or manual offset", () => {
    const payload = {
      parent: {
        fullName: "David Miller",
        email: "david@example.com",
        timezone: "UTC+5:30", // Invalid manual offset
      },
      student: {
        firstName: "Emma",
        age: 10,
        grade: "Grade 5",
      },
      date: "2026-09-30",
      time: "10:00 AM",
      timezone: "UTC+5:30",
    };

    assert.throws(() => createBookingSchema.parse(payload));
  });

  it("validates availability query params with valid date and timezone", () => {
    const validQuery = {
      date: "2026-09-30",
      timezone: "America/Los_Angeles",
    };

    const parsed = getAvailabilitySchema.parse(validQuery);
    assert.strictEqual(parsed.date, "2026-09-30");
    assert.strictEqual(parsed.timezone, "America/Los_Angeles");
  });

  it("rejects availability query params with invalid date format or timezone", () => {
    assert.throws(() =>
      getAvailabilitySchema.parse({ date: "30-09-2026", timezone: "America/New_York" })
    );
    assert.throws(() =>
      getAvailabilitySchema.parse({ date: "2026-09-30", timezone: "Fake_Zone" })
    );
  });
});

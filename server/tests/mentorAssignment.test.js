import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MentorAssignmentService } from "../src/services/mentorAssignmentService.js";
import { TimezoneService } from "../src/services/timezoneService.js";

// In-memory mock database client to test assignment logic deterministically
class MockDbClient {
  constructor(mentors = [], bookings = []) {
    this.mentorsList = mentors;
    this.bookingsList = bookings;

    this.mentor = {
      findMany: async ({ where }) => {
        return this.mentorsList.filter((m) => (where.active !== undefined ? m.active === where.active : true));
      },
    };

    this.booking = {
      findMany: async ({ where }) => {
        return this.bookingsList.filter((b) => {
          if (where.mentorId && b.mentorId !== where.mentorId) return false;
          if (where.status?.not && b.status === where.status.not) return false;
          if (where.startTimeUtc?.gte && new Date(b.startTimeUtc) < new Date(where.startTimeUtc.gte)) return false;
          if (where.startTimeUtc?.lte && new Date(b.startTimeUtc) > new Date(where.startTimeUtc.lte)) return false;
          return true;
        });
      },
    };
  }
}

describe("Automatic Mentor Assignment Service Tests", () => {
  const mentors = [
    { id: "m1", name: "Mentor One", email: "m1@test.com", timezone: "Asia/Kolkata", active: true, createdAt: new Date() },
    { id: "m2", name: "Mentor Two", email: "m2@test.com", timezone: "Asia/Kolkata", active: true, createdAt: new Date() },
  ];

  it("automatically assigns an active mentor during working hours", async () => {
    // 2026-09-30 (Wednesday) 10:00 AM EDT -> 14:00 UTC (19:30 IST)
    const { startUtc, endUtc } = TimezoneService.parseLocalSlotToUtc("2026-09-30", "10:00 AM", "America/New_York");
    const mockDb = new MockDbClient(mentors, []);

    const result = await MentorAssignmentService.findAvailableMentor({
      startTimeUtc: startUtc,
      endTimeUtc: endUtc,
      dbClient: mockDb,
    });

    assert.strictEqual(result.available, true);
    assert.ok(result.mentor);
    assert.ok(["m1", "m2"].includes(result.mentor.id));
  });

  it("returns exact available mentor IDs for the selected time", async () => {
    const { startUtc, endUtc } = TimezoneService.parseLocalSlotToUtc("2026-09-30", "10:00 AM", "America/New_York");
    const mockDb = new MockDbClient(mentors, []);

    const result = await MentorAssignmentService.getAvailableMentorsCount({
      startTimeUtc: startUtc,
      endTimeUtc: endUtc,
      dbClient: mockDb,
    });

    assert.deepEqual(result.availableMentors.map(({ id }) => id), ["m1", "m2"]);
  });

  it("prevents overlapping bookings for the same mentor", async () => {
    const { startUtc, endUtc } = TimezoneService.parseLocalSlotToUtc("2026-09-30", "10:00 AM", "America/New_York");
    // Existing booking for m1 at the exact same slot
    const existingBookings = [
      {
        id: "b1",
        mentorId: "m1",
        startTimeUtc: startUtc,
        endTimeUtc: endUtc,
        status: "CONFIRMED",
      },
    ];

    const mockDb = new MockDbClient(mentors, existingBookings);

    const result = await MentorAssignmentService.findAvailableMentor({
      startTimeUtc: startUtc,
      endTimeUtc: endUtc,
      dbClient: mockDb,
    });

    // Should assign m2 because m1 is busy with an overlapping booking
    assert.strictEqual(result.available, true);
    assert.strictEqual(result.mentor.id, "m2");
  });

  it("enforces maximum 2 trial classes per mentor per local calendar day", async () => {
    // 2026-09-30 (Wednesday): m1 has 2 bookings on 2026-09-30 IST, m2 has 2 bookings on 2026-09-30 IST
    const slot1 = TimezoneService.parseLocalSlotToUtc("2026-09-30", "09:00 AM", "America/New_York");
    const slot2 = TimezoneService.parseLocalSlotToUtc("2026-09-30", "09:30 AM", "America/New_York");
    const slot3 = TimezoneService.parseLocalSlotToUtc("2026-09-30", "10:00 AM", "America/New_York");
    const slot4 = TimezoneService.parseLocalSlotToUtc("2026-09-30", "10:30 AM", "America/New_York");

    const existingBookings = [
      { id: "b1", mentorId: "m1", startTimeUtc: slot1.startUtc, endTimeUtc: slot1.endUtc, status: "CONFIRMED" },
      { id: "b2", mentorId: "m1", startTimeUtc: slot2.startUtc, endTimeUtc: slot2.endUtc, status: "CONFIRMED" },
      { id: "b3", mentorId: "m2", startTimeUtc: slot3.startUtc, endTimeUtc: slot3.endUtc, status: "CONFIRMED" },
      { id: "b4", mentorId: "m2", startTimeUtc: slot4.startUtc, endTimeUtc: slot4.endUtc, status: "CONFIRMED" },
    ];

    const mockDb = new MockDbClient(mentors, existingBookings);

    // Request 11:00 AM EDT (11:00 AM is free from overlap, BUT both mentors reached 2 classes capacity for the day!)
    const targetSlot = TimezoneService.parseLocalSlotToUtc("2026-09-30", "11:00 AM", "America/New_York");

    const result = await MentorAssignmentService.findAvailableMentor({
      startTimeUtc: targetSlot.startUtc,
      endTimeUtc: targetSlot.endUtc,
      dbClient: mockDb,
    });

    assert.strictEqual(result.available, false);
    assert.match(result.reason, /No mentor is available/i);
  });

  it("returns no availability when slot is outside mentor working hours", async () => {
    // Wednesday 2026-09-30 06:00 PM EDT -> 22:00 UTC -> 03:30 AM IST (outside 10:00 AM - 9:00 PM IST)
    const nightSlot = TimezoneService.parseLocalSlotToUtc("2026-09-30", "06:00 PM", "America/New_York");
    const mockDb = new MockDbClient(mentors, []);

    const result = await MentorAssignmentService.findAvailableMentor({
      startTimeUtc: nightSlot.startUtc,
      endTimeUtc: nightSlot.endUtc,
      dbClient: mockDb,
    });

    assert.strictEqual(result.available, false);
  });
});

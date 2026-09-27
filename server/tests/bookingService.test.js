import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BookingService } from "../src/services/bookingService.js";
import { TimezoneService } from "../src/services/timezoneService.js";

const requestedSlot = TimezoneService.parseLocalSlotToUtc(
  "2026-09-30",
  "10:00 AM",
  "America/New_York"
);

function mockTransaction({ mentor, bookings = [] }) {
  return {
    mentor: {
      findFirst: async ({ where }) =>
        mentor?.id === where.id && mentor.active === where.active ? mentor : null,
      findMany: async () => mentor ? [mentor] : [],
    },
    booking: {
      findMany: async ({ where }) =>
        bookings.filter((booking) => !where.mentorId || booking.mentorId === where.mentorId),
    },
  };
}

describe("BookingService selected mentor assignment", () => {
  const mentor = {
    id: "mentor-selected",
    name: "Selected Mentor",
    timezone: "Asia/Kolkata",
    active: true,
  };

  it("keeps the exact requested mentor when available", async () => {
    const tx = mockTransaction({ mentor });

    const assigned = await BookingService.assignMentor({
      mentorId: mentor.id,
      startUtc: requestedSlot.startUtc,
      endUtc: requestedSlot.endUtc,
      tx,
    });

    assert.equal(assigned.id, mentor.id);
  });

  it("rejects an unavailable requested mentor rather than substituting another", async () => {
    const overlappingBooking = {
      mentorId: mentor.id,
      startTimeUtc: requestedSlot.startUtc,
      endTimeUtc: requestedSlot.endUtc,
      status: "CONFIRMED",
    };
    const tx = mockTransaction({ mentor, bookings: [overlappingBooking] });

    await assert.rejects(
      BookingService.assignMentor({
        mentorId: mentor.id,
        startUtc: requestedSlot.startUtc,
        endUtc: requestedSlot.endUtc,
        tx,
      }),
      (error) => error.statusCode === 409 && /selected mentor/i.test(error.message)
    );
  });

  it("rejects the requested mentor outside their working hours", async () => {
    const outsideHours = TimezoneService.parseLocalSlotToUtc(
      "2026-09-30",
      "06:00 PM",
      "America/New_York"
    );

    await assert.rejects(
      BookingService.assignMentor({
        mentorId: mentor.id,
        startUtc: outsideHours.startUtc,
        endUtc: outsideHours.endUtc,
        tx: mockTransaction({ mentor }),
      }),
      (error) => error.statusCode === 409 && /selected mentor/i.test(error.message)
    );
  });
});

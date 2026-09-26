import test, { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DateTime } from "luxon";
import { TimezoneService } from "../src/services/timezoneService.js";

describe("Timezone & DST Service Tests", () => {
  it("validates correct and incorrect IANA timezones", () => {
    assert.strictEqual(TimezoneService.isValidTimezone("America/New_York"), true);
    assert.strictEqual(TimezoneService.isValidTimezone("Europe/London"), true);
    assert.strictEqual(TimezoneService.isValidTimezone("Asia/Kolkata"), true);
    assert.strictEqual(TimezoneService.isValidTimezone("America/Los_Angeles"), true);
    assert.strictEqual(TimezoneService.isValidTimezone("Invalid/Timezone"), false);
    assert.strictEqual(TimezoneService.isValidTimezone("UTC+5:30"), false); // Should reject manual offset
    assert.strictEqual(TimezoneService.isValidTimezone(""), false);
  });

  it("correctly converts parent time in America/New_York to UTC during Daylight Saving Time (EDT, UTC-4)", () => {
    // Summer date: 2026-07-15 is EDT (UTC-4)
    const slot = TimezoneService.parseLocalSlotToUtc("2026-07-15", "10:00 AM", "America/New_York");
    const dtUtc = DateTime.fromJSDate(slot.startUtc, { zone: "utc" });
    // 10:00 AM EDT -> 14:00 UTC
    assert.strictEqual(dtUtc.hour, 14);
    assert.strictEqual(dtUtc.minute, 0);

    // Mentor time in Asia/Kolkata (UTC+5:30) -> 19:30 (7:30 PM)
    const mentorLocal = TimezoneService.formatLocalTime(slot.startUtc, "Asia/Kolkata");
    assert.strictEqual(mentorLocal, "07:30 PM");
  });

  it("correctly converts parent time in America/New_York to UTC during Standard Time (EST, UTC-5)", () => {
    // Winter date: 2026-12-15 is EST (UTC-5)
    const slot = TimezoneService.parseLocalSlotToUtc("2026-12-15", "10:00 AM", "America/New_York");
    const dtUtc = DateTime.fromJSDate(slot.startUtc, { zone: "utc" });
    // 10:00 AM EST -> 15:00 UTC
    assert.strictEqual(dtUtc.hour, 15);
    assert.strictEqual(dtUtc.minute, 0);

    // Mentor time in Asia/Kolkata (UTC+5:30) -> 20:30 (8:30 PM)
    const mentorLocal = TimezoneService.formatLocalTime(slot.startUtc, "Asia/Kolkata");
    assert.strictEqual(mentorLocal, "08:30 PM");
  });

  it("correctly handles Europe/London DST changes (BST UTC+1 vs GMT UTC+0)", () => {
    // Summer (BST): 2026-06-10 10:00 AM BST -> 09:00 UTC
    const summerSlot = TimezoneService.parseLocalSlotToUtc("2026-06-10", "10:00 AM", "Europe/London");
    assert.strictEqual(DateTime.fromJSDate(summerSlot.startUtc, { zone: "utc" }).hour, 9);

    // Winter (GMT): 2026-12-10 10:00 AM GMT -> 10:00 UTC
    const winterSlot = TimezoneService.parseLocalSlotToUtc("2026-12-10", "10:00 AM", "Europe/London");
    assert.strictEqual(DateTime.fromJSDate(winterSlot.startUtc, { zone: "utc" }).hour, 10);
  });

  it("calculates mentor local calendar day accurately across day boundaries", () => {
    // 2026-09-30 08:30 PM EDT (UTC-4) -> UTC: 2026-10-01 00:30 UTC -> Asia/Kolkata: 2026-10-01 06:00 AM
    const slot = TimezoneService.parseLocalSlotToUtc("2026-09-30", "08:30 PM", "America/New_York");
    const mentorDateStr = TimezoneService.getMentorLocalDateString(slot.startUtc, "Asia/Kolkata");
    assert.strictEqual(mentorDateStr, "2026-10-01"); // Next calendar day in India!
  });

  it("enforces mentor working hours (10:00 AM to 9:00 PM Asia/Kolkata, Monday-Friday)", () => {
    // Wednesday 2026-09-30 10:00 AM EDT -> 14:00 UTC -> 19:30 (7:30 PM) IST -> Within 10:00 AM - 9:00 PM IST (working hours)
    const validSlot = TimezoneService.parseLocalSlotToUtc("2026-09-30", "10:00 AM", "America/New_York");
    assert.strictEqual(
      TimezoneService.isWithinMentorWorkingHours(validSlot.startUtc, 45, "Asia/Kolkata"),
      true
    );

    // Wednesday 2026-09-30 02:00 AM EDT -> 06:00 UTC -> 11:30 AM IST -> Within working hours
    const morningSlot = TimezoneService.parseLocalSlotToUtc("2026-09-30", "02:00 AM", "America/New_York");
    assert.strictEqual(
      TimezoneService.isWithinMentorWorkingHours(morningSlot.startUtc, 45, "Asia/Kolkata"),
      true
    );

    // Wednesday 2026-09-30 05:00 PM EDT -> 21:00 UTC -> 02:30 AM IST (next day) -> OUTSIDE working hours
    const nightSlot = TimezoneService.parseLocalSlotToUtc("2026-09-30", "05:00 PM", "America/New_York");
    assert.strictEqual(
      TimezoneService.isWithinMentorWorkingHours(nightSlot.startUtc, 45, "Asia/Kolkata"),
      false
    );

    // Sunday 2026-10-04 -> Weekend -> OUTSIDE working hours
    const weekendSlot = TimezoneService.parseLocalSlotToUtc("2026-10-04", "10:00 AM", "America/New_York");
    assert.strictEqual(
      TimezoneService.isWithinMentorWorkingHours(weekendSlot.startUtc, 45, "Asia/Kolkata"),
      false
    );
  });
});

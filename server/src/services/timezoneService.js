import { DateTime } from "luxon";
import { CONFIG } from "../config/constants.js";

export class TimezoneService {
  /**
   * Validate IANA timezone identifier
   * @param {string} timezone
   * @returns {boolean}
   */
  static isValidTimezone(timezone) {
    if (!timezone || typeof timezone !== "string") return false;
    
    // Disallow manual offsets like UTC+5:30, UTC-5, GMT+1
    if (/^(UTC|GMT)[\+\-]/i.test(timezone.trim())) {
      return false;
    }

    try {
      // Check official IANA list if available
      if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
        const supported = Intl.supportedValuesOf("timeZone");
        if (supported.includes(timezone)) return true;
      }
      
      // Fallback: verify with Intl.DateTimeFormat
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      const dt = DateTime.now().setZone(timezone);
      return dt.isValid && !timezone.startsWith("fixed-");
    } catch {
      return false;
    }
  }

  /**
   * Parse a date and time string in a specific timezone and convert to UTC
   * @param {string} dateStr - e.g. "2026-09-30"
   * @param {string} timeStr - e.g. "10:00 AM" or "10:00"
   * @param {string} timezone - e.g. "America/New_York"
   * @returns {{ startUtc: Date, endUtc: Date, startUtcIso: string, endUtcIso: string }}
   */
  static parseLocalSlotToUtc(dateStr, timeStr, timezone) {
    let localDt;

    // Try parsing "yyyy-MM-dd hh:mm a" (e.g. 2026-09-30 10:00 AM)
    if (timeStr.includes("AM") || timeStr.includes("PM")) {
      const combined = `${dateStr} ${timeStr.trim()}`;
      localDt = DateTime.fromFormat(combined, "yyyy-MM-dd hh:mm a", { zone: timezone });
      if (!localDt.isValid) {
        localDt = DateTime.fromFormat(combined, "yyyy-MM-dd h:mm a", { zone: timezone });
      }
    } else {
      const combined = `${dateStr}T${timeStr.trim()}`;
      localDt = DateTime.fromISO(combined, { zone: timezone });
    }

    if (!localDt.isValid) {
      throw new Error(`Invalid date/time/timezone: date="${dateStr}", time="${timeStr}", tz="${timezone}"`);
    }

    const startUtcDt = localDt.toUTC();
    const endUtcDt = startUtcDt.plus({ minutes: CONFIG.CLASS_DURATION_MINUTES });

    return {
      startUtc: startUtcDt.toJSDate(),
      endUtc: endUtcDt.toJSDate(),
      startUtcIso: startUtcDt.toISO(),
      endUtcIso: endUtcDt.toISO(),
    };
  }

  /**
   * Convert ISO UTC string to Date objects
   * @param {string|Date} startTime
   * @param {number} [durationMinutes=45]
   * @returns {{ startUtc: Date, endUtc: Date, startUtcIso: string, endUtcIso: string }}
   */
  static parseUtcTimestamp(startTime, durationMinutes = CONFIG.CLASS_DURATION_MINUTES) {
    const startDt = typeof startTime === "string" 
      ? DateTime.fromISO(startTime, { zone: "utc" })
      : DateTime.fromJSDate(startTime, { zone: "utc" });

    if (!startDt.isValid) {
      throw new Error(`Invalid UTC timestamp: ${startTime}`);
    }

    const endDt = startDt.plus({ minutes: durationMinutes });

    return {
      startUtc: startDt.toJSDate(),
      endUtc: endDt.toJSDate(),
      startUtcIso: startDt.toISO(),
      endUtcIso: endDt.toISO(),
    };
  }

  /**
   * Format a UTC date into a localized string for display
   * @param {Date|string} utcDate
   * @param {string} timezone
   * @param {string} [format="hh:mm a"]
   * @returns {string}
   */
  static formatLocalTime(utcDate, timezone, format = "hh:mm a") {
    const dt = typeof utcDate === "string"
      ? DateTime.fromISO(utcDate, { zone: "utc" }).setZone(timezone)
      : DateTime.fromJSDate(utcDate, { zone: "utc" }).setZone(timezone);

    if (!dt.isValid) return "";
    return dt.toFormat(format);
  }

  /**
   * Format full localized date/time string with timezone abbreviation
   * e.g. "10:00 AM EDT (Eastern Daylight Time)"
   * @param {Date|string} utcDate
   * @param {string} timezone
   * @returns {{ timeDisplay: string, dateDisplay: string, fullDisplay: string, zoneAbbr: string }}
   */
  static formatLocalizedDetails(utcDate, timezone) {
    const dt = typeof utcDate === "string"
      ? DateTime.fromISO(utcDate, { zone: "utc" }).setZone(timezone)
      : DateTime.fromJSDate(utcDate, { zone: "utc" }).setZone(timezone);

    if (!dt.isValid) {
      return { timeDisplay: "", dateDisplay: "", fullDisplay: "", zoneAbbr: "" };
    }

    return {
      timeDisplay: dt.toFormat("h:mm a"),
      dateDisplay: dt.toFormat("cccc, MMMM d, yyyy"),
      fullDisplay: `${dt.toFormat("h:mm a")} ${dt.offsetNameShort || dt.zoneName}`,
      zoneAbbr: dt.offsetNameShort || dt.zoneName,
    };
  }

  /**
   * Get mentor local calendar date string (YYYY-MM-DD) from UTC timestamp
   * @param {Date|string} utcDate
   * @param {string} mentorTimezone
   * @returns {string} e.g. "2026-09-30"
   */
  static getMentorLocalDateString(utcDate, mentorTimezone = CONFIG.MENTOR_DEFAULT_TIMEZONE) {
    const dt = typeof utcDate === "string"
      ? DateTime.fromISO(utcDate, { zone: "utc" }).setZone(mentorTimezone)
      : DateTime.fromJSDate(utcDate, { zone: "utc" }).setZone(mentorTimezone);

    return dt.toFormat("yyyy-MM-dd");
  }

  /**
   * Get UTC range for a full calendar day in mentor's timezone
   * @param {string} mentorDateStr - "YYYY-MM-DD"
   * @param {string} mentorTimezone - "Asia/Kolkata"
   * @returns {{ startOfDayUtc: Date, endOfDayUtc: Date }}
   */
  static getMentorLocalDayRangeUtc(mentorDateStr, mentorTimezone = CONFIG.MENTOR_DEFAULT_TIMEZONE) {
    const startLocal = DateTime.fromISO(mentorDateStr, { zone: mentorTimezone }).startOf("day");
    const endLocal = DateTime.fromISO(mentorDateStr, { zone: mentorTimezone }).endOf("day");

    return {
      startOfDayUtc: startLocal.toUTC().toJSDate(),
      endOfDayUtc: endLocal.toUTC().toJSDate(),
    };
  }

  /**
   * Check if requested slot falls within mentor's working hours in mentor's timezone
   * @param {Date|string} utcStartDate
   * @param {number} durationMinutes
   * @param {string} [mentorTimezone=CONFIG.MENTOR_DEFAULT_TIMEZONE]
   * @returns {boolean}
   */
  static isWithinMentorWorkingHours(
    utcStartDate,
    durationMinutes = CONFIG.CLASS_DURATION_MINUTES,
    mentorTimezone = CONFIG.MENTOR_DEFAULT_TIMEZONE
  ) {
    const dt = typeof utcStartDate === "string"
      ? DateTime.fromISO(utcStartDate, { zone: "utc" }).setZone(mentorTimezone)
      : DateTime.fromJSDate(utcStartDate, { zone: "utc" }).setZone(mentorTimezone);

    if (!dt.isValid) return false;

    // Check weekday (1 = Monday, ..., 5 = Friday)
    if (!CONFIG.MENTOR_WORK_DAYS.includes(dt.weekday)) {
      return false;
    }

    const startMinutes = dt.hour * 60 + dt.minute;
    const endMinutes = startMinutes + durationMinutes;

    const workStartMinutes = CONFIG.MENTOR_WORK_START_HOUR * 60; // 10 * 60 = 600
    const workEndMinutes = CONFIG.MENTOR_WORK_END_HOUR * 60;     // 21 * 60 = 1260

    return startMinutes >= workStartMinutes && endMinutes <= workEndMinutes;
  }
}

export default TimezoneService;

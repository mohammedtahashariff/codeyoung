import { DateTime } from "luxon";
import { CONFIG } from "../config/constants.js";
import { TimezoneService } from "./timezoneService.js";
import { MentorAssignmentService } from "./mentorAssignmentService.js";

// Standard trial slots commonly presented in UI
const DEFAULT_SLOT_TIMES = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
  "05:30 PM",
  "06:00 PM",
  "06:30 PM",
  "07:00 PM",
  "07:30 PM",
];

export class AvailabilityService {
  /**
   * Get available trial class slots for a given date and parent timezone
   * @param {Object} params
   * @param {string} params.date - "YYYY-MM-DD"
   * @param {string} params.timezone - IANA timezone (e.g. "America/New_York")
   * @param {string[]} [params.requestedTimes] - Optional custom slot list
   * @returns {Promise<{ success: boolean, date: string, timezone: string, slots: Array }>}
   */
  static async getAvailability({ date, timezone, requestedTimes }) {
    if (!TimezoneService.isValidTimezone(timezone)) {
      throw new Error(`Invalid timezone identifier: ${timezone}`);
    }

    const slotLabels = requestedTimes && requestedTimes.length > 0
      ? requestedTimes
      : DEFAULT_SLOT_TIMES;

    const slots = [];

    for (const timeLabel of slotLabels) {
      let slotTimes;
      try {
        slotTimes = TimezoneService.parseLocalSlotToUtc(
          date,
          timeLabel,
          timezone
        );
      } catch {
        slots.push({
          time: timeLabel,
          available: false,
          remainingMentors: 0,
          localDisplay: timeLabel,
          mentorDisplay: "Unavailable",
          mentorPreview: null,
          availableMentors: [],
        });
        continue;
      }

      const { startUtc, endUtc, startUtcIso, endUtcIso } = slotTimes;
      const mentorTimeDisplay = TimezoneService.formatLocalTime(
        startUtc,
        CONFIG.MENTOR_DEFAULT_TIMEZONE,
        "h:mm a"
      ) + " IST";

      // Let database errors reach the controller instead of reporting false unavailability.
      const { available, count, previewMentor, availableMentors } = await MentorAssignmentService.getAvailableMentorsCount({
        startTimeUtc: startUtc,
        endTimeUtc: endUtc,
      });

      slots.push({
        time: timeLabel,
        startTimeUtc: startUtcIso,
        endTimeUtc: endUtcIso,
        available,
        remainingMentors: count,
        localDisplay: timeLabel,
        mentorDisplay: mentorTimeDisplay,
        mentorPreview: previewMentor ? { id: previewMentor.id, name: previewMentor.name } : null,
        availableMentors,
      });
    }

    // Calculate total daily parent capacity (10 mentors x 2 classes = max 20 parents/day)
    const { startOfDayUtc, endOfDayUtc } = TimezoneService.getMentorLocalDayRangeUtc(
      date,
      CONFIG.MENTOR_DEFAULT_TIMEZONE
    );
    const dayBookingsCount = await MentorAssignmentService.getDayBookingsCount({
      startOfDayUtc,
      endOfDayUtc,
    });

    const totalCapacity = CONFIG.TOTAL_PARENT_DAILY_CAPACITY || 20;
    const dt = DateTime.fromISO(date, { zone: timezone });
    const isWeekend = dt.weekday === 6 || dt.weekday === 7;
    const remainingCapacity = isWeekend ? 0 : Math.max(0, totalCapacity - dayBookingsCount);

    return {
      success: true,
      date,
      timezone,
      totalCapacity,
      remainingCapacity,
      bookedCount: dayBookingsCount,
      slots,
    };
  }
}

export default AvailabilityService;

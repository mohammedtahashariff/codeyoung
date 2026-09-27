import { prisma } from "../config/prisma.js";
import { CONFIG } from "../config/constants.js";
import { TimezoneService } from "./timezoneService.js";

export class MentorAssignmentService {
  /**
   * Find an eligible and available mentor for the requested UTC time slot.
   * Checks:
   * 1. Mentor is active
   * 2. Slot is within mentor's local working hours
   * 3. Mentor has not exceeded daily capacity (max 2 classes on their local calendar day)
   * 4. Mentor has no overlapping bookings
   *
   * @param {Object} params
   * @param {Date} params.startTimeUtc
   * @param {Date} params.endTimeUtc
   * @param {Object} [params.dbClient=prisma] - Database transaction or prisma client
   * @returns {Promise<{ available: boolean, mentor?: Object, reason?: string }>}
   */
  static async findAvailableMentor({ startTimeUtc, endTimeUtc, dbClient = prisma }) {
    // 1. Fetch all active mentors
    const activeMentors = await dbClient.mentor.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
    });

    if (!activeMentors || activeMentors.length === 0) {
      return { available: false, reason: "No active mentors configured in the system" };
    }

    const availableMentorsWithLoad = [];

    for (const mentor of activeMentors) {
      const mentorTz = mentor.timezone || CONFIG.MENTOR_DEFAULT_TIMEZONE;

      // 2. Check if the slot is within the mentor's working hours
      const isWorking = TimezoneService.isWithinMentorWorkingHours(
        startTimeUtc,
        CONFIG.CLASS_DURATION_MINUTES,
        mentorTz
      );

      if (!isWorking) {
        continue;
      }

      // 3. Compute mentor's local calendar day and corresponding UTC range
      const mentorLocalDateStr = TimezoneService.getMentorLocalDateString(startTimeUtc, mentorTz);
      const { startOfDayUtc, endOfDayUtc } = TimezoneService.getMentorLocalDayRangeUtc(
        mentorLocalDateStr,
        mentorTz
      );

      // Query mentor's non-cancelled bookings for their local calendar day
      const dayBookings = await dbClient.booking.findMany({
        where: {
          mentorId: mentor.id,
          status: { not: "CANCELLED" },
          startTimeUtc: {
            gte: startOfDayUtc,
            lte: endOfDayUtc,
          },
        },
      });

      // 4. Check daily capacity (max 2 trial classes per local calendar day)
      if (dayBookings.length >= CONFIG.MENTOR_MAX_DAILY_CLASSES) {
        continue;
      }

      // 5. Check overlapping bookings for this mentor
      // Overlap condition: existing.startTimeUtc < requestedEndUtc AND existing.endTimeUtc > requestedStartUtc
      const hasOverlap = dayBookings.some((b) => {
        const bStart = new Date(b.startTimeUtc).getTime();
        const bEnd = new Date(b.endTimeUtc).getTime();
        const reqStart = startTimeUtc.getTime();
        const reqEnd = endTimeUtc.getTime();
        return bStart < reqEnd && bEnd > reqStart;
      });

      if (hasOverlap) {
        continue;
      }

      // Mentor is available! Track daily load for fair load-balancing
      availableMentorsWithLoad.push({
        mentor,
        dailyLoad: dayBookings.length,
      });
    }

    if (availableMentorsWithLoad.length === 0) {
      return {
        available: false,
        reason: "No mentor is available for this time slot. Please choose another time.",
      };
    }

    // Load balancing: pick the mentor with fewest bookings on their local calendar day
    availableMentorsWithLoad.sort((a, b) => a.dailyLoad - b.dailyLoad);
    const selectedMentor = availableMentorsWithLoad[0].mentor;

    return {
      available: true,
      mentor: selectedMentor,
      availableCount: availableMentorsWithLoad.length,
    };
  }

  /**
   * Count available mentors for a specific time slot (used for availability queries)
   * @param {Object} params
   * @param {Date} params.startTimeUtc
   * @param {Date} params.endTimeUtc
   * @param {Object} [params.dbClient=prisma]
   * @returns {Promise<{ available: boolean, count: number, previewMentor?: Object }>}
   */
  static async getAvailableMentorsCount({ startTimeUtc, endTimeUtc, dbClient = prisma }) {
    const activeMentors = await dbClient.mentor.findMany({
      where: { active: true },
    });

    if (!activeMentors || activeMentors.length === 0) {
      return { available: false, count: 0, availableMentors: [] };
    }

    let count = 0;
    let previewMentor = null;
    const availableMentors = [];

    for (const mentor of activeMentors) {
      const mentorTz = mentor.timezone || CONFIG.MENTOR_DEFAULT_TIMEZONE;

      if (!TimezoneService.isWithinMentorWorkingHours(startTimeUtc, CONFIG.CLASS_DURATION_MINUTES, mentorTz)) {
        continue;
      }

      const mentorLocalDateStr = TimezoneService.getMentorLocalDateString(startTimeUtc, mentorTz);
      const { startOfDayUtc, endOfDayUtc } = TimezoneService.getMentorLocalDayRangeUtc(
        mentorLocalDateStr,
        mentorTz
      );

      const dayBookings = await dbClient.booking.findMany({
        where: {
          mentorId: mentor.id,
          status: { not: "CANCELLED" },
          startTimeUtc: {
            gte: startOfDayUtc,
            lte: endOfDayUtc,
          },
        },
      });

      if (dayBookings.length >= CONFIG.MENTOR_MAX_DAILY_CLASSES) {
        continue;
      }

      const hasOverlap = dayBookings.some((b) => {
        const bStart = new Date(b.startTimeUtc).getTime();
        const bEnd = new Date(b.endTimeUtc).getTime();
        return bStart < endTimeUtc.getTime() && bEnd > startTimeUtc.getTime();
      });

      if (!hasOverlap) {
        count++;
        availableMentors.push({ id: mentor.id, name: mentor.name });
        if (!previewMentor) {
          previewMentor = mentor;
        }
      }
    }

    return {
      available: count > 0,
      count,
      previewMentor,
      availableMentors,
    };
  }

  /**
   * Count total non-cancelled bookings across all mentors for a given day range
   */
  static async getDayBookingsCount({ startOfDayUtc, endOfDayUtc, dbClient = prisma }) {
    try {
      return await dbClient.booking.count({
        where: {
          status: { not: "CANCELLED" },
          startTimeUtc: {
            gte: startOfDayUtc,
            lte: endOfDayUtc,
          },
        },
      });
    } catch (err) {
      return 0;
    }
  }
}

export default MentorAssignmentService;

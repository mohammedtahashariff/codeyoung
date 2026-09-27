import { prisma } from "../config/prisma.js";
import { CONFIG } from "../config/constants.js";
import { TimezoneService } from "./timezoneService.js";
import { MentorAssignmentService } from "./mentorAssignmentService.js";
import { ClassLinkService } from "./classLinkService.js";
import { emailService } from "./emailService.js";

export class BookingService {
  static async assignMentor({ mentorId, startUtc, endUtc, tx }) {
    if (!mentorId) {
      const assignment = await MentorAssignmentService.findAvailableMentor({
        startTimeUtc: startUtc,
        endTimeUtc: endUtc,
        dbClient: tx,
      });

      if (!assignment.available || !assignment.mentor) {
        const conflictErr = new Error(
          assignment.reason || "No mentor is available for this time slot. Please choose another time."
        );
        conflictErr.statusCode = 409;
        throw conflictErr;
      }

      return assignment.mentor;
    }

    const requestedMentor = await tx.mentor.findFirst({
      where: { id: mentorId, active: true },
    });

    const conflictErr = new Error(
      "Your selected mentor is no longer available for this time. Please choose another mentor or time slot."
    );
    conflictErr.statusCode = 409;

    if (!requestedMentor) {
      throw conflictErr;
    }

    const mentorTz = requestedMentor.timezone || CONFIG.MENTOR_DEFAULT_TIMEZONE;
    if (!TimezoneService.isWithinMentorWorkingHours(startUtc, CONFIG.CLASS_DURATION_MINUTES, mentorTz)) {
      throw conflictErr;
    }

    const mentorLocalDate = TimezoneService.getMentorLocalDateString(startUtc, mentorTz);
    const { startOfDayUtc, endOfDayUtc } = TimezoneService.getMentorLocalDayRangeUtc(
      mentorLocalDate,
      mentorTz
    );
    const dayBookings = await tx.booking.findMany({
      where: {
        mentorId: requestedMentor.id,
        status: { not: "CANCELLED" },
        startTimeUtc: { gte: startOfDayUtc, lte: endOfDayUtc },
      },
    });

    const hasOverlap = dayBookings.some((booking) =>
      new Date(booking.startTimeUtc) < endUtc && new Date(booking.endTimeUtc) > startUtc
    );
    if (hasOverlap || dayBookings.length >= CONFIG.MENTOR_MAX_DAILY_CLASSES) {
      throw conflictErr;
    }

    return requestedMentor;
  }

  /**
   * Create a trial class booking atomically
   * @param {Object} payload
   * @param {Object} payload.parent - { fullName, email, phone, timezone }
   * @param {Object} payload.student - { firstName, age, grade, codingExperience, email }
   * @param {string} [payload.startTime] - ISO string or local slot info
   * @param {string} [payload.date] - Optional if startTime is ISO
   * @param {string} [payload.time] - Optional if startTime is ISO
   * @param {string} [payload.timezone] - Parent's timezone
   * @returns {Promise<Object>}
   */
  static async createBooking(payload) {
    const { parent: parentData, student: studentData } = payload;
    const parentTimezone = payload.parent?.timezone || payload.timezone || "America/New_York";

    if (!TimezoneService.isValidTimezone(parentTimezone)) {
      const err = new Error(`Invalid timezone: ${parentTimezone}`);
      err.statusCode = 400;
      throw err;
    }

    // Determine UTC start and end timestamps
    let startUtc, endUtc, startUtcIso, endUtcIso;
    if (payload.date && payload.time) {
      const parsed = TimezoneService.parseLocalSlotToUtc(payload.date, payload.time, parentTimezone);
      startUtc = parsed.startUtc;
      endUtc = parsed.endUtc;
      startUtcIso = parsed.startUtcIso;
      endUtcIso = parsed.endUtcIso;
    } else if (payload.startTime) {
      const parsed = TimezoneService.parseUtcTimestamp(payload.startTime, CONFIG.CLASS_DURATION_MINUTES);
      startUtc = parsed.startUtc;
      endUtc = parsed.endUtc;
      startUtcIso = parsed.startUtcIso;
      endUtcIso = parsed.endUtcIso;
    } else {
      const err = new Error("Booking date and time or startTime is required");
      err.statusCode = 400;
      throw err;
    }

    // Use Prisma transaction for atomic concurrency / double booking protection
    const result = await prisma.$transaction(async (tx) => {
      // Never silently substitute another mentor after the parent chose one.
      const assignedMentor = await BookingService.assignMentor({
        mentorId: payload.mentorId,
        startUtc,
        endUtc,
        tx,
      });

      // 2. Create or find Parent
      let parent = await tx.parent.findFirst({
        where: { email: parentData.email.trim().toLowerCase() },
      });

      if (parent) {
        parent = await tx.parent.update({
          where: { id: parent.id },
          data: {
            fullName: parentData.fullName.trim(),
            phone: parentData.phone ? parentData.phone.trim() : parent.phone,
            timezone: parentTimezone,
          },
        });
      } else {
        parent = await tx.parent.create({
          data: {
            fullName: parentData.fullName.trim(),
            email: parentData.email.trim().toLowerCase(),
            phone: parentData.phone ? parentData.phone.trim() : null,
            timezone: parentTimezone,
          },
        });
      }

      // 3. Create Student
      const student = await tx.student.create({
        data: {
          firstName: studentData.firstName.trim(),
          age: parseInt(studentData.age, 10),
          grade: String(studentData.grade),
          codingExperience: studentData.codingExperience ? studentData.codingExperience.trim() : null,
          email: studentData.email ? studentData.email.trim().toLowerCase() : null,
        },
      });

      // 4. Generate dummy class link
      const tempBookingId = `CY-${Date.now().toString().slice(-4)}`;
      const classLink = ClassLinkService.generateClassLink(tempBookingId);

      // 5. Create Booking
      const booking = await tx.booking.create({
        data: {
          parentId: parent.id,
          studentId: student.id,
          mentorId: assignedMentor.id,
          startTimeUtc: startUtc,
          endTimeUtc: endUtc,
          parentTimezone: parentTimezone,
          mentorTimezone: assignedMentor.timezone || CONFIG.MENTOR_DEFAULT_TIMEZONE,
          status: "CONFIRMED",
          classLink,
        },
        include: {
          parent: true,
          student: true,
          mentor: true,
        },
      });

      return { booking, parent, student, mentor: assignedMentor };
    });

    const { booking, parent, student, mentor } = result;

    // Dispatch confirmation emails asynchronously in background without blocking or failing booking
    setImmediate(async () => {
      try {
        await emailService.sendParentConfirmationEmail({ parent, student, mentor, booking });
        await emailService.sendMentorNotificationEmail({ parent, student, mentor, booking });
      } catch (emailErr) {
        console.warn("[BookingService] Non-fatal email dispatch error:", emailErr.message);
      }
    });

    // Format local displays
    const parentLocal = TimezoneService.formatLocalizedDetails(booking.startTimeUtc, booking.parentTimezone);
    const mentorLocal = TimezoneService.formatLocalizedDetails(booking.startTimeUtc, booking.mentorTimezone);

    return {
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        classLink: booking.classLink,
        startTimeUtc: booking.startTimeUtc.toISOString(),
        endTimeUtc: booking.endTimeUtc.toISOString(),
        parentTime: parentLocal.timeDisplay,
        parentDate: parentLocal.dateDisplay,
        parentTimezone: booking.parentTimezone,
        mentorTime: mentorLocal.timeDisplay + " IST",
        mentorDate: mentorLocal.dateDisplay,
        mentorTimezone: booking.mentorTimezone,
        parent: {
          id: parent.id,
          fullName: parent.fullName,
          email: parent.email,
          phone: parent.phone,
          timezone: parent.timezone,
        },
        student: {
          id: student.id,
          firstName: student.firstName,
          age: student.age,
          grade: student.grade,
          codingExperience: student.codingExperience,
          email: student.email,
        },
        mentor: {
          id: mentor.id,
          name: mentor.name,
          email: mentor.email,
          role: "Coding Mentor",
          timezone: mentor.timezone,
        },
      },
    };
  }

  /**
   * Get booking by ID
   * @param {string} id
   * @returns {Promise<Object>}
   */
  static async getBookingById(id) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        parent: true,
        student: true,
        mentor: true,
      },
    });

    if (!booking) {
      const err = new Error("Booking not found");
      err.statusCode = 404;
      throw err;
    }

    const parentLocal = TimezoneService.formatLocalizedDetails(booking.startTimeUtc, booking.parentTimezone);
    const mentorLocal = TimezoneService.formatLocalizedDetails(booking.startTimeUtc, booking.mentorTimezone);

    return {
      success: true,
      booking: {
        id: booking.id,
        status: booking.status,
        classLink: booking.classLink,
        startTimeUtc: booking.startTimeUtc.toISOString(),
        endTimeUtc: booking.endTimeUtc.toISOString(),
        parentTime: parentLocal.timeDisplay,
        parentDate: parentLocal.dateDisplay,
        parentTimezone: booking.parentTimezone,
        mentorTime: mentorLocal.timeDisplay + " IST",
        mentorDate: mentorLocal.dateDisplay,
        mentorTimezone: booking.mentorTimezone,
        parent: booking.parent,
        student: booking.student,
        mentor: {
          id: booking.mentor.id,
          name: booking.mentor.name,
          email: booking.mentor.email,
          role: "Coding Mentor",
          timezone: booking.mentor.timezone,
        },
      },
    };
  }

  /**
   * Get class link for booking
   * @param {string} id
   * @returns {Promise<{ success: boolean, classLink: string }>}
   */
  static async getClassLink(id) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { classLink: true, status: true },
    });

    if (!booking) {
      const err = new Error("Booking not found");
      err.statusCode = 404;
      throw err;
    }

    return {
      success: true,
      classLink: booking.classLink,
      status: booking.status,
    };
  }
}

export default BookingService;

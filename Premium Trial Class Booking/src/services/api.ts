const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  import.meta.env.PROD
    ? "https://codeyoung.onrender.com/api"
    : "http://localhost:5000/api"
);

export interface ParentPayload {
  fullName: string;
  email: string;
  phone?: string;
  timezone?: string;
}

export interface StudentPayload {
  firstName: string;
  age: number | string;
  grade: string;
  codingExperience?: string;
  email?: string;
}

export interface CreateBookingPayload {
  parent: ParentPayload;
  student: StudentPayload;
  date?: string;
  time?: string;
  startTime?: string;
  timezone: string;
  mentorId?: string;
}

export interface AvailabilitySlot {
  time: string;
  startTimeUtc?: string;
  endTimeUtc?: string;
  available: boolean;
  remainingMentors: number;
  localDisplay: string;
  mentorDisplay: string;
  mentorPreview: { id: string; name: string } | null;
  availableMentors: Array<{ id: string; name: string }>;
}

export interface AvailabilityResponse {
  success: boolean;
  date: string;
  timezone: string;
  slots: AvailabilitySlot[];
}

export interface BookingResult {
  id: string;
  status: string;
  classLink: string;
  startTimeUtc: string;
  endTimeUtc: string;
  parentTime: string;
  parentDate: string;
  parentTimezone: string;
  mentorTime: string;
  mentorDate: string;
  mentorTimezone: string;
  parent: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    timezone: string;
  };
  student: {
    id: string;
    firstName: string;
    age: number;
    grade: string;
    codingExperience?: string;
    email?: string;
  };
  mentor: {
    id: string;
    name: string;
    email: string;
    role: string;
    timezone: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  booking?: T;
  message?: string;
  error?: string;
  details?: Array<{ field: string; message: string }>;
}

/**
 * Fetch available trial slots and daily capacity for a selected date and parent timezone
 */
export async function getAvailabilityData(date: string, timezone: string): Promise<{
  slots: AvailabilitySlot[];
  totalCapacity: number;
  remainingCapacity: number;
  bookedCount: number;
}> {
  const url = new URL(`${API_BASE_URL}/availability`);
  url.searchParams.append("date", date);
  url.searchParams.append("timezone", timezone);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || json.error || "Failed to fetch availability.");
  }

  return {
    slots: json.slots || [],
    totalCapacity: json.totalCapacity ?? 20,
    remainingCapacity: json.remainingCapacity ?? 20,
    bookedCount: json.bookedCount ?? 0,
  };
}

/**
 * Fetch available trial slots for a selected date and parent timezone
 */
export async function getAvailability(date: string, timezone: string): Promise<AvailabilitySlot[]> {
  const data = await getAvailabilityData(date, timezone);
  return data.slots;
}

/**
 * Create a new trial class booking
 */
export async function createBooking(payload: CreateBookingPayload): Promise<BookingResult> {
  const response = await fetch(`${API_BASE_URL}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    const errorMsg = json.message || json.error || "Failed to create booking.";
    const err = new Error(errorMsg);
    // @ts-ignore
    err.statusCode = response.status;
    // @ts-ignore
    err.details = json.details;
    throw err;
  }

  return json.booking;
}

/**
 * Get booking details by ID
 */
export async function getBooking(id: string): Promise<BookingResult> {
  const response = await fetch(`${API_BASE_URL}/bookings/${encodeURIComponent(id)}`, {
    headers: {
      Accept: "application/json",
    },
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || json.error || "Failed to retrieve booking.");
  }

  return json.booking;
}

/**
 * Get class link by booking ID
 */
export async function getClassLink(id: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/bookings/${encodeURIComponent(id)}/class-link`, {
    headers: {
      Accept: "application/json",
    },
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || json.error || "Failed to retrieve class link.");
  }

  return json.classLink;
}

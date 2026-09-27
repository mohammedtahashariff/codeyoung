import { v4 as uuidv4 } from "uuid";

export class ClassLinkService {
  /**
   * Generate a unique dummy live-class link for a trial class booking
   * @param {string} [bookingId]
   * @returns {string}
   */
  static generateClassLink(bookingId) {
    const roomId = bookingId ? `CY-${bookingId.slice(0, 8)}` : `CY-${uuidv4().slice(0, 8)}`;
    return `https://live.codeyoung.com/trial/${roomId}`;
  }
}

export default ClassLinkService;

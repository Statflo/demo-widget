/**
 * calendlyApi.ts — FAKE BACKEND
 * -------------------------------------------------------------------------
 * This file simulates what a real integration with the Calendly API
 * (https://developer.calendly.com) would do:
 *
 *   - OAuth-connecting the agent's personal Calendly account
 *   - Fetching the agent's event types (their bookable meeting types)
 *   - Fetching live availability for a given event type
 *   - Building scheduling links, either general or pre-filled to one slot
 *
 * Nothing here hits a real network. Every function has an artificial
 * delay so the widget's loading states behave the way they would against
 * a real API, and the data is generated/randomized instead of fetched.
 *
 * To make this real:
 *   1. Do the OAuth dance (Calendly's OAuth2 flow) once per agent, store
 *      the access/refresh token wherever your host app keeps secrets.
 *   2. Replace `getConnectedUser` with `GET /users/me`.
 *   3. Replace `getEventTypes` with `GET /event_types?user=<uri>`.
 *   4. Replace `getAvailableSlots` with
 *      `GET /event_type_available_times?event_type=<uri>&start_time=...&end_time=...`.
 *   5. Scheduling links don't need an API call — Calendly's booking page
 *      URLs are public and take query params for deep-linking.
 */

export interface CalendlyUser {
  name: string;
  username: string; // used to build scheduling URLs: calendly.com/<username>
  initials: string;
}

export interface CalendlyEventType {
  id: string;
  name: string;
  durationMinutes: number;
  slug: string; // calendly.com/<username>/<slug>
}

export interface TimeSlot {
  id: string;
  start: string; // ISO 8601
  end: string; // ISO 8601
}

const FAKE_USER: CalendlyUser = {
  name: "Ian Gervais",
  username: "iangervais",
  initials: "IG",
};

const FAKE_EVENT_TYPES: CalendlyEventType[] = [
  { id: "evt-15", name: "15 Min Quick Call", durationMinutes: 15, slug: "15min" },
  { id: "evt-30", name: "30 Min Consultation", durationMinutes: 30, slug: "30min" },
  { id: "evt-60", name: "60 Min Strategy Session", durationMinutes: 60, slug: "60min" },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Simulates `GET /users/me` — the currently authenticated Calendly user. */
export const getConnectedUser = async (): Promise<CalendlyUser> => {
  await delay(400);
  return FAKE_USER;
};

/** Simulates `GET /event_types` — the agent's bookable meeting types. */
export const getEventTypes = async (): Promise<CalendlyEventType[]> => {
  await delay(300);
  return FAKE_EVENT_TYPES;
};

/**
 * Simulates `GET /event_type_available_times` — real availability for a
 * given event type over the next few business days. Slots are generated
 * on the fly and a random subset is dropped so the list looks like a real
 * calendar with some times already booked.
 */
export const getAvailableSlots = async (eventType: CalendlyEventType): Promise<TimeSlot[]> => {
  await delay(600);

  const slots: TimeSlot[] = [];
  const now = new Date();
  let businessDaysAdded = 0;
  let dayOffset = 1; // start tomorrow

  while (businessDaysAdded < 4) {
    const day = new Date(now);
    day.setDate(day.getDate() + dayOffset);
    dayOffset += 1;

    // Skip weekends.
    if (day.getDay() === 0 || day.getDay() === 6) continue;
    businessDaysAdded += 1;

    // Business hours 9:00am - 4:30pm, stepped by the event's duration.
    for (let minutes = 9 * 60; minutes < 16 * 60 + 30; minutes += eventType.durationMinutes) {
      // Randomly drop ~40% of slots to simulate ones that are already booked.
      if (Math.random() < 0.4) continue;

      const start = new Date(day);
      start.setHours(0, 0, 0, 0);
      start.setMinutes(minutes);

      const end = new Date(start.getTime() + eventType.durationMinutes * 60000);

      slots.push({
        id: `slot-${start.getTime()}`,
        start: start.toISOString(),
        end: end.toISOString(),
      });
    }
  }

  return slots;
};

/** The general booking page — anyone can open this and pick any open time themselves. */
export const getGeneralSchedulingLink = (user: CalendlyUser, eventType: CalendlyEventType): string =>
  `https://calendly.com/${user.username}/${eventType.slug}`;

/**
 * A deep link pre-filled to one specific slot. (In the real Calendly
 * product, the invitee still confirms on the page — this mirrors the
 * deep-link pattern of jumping straight to a prefilled date/time instead
 * of making the customer browse the calendar themselves.)
 */
export const getSlotSchedulingLink = (
  user: CalendlyUser,
  eventType: CalendlyEventType,
  slot: TimeSlot
): string => `https://calendly.com/${user.username}/${eventType.slug}/${encodeURIComponent(slot.start)}`;

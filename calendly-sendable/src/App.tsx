import React, { useEffect, useMemo, useState } from "react";
import "iframe-resizer-react";
import { useStore } from "zustand";
import "./../node_modules/@statflo/ui/index.css";
import "./App.css";
import { Button } from "@statflo/ui";

import widgetStore, { WidgetEvent } from "@statflo/widget-sdk";
import {
  CalendlyEventType,
  CalendlyUser,
  TimeSlot,
  getAvailableSlots,
  getConnectedUser,
  getEventTypes,
  getGeneralSchedulingLink,
  getSlotSchedulingLink,
} from "./calendlyApi";

/**
 * CALENDLY SENDABLE
 * -------------------------------------------------------------------------
 * Lets an agent either:
 *   1. Pick one specific open time from their own Calendly availability —
 *      sends a message with that time and a link pre-filled to it, or
 *   2. Send their general scheduling link — the customer opens it and
 *      picks whichever open time works for them.
 *
 * Either action publishes the SDK's built-in `APPEND_MESSAGE` event with a
 * plain string, which the host app appends to the chat compose box. All
 * "Calendly account" data (connected user, event types, availability)
 * comes from `calendlyApi.ts`, which fakes the network calls a real
 * integration would make — see that file for what to swap in for real.
 */

type WidgetEventType<T = any> = WidgetEvent<T>;

const formatDayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

const formatTimeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

const groupSlotsByDay = (slots: TimeSlot[]) => {
  const groups = new Map<string, TimeSlot[]>();
  slots.forEach((slot) => {
    const key = formatDayLabel(slot.start);
    const existing = groups.get(key) ?? [];
    existing.push(slot);
    groups.set(key, existing);
  });
  return Array.from(groups.entries());
};

const App = () => {
  // events / publishEvent / getLatestEvent come from the widget SDK store.
  const { events, publishEvent, getLatestEvent } = useStore(widgetStore);

  // --- Framework state: present in every widget, keep as-is -------------
  const [initialized, setInitialized] = useState(false);
  const [token, setToken] = useState("");
  const [accountId, setAccountId] = useState("");
  const [lastEvent, setLastEvent] = useState<WidgetEventType | null>(null);

  // --- Calendly account state (fake) --------------------------------------
  const [user, setUser] = useState<CalendlyUser | null>(null);
  const [eventTypes, setEventTypes] = useState<CalendlyEventType[]>([]);
  const [selectedEventTypeId, setSelectedEventTypeId] = useState<string>("");

  // --- Availability state (fake) ------------------------------------------
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // --- "Sent" feedback ------------------------------------------------------
  const [sentSlotId, setSentSlotId] = useState<string | null>(null);
  const [sentGeneral, setSentGeneral] = useState(false);

  const selectedEventType = useMemo(
    () => eventTypes.find((et) => et.id === selectedEventTypeId) ?? null,
    [eventTypes, selectedEventTypeId]
  );

  // Load the connected Calendly account + their event types once the
  // widget has heard from the host app.
  useEffect(() => {
    if (!initialized) return;

    (async () => {
      const [connectedUser, types] = await Promise.all([getConnectedUser(), getEventTypes()]);
      setUser(connectedUser);
      setEventTypes(types);
      setSelectedEventTypeId((current) => current || types[0]?.id || "");
    })();
  }, [initialized]);

  // Whenever the selected event type changes, re-fetch availability for it.
  useEffect(() => {
    if (!selectedEventType) return;

    let cancelled = false;
    setLoadingSlots(true);

    getAvailableSlots(selectedEventType).then((result) => {
      if (!cancelled) {
        setSlots(result);
        setLoadingSlots(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedEventType]);

  const refreshAvailability = () => {
    if (!selectedEventType) return;
    setLoadingSlots(true);
    getAvailableSlots(selectedEventType).then((result) => {
      setSlots(result);
      setLoadingSlots(false);
    });
  };

  // --- Listening for events from the host app -----------------------------
  useEffect(() => {
    const latest = getLatestEvent();
    if (!latest || lastEvent?.type === latest.type) return;
    setLastEvent(latest);

    switch (latest.type) {
      case "TOKEN_UPDATED":
        setToken(latest.data);
        break;
      case "CURRENT_ACCOUNT_ID":
        setAccountId(latest.data);
        break;
      case "DARK_MODE":
        if (latest.data === true) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
        setInitialized(true);
        break;
    }
  }, [events]);

  // --- Sending content to the chat compose box ------------------------------
  const handleSendSlot = (slot: TimeSlot) => {
    if (!user || !selectedEventType) return;

    const link = getSlotSchedulingLink(user, selectedEventType, slot);
    const message = `I have ${formatDayLabel(slot.start)} at ${formatTimeLabel(
      slot.start
    )} open for a ${selectedEventType.name.toLowerCase()} — you can grab it here: ${link}`;

    publishEvent({ type: "APPEND_MESSAGE", data: message } as WidgetEventType);

    setSentSlotId(slot.id);
    setTimeout(() => setSentSlotId((current) => (current === slot.id ? null : current)), 1500);
  };

  const handleSendGeneralLink = () => {
    if (!user || !selectedEventType) return;

    const link = getGeneralSchedulingLink(user, selectedEventType);
    const message = `Here's my scheduling link for a ${selectedEventType.name.toLowerCase()} — pick whatever time works best for you: ${link}`;

    publishEvent({ type: "APPEND_MESSAGE", data: message } as WidgetEventType);

    setSentGeneral(true);
    setTimeout(() => setSentGeneral(false), 1500);
  };

  const dayGroups = groupSlotsByDay(slots);

  return (
    <div className="p-1 overflow-hidden relative" style={{ height: "auto", minWidth: "500px" }}>
      {!initialized ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="calendly-card">
          <div className="calendly-card-title">Calendly</div>
          <div className="innerContent">
            {!user || eventTypes.length === 0 ? (
              <div className="calendly-loading">Connecting to Calendly...</div>
            ) : (
              <>
                {/* Connected account */}
                <div className="calendly-account">
                  <div className="calendly-avatar">{user.initials}</div>
                  <div className="calendly-account-info">
                    <div className="calendly-account-name">{user.name}</div>
                    <div className="calendly-account-sub">Connected · calendly.com/{user.username}</div>
                  </div>
                </div>

                {/* Meeting type picker */}
                <div className="calendly-field">
                  <label className="calendly-label" htmlFor="calendly-event-type">
                    Meeting type
                  </label>
                  <select
                    id="calendly-event-type"
                    className="calendly-select"
                    value={selectedEventTypeId}
                    onChange={(e) => setSelectedEventTypeId(e.target.value)}
                  >
                    {eventTypes.map((et) => (
                      <option key={et.id} value={et.id}>
                        {et.name} ({et.durationMinutes} min)
                      </option>
                    ))}
                  </select>
                </div>

                {/* General scheduling link */}
                <div className="calendly-general-link">
                  <div className="calendly-general-text">
                    <div className="calendly-general-title">Let them pick a time</div>
                    <div className="calendly-general-sub">
                      Send your general booking page — the customer chooses any open slot.
                    </div>
                  </div>
                  <Button
                    className={`btn btn-primary calendly-send-general-btn ${
                      sentGeneral ? "calendly-sent-btn" : ""
                    }`}
                    onClick={handleSendGeneralLink}
                  >
                    {sentGeneral ? "Sent" : "Send link"}
                  </Button>
                </div>

                <div className="calendly-divider">
                  <span>or pick a time from your calendar</span>
                </div>

                {/* Availability */}
                <div className="calendly-availability-header">
                  <span className="calendly-availability-title">Your open times</span>
                  <button
                    type="button"
                    className="calendly-refresh-btn"
                    onClick={refreshAvailability}
                    disabled={loadingSlots}
                  >
                    {loadingSlots ? "Checking..." : "Refresh"}
                  </button>
                </div>

                {loadingSlots ? (
                  <div className="calendly-loading">Checking your calendar...</div>
                ) : dayGroups.length === 0 ? (
                  <div className="calendly-empty">
                    No open times in the next few days. Try refreshing, or send your general link
                    instead.
                  </div>
                ) : (
                  <div className="calendly-days">
                    {dayGroups.map(([day, daySlots]) => (
                      <div key={day} className="calendly-day-group">
                        <div className="calendly-day-label">{day}</div>
                        <div className="calendly-slot-grid">
                          {daySlots.map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              className={`calendly-slot ${sentSlotId === slot.id ? "calendly-slot-sent" : ""}`}
                              onClick={() => handleSendSlot(slot)}
                            >
                              {sentSlotId === slot.id ? "Sent ✓" : formatTimeLabel(slot.start)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

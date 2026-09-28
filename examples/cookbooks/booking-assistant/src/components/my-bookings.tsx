"use client";

import { useNav } from "@openuidev/react-ui";
import { ArrowLeft, ArrowUpRight, CalendarCheck } from "lucide-react";
import { useEffect, useState } from "react";

type Booking = {
  code: string;
  check_in: string;
  check_out: string;
  guests: number;
  guest_name: string;
  total: number;
  listing_id: string;
  name: string;
  neighbourhood: string;
};

const day = (date: string) =>
  new Date(date).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

// The My bookings page: every simulated booking confirmed in the chat.
export function MyBookings() {
  const { navigate } = useNav();
  const [bookings, setBookings] = useState<Booking[]>();
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/bookings")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setBookings(body.bookings);
      })
      .catch((reason: Error) => setError(reason.message));
  }, []);

  return (
    <div className="bookings">
      <button type="button" className="bookings-back" onClick={() => navigate(undefined)}>
        <ArrowLeft size={16} aria-hidden="true" />
        Back to chat
      </button>
      <h1>My bookings</h1>
      <p className="bookings-intro">
        Stays you confirmed in the chat. They are saved in this app only; nothing is charged or sent
        to a host.
      </p>
      {error && <p role="alert">{error}</p>}
      {bookings?.length === 0 && <p className="bookings-intro">No bookings yet.</p>}
      <ul className="bookings-list">
        {bookings?.map((booking) => (
          <li key={booking.code} className="booking-card">
            <span className="booking-icon">
              <CalendarCheck size={20} aria-hidden="true" />
            </span>
            <div>
              <h2>{booking.name}</h2>
              <p>
                {booking.neighbourhood} · {day(booking.check_in)} – {day(booking.check_out)}
              </p>
              <p>
                {booking.guests} {booking.guests === 1 ? "guest" : "guests"} · €
                {booking.total.toFixed(2)} · {booking.guest_name} · <code>{booking.code}</code>
              </p>
            </div>
            <a
              href={`https://www.airbnb.com/rooms/${booking.listing_id}`}
              target="_blank"
              rel="noreferrer"
              className="bookings-link"
            >
              Listing
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
      <p className="bookings-note">
        Listings and availability from{" "}
        <a href="https://insideairbnb.com/get-the-data/" target="_blank" rel="noreferrer">
          Inside Airbnb
        </a>
        , licensed under CC BY 4.0.
      </p>
    </div>
  );
}

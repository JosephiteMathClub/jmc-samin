/**
 * Calendar Utilities for Josephite Math Club Festival Events
 * Marks September 24, 25, and 26, 2026 in user account calendar
 */

export interface CalendarEvent {
  day: string;
  dateStr: string;
  formattedDate: string; // e.g. "September 24, 2026"
  isoDate: string; // e.g. "2026-09-24"
  startCal: string; // e.g. "20260924T020000Z"
  endCal: string; // e.g. "20260924T120000Z"
  title: string;
  description: string;
  location: string;
}

export const FESTIVAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    day: "Day 1",
    dateStr: "24 Sept 2026",
    formattedDate: "September 24, 2026",
    isoDate: "2026-09-24",
    startCal: "20260924T020000Z",
    calStart: "20260924T020000Z",
    endCal: "20260924T120000Z",
    title: "10th Josephite National Math Festival - Day 1 (Solo Segments)",
    description: "Solo Math Olympiad, Speed Math, Rubik's Cube, Sudoku & IQ Test. Venue: St. Joseph Higher Secondary School campus.",
    location: "St. Joseph Higher Secondary School, 97 Asad Avenue, Mohammadpur, Dhaka-1207",
  } as any,
  {
    day: "Day 2",
    dateStr: "25 Sept 2026",
    formattedDate: "September 25, 2026",
    isoDate: "2026-09-25",
    startCal: "20260925T020000Z",
    calStart: "20260925T020000Z",
    endCal: "20260925T120000Z",
    title: "10th Josephite National Math Festival - Day 2 (Team Mania & Workshops)",
    description: "Team Math Mania, Game of Games, Math Quiz, Escape Room & Interactive Math Workshops.",
    location: "St. Joseph Higher Secondary School, 97 Asad Avenue, Mohammadpur, Dhaka-1207",
  } as any,
  {
    day: "Day 3",
    dateStr: "26 Sept 2026",
    formattedDate: "September 26, 2026",
    isoDate: "2026-09-26",
    startCal: "20260926T020000Z",
    calStart: "20260926T020000Z",
    endCal: "20260926T120000Z",
    title: "10th Josephite National Math Festival - Grand Finale & Awards",
    description: "Grand Finale, Exhibition, Closing Ceremony & Prize Distribution. St. Joseph Campus.",
    location: "St. Joseph Higher Secondary School, 97 Asad Avenue, Mohammadpur, Dhaka-1207",
  } as any,
];

/**
 * Automatically marks September 24, 25, 26 in local user calendar storage
 */
export const markFestivalDatesInUserAccount = (userEmail?: string) => {
  if (typeof window === 'undefined') return;
  try {
    const timestamp = new Date().toISOString();
    const data = {
      marked: true,
      dates: ["2026-09-24", "2026-09-25", "2026-09-26"],
      markedAt: timestamp,
      eventName: "10th Josephite National Math Festival",
    };

    localStorage.setItem('jmc_festival_calendar_marked', JSON.stringify(data));
    if (userEmail) {
      localStorage.setItem(`jmc_festival_calendar_marked_${userEmail.trim().toLowerCase()}`, JSON.stringify(data));
    }
  } catch (err) {
    console.warn("Could not save festival dates to user calendar storage:", err);
  }
};

/**
 * Check if dates are marked for user
 */
export const isFestivalDatesMarked = (userEmail?: string): boolean => {
  if (typeof window === 'undefined') return true; // default show
  try {
    if (userEmail) {
      const userKey = localStorage.getItem(`jmc_festival_calendar_marked_${userEmail.trim().toLowerCase()}`);
      if (userKey) return true;
    }
    const globalKey = localStorage.getItem('jmc_festival_calendar_marked');
    return !!globalKey;
  } catch {
    return false;
  }
};

/**
 * Generate Google Calendar Link for all 3 festival days
 */
export const getGoogleCalendarAllDaysUrl = () => {
  const baseUrl = "https://calendar.google.com/calendar/render";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "10th Josephite National Math Festival (24, 25 & 26 Sept 2026)",
    details: "Your registration is confirmed! Join us on 24, 25 and 26 September 2026 for the 10th Josephite National Math Festival. Venue: St. Joseph Higher Secondary School, Dhaka.",
    location: "St. Joseph Higher Secondary School, 97 Asad Avenue, Mohammadpur, Dhaka-1207",
    dates: "20260924T020000Z/20260926T120000Z",
  });
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Generate Individual Google Calendar Link
 */
export const getGoogleCalendarSingleUrl = (event: typeof FESTIVAL_CALENDAR_EVENTS[0]) => {
  const baseUrl = "https://calendar.google.com/calendar/render";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description,
    location: event.location,
    dates: `${event.startCal}/${event.endCal}`,
  });
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Download iCal (.ics) file for 24, 25, and 26 September 2026
 */
export const downloadIcsCalendar = () => {
  if (typeof window === 'undefined') return;

  let icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Josephite Math Club//Math Festival 2026//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:10th Josephite National Math Festival",
  ];

  FESTIVAL_CALENDAR_EVENTS.forEach((ev) => {
    icsLines.push(
      "BEGIN:VEVENT",
      `SUMMARY:${ev.title}`,
      `DESCRIPTION:${ev.description}`,
      `LOCATION:${ev.location}`,
      `DTSTART:${ev.startCal}`,
      `DTEND:${ev.endCal}`,
      `UID:jmc-festival-2026-${ev.isoDate}@josephitre.club`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-PT24H",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder: 10th Josephite National Math Festival tomorrow!",
      "END:VALARM",
      "END:VEVENT"
    );
  });

  icsLines.push("END:VCALENDAR");

  const icsContent = icsLines.join("\r\n");
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "JMC_Math_Festival_2026_September_24_25_26.ics");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

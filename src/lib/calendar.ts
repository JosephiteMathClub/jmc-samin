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
 * Generate Google Calendar Link for all festival days
 */
export const getGoogleCalendarAllDaysUrl = (festivalCalData?: any) => {
  const baseUrl = "https://calendar.google.com/calendar/render";
  const title = festivalCalData?.title || "10th Josephite National Math Festival (24, 25 & 26 Sept 2026)";
  const location = festivalCalData?.location || "St. Joseph Higher Secondary School, 97 Asad Avenue, Mohammadpur, Dhaka-1207";
  
  const eventsToUse = (Array.isArray(festivalCalData?.events) && festivalCalData.events.length > 0)
    ? festivalCalData.events
    : FESTIVAL_CALENDAR_EVENTS;

  const details = eventsToUse
    .map((e: any) => `${e.day} (${e.dateStr || ''}): ${e.title} - ${e.description}`)
    .join("\n\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    details: details,
    location: location,
    dates: "20260924T020000Z/20260926T120000Z",
  });
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Generate Individual Google Calendar Link
 */
export const getGoogleCalendarSingleUrl = (event: typeof FESTIVAL_CALENDAR_EVENTS[0] | any) => {
  const baseUrl = "https://calendar.google.com/calendar/render";
  const startCal = event.startCal || (event.isoDate ? `${event.isoDate.replace(/-/g, '')}T020000Z` : "20260924T020000Z");
  const endCal = event.endCal || (event.isoDate ? `${event.isoDate.replace(/-/g, '')}T120000Z` : "20260924T120000Z");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description,
    location: event.location || "St. Joseph Higher Secondary School, 97 Asad Avenue, Mohammadpur, Dhaka-1207",
    dates: `${startCal}/${endCal}`,
  });
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Download iCal (.ics) file for festival days
 */
export const downloadIcsCalendar = (customEvents?: any[]) => {
  if (typeof window === 'undefined') return;
  const eventsToUse = (customEvents && customEvents.length > 0) ? customEvents : FESTIVAL_CALENDAR_EVENTS;

  let icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Josephite Math Club//Math Festival 2026//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:10th Josephite National Math Festival",
  ];

  eventsToUse.forEach((ev: any) => {
    const startCal = ev.startCal || (ev.isoDate ? `${ev.isoDate.replace(/-/g, '')}T020000Z` : "20260924T020000Z");
    const endCal = ev.endCal || (ev.isoDate ? `${ev.isoDate.replace(/-/g, '')}T120000Z` : "20260924T120000Z");

    icsLines.push(
      "BEGIN:VEVENT",
      `SUMMARY:${ev.title}`,
      `DESCRIPTION:${ev.description}`,
      `LOCATION:${ev.location || "St. Joseph Higher Secondary School, 97 Asad Avenue, Mohammadpur, Dhaka-1207"}`,
      `DTSTART:${startCal}`,
      `DTEND:${endCal}`,
      `UID:jmc-festival-2026-${ev.isoDate || Math.random().toString(36).substr(2, 6)}@josephite.club`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-PT24H",
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder: Festival Event Tomorrow!",
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
  link.setAttribute("download", "JMC_Math_Festival_2026_Calendar.ics");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

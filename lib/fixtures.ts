import type { CourseData, HoleRow, Scorecard, TeeTimeSlot } from "./course-data";

/**
 * Example fixture: Highland Creek Golf Club (Charlotte, NC).
 * Facts: the club's website, read on 22 Oct 2026 (reworded in our own words).
 * Tee times: snapshot of the CourseRev v2 booking page on 27 Oct 2026 (bookable times of 27, 28 and 29 Oct).
 * It is a placeholder for the real feed, which the dev team defines.
 * Anything not found in public pages is left empty on purpose (TODO), never guessed.
 */

// [time, price in USD, open spots]. Bookable times only (spots > 0).
// Real snapshot of the CourseRev v2 booking page read on 27 Oct 2026 (today and the next two days). Placeholder for the real feed.
const DAY_27: [string, number, number][] = [
  ["13:40", 53.07, 4],
];
const DAY_28: [string, number, number][] = [
  ["07:50", 48.85, 4], ["08:10", 48.85, 1], ["08:20", 48.85, 4], ["08:30", 48.85, 4], ["08:40", 48.85, 4],
  ["08:50", 48.85, 4], ["09:10", 58.71, 4], ["09:20", 58.71, 4], ["09:30", 58.71, 2], ["09:40", 58.71, 4],
  ["10:00", 58.71, 2], ["10:10", 58.71, 3], ["10:40", 58.71, 4], ["10:50", 58.71, 4], ["11:10", 50.26, 4],
  ["11:20", 50.26, 4], ["11:30", 50.26, 4], ["11:40", 50.26, 4], ["11:50", 50.26, 4], ["12:00", 50.26, 2],
  ["12:10", 50.26, 4], ["12:20", 50.26, 4], ["12:30", 50.26, 4], ["12:50", 50.26, 4], ["13:00", 50.26, 4],
  ["13:10", 50.26, 4], ["13:20", 50.26, 4], ["13:30", 50.26, 4], ["13:40", 50.26, 4], ["13:50", 50.26, 4],
  ["14:00", 50.26, 4], ["14:10", 50.26, 4], ["14:20", 50.26, 4], ["14:30", 50.26, 4], ["14:40", 50.26, 4],
  ["14:50", 50.26, 4], ["15:00", 50.26, 4], ["15:10", 38.99, 4], ["15:20", 38.99, 4], ["15:30", 38.99, 2],
  ["15:40", 38.99, 4], ["15:50", 38.99, 4],
];
const DAY_29: [string, number, number][] = [
  ["08:10", 64.34, 1], ["11:00", 53.07, 4], ["11:10", 53.07, 4], ["11:20", 53.07, 4], ["11:40", 53.07, 4],
  ["11:50", 53.07, 4], ["12:00", 53.07, 4], ["12:10", 53.07, 4], ["12:20", 53.07, 4], ["12:30", 53.07, 4],
  ["12:40", 53.07, 2], ["12:50", 53.07, 4], ["13:00", 53.07, 4], ["13:10", 53.07, 4], ["13:20", 53.07, 4],
  ["13:30", 53.07, 4], ["13:40", 53.07, 4], ["13:50", 53.07, 4], ["14:00", 53.07, 4], ["14:10", 53.07, 4],
  ["14:20", 53.07, 4], ["14:30", 53.07, 4], ["14:40", 53.07, 4], ["14:50", 53.07, 4], ["15:00", 38.99, 4],
  ["15:10", 38.99, 4], ["15:20", 38.99, 4], ["15:30", 38.99, 4], ["15:40", 38.99, 4], ["15:50", 38.99, 4],
  ["16:00", 38.99, 4], ["16:10", 38.99, 4], ["16:20", 38.99, 4], ["16:30", 38.99, 4],
];
const toSlots = (rows: [string, number, number][]): TeeTimeSlot[] => rows.map(([time, priceUsd, spots]) => ({ time, priceUsd, spots, holes: 18, cart: null }));

/** Builds hole rows from per-hole lists (par, stroke index, and yards per tee, in hole order). */
const toHoles = (par: number[], hcp: number[], yards: Record<string, number[]>): HoleRow[] =>
  par.map((p, i) => ({ number: i + 1, par: p, hcp: hcp[i] ?? null, yards: Object.fromEntries(Object.entries(yards).map(([t, ys]) => [t, ys[i]])) }));

// EXAMPLE DATA. Scorecards come from OpenGolfAPI (read 2026-10-27), which is NOT a recommended source yet: the
// Tradition card has hole yards that do not add up to the tee totals, and Highland Creek's Blue rating/slope differs
// from the one on TeeOff. The page runs checkScorecard() and drops what fails. The real source is to be decided.
const OGA_NOTE = "Scorecard: OpenGolfAPI, © OpenStreetMap contributors (ODbL). Example data, not verified with the club.";

const HIGHLAND_CREEK_CARD: Scorecard = {
  tees: [
    { name: "Gold", yards: 7043, ratings: [{ gender: "men", rating: 74, slope: 137 }] },
    { name: "Blue", yards: 6520, ratings: [{ gender: "men", rating: 71.5, slope: 136 }] },
    { name: "White", yards: 6001, ratings: [{ gender: "men", rating: 68.6, slope: 130 }, { gender: "women", rating: 74.9, slope: 140 }] },
    { name: "Red", yards: 5080, ratings: [{ gender: "men", rating: 64.9, slope: 123 }, { gender: "women", rating: 69.8, slope: 134 }] },
  ],
  holes: toHoles(
    [4, 5, 3, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 4, 4, 3, 5],
    [7, 17, 15, 1, 11, 9, 13, 5, 3, 14, 8, 6, 4, 16, 2, 10, 12, 18],
    {
      Gold: [405, 535, 196, 419, 396, 233, 562, 393, 402, 405, 212, 560, 398, 400, 446, 395, 199, 487],
      Blue: [368, 510, 165, 392, 370, 211, 531, 375, 372, 373, 188, 542, 360, 369, 409, 374, 151, 460],
      White: [333, 483, 127, 364, 340, 178, 510, 370, 320, 334, 167, 527, 332, 333, 364, 327, 140, 452],
      Red: [267, 421, 92, 338, 311, 136, 470, 287, 275, 255, 116, 446, 288, 292, 303, 272, 111, 400],
    },
  ),
  sourceNote: OGA_NOTE,
};

const TRADITION_CARD: Scorecard = {
  tees: [
    { name: "Gold", yards: 6978, ratings: [{ gender: "men", rating: 72.6, slope: 140 }] },
    { name: "Green", yards: 6484, ratings: [{ gender: "men", rating: 70.3, slope: 132 }] },
    { name: "White", yards: 6121, ratings: [{ gender: "men", rating: 68.4, slope: 124 }, { gender: "women", rating: 73.8, slope: 137 }] },
    { name: "Red", yards: 5443, ratings: [{ gender: "women", rating: 69.6, slope: 125 }] },
  ],
  holes: toHoles(
    [4, 4, 5, 4, 3, 4, 4, 3, 5, 4, 3, 4, 4, 5, 3, 4, 4, 5],
    [5, 1, 9, 3, 7, 11, 15, 17, 13, 10, 12, 2, 6, 16, 14, 4, 8, 18],
    {
      // These add up to 6,597 / 6,206 / 5,738 / 4,844, not to the tee totals above. Kept as delivered by the source.
      Gold: [385, 436, 503, 418, 199, 361, 343, 142, 477, 384, 223, 446, 372, 483, 159, 372, 387, 507],
      Green: [362, 414, 485, 396, 174, 324, 326, 129, 457, 356, 196, 424, 362, 463, 140, 354, 365, 479],
      White: [342, 373, 449, 370, 160, 315, 316, 117, 430, 341, 162, 342, 329, 438, 132, 332, 331, 459],
      Red: [315, 348, 368, 292, 123, 266, 267, 114, 329, 309, 133, 280, 291, 347, 108, 265, 301, 388],
    },
  ),
  sourceNote: OGA_NOTE,
};

export const highlandCreek: CourseData = {
  facts: {
    slug: "highland-creek-golf-club",
    name: "Highland Creek Golf Club",
    country: "us",
    region: "nc",
    city: "Charlotte",
    address: { street: "7101 Highland Creek Parkway", postalCode: "28269" },
    phone: "+17048759000",
    website: "https://highlandcreekgolfclub.com",
    geo: { lat: 35.3808938, lng: -80.7629295 }, // CourseRev v2 booking page ("Get Directions" link), read 23 Oct 2026
    holes: 18,
    par: 72,
    designer: "Clifton, Ezell and Clifton",
    yearOpened: null, // TODO: not published on the pages read
    description:
      "Highland Creek is an 18-hole championship course in Charlotte, North Carolina designed by Clifton, Ezell and Clifton. It has Bermuda fairways, more than 65 bunkers and water in play on 11 holes, and the clubhouse has a taproom and a beer garden.",
    amenities: [
      "Driving range",
      "Putting green",
      "Chipping green and practice bunker",
      "Clubhouse with locker rooms",
      "Taproom and beer garden",
      "Golf lessons",
      "Outings and events",
    ],
    // Banner of the CourseRev v2 page (CourseRev CDN). Licensing for use on Teemeup is to be confirmed with the club.
    photos: [{ url: "https://storage.googleapis.com/courserev-cdn/course/org-banner-1778849042200.jpeg", alt: "Fairway and flagstick at Highland Creek Golf Club", width: 1280, height: 550 }],
    logoUrl: null,
    themeColor: "#0B6B3A", // TODO: placeholder, confirm the club's color
    optional: { yardsMin: 5080, yardsMax: 7000 },
    scorecard: HIGHLAND_CREEK_CARD,
  },
  ops: {
    teeTimes: [
      { date: "2026-10-27", asOf: "2026-10-27", slots: toSlots(DAY_27) },
      { date: "2026-10-28", asOf: "2026-10-27", slots: toSlots(DAY_28) },
      { date: "2026-10-29", asOf: "2026-10-27", slots: toSlots(DAY_29) },
    ],
    policies: {
      cancellation: "Changes must be made at least 24 hours before the tee time.",
      dressCode: "Proper golf attire is required.",
      groupingNote: "Reservations for fewer than four golfers may be grouped with other golfers.",
      maxPlayers: 4,
    },
    faq: [], // TODO: questions golfers actually ask; do not invent
  },
  teemeup: {
    deepLinkUrl: "https://example.invalid/open?course=highland-creek-golf-club", // PLACEHOLDER
    qrImageUrl: null,
    appStoreUrl: "https://apps.apple.com/app/id0000000000", // PLACEHOLDER
    playStoreUrl: "https://play.google.com/store/apps/details?id=example.placeholder", // PLACEHOLDER
    chatBaseUrl: "https://web.teemeup.example", // PLACEHOLDER: confirm the real web chat URL with the app team
    nearby: ["the-tradition-golf-club"],
  },
  provenance: {
    geo: { source: "highlandcreekgolfclub.bookings.v2.courserev.ai (Get Directions link)", retrievedOn: "2026-10-23" },
    photos: { source: "highlandcreekgolfclub.bookings.v2.courserev.ai (banner, CourseRev CDN)", retrievedOn: "2026-10-23" },
    description: { source: "highlandcreekgolfclub.com (reworded)", retrievedOn: "2026-10-23" },
    designer: { source: "highlandcreekgolfclub.com", retrievedOn: "2026-10-23" },
    // NOTE: the v2 booking page lists +1 704 486 2984, the club site +1 704 875 9000. Confirm which is the public number.
    phone: { source: "highlandcreekgolfclub.com", retrievedOn: "2026-10-23" },
    teeTimes: { source: "highlandcreekgolfclub.bookings.v2.courserev.ai (snapshot)", retrievedOn: "2026-10-27" },
    policies: { source: "highlandcreekgolfclub.com/course-rates (page dated 2025-03-27)", retrievedOn: "2026-10-23" },
    scorecard: { source: "OpenGolfAPI /api/v1/courses/{id}/tees and /holes (example; source not recommended yet)", retrievedOn: "2026-10-27" },
  },
};


/**
 * Second example: The Tradition Golf Club (Charlotte, NC), a real CourseRev club close to Highland Creek.
 * Facts: Chronogolf listing for the club (reworded) and the CourseRev v2 booking page, read 23 Oct 2026.
 * Tee times: snapshot of the v2 page for 27, 28 and 29 Oct 2026.
 */
const TRADITION_27: [string, number, number][] = [
  ["11:10", 50.97, 1], ["11:20", 50.97, 4], ["11:30", 50.97, 2], ["11:40", 50.97, 4], ["11:50", 50.97, 4],
  ["12:00", 50.97, 1], ["12:20", 50.97, 4], ["12:30", 50.97, 4], ["12:40", 50.97, 4], ["12:50", 50.97, 4],
  ["13:00", 50.97, 3], ["13:20", 50.97, 4], ["13:30", 50.97, 4], ["13:50", 50.97, 4], ["14:00", 50.97, 4],
  ["14:10", 50.97, 4], ["14:20", 50.97, 4], ["14:30", 50.97, 2], ["14:40", 50.97, 1], ["14:50", 50.97, 4],
  ["15:00", 50.97, 4], ["15:10", 50.97, 4], ["15:20", 50.97, 4], ["15:30", 50.97, 2], ["16:20", 39.92, 4],
  ["16:50", 39.92, 4],
];
const TRADITION_28: [string, number, number][] = [
  ["07:40", 45.87, 1], ["07:50", 45.87, 4], ["08:00", 58.62, 4], ["08:10", 58.62, 4], ["08:20", 58.62, 4],
  ["08:30", 58.62, 4], ["08:40", 58.62, 4], ["08:50", 58.62, 4], ["09:10", 58.62, 4], ["10:30", 58.62, 4],
  ["10:40", 58.62, 4], ["10:50", 58.62, 4], ["11:00", 50.97, 2], ["11:10", 50.97, 4], ["11:20", 50.97, 4],
  ["12:10", 50.97, 4], ["12:20", 50.97, 4], ["12:40", 50.97, 4], ["12:50", 50.97, 4], ["13:00", 50.97, 4],
  ["13:10", 50.97, 4], ["13:20", 50.97, 4], ["13:30", 50.97, 4], ["13:40", 50.97, 4], ["13:50", 50.97, 1],
  ["14:10", 48.42, 4], ["14:20", 48.42, 4], ["14:30", 48.42, 4], ["14:40", 48.42, 4], ["14:50", 48.42, 4],
  ["15:00", 48.42, 4], ["15:10", 48.42, 4], ["15:20", 48.42, 4], ["15:30", 48.42, 4], ["15:40", 48.42, 4],
  ["16:00", 38.02, 4], ["16:10", 38.02, 4], ["16:20", 38.02, 4], ["16:30", 38.02, 4], ["16:40", 38.02, 4],
];
const TRADITION_29: [string, number, number][] = [
  ["08:10", 58.62, 1], ["08:20", 58.62, 4], ["08:30", 58.62, 2], ["09:00", 58.62, 2], ["09:10", 58.62, 1],
  ["09:20", 58.62, 2], ["09:50", 58.62, 2], ["10:00", 58.62, 2], ["10:30", 58.62, 4], ["10:40", 58.62, 4],
  ["11:00", 45.87, 3], ["11:10", 45.87, 4], ["11:20", 45.87, 4], ["11:30", 45.87, 4], ["11:40", 45.87, 4],
  ["11:50", 45.87, 4], ["12:00", 45.87, 2], ["12:10", 45.87, 4], ["12:20", 45.87, 4], ["12:30", 45.87, 4],
  ["12:40", 45.87, 4], ["12:50", 45.87, 4], ["13:00", 45.87, 1], ["13:10", 45.87, 4], ["13:20", 45.87, 4],
  ["13:30", 45.87, 4], ["13:40", 45.87, 4], ["13:50", 45.87, 4], ["14:10", 53.52, 2], ["14:20", 53.52, 4],
  ["14:30", 53.52, 4], ["14:40", 53.52, 4], ["14:50", 53.52, 4], ["15:00", 53.52, 4], ["15:10", 53.52, 4],
  ["15:20", 53.52, 4], ["15:30", 53.52, 4], ["16:10", 41.82, 2], ["16:20", 41.82, 4], ["16:30", 41.82, 2],
  ["16:40", 41.82, 2],
];

export const tradition: CourseData = {
  facts: {
    slug: "the-tradition-golf-club",
    name: "The Tradition Golf Club",
    country: "us",
    region: "nc",
    city: "Charlotte",
    address: { street: "3800 Prosperity Church Road", postalCode: "28269" },
    phone: "+17045037529",
    website: null, // TODO: the club's own site was not confirmed
    geo: { lat: 35.3508232, lng: -80.7743232 }, // CourseRev v2 booking page ("Get Directions" link)
    holes: 18,
    par: 72,
    designer: "John Cassell II",
    yearOpened: 1996,
    description:
      "The Tradition is an 18-hole, par-72 course in Charlotte, North Carolina, designed by John Cassell II and opened in 1996. It has tree-lined fairways with three doglegs, small greens, eleven water hazards, and Bermudagrass on the fairways and greens.",
    amenities: ["Driving range", "Two practice putting greens", "Two practice bunkers", "Clubhouse with dining and a golf shop", "Outings and events"],
    // Banner of the CourseRev v2 page (CourseRev CDN). Licensing is to be confirmed with the club. The alt text describes the subject only: the image content was not reviewed.
    photos: [{ url: "https://storage.googleapis.com/courserev-cdn/course/org-banner-1784753398083.jpeg", alt: "The Tradition Golf Club, Charlotte, North Carolina", width: 1500, height: 750 }],
    logoUrl: null,
    themeColor: null, // TODO: not known; falls back to the Teemeup purple
    scorecard: TRADITION_CARD,
  },
  ops: {
    teeTimes: [
      { date: "2026-10-27", asOf: "2026-10-27", slots: toSlots(TRADITION_27) },
      { date: "2026-10-28", asOf: "2026-10-27", slots: toSlots(TRADITION_28) },
      { date: "2026-10-29", asOf: "2026-10-27", slots: toSlots(TRADITION_29) },
    ],
    policies: { maxPlayers: 4 }, // From the v2 booking page, which offers 1 to 4 players. No cancellation or dress code text was found.
    faq: [],
  },
  teemeup: {
    deepLinkUrl: "https://example.invalid/open?course=the-tradition-golf-club", // PLACEHOLDER
    qrImageUrl: null,
    appStoreUrl: "https://apps.apple.com/app/id0000000000", // PLACEHOLDER
    playStoreUrl: "https://play.google.com/store/apps/details?id=example.placeholder", // PLACEHOLDER
    chatBaseUrl: "https://web.teemeup.example", // PLACEHOLDER
    nearby: ["highland-creek-golf-club"],
  },
  provenance: {
    description: { source: "Chronogolf listing for The Tradition (reworded)", retrievedOn: "2026-10-23" },
    designer: { source: "Chronogolf listing for The Tradition", retrievedOn: "2026-10-23" },
    yearOpened: { source: "Chronogolf listing for The Tradition", retrievedOn: "2026-10-23" },
    phone: { source: "thetraditiongolfclub.bookings.v2.courserev.ai and Chronogolf listing (same number)", retrievedOn: "2026-10-23" },
    geo: { source: "thetraditiongolfclub.bookings.v2.courserev.ai (Get Directions link)", retrievedOn: "2026-10-23" },
    photos: { source: "thetraditiongolfclub.bookings.v2.courserev.ai (banner, CourseRev CDN)", retrievedOn: "2026-10-23" },
    teeTimes: { source: "thetraditiongolfclub.bookings.v2.courserev.ai (snapshot)", retrievedOn: "2026-10-27" },
    policies: { source: "thetraditiongolfclub.bookings.v2.courserev.ai (player count offered)", retrievedOn: "2026-10-23" },
    scorecard: { source: "OpenGolfAPI /api/v1/courses/{id}/tees and /holes (example; source not recommended yet)", retrievedOn: "2026-10-27" },
  },
};

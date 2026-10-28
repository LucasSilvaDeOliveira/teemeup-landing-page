import type { CourseData, TeeTimeDay, TeemeupLayer } from "./course-data";
import { SNAPSHOT_AS_OF, TEE_TIMES } from "./fixture-tee-times";

/**
 * EXAMPLE DATA for five real CourseRev clubs (Highland Creek, The Tradition, The Divide, Waterford, Cottonwood).
 * Placeholder for the real data layer, which the dev team defines. Sources are in each `provenance`.
 * Facts are reworded in our own words; anything not found is left empty on purpose (TODO), never guessed.
 * Tee times: `fixture-tee-times.ts` (CourseRev v2 booking API, read 28 Oct 2026 for 29-31 Oct).
 */

const days = (slug: string): TeeTimeDay[] =>
  Object.entries(TEE_TIMES[slug] ?? {}).map(([date, rows]) => ({
    date,
    asOf: SNAPSHOT_AS_OF,
    slots: rows.map(([time, priceUsd, spots]) => ({ time, priceUsd, spots, holes: 18 as const, cart: null })),
  }));

/** Teemeup layer with placeholders; only the slug and the nearby list change per course. */
const teemeup = (slug: string, nearby: string[]): TeemeupLayer => ({
  deepLinkUrl: `https://example.invalid/open?course=${slug}`, // PLACEHOLDER
  qrImageUrl: null,
  appStoreUrl: "https://apps.apple.com/app/id0000000000", // PLACEHOLDER
  playStoreUrl: "https://play.google.com/store/apps/details?id=example.placeholder", // PLACEHOLDER
  chatBaseUrl: "https://web.teemeup.example", // PLACEHOLDER: confirm the real web chat URL with the app team
  nearby,
});

const v2 = (sub: string, what: string, on = "2026-10-28") => ({ source: `${sub}.bookings.v2.courserev.ai (${what})`, retrievedOn: on });
const demo = (club: string) => ({ source: `courserev-seo-geo-demo-site.vercel.app/clubs/${club} (FAQ, reworded)`, retrievedOn: "2026-10-28" });

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
    geo: { lat: 35.3808938, lng: -80.7629295 },
    holes: 18,
    par: 72,
    designer: "Clifton, Ezell and Clifton",
    yearOpened: null, // TODO: not published on the pages read
    description:
      "Highland Creek is an 18-hole championship course in Charlotte, North Carolina designed by Clifton, Ezell and Clifton. It has Bermuda fairways, more than 65 bunkers and water in play on 11 holes, and the clubhouse has a taproom and a beer garden.",
    amenities: ["Driving range", "Putting green", "Chipping green and practice bunker", "Clubhouse with locker rooms", "Taproom and beer garden", "Golf lessons", "Outings and events"],
    // Banner of the CourseRev v2 page (CourseRev CDN). Licensing for use on Teemeup is to be confirmed with the club.
    photos: [{ url: "https://storage.googleapis.com/courserev-cdn/course/org-banner-1778849042200.jpeg", alt: "Fairway and flagstick at Highland Creek Golf Club", width: 1280, height: 550 }],
    logoUrl: null,
    themeColor: "#0B6B3A", // TODO: placeholder, confirm the club's color
    optional: { yardsMin: 5080, yardsMax: 7000 },
  },
  ops: {
    teeTimes: days("highland-creek-golf-club"),
    policies: {
      cancellation: "Changes must be made at least 24 hours before the tee time.",
      dressCode: "Proper golf attire is required.",
      groupingNote: "Reservations for fewer than four golfers may be grouped with other golfers.",
      maxPlayers: 4,
    },
    faq: [], // TODO: questions golfers actually ask; do not invent
  },
  teemeup: teemeup("highland-creek-golf-club", ["the-tradition-golf-club", "the-divide-golf-club", "waterford-golf-club"]),
  provenance: {
    geo: v2("highlandcreekgolfclub", "Get Directions link", "2026-10-23"),
    photos: v2("highlandcreekgolfclub", "banner, CourseRev CDN", "2026-10-23"),
    description: { source: "highlandcreekgolfclub.com (reworded)", retrievedOn: "2026-10-23" },
    designer: { source: "highlandcreekgolfclub.com", retrievedOn: "2026-10-23" },
    // NOTE: the v2 booking page lists +1 704 486 2984, the club site +1 704 875 9000. Confirm which is the public number.
    phone: { source: "highlandcreekgolfclub.com", retrievedOn: "2026-10-23" },
    teeTimes: v2("highlandcreekgolfclub", "tee time API, snapshot"),
    policies: { source: "highlandcreekgolfclub.com/course-rates (page dated 2025-03-27)", retrievedOn: "2026-10-23" },
  },
};

export const tradition: CourseData = {
  facts: {
    slug: "the-tradition-golf-club",
    name: "The Tradition Golf Club",
    country: "us",
    region: "nc",
    city: "Charlotte",
    address: { street: "3800 Prosperity Church Road", postalCode: "28269" },
    phone: "+17045037529",
    website: "https://thetraditiongolfclub.com",
    geo: { lat: 35.3508232, lng: -80.7743232 },
    holes: 18,
    par: 72,
    designer: "John Cassell II",
    yearOpened: 1996,
    description:
      "The Tradition is an 18-hole, par-72 course in Charlotte, North Carolina, designed by John Cassell II and opened in 1996. It has tree-lined fairways with three doglegs, small greens, eleven water hazards, and Bermudagrass on the fairways and greens.",
    amenities: ["Driving range", "Two practice putting greens", "Two practice bunkers", "Clubhouse with dining and a golf shop", "Outings and events"],
    // Banner of the CourseRev v2 page. Licensing is to be confirmed with the club. The alt text describes the subject only: the image content was not reviewed.
    photos: [{ url: "https://storage.googleapis.com/courserev-cdn/course/org-banner-1784753398083.jpeg", alt: "The Tradition Golf Club, Charlotte, North Carolina", width: 1500, height: 750 }],
    logoUrl: null,
    themeColor: null, // TODO: not known; falls back to the Teemeup purple
  },
  ops: {
    teeTimes: days("the-tradition-golf-club"),
    policies: { maxPlayers: 4 }, // From the v2 booking page, which offers 1 to 4 players. No cancellation or dress code text was found.
    faq: [],
  },
  teemeup: teemeup("the-tradition-golf-club", ["highland-creek-golf-club", "the-divide-golf-club", "waterford-golf-club"]),
  provenance: {
    description: { source: "Chronogolf listing for The Tradition (reworded)", retrievedOn: "2026-10-23" },
    designer: { source: "Chronogolf listing for The Tradition", retrievedOn: "2026-10-23" },
    yearOpened: { source: "Chronogolf listing for The Tradition", retrievedOn: "2026-10-23" },
    phone: v2("thetraditiongolfclub", "course details", "2026-10-23"),
    website: v2("thetraditiongolfclub", "course details"),
    geo: v2("thetraditiongolfclub", "Get Directions link", "2026-10-23"),
    photos: v2("thetraditiongolfclub", "banner, CourseRev CDN", "2026-10-23"),
    teeTimes: v2("thetraditiongolfclub", "tee time API, snapshot"),
    policies: v2("thetraditiongolfclub", "player count offered", "2026-10-23"),
  },
};

export const theDivide: CourseData = {
  facts: {
    slug: "the-divide-golf-club",
    name: "The Divide Golf Club",
    country: "us",
    region: "nc",
    city: "Matthews",
    address: { street: "6803 Stevens Mill Road", postalCode: "28104" },
    // NOTE: the v2 course record lists +1 704 628 6438; the organization record lists +1 980 360 4478. Confirm.
    phone: "+17046286438",
    website: "https://thedividegolfclub.com",
    geo: { lat: 35.1290016, lng: -80.6340228 },
    holes: 18,
    par: null, // TODO: not confirmed on the pages read
    designer: "John Cassell II",
    yearOpened: null,
    description:
      "The Divide is an 18-hole public course in Matthews, North Carolina, designed by John Cassell II. The course crosses the line between Mecklenburg and Union counties and has Diamond Zoysia greens.",
    amenities: [], // TODO
    // Banner of the CourseRev v2 page. Licensing to be confirmed; image content not reviewed, so the alt text names the place only.
    photos: [{ url: "https://storage.googleapis.com/courserev-cdn/course/org-banner-1784748864666.jpeg", alt: "The Divide Golf Club, Matthews, North Carolina", width: 1800, height: 750 }],
    logoUrl: null,
    themeColor: null,
  },
  ops: {
    teeTimes: days("the-divide-golf-club"),
    policies: {
      cancellation: "Changes or cancellations must be made at least 24 hours before the tee time; later cancellations are charged the full rate.",
      walking: "Walking and riding rates are both offered.",
      dressCode: "Proper golf attire is required.",
      maxPlayers: 4,
      bookingWindowDays: 14,
    },
    faq: [],
  },
  teemeup: teemeup("the-divide-golf-club", ["highland-creek-golf-club", "the-tradition-golf-club", "waterford-golf-club"]),
  provenance: {
    description: demo("the-divide"),
    designer: v2("thedividegolfclub", "course details"),
    phone: v2("thedividegolfclub", "course details"),
    website: v2("thedividegolfclub", "course details"),
    geo: v2("thedividegolfclub", "course details, map link"),
    photos: v2("thedividegolfclub", "banner, CourseRev CDN"),
    teeTimes: v2("thedividegolfclub", "tee time API, snapshot"),
    policies: demo("the-divide"),
  },
};

export const waterford: CourseData = {
  facts: {
    slug: "waterford-golf-club",
    name: "Waterford Golf Club",
    country: "us",
    region: "sc",
    city: "Rock Hill",
    address: { street: "1900 Clubhouse Road", postalCode: "29730" },
    phone: "+18033240300",
    website: "https://thelinksatwaterford.com",
    geo: { lat: 34.9493873, lng: -80.9450954 },
    holes: 18,
    par: 72,
    designer: "Hale Irwin",
    yearOpened: null,
    description:
      "Waterford is an 18-hole, par-72 course in Rock Hill, South Carolina, designed by Hale Irwin. It runs through hardwoods and rolling ground along the Catawba River, with water in play on 16 of the 18 holes.",
    amenities: [], // TODO
    photos: [{ url: "https://storage.googleapis.com/courserev-cdn/course/org-banner-1785906424754.jpeg", alt: "Waterford Golf Club, Rock Hill, South Carolina", width: 2000, height: 750 }],
    logoUrl: null,
    themeColor: null,
  },
  ops: {
    teeTimes: days("waterford-golf-club"),
    policies: {
      cancellation: "Changes or cancellations must be made at least 24 hours before the tee time; later cancellations are charged the full rate.",
      walking: "Walking is allowed any time Monday to Friday, and from 1:00 PM on weekends and holidays.",
      dressCode: "Proper golf attire is required. Outside food, coolers and alcohol are not allowed.",
      maxPlayers: 4,
      bookingWindowDays: 14,
    },
    faq: [],
  },
  teemeup: teemeup("waterford-golf-club", ["the-divide-golf-club", "the-tradition-golf-club", "highland-creek-golf-club"]),
  provenance: {
    description: demo("waterford"),
    designer: v2("waterfordgolfclub", "course details"),
    phone: v2("waterfordgolfclub", "course details"),
    website: v2("waterfordgolfclub", "course details"),
    geo: v2("waterfordgolfclub", "course details"),
    photos: v2("waterfordgolfclub", "banner, CourseRev CDN"),
    teeTimes: v2("waterfordgolfclub", "tee time API, snapshot"),
    policies: demo("waterford"),
  },
};

export const cottonwood: CourseData = {
  facts: {
    slug: "cottonwood-golf-club",
    name: "Cottonwood Golf Club",
    country: "us",
    region: "ca",
    city: "El Cajon",
    address: { street: "3121 Willow Glen Drive", postalCode: "92019" },
    phone: "+16194429891",
    website: "https://cottonwoodgolf.com",
    geo: { lat: 32.7479326, lng: -116.9106278 },
    holes: 18,
    par: 72,
    designer: null, // TODO: the v2 text names an architect, not verified
    yearOpened: null,
    description:
      "Cottonwood is a public 18-hole golf course in El Cajon, California, in the hills of Rancho San Diego about 20 minutes from downtown San Diego.",
    amenities: [], // TODO
    photos: [{ url: "https://storage.googleapis.com/courserev-cdn/course/org-banner-1787691404975.jpeg", alt: "Cottonwood Golf Club, El Cajon, California", width: 1500, height: 350 }],
    logoUrl: null,
    themeColor: null,
  },
  ops: {
    teeTimes: days("cottonwood-golf-club"),
    policies: {
      cancellation: "Changes or cancellations need at least 24 hours' notice.",
      walking: "Walking is allowed at all times; carts can be rented.",
      dressCode: "Collared shirts or golf mock necks and tailored pants or shorts are required. No denim, gym wear or metal spikes.",
      maxPlayers: 4,
      bookingWindowDays: 14,
    },
    faq: [],
  },
  teemeup: teemeup("cottonwood-golf-club", []),
  provenance: {
    description: demo("cottonwood"),
    phone: v2("cottonwoodgolfclub", "course details"),
    website: v2("cottonwoodgolfclub", "course details"),
    geo: v2("cottonwoodgolfclub", "course details"),
    photos: v2("cottonwoodgolfclub", "banner, CourseRev CDN"),
    teeTimes: v2("cottonwoodgolfclub", "tee time API, snapshot"),
    policies: demo("cottonwood"),
  },
};

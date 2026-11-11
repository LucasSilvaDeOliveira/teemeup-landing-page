import type { IconName } from "@/components/Icon";

/** Icon for an amenity, chosen from keywords in its text. Amenities are free text, so anything unknown gets a check mark. */
const AMENITY_RULES: [RegExp, IconName][] = [
  [/range/i, "golf"],
  [/putting/i, "flag-pennant"],
  [/chipping|bunker/i, "target"],
  [/locker/i, "lockers"],
  [/beer|taproom|\bbar\b|pub/i, "beer-stein"],
  [/dining|restaurant|grill|food/i, "fork-knife"],
  [/shop|store/i, "storefront"],
  [/lesson|instruction|academy/i, "chalkboard-teacher"],
  [/outing|event|wedding|banquet/i, "users-three"],
  [/cart/i, "car-simple"],
];

export function amenityIcon(text: string): IconName {
  return AMENITY_RULES.find(([re]) => re.test(text))?.[1] ?? "check-circle";
}

/** Icons for the booking policy lines, by policy field. */
export const POLICY_ICONS = {
  cancellation: "clock-countdown",
  dressCode: "t-shirt",
  carts: "car-simple",
  walking: "person-simple-walk",
  groupingNote: "users",
  maxPlayers: "ticket",
  bookingWindowDays: "calendar-check",
} as const satisfies Record<string, IconName>;

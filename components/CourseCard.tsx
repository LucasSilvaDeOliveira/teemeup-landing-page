import Image from "next/image";
import type { CardData } from "@/lib/hub";

/**
 * Course card used by the hubs and by "Golf courses near ...". A plain link: photo, name and place (with the distance
 * when known). `Heading` keeps the outline right: h3 under a section h2, h4 under a city h3.
 */
export function CourseCard({ card, heading: Heading = "h3" }: { card: CardData; heading?: "h3" | "h4" }) {
  return (
    <a className="near" href={card.href}>
      <div className="ph">
        {card.photo && <Image src={card.photo.url} alt={card.photo.alt} width={card.photo.width} height={card.photo.height} sizes="(min-width: 640px) 420px, 116px" />}
      </div>
      <div>
        <Heading className="near-name">{card.name}</Heading>
        <p>{card.place}</p>
      </div>
    </a>
  );
}

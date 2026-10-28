import Image from "next/image";
import type { CardData } from "@/lib/hub";

/** Course card used by the hubs and by "Golf courses near ...". A plain link: photo, name and place (with the distance when known). */
export function CourseCard({ card }: { card: CardData }) {
  return (
    <a className="ncard" href={card.href}>
      {card.photo && (
        <span className="nthumb">
          <Image src={card.photo.url} alt={card.photo.alt} width={card.photo.width} height={card.photo.height} sizes="(min-width: 768px) 360px, calc(100vw - 40px)" />
        </span>
      )}
      <span className="nbody">
        <b>{card.name}</b>
        <span>{card.place}</span>
      </span>
    </a>
  );
}

import Image from "next/image";
import type { CardData } from "@/lib/hub";

/** Course card used by the hubs and by "Golf courses near ...". A plain link: name, place, facts and availability. */
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
        {card.detail && <span>{card.detail}</span>}
        {card.availability && <span className="avail">{card.availability}</span>}
      </span>
    </a>
  );
}

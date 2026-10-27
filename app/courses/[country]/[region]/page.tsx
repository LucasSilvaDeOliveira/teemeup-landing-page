import type { Metadata } from "next";
import { listCourses } from "@/lib/courses";
import { coursePath } from "@/lib/config";

type Props = { params: Promise<{ country: string; region: string }> };

export const metadata: Metadata = { title: "Golf courses on Teemeup", robots: { index: false, follow: true } };
export const revalidate = 300;

export default async function RegionHub({ params }: Props) {
  const { country, region } = await params;
  const courses = (await listCourses()).filter((c) => c.facts.country === country && c.facts.region === region);
  return (
    <div className="wrap" style={{ padding: "40px 20px" }}>
      <p><a className="wordmark" href="/courses">teemeup</a></p>
      <h1 style={{ margin: "24px 0 16px" }}>Golf courses in {region.toUpperCase()}</h1>
      <ul className="plain">
        {courses.map((c) => (
          <li key={c.facts.slug}>
            <a href={coursePath(c.facts)}>{c.facts.name}</a> · {c.facts.city}
          </li>
        ))}
      </ul>
    </div>
  );
}

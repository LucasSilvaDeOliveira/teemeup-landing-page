import type { Metadata } from "next";
import { listCourses } from "@/lib/courses";
import { coursePath } from "@/lib/config";

// Hub pages stay noindex until there are enough courses with real content to list.
export const metadata: Metadata = { title: "Golf courses on Teemeup", robots: { index: false, follow: true } };
export const revalidate = 300;

export default async function CoursesHub() {
  const courses = await listCourses();
  return (
    <div className="wrap" style={{ padding: "40px 20px" }}>
      <p><a className="wordmark" href="/courses">teemeup</a></p>
      <h1 style={{ margin: "24px 0 16px" }}>Golf courses on Teemeup</h1>
      <ul className="plain">
        {courses.map((c) => (
          <li key={c.facts.slug}>
            <a href={coursePath(c.facts)}>{c.facts.name}</a> · {c.facts.city}, {c.facts.region.toUpperCase()}
          </li>
        ))}
      </ul>
    </div>
  );
}

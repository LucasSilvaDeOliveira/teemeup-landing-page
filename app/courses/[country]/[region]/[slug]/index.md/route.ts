import { getCourse } from "@/lib/courses";
import { courseMarkdown } from "@/lib/seo";

export const revalidate = 300;

type Ctx = { params: Promise<{ country: string; region: string; slug: string }> };

/** Markdown twin of the course page, generated from the same data as the HTML. */
export async function GET(_req: Request, { params }: Ctx) {
  const { country, region, slug } = await params;
  const c = await getCourse(country, region, slug);
  if (!c) return new Response("Not found", { status: 404 });
  return new Response(courseMarkdown(c), {
    headers: { "Content-Type": "text/markdown; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}

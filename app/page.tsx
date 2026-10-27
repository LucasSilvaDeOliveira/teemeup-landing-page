import { redirect } from "next/navigation";

// Development stand-in: the real home page lives elsewhere. Replace or remove before production.
export default function Home() {
  redirect("/courses");
}

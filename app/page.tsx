import { redirect } from "next/navigation"

// Root only redirects based on the session; caching it would hand every visitor
// a stale redirect baked from whoever hit it first.
export const dynamic = "force-dynamic";

export default function HomePage() {
  redirect("/dashboard")
}

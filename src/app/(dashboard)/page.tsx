import { redirect } from "next/navigation";

// Root of the (dashboard) route group — real content lives in /dashboard subfolder
export default function DashboardGroupPage() {
  redirect("/dashboard");
}

import { redirect } from "next/navigation";

// The home page is a new Team Radio chat. The original chat (components/analytics-chat.tsx) is kept but no longer served here.
export default function Page() {
  redirect("/design/new");
}

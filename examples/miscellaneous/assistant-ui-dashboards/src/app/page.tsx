import App from "../components/app";

export const dynamic = "force-dynamic";

export default function Page() {
  // With THESYS_BASE_URL set, the browser calls OpenUI Cloud on this origin, which next.config.ts
  // forwards there. Otherwise it calls https://api.thesys.dev directly.
  return <App apiBaseUrl={process.env.THESYS_BASE_URL ? "" : undefined} />;
}

"use client";

import { Button } from "@openuidev/react-ui";
import { useRouter } from "next/navigation";

export default function TopBarDocsButton() {
  const router = useRouter();

  return (
    <Button variant="primary" size="small" onClick={() => router.push("/blocks")}>
      Docs
    </Button>
  );
}

"use client";

import { Button } from "@openuidev/react-ui/Button";
import { useRouter } from "next/navigation";

export default function TopBarDocsButton() {
  const router = useRouter();

  return (
    <Button variant="primary" size="small" onClick={() => router.push("/components/blocks")}>
      Docs
    </Button>
  );
}

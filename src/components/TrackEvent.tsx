"use client";

import { useEffect, useRef } from "react";
import { track } from "@vercel/analytics";

export default function TrackEvent({
  name,
  data,
}: {
  name: string;
  data?: Record<string, string | number | boolean>;
}) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      track(name, data);
    }
  }, [name, data]);

  return null;
}

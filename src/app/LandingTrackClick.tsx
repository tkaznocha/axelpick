"use client";

import { track } from "@vercel/analytics";

export default function LandingTrackClick({
  event,
  data,
  children,
  ...props
}: {
  event: string;
  data?: Record<string, string>;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a {...props} onClick={() => track(event, data)}>
      {children}
    </a>
  );
}

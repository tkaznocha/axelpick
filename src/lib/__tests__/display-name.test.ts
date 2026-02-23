import { describe, it, expect, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: <T>(fn: T) => fn };
});
vi.mock("next/headers", () => ({
  cookies: () => ({ getAll: () => [], set: () => {} }),
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({}),
}));

import { getDisplayName } from "../supabase-server";

// Minimal User-shaped objects — only the fields getDisplayName touches
function fakeUser(overrides: {
  user_metadata?: Record<string, string>;
  email?: string;
}) {
  return overrides as Parameters<typeof getDisplayName>[0];
}

describe("getDisplayName", () => {
  it("uses display_name from metadata", () => {
    expect(
      getDisplayName(fakeUser({ user_metadata: { display_name: "Alex" } }))
    ).toBe("Alex");
  });

  it("falls back to full_name", () => {
    expect(
      getDisplayName(fakeUser({ user_metadata: { full_name: "Alex Kim" } }))
    ).toBe("Alex Kim");
  });

  it("falls back to email prefix", () => {
    expect(
      getDisplayName(fakeUser({ user_metadata: {}, email: "alex@example.com" }))
    ).toBe("alex");
  });

  it("falls back to 'Skater' when nothing set", () => {
    expect(getDisplayName(fakeUser({ user_metadata: {} }))).toBe("Skater");
  });

  it("empty string display_name falls through to next", () => {
    expect(
      getDisplayName(
        fakeUser({
          user_metadata: { display_name: "", full_name: "Fallback" },
        })
      )
    ).toBe("Fallback");
  });
});

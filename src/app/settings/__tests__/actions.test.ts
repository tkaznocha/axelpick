import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: vi.fn(),
}));
vi.mock("@/lib/supabase-admin", () => ({
  createAdminClient: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { updateDisplayName, changePassword } from "../actions";

// ── Helpers ──────────────────────────────────────────────────────────
function chain(data: unknown) {
  const result = Promise.resolve({ data, error: null });
  const obj: Record<string, unknown> = {};
  const proxy: unknown = new Proxy(obj, {
    get(_target, prop) {
      if (prop === "then") return result.then.bind(result);
      return () => proxy;
    },
  });
  return proxy;
}

function mockClient(
  session: { user: { id: string } } | null,
  opts: { updateError?: boolean; authError?: boolean } = {}
) {
  const client = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session } }),
      updateUser: vi.fn().mockResolvedValue({
        error: opts.authError ? { message: "fail" } : null,
      }),
    },
    from: vi.fn(() =>
      chain(opts.updateError ? undefined : { id: "u1" })
    ),
  };
  vi.mocked(createServerSupabaseClient).mockReturnValue(client as never);
  return client;
}

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.append(k, v);
  return fd;
}

const USER = { id: "u1" };

beforeEach(() => vi.clearAllMocks());

// ── updateDisplayName ────────────────────────────────────────────────
describe("updateDisplayName", () => {
  it("returns error when not authenticated", async () => {
    mockClient(null);
    const res = await updateDisplayName(formData({ displayName: "X" }));
    expect(res).toEqual({ error: "Not authenticated" });
  });

  it("returns error for empty name", async () => {
    mockClient({ user: USER });
    const res = await updateDisplayName(formData({ displayName: "   " }));
    expect(res).toEqual({ error: "Display name must be 1\u201350 characters" });
  });

  it("returns error for name over 50 chars", async () => {
    mockClient({ user: USER });
    const res = await updateDisplayName(
      formData({ displayName: "A".repeat(51) })
    );
    expect(res).toEqual({ error: "Display name must be 1\u201350 characters" });
  });

  it("returns success for valid name", async () => {
    mockClient({ user: USER });
    const res = await updateDisplayName(formData({ displayName: "Alex" }));
    expect(res).toEqual({ success: true });
  });
});

// ── changePassword ───────────────────────────────────────────────────
describe("changePassword", () => {
  it("returns error when not authenticated", async () => {
    mockClient(null);
    const res = await changePassword(
      formData({ newPassword: "longpassword", confirmPassword: "longpassword" })
    );
    expect(res).toEqual({ error: "Not authenticated" });
  });

  it("returns error for password too short", async () => {
    mockClient({ user: USER });
    const res = await changePassword(
      formData({ newPassword: "short", confirmPassword: "short" })
    );
    expect(res).toEqual({ error: "Password must be at least 8 characters" });
  });

  it("returns error when passwords don't match", async () => {
    mockClient({ user: USER });
    const res = await changePassword(
      formData({ newPassword: "longpassword", confirmPassword: "different" })
    );
    expect(res).toEqual({ error: "Passwords do not match" });
  });

  it("returns success for valid password", async () => {
    mockClient({ user: USER });
    const res = await changePassword(
      formData({ newPassword: "longpassword", confirmPassword: "longpassword" })
    );
    expect(res).toEqual({ success: true });
  });
});

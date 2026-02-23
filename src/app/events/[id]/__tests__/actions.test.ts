import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ────────────────────────────────────────────────────────────
vi.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: vi.fn(),
}));
vi.mock("@/lib/supabase-admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { addPick, removePick } from "../actions";

// ── Helpers ──────────────────────────────────────────────────────────

/** Build a chainable Supabase query builder that resolves to `data`. */
function chain(data: unknown, opts?: { count?: number }) {
  const obj: Record<string, unknown> = {};
  const result =
    opts?.count !== undefined
      ? Promise.resolve({ data, count: opts.count })
      : Promise.resolve({ data, error: null });

  // Every chainable method returns the same object so .select().eq().single() works
  const proxy: unknown = new Proxy(obj, {
    get(_target, prop) {
      if (prop === "then") return result.then.bind(result);
      return () => proxy;
    },
  });
  return proxy;
}

type TableData = Record<string, unknown>;

/**
 * Create a fake Supabase client.
 * `tables` maps "tableName" → data returned by that table's query.
 * Special: tables["user_picks:insert"] controls the insert result.
 */
function mockClient(
  session: { user: { id: string } } | null,
  tables: Record<string, TableData | TableData[] | null> = {}
) {
  const client = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session } }),
    },
    from: vi.fn((table: string) => {
      const hasInsert = `${table}:insert` in tables;
      const hasDelete = `${table}:deleteCount` in tables;
      if (hasInsert || hasDelete) {
        return {
          insert: () =>
            Promise.resolve({ error: tables[`${table}:insert`] ?? null }),
          select: () => chain(tables[table] ?? null),
          delete: () => chain(null, { count: tables[`${table}:deleteCount`] as number ?? 0 }),
        };
      }
      return chain(tables[table] ?? null);
    }),
  };
  vi.mocked(createServerSupabaseClient).mockReturnValue(client as never);
  return client;
}

// ── Defaults ─────────────────────────────────────────────────────────
const USER = { id: "u1" };
const EVENT_ID = "e1";
const SKATER_ID = "s1";

const OPEN_EVENT = {
  id: EVENT_ID,
  picks_limit: 5,
  budget: 50_000_000,
  picks_lock_at: null,
  status: "upcoming",
};

const ENTRY = {
  skater_id: SKATER_ID,
  price_at_event: 10_000_000,
  is_withdrawn: false,
};

beforeEach(() => vi.clearAllMocks());

// ── addPick ──────────────────────────────────────────────────────────
describe("addPick", () => {
  it("returns error when not authenticated", async () => {
    mockClient(null);
    const res = await addPick(EVENT_ID, SKATER_ID);
    expect(res).toEqual({ success: false, error: "Not authenticated" });
  });

  it("returns error when event not found", async () => {
    mockClient({ user: USER }, { events: null, event_entries: ENTRY, user_picks: [] });
    const res = await addPick(EVENT_ID, SKATER_ID);
    expect(res).toEqual({ success: false, error: "Event not found" });
  });

  it("returns error when event status is locked", async () => {
    mockClient({ user: USER }, {
      events: { ...OPEN_EVENT, status: "locked" },
      event_entries: ENTRY,
      user_picks: [],
    });
    const res = await addPick(EVENT_ID, SKATER_ID);
    expect(res).toEqual({
      success: false,
      error: "Event is no longer accepting picks",
    });
  });

  it("returns error when picks lock time is in the past", async () => {
    mockClient({ user: USER }, {
      events: {
        ...OPEN_EVENT,
        picks_lock_at: new Date(Date.now() - 60_000).toISOString(),
      },
      event_entries: ENTRY,
      user_picks: [],
    });
    const res = await addPick(EVENT_ID, SKATER_ID);
    expect(res).toEqual({
      success: false,
      error: "Picks are locked for this event",
    });
  });

  it("returns error when skater not in event", async () => {
    mockClient({ user: USER }, {
      events: OPEN_EVENT,
      event_entries: null,
      user_picks: [],
    });
    const res = await addPick(EVENT_ID, SKATER_ID);
    expect(res).toEqual({
      success: false,
      error: "Skater is not in this event",
    });
  });

  it("returns error when skater is withdrawn", async () => {
    mockClient({ user: USER }, {
      events: OPEN_EVENT,
      event_entries: { ...ENTRY, is_withdrawn: true },
      user_picks: [],
    });
    const res = await addPick(EVENT_ID, SKATER_ID);
    expect(res).toEqual({
      success: false,
      error: "Skater has withdrawn from this event",
    });
  });

  it("returns error on duplicate pick", async () => {
    mockClient({ user: USER }, {
      events: OPEN_EVENT,
      event_entries: ENTRY,
      user_picks: [{ skater_id: SKATER_ID }],
    });
    const res = await addPick(EVENT_ID, SKATER_ID);
    expect(res).toEqual({ success: false, error: "Skater already picked" });
  });

  it("returns error when pick limit reached", async () => {
    mockClient({ user: USER }, {
      events: { ...OPEN_EVENT, picks_limit: 1 },
      event_entries: ENTRY,
      user_picks: [{ skater_id: "other" }],
    });
    const res = await addPick(EVENT_ID, SKATER_ID);
    expect(res).toEqual({ success: false, error: "Pick limit reached" });
  });

  it("returns error when over budget", async () => {
    mockClient({ user: USER }, {
      events: { ...OPEN_EVENT, budget: 5_000_000 },
      event_entries: { ...ENTRY, price_at_event: 10_000_000 },
      user_picks: [],
      "user_picks:insert": null,
    });
    const res = await addPick(EVENT_ID, SKATER_ID);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Over budget/);
  });

  it("returns success on happy path", async () => {
    mockClient({ user: USER }, {
      events: OPEN_EVENT,
      event_entries: ENTRY,
      user_picks: [],
      "user_picks:insert": null, // null error = success
    });
    const res = await addPick(EVENT_ID, SKATER_ID);
    expect(res).toEqual({ success: true });
  });
});

// ── removePick ───────────────────────────────────────────────────────
describe("removePick", () => {
  it("returns error when not authenticated", async () => {
    mockClient(null);
    const res = await removePick(EVENT_ID, SKATER_ID);
    expect(res).toEqual({ success: false, error: "Not authenticated" });
  });

  it("returns error when event is locked", async () => {
    mockClient({ user: USER }, {
      events: { ...OPEN_EVENT, status: "locked" },
    });
    const res = await removePick(EVENT_ID, SKATER_ID);
    expect(res).toEqual({
      success: false,
      error: "Event is no longer accepting picks",
    });
  });

  it("returns error when pick not found (count=0)", async () => {
    mockClient({ user: USER }, {
      events: OPEN_EVENT,
      "user_picks:deleteCount": 0,
    });
    const res = await removePick(EVENT_ID, SKATER_ID);
    expect(res).toEqual({ success: false, error: "Pick not found" });
  });

  it("returns success on happy path", async () => {
    mockClient({ user: USER }, {
      events: OPEN_EVENT,
      "user_picks:deleteCount": 1,
    });
    const res = await removePick(EVENT_ID, SKATER_ID);
    expect(res).toEqual({ success: true });
  });
});

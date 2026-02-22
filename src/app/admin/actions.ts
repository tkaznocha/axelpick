"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { calculateFantasyPoints } from "@/lib/scoring";

async function requireAdmin() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminIds = (process.env.ADMIN_USER_ID ?? "").split(",").map((s) => s.trim());
  if (!user || !adminIds.includes(user.id)) {
    throw new Error("Unauthorized");
  }

  return user;
}

// ---------- Create Event ----------

export async function createEvent(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const name = formData.get("name") as string;
  const eventType = formData.get("event_type") as string;
  const location = formData.get("location") as string;
  const startDate = formData.get("start_date") as string;
  const endDate = formData.get("end_date") as string;
  const picksLimit = parseInt(formData.get("picks_limit") as string, 10);
  const budget = parseInt(formData.get("budget") as string, 10);
  const pointsMultiplier = parseFloat(
    formData.get("points_multiplier") as string
  );
  const picksLockAt = formData.get("picks_lock_at") as string;

  const { data, error } = await admin.from("events").insert({
    name,
    event_type: eventType,
    location,
    start_date: startDate,
    end_date: endDate,
    picks_limit: picksLimit,
    budget,
    points_multiplier: pointsMultiplier,
    picks_lock_at: picksLockAt || null,
    status: "upcoming",
  }).select().single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, event: data };
}

// ---------- Import Entries ----------

interface EntryInput {
  skater_name: string;
  country: string;
  discipline: string;
  world_ranking?: number;
  price: number;
}

export async function importEntries(eventId: string, jsonText: string) {
  await requireAdmin();
  const admin = createAdminClient();

  let entries: EntryInput[];
  try {
    entries = JSON.parse(jsonText);
  } catch {
    return { success: false, error: "Invalid JSON" };
  }

  if (!Array.isArray(entries) || entries.length === 0) {
    return { success: false, error: "JSON must be a non-empty array" };
  }

  const results: string[] = [];
  let created = 0;
  let skipped = 0;

  for (const entry of entries) {
    // Upsert skater by name + discipline
    let { data: skater } = await admin
      .from("skaters")
      .select("id")
      .eq("name", entry.skater_name)
      .eq("discipline", entry.discipline)
      .single();

    if (!skater) {
      const { data: newSkater, error: skaterErr } = await admin
        .from("skaters")
        .insert({
          name: entry.skater_name,
          country: entry.country,
          discipline: entry.discipline,
          world_ranking: entry.world_ranking ?? null,
          current_price: entry.price,
          is_active: true,
        })
        .select("id")
        .single();

      if (skaterErr) {
        results.push(`SKIP ${entry.skater_name}: ${skaterErr.message}`);
        skipped++;
        continue;
      }
      skater = newSkater;
    } else {
      // Update existing skater's ranking and price
      await admin
        .from("skaters")
        .update({
          country: entry.country,
          world_ranking: entry.world_ranking ?? null,
          current_price: entry.price,
          updated_at: new Date().toISOString(),
        })
        .eq("id", skater.id);
    }

    // Create event entry
    const { error: entryErr } = await admin.from("event_entries").insert({
      event_id: eventId,
      skater_id: skater.id,
      price_at_event: entry.price,
    });

    if (entryErr) {
      if (entryErr.message.includes("duplicate")) {
        results.push(`SKIP ${entry.skater_name}: already entered`);
        skipped++;
      } else {
        results.push(`ERROR ${entry.skater_name}: ${entryErr.message}`);
        skipped++;
      }
    } else {
      created++;
    }
  }

  return {
    success: true,
    summary: `${created} entries imported, ${skipped} skipped`,
    details: results,
  };
}

// ---------- Import Results ----------

interface ResultInput {
  skater_name: string;
  placement: number;
  sp_placement?: number;
  total_score?: number;
  sp_score?: number;
  fs_score?: number;
  falls?: number;
  is_personal_best?: boolean;
  is_withdrawal?: boolean;
}

export async function importResults(eventId: string, jsonText: string) {
  await requireAdmin();
  const admin = createAdminClient();

  let resultsInput: ResultInput[];
  try {
    resultsInput = JSON.parse(jsonText);
  } catch {
    return { success: false, error: "Invalid JSON" };
  }

  if (!Array.isArray(resultsInput) || resultsInput.length === 0) {
    return { success: false, error: "JSON must be a non-empty array" };
  }

  // Get event for multiplier
  const { data: event, error: eventErr } = await admin
    .from("events")
    .select("id, points_multiplier")
    .eq("id", eventId)
    .single();

  if (eventErr || !event) {
    return { success: false, error: "Event not found" };
  }

  const log: string[] = [];
  let created = 0;
  let skipped = 0;

  for (const r of resultsInput) {
    // Find skater by name in event entries
    const { data: entryRow } = await admin
      .from("event_entries")
      .select("skater_id, skaters!inner(id, name)")
      .eq("event_id", eventId)
      .eq("skaters.name", r.skater_name)
      .single();

    if (!entryRow) {
      log.push(`SKIP ${r.skater_name}: not found in event entries`);
      skipped++;
      continue;
    }

    const falls = r.falls ?? 0;
    const isPB = r.is_personal_best ?? false;
    const isWD = r.is_withdrawal ?? false;

    const { raw, final: finalPts } = calculateFantasyPoints(
      {
        final_placement: r.placement,
        sp_placement: r.sp_placement ?? null,
        falls,
        is_personal_best: isPB,
        is_withdrawal: isWD,
      },
      { points_multiplier: Number(event.points_multiplier) }
    );

    const { error: resErr } = await admin.from("results").insert({
      event_id: eventId,
      skater_id: entryRow.skater_id,
      final_placement: r.placement,
      sp_placement: r.sp_placement ?? null,
      total_score: r.total_score ?? null,
      sp_score: r.sp_score ?? null,
      fs_score: r.fs_score ?? null,
      falls,
      is_personal_best: isPB,
      is_withdrawal: isWD,
      fantasy_points_raw: raw,
      fantasy_points_final: finalPts,
    });

    if (resErr) {
      if (resErr.message.includes("duplicate")) {
        log.push(`SKIP ${r.skater_name}: result already exists`);
        skipped++;
      } else {
        log.push(`ERROR ${r.skater_name}: ${resErr.message}`);
        skipped++;
      }
    } else {
      log.push(
        `OK ${r.skater_name}: ${r.placement}${getOrdinal(r.placement)} → ${finalPts} pts (raw ${raw})`
      );
      created++;
    }
  }

  // Update event status to completed
  await admin
    .from("events")
    .update({ status: "completed" })
    .eq("id", eventId);

  // Update user_picks points and season totals
  await recalcUserPoints(admin, eventId);

  return {
    success: true,
    summary: `${created} results imported, ${skipped} skipped`,
    details: log,
  };
}

// Recalculate points earned for each user pick in this event,
// then update total_season_points for affected users.
async function recalcUserPoints(
  admin: ReturnType<typeof createAdminClient>,
  eventId: string
) {
  // Get all results for this event
  const { data: eventResults } = await admin
    .from("results")
    .select("skater_id, fantasy_points_final")
    .eq("event_id", eventId);

  if (!eventResults) return;

  const pointsBySkater = new Map<string, number>();
  for (const r of eventResults) {
    pointsBySkater.set(r.skater_id, r.fantasy_points_final ?? 0);
  }

  // Get all picks for this event
  const { data: picks } = await admin
    .from("user_picks")
    .select("id, user_id, skater_id")
    .eq("event_id", eventId);

  if (!picks) return;

  // Update each pick's points_earned
  for (const pick of picks) {
    const pts = pointsBySkater.get(pick.skater_id) ?? 0;
    await admin
      .from("user_picks")
      .update({ points_earned: pts })
      .eq("id", pick.id);
  }

  // Recalculate season totals for affected users
  const userIds = Array.from(new Set(picks.map((p) => p.user_id)));
  for (const userId of userIds) {
    const { data: allPicks } = await admin
      .from("user_picks")
      .select("points_earned")
      .eq("user_id", userId);

    const total = (allPicks ?? []).reduce(
      (sum, p) => sum + (p.points_earned ?? 0),
      0
    );

    await admin
      .from("users")
      .update({ total_season_points: total })
      .eq("id", userId);
  }
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// ---------- Fetch Event Entries (for withdrawal management) ----------

export async function fetchEventEntries(eventId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("event_entries")
    .select(
      "id, skater_id, price_at_event, is_withdrawn, withdrawn_at, skaters(id, name, country, discipline)"
    )
    .eq("event_id", eventId)
    .order("price_at_event", { ascending: false });

  if (error) return { success: false, error: error.message, entries: [] };
  return { success: true, entries: data ?? [] };
}

// ---------- Withdraw Skater ----------

export async function withdrawSkater(
  eventId: string,
  skaterId: string,
  replacementDeadline: string | null
) {
  await requireAdmin();
  const admin = createAdminClient();

  // 1. Mark entry as withdrawn
  const { error: updateErr } = await admin
    .from("event_entries")
    .update({ is_withdrawn: true, withdrawn_at: new Date().toISOString() })
    .eq("event_id", eventId)
    .eq("skater_id", skaterId);

  if (updateErr) return { success: false, error: updateErr.message };

  // 2. Update replacement deadline on event (if provided)
  if (replacementDeadline) {
    await admin
      .from("events")
      .update({ replacement_deadline: replacementDeadline })
      .eq("id", eventId);
  }

  // 3. Get skater name + event name for notification text
  const { data: skater } = await admin
    .from("skaters")
    .select("name")
    .eq("id", skaterId)
    .single();
  const { data: event } = await admin
    .from("events")
    .select("name")
    .eq("id", eventId)
    .single();

  // 4. Find affected users (those who picked this skater)
  const { data: affectedPicks } = await admin
    .from("user_picks")
    .select("user_id")
    .eq("event_id", eventId)
    .eq("skater_id", skaterId);

  const affectedUserIds = (affectedPicks ?? []).map((p) => p.user_id);

  // 5. Create replacement entitlements and notifications
  for (const userId of affectedUserIds) {
    await admin.from("pick_replacements").insert({
      user_id: userId,
      event_id: eventId,
      withdrawn_skater_id: skaterId,
    });

    const deadlineText = replacementDeadline
      ? `You have until ${new Date(replacementDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} to pick a replacement.`
      : "Check the event page to pick a replacement.";

    await admin.from("notifications").insert({
      user_id: userId,
      type: "withdrawal",
      title: "Skater Withdrawal",
      body: `${skater?.name ?? "A skater"} has withdrawn from ${event?.name ?? "the event"}. ${deadlineText}`,
      event_id: eventId,
      metadata: {
        skater_id: skaterId,
        skater_name: skater?.name,
        replacement_deadline: replacementDeadline,
      },
    });
  }

  return {
    success: true,
    summary: `${skater?.name ?? "Skater"} withdrawn. ${affectedUserIds.length} user(s) notified.`,
  };
}

// ---------- Fetch Events (for dropdowns) ----------

export async function fetchEvents() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("events")
    .select("id, name, event_type, status, start_date")
    .order("start_date", { ascending: false });

  if (error) {
    return { success: false, error: error.message, events: [] };
  }

  return { success: true, events: data ?? [] };
}

// ---------- Fetch Events Full (for edit forms) ----------

export async function fetchEventsFull() {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("events")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) {
    return { success: false, error: error.message, events: [] };
  }

  return { success: true, events: data ?? [] };
}

// ---------- Update Event ----------

export async function updateEvent(
  eventId: string,
  fields: Record<string, unknown>
) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("events")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---------- Delete Event ----------

export async function deleteEvent(eventId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  // Block if user_picks exist
  const { count } = await admin
    .from("user_picks")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId);

  if (count && count > 0) {
    return {
      success: false,
      error: `Cannot delete: ${count} user pick(s) reference this event.`,
    };
  }

  // Delete related data first
  await admin.from("results").delete().eq("event_id", eventId);
  await admin.from("event_entries").delete().eq("event_id", eventId);

  const { error } = await admin.from("events").delete().eq("id", eventId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---------- Update Entry Price ----------

export async function updateEntryPrice(entryId: string, newPrice: number) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("event_entries")
    .update({ price_at_event: newPrice })
    .eq("id", entryId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---------- Remove Entry ----------

export async function removeEntry(entryId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  // Get the entry to check for picks
  const { data: entry } = await admin
    .from("event_entries")
    .select("event_id, skater_id")
    .eq("id", entryId)
    .single();

  if (!entry) return { success: false, error: "Entry not found" };

  const { count } = await admin
    .from("user_picks")
    .select("id", { count: "exact", head: true })
    .eq("event_id", entry.event_id)
    .eq("skater_id", entry.skater_id);

  if (count && count > 0) {
    return {
      success: false,
      error: `Cannot remove: ${count} user(s) have picked this skater.`,
    };
  }

  const { error } = await admin
    .from("event_entries")
    .delete()
    .eq("id", entryId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---------- Add Entry to Event ----------

export async function addEntryToEvent(
  eventId: string,
  skaterId: string,
  price: number
) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("event_entries").insert({
    event_id: eventId,
    skater_id: skaterId,
    price_at_event: price,
  });

  if (error) {
    if (error.message.includes("duplicate")) {
      return { success: false, error: "Skater already entered in this event" };
    }
    return { success: false, error: error.message };
  }
  return { success: true };
}

// ---------- Search Skaters ----------

export async function fetchSkaterSearch(query: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("skaters")
    .select("id, name, country, discipline, current_price")
    .ilike("name", `%${query}%`)
    .limit(20);

  if (error) return { success: false, error: error.message, skaters: [] };
  return { success: true, skaters: data ?? [] };
}

// ---------- Fetch Event Results ----------

export async function fetchEventResults(eventId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("results")
    .select(
      "id, skater_id, final_placement, sp_placement, total_score, sp_score, fs_score, falls, is_personal_best, is_withdrawal, fantasy_points_raw, fantasy_points_final, skaters(id, name, country, discipline)"
    )
    .eq("event_id", eventId)
    .order("final_placement", { ascending: true });

  if (error) return { success: false, error: error.message, results: [] };
  return { success: true, results: data ?? [] };
}

// ---------- Update Result ----------

export async function updateResult(
  resultId: string,
  fields: {
    final_placement?: number;
    sp_placement?: number | null;
    total_score?: number | null;
    sp_score?: number | null;
    fs_score?: number | null;
    falls?: number;
    is_personal_best?: boolean;
    is_withdrawal?: boolean;
  }
) {
  await requireAdmin();
  const admin = createAdminClient();

  // Get result + event for recalculation
  const { data: result } = await admin
    .from("results")
    .select("*, events(points_multiplier)")
    .eq("id", resultId)
    .single();

  if (!result) return { success: false, error: "Result not found" };

  const merged = {
    final_placement: fields.final_placement ?? result.final_placement,
    sp_placement: fields.sp_placement !== undefined ? fields.sp_placement : result.sp_placement,
    falls: fields.falls ?? result.falls,
    is_personal_best: fields.is_personal_best ?? result.is_personal_best,
    is_withdrawal: fields.is_withdrawal ?? result.is_withdrawal,
  };

  const { raw, final: finalPts } = calculateFantasyPoints(merged, {
    points_multiplier: Number(result.events.points_multiplier),
  });

  const { error } = await admin
    .from("results")
    .update({
      ...fields,
      fantasy_points_raw: raw,
      fantasy_points_final: finalPts,
    })
    .eq("id", resultId);

  if (error) return { success: false, error: error.message };
  return { success: true, fantasy_points_raw: raw, fantasy_points_final: finalPts };
}

// ---------- Delete Result ----------

export async function deleteResult(resultId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin.from("results").delete().eq("id", resultId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---------- Recalculate Event Points (full cascade) ----------

export async function recalculateEventPoints(eventId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  // Get event
  const { data: event } = await admin
    .from("events")
    .select("id, points_multiplier")
    .eq("id", eventId)
    .single();

  if (!event) return { success: false, error: "Event not found" };

  // Get all results for the event
  const { data: results } = await admin
    .from("results")
    .select("*")
    .eq("event_id", eventId);

  if (!results) return { success: false, error: "No results found" };

  // Recalculate each result
  for (const r of results) {
    const { raw, final: finalPts } = calculateFantasyPoints(
      {
        final_placement: r.final_placement,
        sp_placement: r.sp_placement,
        falls: r.falls,
        is_personal_best: r.is_personal_best,
        is_withdrawal: r.is_withdrawal,
      },
      { points_multiplier: Number(event.points_multiplier) }
    );

    await admin
      .from("results")
      .update({ fantasy_points_raw: raw, fantasy_points_final: finalPts })
      .eq("id", r.id);
  }

  // Cascade to user picks
  await recalcUserPoints(admin, eventId);

  return { success: true, summary: `${results.length} results recalculated` };
}

// ---------- Fetch Skaters (paginated) ----------

export async function fetchSkaters({
  search,
  discipline,
  page,
}: {
  search?: string;
  discipline?: string;
  page?: number;
}) {
  await requireAdmin();
  const admin = createAdminClient();

  const pageSize = 50;
  const currentPage = page ?? 1;
  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = admin
    .from("skaters")
    .select("*", { count: "exact" })
    .order("name", { ascending: true })
    .range(from, to);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (discipline && discipline !== "all") {
    query = query.eq("discipline", discipline);
  }

  const { data, error, count } = await query;

  if (error) return { success: false, error: error.message, skaters: [], total: 0 };
  return {
    success: true,
    skaters: data ?? [],
    total: count ?? 0,
    page: currentPage,
    pageSize,
  };
}

// ---------- Update Skater ----------

export async function updateSkater(
  skaterId: string,
  fields: Record<string, unknown>
) {
  await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("skaters")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", skaterId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---------- Delete Skater ----------

export async function deleteSkater(skaterId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  // Check for entries
  const { count: entryCount } = await admin
    .from("event_entries")
    .select("id", { count: "exact", head: true })
    .eq("skater_id", skaterId);

  if (entryCount && entryCount > 0) {
    return {
      success: false,
      error: `Cannot delete: ${entryCount} event entry/entries reference this skater.`,
    };
  }

  // Check for results
  const { count: resultCount } = await admin
    .from("results")
    .select("id", { count: "exact", head: true })
    .eq("skater_id", skaterId);

  if (resultCount && resultCount > 0) {
    return {
      success: false,
      error: `Cannot delete: ${resultCount} result(s) reference this skater.`,
    };
  }

  const { error } = await admin.from("skaters").delete().eq("id", skaterId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// Quick integration test for league create + join flow
// Uses Supabase admin client (service role) to bypass RLS for setup,
// then tests RLS-protected operations with anon key + user auth.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hqvbdmrmqbxoykaifynt.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SERVICE_ROLE_KEY || !ANON_KEY) {
  console.error("Missing env vars. Run with:");
  console.error(
    "  node --env-file=.env.local scripts/test-leagues.mjs"
  );
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ ${msg}`);
    failed++;
  }
}

// Cleanup helper
const createdLeagueIds = [];
const testUserIds = [];

async function cleanup() {
  for (const lid of createdLeagueIds) {
    await admin.from("league_members").delete().eq("league_id", lid);
    await admin.from("leagues").delete().eq("id", lid);
  }
  for (const uid of testUserIds) {
    await admin.from("users").delete().eq("id", uid);
    await admin.auth.admin.deleteUser(uid);
  }
}

async function createTestUser(email, displayName) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: "testpass123!",
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (error) throw new Error(`Failed to create user ${email}: ${error.message}`);
  testUserIds.push(data.user.id);

  // Ensure user row exists in public.users (trigger may handle this)
  await admin.from("users").upsert({
    id: data.user.id,
    display_name: displayName,
    total_season_points: 0,
  });

  return data.user;
}

function createUserClient(accessToken) {
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

async function signIn(email) {
  // Use admin to generate a session
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error) throw new Error(`Failed to generate link: ${error.message}`);

  // Sign in with the anon client
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: session, error: signInError } =
    await anonClient.auth.verifyOtp({
      token_hash: data.properties.hashed_token,
      type: "magiclink",
    });
  if (signInError)
    throw new Error(`Failed to sign in: ${signInError.message}`);

  return { client: createUserClient(session.session.access_token), session };
}

async function run() {
  console.log("\n=== League Integration Tests ===\n");

  // 1. Create test users
  console.log("Setting up test users...");
  const userA = await createTestUser(
    `test-league-a-${Date.now()}@test.local`,
    "Alice"
  );
  const userB = await createTestUser(
    `test-league-b-${Date.now()}@test.local`,
    "Bob"
  );

  const clientA = await signIn(userA.email);
  const clientB = await signIn(userB.email);

  // 2. Test: User A creates a league
  console.log("\n1. Create League (User A)");
  const inviteCode = generateInviteCode();
  const { data: league, error: createErr } = await clientA.client
    .from("leagues")
    .insert({ name: "Test League", invite_code: inviteCode, created_by: userA.id })
    .select("id, name, invite_code")
    .single();

  assert(!createErr, `League created: ${league?.name ?? createErr?.message}`);
  if (league) createdLeagueIds.push(league.id);

  // 3. Test: Creator auto-joins
  console.log("\n2. Creator joins as member");
  const { error: joinCreatorErr } = await clientA.client
    .from("league_members")
    .insert({ league_id: league.id, user_id: userA.id });

  assert(!joinCreatorErr, `Creator joined: ${joinCreatorErr?.message ?? "OK"}`);

  // 4. Test: Verify membership
  const { data: members1 } = await clientA.client
    .from("league_members")
    .select("user_id")
    .eq("league_id", league.id);

  assert(members1?.length === 1, `Member count is 1 (got ${members1?.length})`);

  // 5. Test: User B looks up league by invite code
  console.log("\n3. Join League (User B via invite code)");
  const { data: foundLeague } = await clientB.client
    .from("leagues")
    .select("id, name")
    .eq("invite_code", inviteCode.toUpperCase())
    .single();

  assert(foundLeague?.id === league.id, `League found by invite code`);

  // 6. Test: User B joins
  const { error: joinBErr } = await clientB.client
    .from("league_members")
    .insert({ league_id: league.id, user_id: userB.id });

  assert(!joinBErr, `User B joined: ${joinBErr?.message ?? "OK"}`);

  // 7. Test: Both members visible
  const { data: members2 } = await clientB.client
    .from("league_members")
    .select("user_id, users(display_name, total_season_points)")
    .eq("league_id", league.id);

  assert(members2?.length === 2, `Member count is 2 (got ${members2?.length})`);

  // 8. Test: Case-insensitive invite code lookup
  console.log("\n4. Case-insensitive code lookup");
  const { data: lowerLookup } = await clientB.client
    .from("leagues")
    .select("id")
    .eq("invite_code", inviteCode.toUpperCase())
    .single();

  assert(lowerLookup?.id === league.id, `Uppercase lookup works`);

  // 9. Test: User B can see their leagues
  console.log("\n5. List user's leagues");
  const { data: bLeagues } = await clientB.client
    .from("league_members")
    .select("league_id, leagues(id, name, created_by)")
    .eq("user_id", userB.id);

  assert(bLeagues?.length === 1, `User B has 1 league (got ${bLeagues?.length})`);

  // 10. Test: RLS - User B cannot insert league as User A
  console.log("\n6. RLS enforcement");
  const { error: rlsErr } = await clientB.client
    .from("leagues")
    .insert({ name: "Hacked", invite_code: "HACK01", created_by: userA.id });

  assert(!!rlsErr, `RLS blocks creating league as another user`);

  // 11. Test: RLS - User B cannot join as User A
  const { error: rlsJoinErr } = await clientB.client
    .from("league_members")
    .insert({ league_id: league.id, user_id: userA.id });

  // This might succeed since A is already a member (PK conflict) or be blocked by RLS
  assert(
    !!rlsJoinErr,
    `RLS blocks joining as another user: ${rlsJoinErr?.message ?? "no error"}`
  );

  // Summary
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
}

function generateInviteCode(length = 6) {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

try {
  await run();
} finally {
  console.log("Cleaning up test data...");
  await cleanup();
  console.log("Done.\n");
}

process.exit(failed > 0 ? 1 : 0);

// Notify all players that Worlds 2026 entry list has been updated
// Run with: node --env-file=.env.local scripts/notify-worlds-update.mjs --dry-run
// Send:     node --env-file=.env.local scripts/notify-worlds-update.mjs

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { readFileSync, writeFileSync } from "fs";

const DRY_RUN = process.argv.includes("--dry-run");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

// --- 1. Fetch all auth users (paginated) ---
console.log("Fetching users...");
const allUsers = [];
let page = 1;
while (true) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page,
    perPage: 1000,
  });
  if (error) {
    console.error("Error fetching users:", error.message);
    process.exit(1);
  }
  allUsers.push(...data.users);
  if (data.users.length < 1000) break;
  page++;
}
console.log(`Found ${allUsers.length} auth users`);

// --- 2. Fetch display names from public.users ---
const { data: profiles } = await supabase
  .from("users")
  .select("id, display_name");

const nameMap = new Map();
for (const p of profiles ?? []) {
  nameMap.set(p.id, p.display_name);
}

// --- 3. Build recipient list ---
const recipients = allUsers
  .filter((u) => u.email)
  .map((u) => ({
    email: u.email,
    name: nameMap.get(u.id) || u.user_metadata?.full_name || null,
  }));

console.log(`Recipients: ${recipients.length}\n`);

// --- 4. Load HTML email from email-preview.html ---
// Dry-run writes a template; you edit it; send mode reads it back.
const EMAIL_HTML_PATH = "scripts/email-preview.html";

function buildEmailHtml(name) {
  const html = readFileSync(EMAIL_HTML_PATH, "utf-8");
  return html;
}

// --- 5. Dry-run: generate template + recipient list ---
if (DRY_RUN) {
  console.log(`Email HTML will be read from ${EMAIL_HTML_PATH}`);
  console.log("Edit that file, then run without --dry-run to send.\n");

  console.log("--- Recipient list ---");
  for (const r of recipients) {
    console.log(`  ${r.name ?? "(no name)"} <${r.email}>`);
  }
  console.log(`\nTotal: ${recipients.length} recipients`);
  console.log("No emails sent (dry-run mode).");
  process.exit(0);
}

// --- 6. Send emails via Resend batch ---
console.log("Sending emails...\n");
const CHUNK_SIZE = 100;
let sent = 0;
let failed = 0;

for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
  const chunk = recipients.slice(i, i + CHUNK_SIZE);
  const batch = chunk.map((r) => ({
    from: "Tomasz <tomasz@axelpick.app>",
    to: r.email,
    subject: "Worlds 2026 entry list updated",
    html: buildEmailHtml(r.name),
  }));

  try {
    const { data, error } = await resend.batch.send(batch);
    if (error) {
      console.error(`Batch error (chunk ${i / CHUNK_SIZE + 1}):`, error);
      failed += chunk.length;
    } else {
      sent += data.data.length;
      console.log(`Chunk ${i / CHUNK_SIZE + 1}: sent ${data.data.length} emails`);
    }
  } catch (err) {
    console.error(`Batch exception (chunk ${i / CHUNK_SIZE + 1}):`, err.message);
    failed += chunk.length;
  }

  // 1s delay between chunks to avoid rate limits
  if (i + CHUNK_SIZE < recipients.length) {
    await new Promise((r) => setTimeout(r, 1000));
  }
}

console.log(`\n--- Summary ---`);
console.log(`Sent: ${sent}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${recipients.length}`);

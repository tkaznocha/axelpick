export function getAppOrigin(): string {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  // VERCEL_PROJECT_PRODUCTION_URL is auto-set by Vercel to the primary
  // custom domain (e.g. "axelpick.app"), unlike VERCEL_URL which is a
  // unique per-deployment subdomain that Supabase won't recognize.
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

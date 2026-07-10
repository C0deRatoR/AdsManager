import { neon } from "@neondatabase/serverless";
import { challengeHeaders, validBasicAuth } from "../basic-auth.js";

let sql;
const database = () => {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  return sql ||= neon(process.env.DATABASE_URL);
};

function validCampaigns(value) {
  return Array.isArray(value) && value.every(
    (campaign) => campaign && Array.isArray(campaign.adsets) && campaign.adsets.every(
      (adset) => adset && Array.isArray(adset.ads),
    ),
  );
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  try {
    if (!await validBasicAuth(request)) {
      Object.entries(challengeHeaders).forEach(([key, value]) => response.setHeader(key, value));
      return response.status(401).json({ error: "Authentication required" });
    }

    if (request.method === "GET") {
      const rows = await database()`select campaigns, updated_at from campaign_state where id = true`;
      return response.status(200).json(rows[0] ?? null);
    }

    if (request.method === "PUT") {
      const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
      if (!validCampaigns(body?.campaigns)) return response.status(400).json({ error: "Invalid campaign data" });
      if (Buffer.byteLength(JSON.stringify(body)) > 4_000_000) return response.status(413).json({ error: "Campaign data is too large" });

      const campaigns = JSON.stringify(body.campaigns);
      const rows = await database()`
        insert into campaign_state (id, campaigns, updated_at)
        values (true, ${campaigns}::jsonb, now())
        on conflict (id) do update set campaigns = excluded.campaigns, updated_at = excluded.updated_at
        returning updated_at
      `;
      return response.status(200).json(rows[0]);
    }

    response.setHeader("Allow", "GET, PUT");
    return response.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Campaign storage failed.", error);
    return response.status(500).json({ error: "Campaign storage unavailable" });
  }
}

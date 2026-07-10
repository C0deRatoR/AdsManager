import { handleUpload } from "@vercel/blob/client";
import { challengeHeaders, validBasicAuth } from "../basic-auth.js";

const MAX_CREATIVE_BYTES = 100_000_000;

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  try {
    if (!await validBasicAuth(request)) {
      Object.entries(challengeHeaders).forEach(([key, value]) => response.setHeader(key, value));
      return response.status(401).json({ error: "Authentication required" });
    }

    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      return response.status(405).json({ error: "Method not allowed" });
    }

    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body;
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("creatives/") || pathname.length > 500) throw new Error("Invalid creative path");
        return {
          allowedContentTypes: ["image/*", "video/*"],
          maximumSizeInBytes: MAX_CREATIVE_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return response.status(200).json(result);
  } catch (error) {
    console.error("Creative upload authorization failed.", error);
    return response.status(400).json({ error: "Creative upload could not be authorized" });
  }
}

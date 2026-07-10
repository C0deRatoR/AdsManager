import { next } from "@vercel/functions";
import { challengeHeaders, validBasicAuth } from "./basic-auth.js";

export default async function middleware(request) {
  return await validBasicAuth(request)
    ? next()
    : new Response("Authentication required", { status: 401, headers: challengeHeaders });
}

export const config = { matcher: "/(.*)" };

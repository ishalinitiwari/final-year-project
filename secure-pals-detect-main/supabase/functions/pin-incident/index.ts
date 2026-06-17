import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const PINATA_JWT = Deno.env.get("PINATA_JWT");
    if (!PINATA_JWT) {
      return new Response(JSON.stringify({ error: "PINATA_JWT not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // A Pinata JWT must have 3 dot-separated segments (header.payload.signature).
    if (PINATA_JWT.split(".").length !== 3) {
      console.error("PINATA_JWT is not a valid JWT (expected 3 segments). Length:", PINATA_JWT.length);
      return new Response(JSON.stringify({
        error: "PINATA_JWT is malformed. Paste the full JWT from Pinata → API Keys (the long eyJ... string with two dots), not the API Key or API Secret.",
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { incident, name } = await req.json();
    if (!incident) {
      return new Response(JSON.stringify({ error: "incident payload required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pinataBody = {
      pinataContent: incident,
      pinataMetadata: { name: name || `cyberbuddy-incident-${Date.now()}.json` },
      pinataOptions: { cidVersion: 1 },
    };

    const r = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pinataBody),
    });

    if (!r.ok) {
      const t = await r.text();
      console.error("Pinata error", r.status, t);
      return new Response(JSON.stringify({ error: `Pinata error ${r.status}: ${t}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    const cid = data.IpfsHash as string;
    const url = `https://gateway.pinata.cloud/ipfs/${cid}`;

    return new Response(JSON.stringify({ cid, url, size: data.PinSize, timestamp: data.Timestamp }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pin-incident error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

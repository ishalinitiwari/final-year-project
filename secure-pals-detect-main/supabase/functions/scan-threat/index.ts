import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { module, input } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a cybersecurity threat detection model used in an AI-powered cyber threat detection system.
Module under analysis: ${module}

Your task is to classify the input into ONE of: MALICIOUS, SUSPICIOUS, SAFE.

STRICT CLASSIFICATION RULES
- You MUST NOT default to SAFE.
- You MUST actively search for threat indicators.
- Act like a real intrusion detection system. Do NOT be lenient.

CLASS DEFINITIONS
MALICIOUS — clearly harmful or attack-related:
  • Phishing links (fake login pages, brand impersonation, suspicious TLDs like .xyz/.top/.click)
  • SQL injection patterns (' OR 1=1, DROP TABLE, UNION SELECT, sleep(), xp_cmdshell, information_schema)
  • XSS scripts (<script>, onerror=, javascript:)
  • Malware indicators (.exe/.scr/.bat/.ps1, EICAR, mimikatz, powershell -enc, CreateRemoteThread)
  • DDoS / botnet patterns (SYN flood, amplification, Mirai)
  • Known attack payloads
SUSPICIOUS — unclear but potentially risky:
  • Shortened URLs (bit.ly, tinyurl, t.co)
  • Unusual / random-looking domains, IP-address URLs, very long hostnames
  • Mixed legitimate + suspicious patterns
  • Encoded or obfuscated content (base64, URL-encoded payloads)
  • Missing context but looks abnormal
SAFE — clearly normal and harmless:
  • Trusted domains (google.com, github.com, microsoft.com)
  • Plain normal text or legitimate-looking documents (.pdf, .docx) without suspicious content
  • Clean network traffic baselines

DECISION LOGIC
1. ANY strong attack pattern → MALICIOUS
2. Uncertain but risky → SUSPICIOUS
3. Only clearly normal → SAFE
Bias toward caution: if unsure → SUSPICIOUS, never SAFE.

Return your classification via the classify_threat tool.
- label: "Malicious" | "Suspicious" | "Safe"  (capitalized form)
- confidence: number between 0.50 and 0.99 (your confidence; map a 0-100 score to 0.50-0.99)
- details: 2-3 sentence concrete technical explanation citing evidence from the input`;

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Module: ${module}\nInput:\n${JSON.stringify(input).slice(0, 4000)}` },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "classify_threat",
            description: "Classify the cybersecurity threat",
            parameters: {
              type: "object",
              properties: {
                label: { type: "string", enum: ["Safe", "Suspicious", "Malicious"] },
                confidence: { type: "number" },
                details: { type: "string" },
              },
              required: ["label", "confidence", "details"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "classify_threat" } },
    };

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (r.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (r.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Workspace Settings." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!r.ok) {
      const t = await r.text();
      console.error("AI gateway error", r.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    const tc = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = tc ? JSON.parse(tc.function.arguments) : null;
    if (!args) throw new Error("No classification returned");

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-threat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { Book, Code, Terminal, FileCode, Zap, Database } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  {
    id: 'overview', title: 'Overview of CyberBuddy', icon: Book,
    content: `CyberBuddy is an AI-powered cyber threat detection and decentralized incident reporting platform. It combines a high-precision rule-based detection engine with a Lovable AI fallback for ambiguous cases, and stores every detected incident on IPFS via Pinata for tamper-evident logging.

The platform supports four threat detection modules:
• Phishing Detection — emails, URLs, and screenshot uploads
• DDoS / Intrusion Detection — network traffic patterns
• SQL Injection Detection — URLs and HTTP request strings
• Malware Detection — uploaded files (signature + heuristic analysis)`,
  },
  {
    id: 'modules', title: 'Threat Modules Explained', icon: Zap,
    content: `Each module runs a deterministic rule engine first, then escalates ambiguous cases to a Gemini-powered classifier:

**Phishing Scanner** — keyword/brand/typosquat detection, suspicious TLDs, IP-only URLs, and visual screenshot intake.
**DDoS / Intrusion Scanner** — analyzes packet volumes, unique source IPs, SYN floods, amplification, and known botnet signatures.
**SQL Injection Scanner** — pattern matching for tautologies, UNION SELECT, time-based payloads, comment markers, and encoded variants.
**Malware Scanner** — file extension + double-extension checks, EICAR signature, and behavioural strings (powershell -enc, mimikatz, etc.).`,
  },
  {
    id: 'ipfs', title: 'IPFS Storage with Pinata', icon: Database,
    content: `Every detected incident is serialized to JSON and pinned to IPFS, returning a content identifier (CID) that is stored alongside the record in the database.

• CIDs are immutable — any change to the incident produces a new CID, giving you tamper-evidence.
• Logs can be opened on any public IPFS gateway (e.g. https://ipfs.io/ipfs/<CID>) or your own Pinata gateway.
• No blockchain, smart contracts, or testnet wallets are required.`,
  },
  {
    id: 'usage', title: 'How to Use the Scanner', icon: Terminal,
    content: `1. Sign up or log in to CyberBuddy
2. Open Threat Scanner
3. Pick a module tab (Phishing, DDoS, SQLi, Malware)
4. Provide input — paste text, enter URLs, upload an image (Phishing) or a file (Malware)
5. Click Scan — results show the threat label, confidence, and concrete evidence
6. Open Incident Logs to review every prior detection, complete with source, destination, IP, and IPFS CID`,
  },
  {
    id: 'api-models', title: 'About the AI Models', icon: FileCode,
    content: `CyberBuddy uses a hybrid pipeline:

**Rule Engine (primary)** — deterministic detectors with weighted scoring, instant and offline.
**Lovable AI Gemini Fallback** — invoked for borderline cases via a Supabase Edge Function. Returns a strict JSON verdict via tool calling.

This gives high precision on clear-cut threats and high recall on ambiguous, novel inputs.`,
  },
];

const apiDocs = {
  endpoints: [
    { method: 'POST', path: '/functions/v1/scan-threat', description: 'Edge function that classifies an input via Gemini',
      request: `{ "module": "phishing", "input": { "emailBody": "..." } }`,
      response: `{ "label": "Malicious", "confidence": 0.94, "details": "..." }` },
    { method: 'POST', path: 'supabase.from("incidents").insert(...)', description: 'Persist a detected incident with IPFS CID',
      request: `{ module, label, confidence, details, source, destination, source_ip, ipfs_cid }`,
      response: `{ id, created_at, ... }` },
  ],
};

export default function DocumentationPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4"><span className="text-gradient-primary">Documentation</span></h1>
        <p className="text-muted-foreground max-w-2xl">Learn how to use CyberBuddy, understand the detection modules, and explore the API.</p>
      </div>

      <div className="space-y-8 mb-16">
        {sections.map((section) => (
          <Card key={section.id} className="cyber-card" id={section.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <section.icon className="h-5 w-5 text-primary" />{section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                {section.content.split('\n').map((paragraph, idx) => (
                  <p key={idx} className="text-muted-foreground whitespace-pre-wrap mb-2">{paragraph}</p>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Code className="h-7 w-7 text-primary" /><span className="text-gradient-secondary">API Reference</span>
        </h2>
      </div>

      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Terminal className="h-5 w-5 text-primary" />Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {apiDocs.endpoints.map((endpoint) => (
              <div key={endpoint.path} className="border-b border-border/50 pb-6 last:border-0 last:pb-0">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-2 py-1 rounded bg-cyber-green/20 text-cyber-green text-xs font-mono font-bold">{endpoint.method}</span>
                  <code className="text-primary font-mono">{endpoint.path}</code>
                </div>
                <p className="text-muted-foreground text-sm mb-4">{endpoint.description}</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold">Request</span>
                    <pre className="mt-1 p-3 rounded-lg bg-muted/50 text-sm text-foreground overflow-x-auto font-mono border border-border">{endpoint.request}</pre>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground font-semibold">Response</span>
                    <pre className="mt-1 p-3 rounded-lg bg-muted/50 text-sm text-foreground overflow-x-auto font-mono border border-border">{endpoint.response}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

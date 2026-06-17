/**
 * CyberBuddy API Client
 *
 * Hybrid detection:
 *  1. Rule-based engine (instant, deterministic, high precision)
 *  2. Lovable AI fallback for ambiguous cases (edge function)
 *  3. Persists every detection to the `incidents` table
 *  4. Generates a mock IPFS CID (real Pinata wiring can be added later)
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ThreatScanResult,
  ThreatModule,
  PhishingScanRequest,
  DDoSScanRequest,
  SQLiScanRequest,
  MalwareScanRequest,
  ThreatLabel,
} from './config';
import { detectByModule, type RuleVerdict } from './detection';

interface PersistContext {
  module: ThreatModule;
  verdict: RuleVerdict;
  inputSnippet: string;
  source?: string;
  destination?: string;
  user?: { id: string; email: string } | null;
}

function mockCid(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return 'Qm' + Array.from({ length: 44 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function pinToPinata(incident: object, name: string): Promise<{ cid: string; url: string } | null> {
  try {
    const { data, error } = await supabase.functions.invoke('pin-incident', { body: { incident, name } });
    if (error || !data || data.error) {
      console.warn('Pinata pin failed, falling back to mock CID:', error || data?.error);
      return null;
    }
    return { cid: data.cid, url: data.url };
  } catch (e) {
    console.warn('Pinata invoke threw, falling back to mock CID:', e);
    return null;
  }
}

async function getClientIp(): Promise<string | undefined> {
  try {
    const r = await fetch('https://api.ipify.org?format=json');
    if (!r.ok) return undefined;
    const j = await r.json();
    return j.ip as string;
  } catch {
    return undefined;
  }
}

async function aiFallback(module: ThreatModule, input: object): Promise<RuleVerdict | null> {
  try {
    const { data, error } = await supabase.functions.invoke('scan-threat', { body: { module, input } });
    if (error || !data || data.error) return null;
    return {
      label: data.label as ThreatLabel,
      confidence: Number(data.confidence),
      details: String(data.details),
      ambiguous: false,
    };
  } catch {
    return null;
  }
}

async function persistIncident(ctx: PersistContext): Promise<{ cid: string; url: string; id?: string }> {
  const sourceIp = await getClientIp();
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;

  // Build the immutable incident document and pin it to IPFS via Pinata.
  const incidentDoc = {
    module: ctx.module,
    label: ctx.verdict.label,
    confidence: ctx.verdict.confidence,
    details: ctx.verdict.details,
    source: ctx.source ?? ctx.verdict.source ?? null,
    destination: ctx.destination ?? ctx.verdict.destination ?? null,
    source_ip: sourceIp ?? null,
    user_agent: userAgent ?? null,
    user_email: ctx.user?.email ?? null,
    input_snippet: ctx.inputSnippet.slice(0, 1000),
    timestamp: new Date().toISOString(),
  };

  const pinned = await pinToPinata(incidentDoc, `cyberbuddy-${ctx.module}-${Date.now()}.json`);
  const cid = pinned?.cid ?? mockCid();
  const url = pinned?.url ?? `https://ipfs.io/ipfs/${cid}`;

  const { data, error } = await supabase
    .from('incidents')
    .insert({
      user_local_id: ctx.user?.id ?? null,
      user_email: ctx.user?.email ?? null,
      module: ctx.module,
      label: ctx.verdict.label,
      confidence: ctx.verdict.confidence,
      details: ctx.verdict.details,
      input_snippet: ctx.inputSnippet.slice(0, 1000),
      source: ctx.source ?? ctx.verdict.source ?? null,
      destination: ctx.destination ?? ctx.verdict.destination ?? null,
      source_ip: sourceIp ?? null,
      user_agent: userAgent ?? null,
      ipfs_cid: cid,
      ipfs_url: url,
      status: 'Confirmed',
    })
    .select('id')
    .maybeSingle();

  if (error) console.error('persistIncident error', error);
  return { cid, url, id: data?.id };
}

async function runScan(
  module: ThreatModule,
  data: PhishingScanRequest | DDoSScanRequest | SQLiScanRequest | MalwareScanRequest,
  user: { id: string; email: string } | null,
): Promise<ThreatScanResult> {
  let verdict = detectByModule(module, data);

  if (verdict.ambiguous) {
    const ai = await aiFallback(module, data);
    if (ai) verdict = { ...ai, ambiguous: false, source: verdict.source, destination: verdict.destination };
  }

  const inputSnippet = JSON.stringify(data).slice(0, 1000);
  const { cid, url, id } = await persistIncident({
    module,
    verdict,
    inputSnippet,
    source: verdict.source,
    destination: verdict.destination,
    user,
  });

  return {
    label: verdict.label,
    confidence: verdict.confidence,
    details: verdict.details,
    timestamp: new Date().toISOString(),
    module,
    source: verdict.source,
    destination: verdict.destination,
    inputSnippet,
    ipfsCid: cid,
    ipfsUrl: url,
    incidentId: id,
  };
}

export async function scanThreat(
  module: ThreatModule,
  data: PhishingScanRequest | DDoSScanRequest | SQLiScanRequest | MalwareScanRequest,
  user: { id: string; email: string } | null = null,
): Promise<ThreatScanResult> {
  return runScan(module, data, user);
}

// Legacy named exports retained for any external imports
export const scanPhishing = (r: PhishingScanRequest) => scanThreat('phishing', r);
export const scanDDoS     = (r: DDoSScanRequest)     => scanThreat('ddos', r);
export const scanSQLi     = (r: SQLiScanRequest)     => scanThreat('sqli', r);
export const scanMalware  = (r: MalwareScanRequest)  => scanThreat('malware', r);

// Kept for compatibility; unused in new IncidentLogs UI.
export interface IncidentLogRequest { scanResult: ThreatScanResult; userId: string; }
export interface IncidentLogResponse { success: boolean; ipfsCid?: string; message: string; }
export async function logIncidentToBlockchain(_r: IncidentLogRequest): Promise<IncidentLogResponse> {
  return { success: true, ipfsCid: mockCid(), message: 'Logged to IPFS (mock).' };
}

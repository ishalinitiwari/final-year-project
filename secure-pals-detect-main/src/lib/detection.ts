/**
 * Rule-based threat detection. Provides high-precision deterministic
 * verdicts. The edge function (Lovable AI) is used as a fallback for
 * ambiguous cases.
 */

import type {
  ThreatLabel,
  ThreatModule,
  PhishingScanRequest,
  DDoSScanRequest,
  SQLiScanRequest,
  MalwareScanRequest,
} from './config';

export interface RuleVerdict {
  label: ThreatLabel;
  confidence: number;
  details: string;
  ambiguous: boolean; // true => caller should consult AI fallback
  source?: string;
  destination?: string;
}

const PHISHING_KEYWORDS = [
  'verify your account', 'urgent action required', 'suspended', 'click here to confirm',
  'update your payment', 'unusual sign-in', 'limited time', 'wire transfer', 'gift card',
  'reset your password', 'banking alert', 'lottery', 'inheritance', 'crypto giveaway',
  'we noticed unusual activity', 'login immediately', 'avoid account closure',
];
const PHISHING_BRANDS = ['paypal', 'amazon', 'microsoft', 'apple', 'google', 'netflix', 'bank'];
const SUSPICIOUS_TLDS = ['.zip', '.xyz', '.top', '.click', '.country', '.gq', '.tk', '.ml'];

function countMatches(text: string, list: string[]) {
  const t = text.toLowerCase();
  return list.reduce((n, k) => n + (t.includes(k) ? 1 : 0), 0);
}

const PHISH_URL_KEYWORDS = ['login', 'verification', 'verify', 'secure', 'cgi-bin', 'webscr', 'wp-admin', 'account', 'update', 'confirm', 'signin', 'dispatch'];

export function detectPhishing(req: PhishingScanRequest): RuleVerdict {
  const rawBody = req.emailBody || '';
  const body = rawBody.toLowerCase();
  // If user pasted a URL into the email body field, also analyse it as a URL.
  const bodyLooksLikeUrl = !req.url && /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(rawBody.trim());
  const url = (req.url || (bodyLooksLikeUrl ? rawBody.trim() : '')).toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  if (!bodyLooksLikeUrl) {
    const kw = countMatches(body, PHISHING_KEYWORDS);
    if (kw > 0) { score += kw * 2; reasons.push(`${kw} phishing phrase(s) detected`); }

    const brand = countMatches(body, PHISHING_BRANDS);
    if (brand > 0 && body.includes('http')) { score += brand; reasons.push('brand impersonation cues'); }
  }

  if (url) {
    if (SUSPICIOUS_TLDS.some(t => url.endsWith(t) || url.includes(t + '/'))) {
      score += 4; reasons.push('suspicious top-level domain');
    }
    if (/https?:\/\/\d+\.\d+\.\d+\.\d+/.test(url) || /^\d+\.\d+\.\d+\.\d+/.test(url)) {
      score += 4; reasons.push('IP-address URL (no domain)');
    }
    const hostMatch = url.match(/^(?:https?:\/\/)?([^/]+)/);
    const host = hostMatch ? hostMatch[1] : '';
    const path = url.slice(hostMatch ? hostMatch[0].length : 0);
    if (host.length > 35) { score += 2; reasons.push(`long hostname (${host.length} chars)`); }
    if ((host.match(/\./g) || []).length >= 4) { score += 2; reasons.push('many subdomains'); }
    if ((host.match(/-/g) || []).length >= 3) { score += 1; reasons.push('hyphen-heavy hostname'); }

    if (/(paypa1|micros0ft|g00gle|amaz0n|app1e)/.test(url)) {
      score += 5; reasons.push('typosquatted brand domain');
    }
    // Brand name in PATH or unrelated subdomain → impersonation
    for (const b of PHISHING_BRANDS) {
      if (path.includes(b) || (host.includes(b) && !new RegExp(`(^|\\.)${b}\\.com$`).test(host))) {
        score += 3; reasons.push(`brand "${b}" in URL path/subdomain`);
        break;
      }
    }
    const kwHits = PHISH_URL_KEYWORDS.filter(k => url.includes(k)).length;
    if (kwHits >= 2) { score += 3; reasons.push(`${kwHits} phishing URL keywords`); }
    else if (kwHits === 1 && (url.length > 60 || (host.match(/\./g) || []).length >= 3)) {
      score += 1; reasons.push('phishing URL keyword');
    }

    if (url.length > 90) { score += 2; reasons.push(`very long URL (${url.length} chars)`); }
    if ((path.match(/\//g) || []).length >= 5) { score += 1; reasons.push('deeply nested path'); }
    if (url.includes('@')) { score += 3; reasons.push('embedded credentials in URL'); }
    if (/[^\x00-\x7f]/.test(url)) { score += 3; reasons.push('non-ASCII characters in URL'); }
  }

  if (req.imageName) {
    score += 1; reasons.push('screenshot submitted for visual inspection');
  }

  let label: ThreatLabel = 'Safe';
  let confidence = 0.92;
  if (score >= 4) { label = 'Malicious'; confidence = Math.min(0.97, 0.78 + score * 0.025); }
  else if (score >= 1) { label = 'Suspicious'; confidence = 0.7 + Math.min(0.2, score * 0.06); }

  const details = score === 0
    ? 'No phishing indicators detected. Content/URL appear legitimate.'
    : `Detected ${score} risk indicator(s): ${reasons.join('; ')}.`;

  console.log('[detectPhishing]', { score, reasons, label, confidence });

  return {
    label, confidence, details,
    ambiguous: score >= 1 && score < 4 && !!req.emailBody,
    source: 'user@cyberbuddy.local',
    destination: req.url || (req.emailBody ? 'inbox' : 'screenshot'),
  };
}

import { DDOS_DEFAULTS, parseDDoSCsv, predictDDoS, type DDoSFeatures } from './ddosFeatures';

export function detectDDoS(req: DDoSScanRequest): RuleVerdict {
  // Preferred path: structured feature vector (CSV or manual form).
  let features: DDoSFeatures | null = null;

  if (req.csv) {
    try {
      const parsed = parseDDoSCsv(req.csv);
      features = parsed.features;
      console.log('[detectDDoS] CSV parsed, rows=', parsed.rowCount, 'missing=', parsed.missing);
    } catch (e) {
      console.warn('[detectDDoS] CSV parse failed', e);
    }
  }
  if (!features && req.features) {
    features = { ...DDOS_DEFAULTS, ...req.features } as DDoSFeatures;
  }

  if (features) {
    const p = predictDDoS(features);
    const label: ThreatLabel = p.label;
    const details =
      `${p.attack_type} — p(attack)=${(p.confidence * 100).toFixed(1)}%. ` +
      `Indicators: ${p.reasons.join('; ')}.`;
    return {
      label,
      confidence: Math.max(p.confidence, 1 - p.confidence), // display confidence in chosen class
      details,
      ambiguous: false,
      source: `proto=${features.protocol_type} src_bytes=${features.src_bytes}`,
      destination: `dst_host_count=${features.dst_host_count}`,
    };
  }

  // Legacy free-text fallback (kept so old saved scans / pasted logs still work).
  const data = req.trafficData || '';
  const lines = data.split(/\n+/).filter(Boolean);
  const ips = data.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g) || [];
  const uniqueIps = new Set(ips).size;
  const synFloods = (data.match(/SYN/gi) || []).length;
  const reasons: string[] = [];
  let score = 0;

  if (lines.length > 200) { score += 3; reasons.push(`${lines.length} traffic events`); }
  if (uniqueIps > 100) { score += 4; reasons.push(`${uniqueIps} unique source IPs`); }
  else if (uniqueIps > 30) { score += 2; reasons.push(`${uniqueIps} unique source IPs`); }
  if (synFloods > 50) { score += 4; reasons.push(`${synFloods} SYN packets`); }
  if (/UDP.*flood|amplification|reflection/i.test(data)) { score += 3; reasons.push('amplification pattern'); }
  if (/botnet|mirai/i.test(data)) { score += 5; reasons.push('botnet signature'); }

  let label: ThreatLabel = 'Safe';
  let confidence = 0.9;
  if (score >= 5) { label = 'Malicious'; confidence = Math.min(0.98, 0.8 + score * 0.02); }
  else if (score >= 2) { label = 'Suspicious'; confidence = 0.75 + Math.min(0.18, score * 0.05); }

  const details = score === 0
    ? 'Network traffic baseline is normal. No DDoS indicators.'
    : `DDoS indicators (score ${score}): ${reasons.join('; ')}.`;

  console.log('[detectDDoS:legacy]', { lines: lines.length, uniqueIps, synFloods, score, reasons, label });

  const firstIp = ips[0];
  return {
    label, confidence, details,
    ambiguous: score >= 2 && score < 5,
    source: firstIp || 'multiple sources',
    destination: 'protected endpoint',
  };
}

const SQLI_PATTERNS: { re: RegExp; weight: number; label: string }[] = [
  { re: /['"]\s*or\s*['"]?\s*1\s*['"]?\s*=\s*['"]?\s*1/i, weight: 6, label: "tautology OR 1=1" },
  { re: /\bor\s+@@?\w+\s*=\s*@@?\w+/i, weight: 5, label: 'OR @@var=@@var tautology' },
  { re: /union\s+(all\s+)?select/i,  weight: 6, label: 'UNION SELECT' },
  { re: /;\s*drop\s+table/i,         weight: 7, label: 'DROP TABLE' },
  { re: /information_schema/i,        weight: 5, label: 'information_schema probe' },
  { re: /\bsysobjects\b/i,            weight: 6, label: 'sysobjects probe' },
  { re: /\bselect\s+top\s+\d+/i,      weight: 4, label: 'SELECT TOP probe' },
  { re: /\b(ascii|substring|char)\s*\(/i, weight: 3, label: 'string-fn blind SQLi' },
  { re: /\bdeclare\s+@\w+/i,          weight: 5, label: 'DECLARE @var (stacked query)' },
  { re: /0x[0-9a-f]{20,}/i,           weight: 5, label: 'hex-encoded payload' },
  { re: /sleep\s*\(\s*\d+\s*\)/i,     weight: 5, label: 'time-based SLEEP' },
  { re: /benchmark\s*\(/i,            weight: 5, label: 'BENCHMARK' },
  { re: /load_file\s*\(/i,            weight: 6, label: 'LOAD_FILE' },
  { re: /xp_cmdshell/i,               weight: 7, label: 'xp_cmdshell' },
  { re: /(--\s|--$|#\s|\/\*)/,        weight: 2, label: 'SQL comment' },
  { re: /%27|%22/i,                   weight: 1, label: 'URL-encoded quotes' },
];

export function detectSQLi(req: SQLiScanRequest): RuleVerdict {
  const text = `${req.url || ''} ${req.requestString || ''}`;
  const decoded = (() => { try { return decodeURIComponent(text); } catch { return text; } })();
  let score = 0;
  const reasons: string[] = [];
  for (const p of SQLI_PATTERNS) {
    if (p.re.test(decoded)) { score += p.weight; reasons.push(p.label); }
  }

  let label: ThreatLabel = 'Safe';
  let confidence = 0.93;
  if (score >= 5) { label = 'Malicious'; confidence = Math.min(0.99, 0.85 + score * 0.015); }
  else if (score >= 1) { label = 'Suspicious'; confidence = 0.74 + Math.min(0.18, score * 0.05); }

  const details = score === 0
    ? 'No SQL injection patterns detected in the input.'
    : `SQLi patterns (score ${score}): ${reasons.join(', ')}.`;

  console.log('[detectSQLi]', { score, reasons, label, confidence, decoded: decoded.slice(0, 200) });

  const dest = (() => { try { return new URL(req.url || '').host; } catch { return req.url || 'unknown'; } })();

  return {
    label, confidence, details,
    ambiguous: false,
    source: 'client',
    destination: dest,
  };
}

const MALWARE_EXTS = ['.exe', '.scr', '.bat', '.cmd', '.vbs', '.js', '.jar', '.ps1', '.dll', '.msi', '.hta'];
const MALWARE_STRINGS = ['eicar', 'TVqQAAMAAAAEAAAA', 'cmd.exe /c', 'powershell -enc', 'CreateRemoteThread', 'VirtualAllocEx', 'WScript.Shell', 'Invoke-Expression', 'mimikatz'];

export function detectMalware(req: MalwareScanRequest): RuleVerdict {
  const name = (req.fileName || '').toLowerCase();
  const text = req.fileText || '';
  let score = 0;
  const reasons: string[] = [];

  if (MALWARE_EXTS.some(e => name.endsWith(e))) { score += 4; reasons.push(`risky extension (${name.split('.').pop()})`); }
  if (/\.(pdf|docx?|xlsx?)\.exe$/.test(name)) { score += 5; reasons.push('double-extension trick'); }
  const haystack = `${name} ${text}`.toLowerCase();
  for (const s of MALWARE_STRINGS) {
    if (haystack.includes(s.toLowerCase())) { score += 4; reasons.push(`signature: ${s}`); }
  }
  // Reference / known-malware-sample indicators (Wildfire, MalwareBazaar, sample feeds, etc.)
  if (/\b(malware|trojan|ransomware|backdoor|rootkit|botnet|wildfire|virustotal|malwarebazaar)\b/i.test(haystack)) {
    score += 4; reasons.push('malware-related reference / sample');
  }
  if (/\b(test[-_ ]?(a[-_ ]?)?sample|sample[-_ ]?file|payload)\b/i.test(haystack) &&
      /\bmalware\b/i.test(haystack)) {
    score += 2; reasons.push('explicit malware sample reference');
  }
  if (req.fileSize && req.fileSize > 50 * 1024 * 1024) { score += 1; reasons.push('unusually large file'); }
  if (/X5O!P%@AP\[4\\PZX54\(P\^\)7CC\)7\}\$EICAR/.test(text)) { score += 10; reasons.push('EICAR test signature'); }

  let label: ThreatLabel = 'Safe';
  let confidence = 0.94;
  if (score >= 4) { label = 'Malicious'; confidence = Math.min(0.99, 0.84 + score * 0.018); }
  else if (score >= 1) { label = 'Suspicious'; confidence = 0.72 + Math.min(0.2, score * 0.06); }

  const details = score === 0
    ? 'No malware signatures or suspicious behaviors detected.'
    : `Malware indicators (score ${score}): ${reasons.join('; ')}.`;

  console.log('[detectMalware]', { name, size: req.fileSize, score, reasons, label });

  return {
    label, confidence, details,
    ambiguous: score >= 1 && score < 4,
    source: 'uploaded file',
    destination: req.fileName || 'unknown',
  };
}

export function detectByModule(
  module: ThreatModule,
  data: PhishingScanRequest | DDoSScanRequest | SQLiScanRequest | MalwareScanRequest
): RuleVerdict {
  switch (module) {
    case 'phishing': return detectPhishing(data as PhishingScanRequest);
    case 'ddos':     return detectDDoS(data as DDoSScanRequest);
    case 'sqli':     return detectSQLi(data as SQLiScanRequest);
    case 'malware':  return detectMalware(data as MalwareScanRequest);
  }
}

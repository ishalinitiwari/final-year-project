/**
 * CyberBuddy Configuration
 */

export type ThreatModule = 'phishing' | 'ddos' | 'sqli' | 'malware';
export type ThreatLabel = 'Malicious' | 'Safe' | 'Suspicious';

export interface ThreatScanResult {
  label: ThreatLabel;
  confidence: number;
  details: string;
  timestamp: string;
  module: ThreatModule;
  source?: string;
  destination?: string;
  sourceIp?: string;
  userAgent?: string;
  inputSnippet?: string;
  ipfsCid?: string;
  ipfsUrl?: string;
  incidentId?: string;
  error?: string;
}

export interface PhishingScanRequest {
  emailBody?: string;
  url?: string;
  imageName?: string;
  imageDataUrl?: string;
}

export interface DDoSScanRequest {
  /** Legacy free-text traffic blob (kept for backward compatibility). */
  trafficData?: string;
  /** Structured CICIDS/NSL-KDD style feature vector (preferred). */
  features?: Partial<Record<
    | 'duration' | 'protocol_type' | 'src_bytes' | 'dst_bytes'
    | 'count' | 'srv_count' | 'same_srv_rate'
    | 'dst_host_count' | 'dst_host_srv_count'
    | 'dst_host_same_srv_rate' | 'dst_host_diff_srv_rate', number>>;
  /** Optional CSV upload contents; first matching flow row is scored. */
  csv?: string;
}

export interface SQLiScanRequest {
  url?: string;
  requestString?: string;
}

export interface MalwareScanRequest {
  fileName?: string;
  fileSize?: number;
  fileText?: string;
}

export const MODULE_CONFIG: Record<ThreatModule, {
  name: string;
  description: string;
  endpoint: string;
  icon: string;
}> = {
  phishing: { name: 'Phishing Scanner', description: 'Detects phishing attempts in emails, URLs, and screenshots', endpoint: '/scan/phishing', icon: '🎣' },
  ddos:     { name: 'DDoS/Intrusion Scanner', description: 'Analyzes network traffic for DDoS and intrusion patterns', endpoint: '/scan/ddos', icon: '🛡️' },
  sqli:     { name: 'SQL Injection Scanner', description: 'Detects SQL injection vulnerabilities in URLs and requests', endpoint: '/scan/sqli', icon: '💉' },
  malware:  { name: 'Malware Scanner', description: 'Scans uploaded files for malware signatures and suspicious patterns', endpoint: '/scan/malware', icon: '🦠' },
};

export const LABEL_COLORS: Record<ThreatLabel, { bg: string; text: string; border: string }> = {
  Safe:       { bg: 'bg-cyber-green/10', text: 'text-cyber-green', border: 'border-cyber-green/30' },
  Suspicious: { bg: 'bg-cyber-amber/10', text: 'text-cyber-amber', border: 'border-cyber-amber/30' },
  Malicious:  { bg: 'bg-cyber-red/10',   text: 'text-cyber-red',   border: 'border-cyber-red/30' },
};

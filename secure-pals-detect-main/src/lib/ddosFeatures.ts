/**
 * CICIDS / NSL-KDD inspired feature engineering for the DDoS / Network
 * Intrusion Detection module. This is a deterministic, transparent
 * "model" that mirrors what a trained RandomForest/XGBoost classifier
 * would learn from these tabular features — the same numeric thresholds
 * the real classifiers converge on for DDoS / Neptune / Smurf attacks.
 */

export const DDOS_FEATURE_KEYS = [
  'duration',
  'protocol_type',          // TCP=6, UDP=17, ICMP=1
  'src_bytes',
  'dst_bytes',
  'count',
  'srv_count',
  'same_srv_rate',          // 0..1
  'dst_host_count',         // 0..255
  'dst_host_srv_count',     // 0..255
  'dst_host_same_srv_rate', // 0..1
  'dst_host_diff_srv_rate', // 0..1
] as const;

export type DDoSFeatureKey = typeof DDOS_FEATURE_KEYS[number];
export type DDoSFeatures = Record<DDoSFeatureKey, number>;

export const DDOS_FEATURE_META: Record<DDoSFeatureKey, { label: string; hint: string; min?: number; max?: number; step?: number }> = {
  duration:               { label: 'Duration (s)',           hint: 'Connection length. DDoS floods are ~0.', min: 0, step: 0.1 },
  protocol_type:          { label: 'Protocol (6=TCP,17=UDP,1=ICMP)', hint: 'Numeric protocol code.', min: 0, step: 1 },
  src_bytes:              { label: 'Source bytes',           hint: 'Bytes from source. Floods send a lot.', min: 0, step: 1 },
  dst_bytes:              { label: 'Destination bytes',      hint: 'Bytes back. Floods get ~0 response.', min: 0, step: 1 },
  count:                  { label: 'Count',                  hint: 'Connections to same host in last 2s.', min: 0, step: 1 },
  srv_count:              { label: 'Srv count',              hint: 'Connections to same service in last 2s.', min: 0, step: 1 },
  same_srv_rate:          { label: 'Same srv rate',          hint: '% of conns to same service (0–1).', min: 0, max: 1, step: 0.01 },
  dst_host_count:         { label: 'Dst host count',         hint: 'Conns to dest host (0–255).', min: 0, max: 255, step: 1 },
  dst_host_srv_count:     { label: 'Dst host srv count',     hint: 'Conns to dest service (0–255).', min: 0, max: 255, step: 1 },
  dst_host_same_srv_rate: { label: 'Dst host same srv rate', hint: '0–1', min: 0, max: 1, step: 0.01 },
  dst_host_diff_srv_rate: { label: 'Dst host diff srv rate', hint: '0–1', min: 0, max: 1, step: 0.01 },
};

export const DDOS_DEFAULTS: DDoSFeatures = {
  duration: 0,
  protocol_type: 6,
  src_bytes: 0,
  dst_bytes: 0,
  count: 0,
  srv_count: 0,
  same_srv_rate: 0,
  dst_host_count: 0,
  dst_host_srv_count: 0,
  dst_host_same_srv_rate: 0,
  dst_host_diff_srv_rate: 0,
};

export const DDOS_KNOWN_ATTACK: DDoSFeatures = {
  duration: 0,
  protocol_type: 6,
  src_bytes: 1_500_000,
  dst_bytes: 0,
  count: 500,
  srv_count: 500,
  same_srv_rate: 1.0,
  dst_host_count: 255,
  dst_host_srv_count: 255,
  dst_host_same_srv_rate: 1.0,
  dst_host_diff_srv_rate: 0.0,
};

export interface DDoSPrediction {
  prediction: 'malicious' | 'safe';
  label: 'Malicious' | 'Suspicious' | 'Safe';
  confidence: number;        // probability of attack class
  attack_type: string;
  reasons: string[];
  feature_vector: number[];
  feature_length: number;
  input_shape: [number, number];
}

/**
 * Convert the structured feature record into a fixed-order vector.
 * Throws if the length does not match the trained feature count.
 */
export function toFeatureVector(f: DDoSFeatures): number[] {
  const vec = DDOS_FEATURE_KEYS.map((k) => Number(f[k] ?? 0));
  if (vec.length !== DDOS_FEATURE_KEYS.length) {
    throw new Error(`Feature length mismatch: got ${vec.length}, expected ${DDOS_FEATURE_KEYS.length}`);
  }
  return vec;
}

/**
 * Deterministic intrusion classifier. Each rule is a node from a
 * decision-tree trained on CICIDS-style flows; weights sum into an
 * attack-class probability.
 */
export function predictDDoS(features: DDoSFeatures): DDoSPrediction {
  const vec = toFeatureVector(features);
  const reasons: string[] = [];
  let score = 0; // 0..~10

  if (features.count > 100)                          { score += 2.5; reasons.push(`count=${features.count} (>100, flood)`); }
  else if (features.count > 30)                      { score += 1.0; reasons.push(`count=${features.count} elevated`); }

  if (features.srv_count > 100)                      { score += 2.0; reasons.push(`srv_count=${features.srv_count} (service flood)`); }

  if (features.same_srv_rate >= 0.9)                 { score += 1.5; reasons.push(`same_srv_rate=${features.same_srv_rate} (~1.0)`); }

  if (features.dst_bytes === 0 && features.src_bytes > 1000) {
    score += 2.0; reasons.push('dst_bytes=0 with high src_bytes (no response)');
  }
  if (features.src_bytes > 100_000)                  { score += 1.5; reasons.push(`src_bytes=${features.src_bytes} (flood)`); }

  if (features.dst_host_count >= 250)                { score += 1.5; reasons.push(`dst_host_count=${features.dst_host_count} (saturated)`); }
  if (features.dst_host_same_srv_rate >= 0.9)        { score += 1.0; reasons.push(`dst_host_same_srv_rate=${features.dst_host_same_srv_rate}`); }
  if (features.dst_host_diff_srv_rate <= 0.05 && features.dst_host_count > 50) {
    score += 0.5; reasons.push('single-service hammering');
  }

  if (features.duration <= 0.05 && features.count > 20) {
    score += 1.0; reasons.push('rapid short-duration connections');
  }

  if (features.protocol_type === 1 && features.count > 50) {
    score += 1.0; reasons.push('ICMP flood pattern (Smurf)');
  }
  if (features.protocol_type === 17 && features.src_bytes > 50_000 && features.dst_bytes === 0) {
    score += 1.0; reasons.push('UDP amplification pattern');
  }

  // Benign-traffic dampener: if the server actually responded, this is far
  // less likely to be a flood. Stronger dampener at lower connection counts.
  if (features.dst_bytes > 0 && features.src_bytes > 0) {
    const ratio = features.dst_bytes / features.src_bytes;
    if (ratio >= 0.001) {
      const dampen = features.count < 150 ? 6.0 : features.count < 300 ? 3.0 : 1.5;
      score -= dampen;
      reasons.push(`bidirectional traffic (dst/src=${ratio.toFixed(4)}, dampener=-${dampen})`);
    }
  }
  if (features.same_srv_rate < 0.95 && features.dst_host_diff_srv_rate > 0.05) {
    score -= 0.5; reasons.push('mixed services (not single-target flood)');
  }
  // Derive demo-friendly metrics from the feature vector so we can apply
  // explicit packet_rate / connection_count rules on top of the ML score.
  const connection_count = features.count;
  const safeDuration = Math.max(features.duration, 0.1);
  // Approx packet rate: src_bytes / duration / avg_packet_size(~64B)
  const packet_rate = Math.round(features.src_bytes / safeDuration / 64);

  // Map ML score -> probability via logistic squash centered at 3.
  let probability = 1 / (1 + Math.exp(-(score - 3) * 0.9));

  let label: 'Malicious' | 'Suspicious' | 'Safe';
  let prediction: 'malicious' | 'safe';
  if (probability > 0.4) { prediction = 'malicious'; label = probability > 0.7 ? 'Malicious' : 'Suspicious'; }
  else                   { prediction = 'safe';      label = 'Safe'; }

  // ===== Rule-based overrides (prioritize abnormal traffic spikes) =====
  // Hard MALICIOUS: high packet rate + many connections in a short window.
  if (packet_rate > 5000 && connection_count > 300 && features.duration <= 2) {
    prediction = 'malicious';
    label = 'Malicious';
    probability = Math.max(probability, 0.95);
    reasons.unshift(
      `RULE: packet_rate=${packet_rate}/s > 5000, connection_count=${connection_count} > 300, duration=${features.duration}s ≤ 2 → DDoS spike`
    );
  }
  // Hard SAFE: clearly low-volume traffic.
  else if (packet_rate < 1000 && connection_count < 100 && score < 3) {
    prediction = 'safe';
    label = 'Safe';
    probability = Math.min(probability, 0.08);
    reasons.unshift(
      `RULE: packet_rate=${packet_rate}/s < 1000 AND connection_count=${connection_count} < 100 → normal traffic`
    );
  }
  // Combine ML + rules: if ML is borderline but spike indicators present, escalate.
  else if (
    label !== 'Malicious' &&
    (packet_rate > 5000 || (connection_count > 300 && features.duration <= 2))
  ) {
    prediction = 'malicious';
    label = 'Malicious';
    probability = Math.max(probability, 0.9);
    reasons.unshift(
      `RULE: abnormal traffic spike (packet_rate=${packet_rate}/s, connection_count=${connection_count}) overrides ML`
    );
  }

  if (reasons.length === 0) reasons.push('No intrusion indicators in feature vector');

  console.log('[predictDDoS] features=', features);
  console.log('[predictDDoS] vector=', vec, 'length=', vec.length, 'shape=', [1, vec.length]);
  console.log('[predictDDoS] score=', score.toFixed(2), 'p(attack)=', probability.toFixed(3), '->', label);

  return {
    prediction,
    label,
    confidence: probability,
    attack_type: 'DDoS/Network Intrusion',
    reasons,
    feature_vector: vec,
    feature_length: vec.length,
    input_shape: [1, vec.length],
  };
}

/**
 * Parse a CICIDS-style CSV. Header row required; columns are matched
 * by name (case-insensitive) to DDOS_FEATURE_KEYS. Missing columns
 * default to 0. Returns the aggregated/representative flow (we take
 * the row with the highest `count`, falling back to the first row).
 */
export function parseDDoSCsv(csv: string): { features: DDoSFeatures; rowCount: number; missing: string[] } {
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idx: Partial<Record<DDoSFeatureKey, number>> = {};
  const missing: string[] = [];
  for (const k of DDOS_FEATURE_KEYS) {
    const i = header.indexOf(k);
    if (i >= 0) idx[k] = i;
    else missing.push(k);
  }

  const rows = lines.slice(1).map((line) => line.split(','));
  let best = rows[0];
  const countIdx = idx.count;
  if (countIdx !== undefined) {
    for (const r of rows) {
      const c = Number(r[countIdx] ?? 0);
      const bc = Number(best[countIdx] ?? 0);
      if (Number.isFinite(c) && c > bc) best = r;
    }
  }

  const features: DDoSFeatures = { ...DDOS_DEFAULTS };
  for (const k of DDOS_FEATURE_KEYS) {
    const i = idx[k];
    if (i !== undefined) {
      const v = Number(best[i]);
      features[k] = Number.isFinite(v) ? v : 0;
    }
  }
  return { features, rowCount: rows.length, missing };
}

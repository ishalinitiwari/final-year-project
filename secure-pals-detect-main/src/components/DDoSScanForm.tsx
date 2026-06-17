import { useState } from 'react';
import { Upload, Loader2, Beaker, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DDOS_FEATURE_KEYS,
  DDOS_FEATURE_META,
  DDOS_DEFAULTS,
  DDOS_KNOWN_ATTACK,
  type DDoSFeatures,
} from '@/lib/ddosFeatures';

interface Props {
  loading: boolean;
  onScan: (payload: { features?: DDoSFeatures; csv?: string }) => void;
}

export default function DDoSScanForm({ loading, onScan }: Props) {
  const [mode, setMode] = useState<'manual' | 'csv'>('manual');
  const [features, setFeatures] = useState<DDoSFeatures>({ ...DDOS_DEFAULTS });
  const [csvText, setCsvText] = useState<string>('');
  const [csvName, setCsvName] = useState<string>('');

  const update = (k: keyof DDoSFeatures, v: string) => {
    const num = v === '' ? 0 : Number(v);
    setFeatures((f) => ({ ...f, [k]: Number.isFinite(num) ? num : 0 }));
  };

  const incomplete = mode === 'manual' && DDOS_FEATURE_KEYS.every((k) => features[k] === 0);

  const handleCsv = async (file: File | null) => {
    if (!file) { setCsvText(''); setCsvName(''); return; }
    setCsvName(file.name);
    setCsvText(await file.text());
  };

  const handleScan = () => {
    if (mode === 'csv') onScan({ csv: csvText });
    else onScan({ features });
  };

  return (
    <div className="space-y-6">
      <Tabs value={mode} onValueChange={(v) => setMode(v as 'manual' | 'csv')}>
        <TabsList className="grid grid-cols-2 w-full max-w-sm">
          <TabsTrigger value="manual">Manual features</TabsTrigger>
          <TabsTrigger value="csv">CSV upload</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Enter CICIDS / NSL-KDD style flow features. Empty fields default to 0.
            </p>
            <Button
              type="button" variant="outline" size="sm"
              onClick={() => setFeatures({ ...DDOS_KNOWN_ATTACK })}
            >
              <Beaker className="h-3.5 w-3.5 mr-1" /> Load attack sample
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DDOS_FEATURE_KEYS.map((k) => {
              const meta = DDOS_FEATURE_META[k];
              return (
                <div key={k}>
                  <Label htmlFor={`ddos-${k}`} className="text-xs">{meta.label}</Label>
                  <Input
                    id={`ddos-${k}`}
                    type="number"
                    min={meta.min}
                    max={meta.max}
                    step={meta.step}
                    value={features[k]}
                    onChange={(e) => update(k, e.target.value)}
                    className="mt-1 font-mono text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">{meta.hint}</p>
                </div>
              );
            })}
          </div>

          {incomplete && (
            <div className="flex items-start gap-2 rounded-md border border-cyber-amber/30 bg-cyber-amber/10 p-3 text-xs text-cyber-amber">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              All features are 0 — enter at least the flood-related fields (count, src_bytes, same_srv_rate) for a meaningful prediction.
            </div>
          )}
        </TabsContent>

        <TabsContent value="csv" className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a CICIDS-style CSV. Required column names:{' '}
            <span className="font-mono text-xs text-foreground">{DDOS_FEATURE_KEYS.join(', ')}</span>.
          </p>
          <div className="flex items-center gap-3">
            <label
              htmlFor="ddos-csv"
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 text-sm text-foreground"
            >
              <Upload className="h-4 w-4 text-primary" />
              {csvName || 'Choose CSV file'}
            </label>
            <input
              id="ddos-csv" type="file" accept=".csv,text/csv" className="hidden"
              onChange={(e) => handleCsv(e.target.files?.[0] ?? null)}
            />
            {csvName && <Button variant="ghost" size="sm" onClick={() => handleCsv(null)}>Clear</Button>}
          </div>
          {csvText && (
            <pre className="text-[11px] font-mono bg-muted/40 border border-border rounded p-3 overflow-x-auto max-h-40">
              {csvText.split('\n').slice(0, 6).join('\n')}
              {csvText.split('\n').length > 6 ? '\n…' : ''}
            </pre>
          )}
        </TabsContent>
      </Tabs>

      {/* Feature preview */}
      {mode === 'manual' && (
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="text-xs font-semibold text-foreground mb-2">Feature vector preview (1 × {DDOS_FEATURE_KEYS.length})</div>
          <code className="text-[11px] font-mono text-muted-foreground break-all">
            [{DDOS_FEATURE_KEYS.map((k) => features[k]).join(', ')}]
          </code>
        </div>
      )}

      <Button
        onClick={handleScan}
        disabled={loading || (mode === 'csv' && !csvText)}
        className="w-full sm:w-auto glow-cyan"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Run intrusion detection
      </Button>
    </div>
  );
}

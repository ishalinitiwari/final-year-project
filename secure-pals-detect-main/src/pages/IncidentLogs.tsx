import { useEffect, useState } from 'react';
import { Database, ExternalLink, Clock, Eye, AlertTriangle, RefreshCw, Loader2, MapPin, Globe, Calendar, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LABEL_COLORS, type ThreatLabel } from '@/lib/config';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Incident {
  id: string;
  created_at: string;
  module: string;
  label: string;
  confidence: number;
  details: string | null;
  input_snippet: string | null;
  source: string | null;
  destination: string | null;
  source_ip: string | null;
  user_agent: string | null;
  ipfs_cid: string | null;
  ipfs_url: string | null;
  status: string;
}

const moduleLabels: Record<string, string> = {
  phishing: 'Phishing', ddos: 'DDoS', sqli: 'SQL Injection', malware: 'Malware',
};

export default function IncidentLogsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Incident | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('incidents')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error && data) setIncidents(data as Incident[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const getLabelColors = (label: string) => LABEL_COLORS[label as ThreatLabel] || LABEL_COLORS['Suspicious'];

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2"><span className="text-gradient-primary">Incident Logs</span></h1>
          <p className="text-muted-foreground">All detected threats, automatically pinned to IPFS for tamper-evident storage.</p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm">
            <Database className="h-4 w-4" />Decentralized storage via IPFS + Pinata
          </div>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>

      <Card className="cyber-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Clock className="h-5 w-5 text-primary" />Logged Incidents ({incidents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            </div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No incidents yet. Run a scan to populate logs.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date/Time</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Module</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Threat</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Confidence</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">IPFS CID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => {
                    const c = getLabelColors(inc.label);
                    return (
                      <tr key={inc.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className="text-sm text-foreground">{new Date(inc.created_at).toLocaleDateString()}</span><br />
                          <span className="text-xs text-muted-foreground">{new Date(inc.created_at).toLocaleTimeString()}</span>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">{moduleLabels[inc.module] || inc.module}</td>
                        <td className="py-3 px-4">
                          <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', c.bg, c.text, c.border)}>{inc.label}</span>
                        </td>
                        <td className="py-3 px-4 text-sm font-mono text-foreground">{(Number(inc.confidence) * 100).toFixed(1)}%</td>
                        <td className="py-3 px-4">
                          {inc.ipfs_cid ? (
                            <a href={inc.ipfs_url || `https://ipfs.io/ipfs/${inc.ipfs_cid}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono">
                              {inc.ipfs_cid.slice(0, 12)}...<ExternalLink className="h-3 w-3" />
                            </a>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-cyber-green/10 text-cyber-green border border-cyber-green/30">
                            {inc.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelected(inc)}><Eye className="h-4 w-4" /></Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="cyber-card !fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2 max-w-2xl w-[calc(100%-2rem)] max-h-[85vh] p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
            <DialogTitle className="text-foreground">Incident Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 px-6 pb-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <DetailRow icon={Server} label="Module" value={moduleLabels[selected.module] || selected.module} />
                <DetailRow icon={AlertTriangle} label="Threat" value={selected.label} valueClass={getLabelColors(selected.label).text} />
                <DetailRow icon={Calendar} label="Timestamp" value={new Date(selected.created_at).toLocaleString()} />
                <DetailRow icon={Globe} label="Source IP" value={selected.source_ip || 'unknown'} mono />
                <DetailRow icon={MapPin} label="Source" value={selected.source || '—'} />
                <DetailRow icon={MapPin} label="Destination" value={selected.destination || '—'} mono />
              </div>

              {selected.user_agent && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <span className="text-xs text-muted-foreground">User Agent</span>
                  <p className="text-xs text-foreground break-all mt-1">{selected.user_agent}</p>
                </div>
              )}

              {selected.ipfs_cid && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-xs text-muted-foreground">IPFS CID</span>
                  <p className="font-mono text-xs text-primary break-all mt-1">{selected.ipfs_cid}</p>
                  <a href={selected.ipfs_url || `https://ipfs.io/ipfs/${selected.ipfs_cid}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-1 hover:underline">
                    Open on IPFS gateway <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h5 className="text-sm font-semibold text-foreground mb-2">Analysis</h5>
                <p className="text-muted-foreground text-sm">{selected.details}</p>
              </div>

              {selected.input_snippet && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border">
                  <span className="text-xs text-muted-foreground">Input Snippet</span>
                  <pre className="text-xs text-foreground font-mono mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-all">{selected.input_snippet}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, mono, valueClass }: { icon: any; label: string; value: string; mono?: boolean; valueClass?: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground inline-flex items-center gap-1"><Icon className="h-3 w-3" />{label}</span>
      <p className={cn('font-medium text-foreground mt-0.5', mono && 'font-mono text-sm', valueClass)}>{value}</p>
    </div>
  );
}

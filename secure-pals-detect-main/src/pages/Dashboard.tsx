import { useState, useMemo, useEffect } from 'react';
import { BarChart3, Shield, Fish, Syringe, Bug, TrendingUp, Clock, Eye, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { LABEL_COLORS, type ThreatLabel } from '@/lib/config';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface Scan {
  id: string;
  module: string;
  label: ThreatLabel;
  confidence: number;
  details: string | null;
  created_at: string;
}

const moduleIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  phishing: Fish, ddos: Shield, sqli: Syringe, malware: Bug,
};
const moduleLabels: Record<string, string> = {
  phishing: 'Phishing', ddos: 'DDoS', sqli: 'SQL Injection', malware: 'Malware',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>{entry.name}: {entry.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('incidents')
        .select('id, module, label, confidence, details, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (data) setScans(data as Scan[]);
      setLoading(false);
    })();
  }, []);

  const stats = useMemo(() => {
    const moduleCounts = { phishing: 0, ddos: 0, sqli: 0, malware: 0 };
    scans.forEach(scan => {
      if (scan.module in moduleCounts) moduleCounts[scan.module as keyof typeof moduleCounts]++;
    });
    return { totalScans: scans.length, ...moduleCounts };
  }, [scans]);

  const moduleChartData = useMemo(() => [
    { name: 'Phishing', scans: stats.phishing },
    { name: 'DDoS', scans: stats.ddos },
    { name: 'SQL Injection', scans: stats.sqli },
    { name: 'Malware', scans: stats.malware },
  ], [stats]);

  const threatSummaryData = useMemo(() => {
    const counts = { Safe: 0, Suspicious: 0, Malicious: 0 };
    scans.forEach(scan => { if (scan.label in counts) counts[scan.label as keyof typeof counts]++; });
    return [
      { name: 'Safe', value: counts.Safe, color: 'hsl(142 76% 36%)' },
      { name: 'Suspicious', value: counts.Suspicious, color: 'hsl(38 92% 50%)' },
      { name: 'Malicious', value: counts.Malicious, color: 'hsl(0 84% 60%)' },
    ];
  }, [scans]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2"><span className="text-gradient-primary">Dashboard</span></h1>
        <p className="text-muted-foreground">Welcome back, <span className="text-foreground">{user?.email}</span>. Here's your security overview.</p>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
      ) : (
      <>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="cyber-card col-span-2 lg:col-span-1">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><BarChart3 className="h-4 w-4" />Total Scans</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalScans}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><TrendingUp className="h-3 w-3 text-cyber-green" /><span className="text-cyber-green">All time</span></p>
          </CardContent>
        </Card>
        {Object.entries(moduleIcons).map(([key, Icon]) => (
          <Card key={key} className="cyber-card">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Icon className="h-4 w-4" />{moduleLabels[key]}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-foreground">{stats[key as keyof typeof stats]}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        <Card className="cyber-card lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-foreground"><BarChart3 className="h-5 w-5 text-primary" />Scan Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={moduleChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="scans" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="cyber-card">
          <CardHeader><CardTitle className="text-foreground">Threat Summary</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={threatSummaryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {threatSummaryData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4 flex-wrap">
              {threatSummaryData.map(item => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="cyber-card">
        <CardHeader><CardTitle className="flex items-center gap-2 text-foreground"><Clock className="h-5 w-5 text-primary" />Recent Scans</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Module</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Result</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Confidence</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scans.slice(0, 10).map(scan => {
                  const c = LABEL_COLORS[scan.label] || LABEL_COLORS.Suspicious;
                  return (
                    <tr key={scan.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-sm text-foreground">{new Date(scan.created_at).toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-foreground">{moduleLabels[scan.module] || scan.module}</td>
                      <td className="py-3 px-4">
                        <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', c.bg, c.text, c.border)}>{scan.label}</span>
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-foreground">{(Number(scan.confidence) * 100).toFixed(1)}%</td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedScan(scan)}><Eye className="h-4 w-4" /></Button>
                      </td>
                    </tr>
                  );
                })}
                {scans.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">No scans yet — head to Threat Scanner to run your first detection.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </>
      )}

      <Dialog open={!!selectedScan} onOpenChange={() => setSelectedScan(null)}>
        <DialogContent className="cyber-card max-w-lg">
          <DialogHeader><DialogTitle className="text-foreground">Scan Details</DialogTitle></DialogHeader>
          {selectedScan && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">Module</span><p className="font-medium text-foreground">{moduleLabels[selectedScan.module]}</p></div>
                <div><span className="text-sm text-muted-foreground">Result</span><p className={cn('font-medium', (LABEL_COLORS[selectedScan.label] || LABEL_COLORS.Suspicious).text)}>{selectedScan.label}</p></div>
                <div><span className="text-sm text-muted-foreground">Confidence</span><p className="font-mono font-medium text-foreground">{(Number(selectedScan.confidence) * 100).toFixed(1)}%</p></div>
                <div><span className="text-sm text-muted-foreground">Date</span><p className="font-medium text-foreground">{new Date(selectedScan.created_at).toLocaleString()}</p></div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h5 className="text-sm font-semibold text-foreground mb-2">Details</h5>
                <p className="text-muted-foreground text-sm">{selectedScan.details}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

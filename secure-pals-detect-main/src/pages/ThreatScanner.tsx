import { useState } from 'react';
import { Fish, Shield, Syringe, Bug, Loader2, AlertTriangle, CheckCircle, XCircle, Upload, ImageIcon, FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { scanThreat } from '@/lib/apiClient';
import { MODULE_CONFIG, LABEL_COLORS, type ThreatScanResult, type ThreatLabel, type ThreatModule } from '@/lib/config';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import DDoSScanForm from '@/components/DDoSScanForm';
import type { DDoSFeatures } from '@/lib/ddosFeatures';

interface ScanResultCardProps {
  result: ThreatScanResult | null;
  loading: boolean;
  error: string | null;
}

function ScanResultCard({ result, loading, error }: ScanResultCardProps) {
  if (loading) {
    return (
      <div className="cyber-card mt-6 text-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Analyzing threat data...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="cyber-card mt-6 border-destructive/50 bg-destructive/10">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-destructive">Scan Error</h4>
            <p className="text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  if (!result) return null;

  const labelColors = LABEL_COLORS[result.label as ThreatLabel];
  const LabelIcon = result.label === 'Safe' ? CheckCircle : result.label === 'Malicious' ? XCircle : AlertTriangle;

  return (
    <div className="cyber-card mt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-foreground">Scan Result</h4>
        <span className="text-xs text-muted-foreground font-mono">{new Date(result.timestamp).toLocaleString()}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className={cn('flex items-center gap-3 px-6 py-4 rounded-lg border', labelColors.bg, labelColors.border)}>
          <LabelIcon className={cn('h-8 w-8', labelColors.text)} />
          <div>
            <div className={cn('text-2xl font-bold', labelColors.text)}>{result.label}</div>
            <div className="text-sm text-muted-foreground">Threat Status</div>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-mono font-semibold text-foreground">{(result.confidence * 100).toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all duration-500',
                result.label === 'Safe' ? 'bg-cyber-green' : result.label === 'Malicious' ? 'bg-cyber-red' : 'bg-cyber-amber'
              )}
              style={{ width: `${result.confidence * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
        <h5 className="text-sm font-semibold text-foreground mb-2">Analysis Details</h5>
        <p className="text-muted-foreground text-sm">{result.details}</p>
      </div>

      {result.ipfsCid && (
        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <span className="text-xs text-muted-foreground">Logged to IPFS — CID</span>
          <p className="font-mono text-xs text-primary break-all">{result.ipfsCid}</p>
        </div>
      )}
    </div>
  );
}

async function readFileAsText(file: File, max = 200_000): Promise<string> {
  const slice = file.slice(0, max);
  return await slice.text();
}
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function ThreatScannerPage() {
  const [activeTab, setActiveTab] = useState('phishing');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ThreatScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const [phishingEmail, setPhishingEmail] = useState('');
  const [phishingUrl, setPhishingUrl] = useState('');
  const [phishingImage, setPhishingImage] = useState<File | null>(null);
  const [phishingImagePreview, setPhishingImagePreview] = useState<string | null>(null);

  const [sqliUrl, setSqliUrl] = useState('');
  const [sqliRequest, setSqliRequest] = useState('');

  const [malwareFile, setMalwareFile] = useState<File | null>(null);

  const handlePhishingImage = async (file: File | null) => {
    setPhishingImage(file);
    setPhishingImagePreview(file ? await readFileAsDataUrl(file) : null);
  };

  const runScan = async (module: ThreatModule, data: object) => {
    setLoading(true); setResult(null); setError(null);
    try {
      const scanResult = await scanThreat(module, data as any, user);
      setResult(scanResult);
      toast({
        title: 'Scan Complete',
        description: `${MODULE_CONFIG[module].name}: ${scanResult.label} (${(scanResult.confidence * 100).toFixed(0)}%)`,
      });
    } catch (err: unknown) {
      const m = err instanceof Error ? err.message : 'Scan failed.';
      setError(m);
      toast({ variant: 'destructive', title: 'Scan Failed', description: m });
    } finally {
      setLoading(false);
    }
  };

  const handlePhishingScan = () =>
    runScan('phishing', {
      emailBody: phishingEmail,
      url: phishingUrl,
      imageName: phishingImage?.name,
      imageDataUrl: phishingImagePreview ?? undefined,
    });

  const handleMalwareScan = async () => {
    if (!malwareFile) return;
    const text = await readFileAsText(malwareFile);
    runScan('malware', { fileName: malwareFile.name, fileSize: malwareFile.size, fileText: text });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4"><span className="text-gradient-primary">Threat Scanner</span></h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Submit suspicious data for AI-powered analysis. All detections are stored and pinned to IPFS automatically.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto gap-2 bg-transparent p-0">
            <TabsTrigger value="phishing" className="cyber-card flex-col gap-2 py-4 data-[state=active]:border-primary data-[state=active]:glow-cyan">
              <Fish className="h-6 w-6" /><span className="text-sm">Phishing</span>
            </TabsTrigger>
            <TabsTrigger value="ddos" className="cyber-card flex-col gap-2 py-4 data-[state=active]:border-primary data-[state=active]:glow-cyan">
              <Shield className="h-6 w-6" /><span className="text-sm">DDoS</span>
            </TabsTrigger>
            <TabsTrigger value="sqli" className="cyber-card flex-col gap-2 py-4 data-[state=active]:border-primary data-[state=active]:glow-cyan">
              <Syringe className="h-6 w-6" /><span className="text-sm">SQL Injection</span>
            </TabsTrigger>
            <TabsTrigger value="malware" className="cyber-card flex-col gap-2 py-4 data-[state=active]:border-primary data-[state=active]:glow-cyan">
              <Bug className="h-6 w-6" /><span className="text-sm">Malware</span>
            </TabsTrigger>
          </TabsList>

          {/* Phishing */}
          <TabsContent value="phishing" className="mt-8">
            <div className="cyber-card">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
                <Fish className="h-5 w-5 text-primary" />{MODULE_CONFIG.phishing.name}
              </h3>
              <p className="text-muted-foreground mb-6">{MODULE_CONFIG.phishing.description}</p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phishing-email">Email Body / Message</Label>
                  <Textarea id="phishing-email" placeholder="Paste the suspicious email content here..." value={phishingEmail} onChange={(e) => setPhishingEmail(e.target.value)} rows={6} className="mt-2 font-mono text-sm" />
                </div>
                <div>
                  <Label htmlFor="phishing-url">Suspicious URL (optional)</Label>
                  <Input id="phishing-url" type="text" placeholder="https://example.com/suspicious-link" value={phishingUrl} onChange={(e) => setPhishingUrl(e.target.value)} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="phishing-image">Screenshot / Image (optional)</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <label htmlFor="phishing-image" className="flex items-center gap-2 px-4 py-2 rounded-md border border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors text-sm text-foreground">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      {phishingImage ? phishingImage.name : 'Upload phishing screenshot'}
                    </label>
                    <input
                      id="phishing-image" type="file" accept="image/*" className="hidden"
                      onChange={(e) => handlePhishingImage(e.target.files?.[0] ?? null)}
                    />
                    {phishingImage && (
                      <Button variant="ghost" size="sm" onClick={() => handlePhishingImage(null)}>Clear</Button>
                    )}
                  </div>
                  {phishingImagePreview && (
                    <img src={phishingImagePreview} alt="upload preview" className="mt-3 max-h-40 rounded-md border border-border" />
                  )}
                </div>
                <Button onClick={handlePhishingScan} disabled={loading || (!phishingEmail && !phishingUrl && !phishingImage)} className="w-full sm:w-auto glow-cyan">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Scan for Phishing
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* DDoS */}
          <TabsContent value="ddos" className="mt-8">
            <div className="cyber-card">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
                <Shield className="h-5 w-5 text-primary" />{MODULE_CONFIG.ddos.name}
              </h3>
              <p className="text-muted-foreground mb-6">{MODULE_CONFIG.ddos.description}</p>
              <DDoSScanForm
                loading={loading}
                onScan={(payload) => runScan('ddos', payload)}
              />
            </div>
          </TabsContent>

          {/* SQLi */}
          <TabsContent value="sqli" className="mt-8">
            <div className="cyber-card">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
                <Syringe className="h-5 w-5 text-primary" />{MODULE_CONFIG.sqli.name}
              </h3>
              <p className="text-muted-foreground mb-6">{MODULE_CONFIG.sqli.description}</p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sqli-url">Target URL</Label>
                  <Input id="sqli-url" type="text" placeholder="https://example.com/page?id=1" value={sqliUrl} onChange={(e) => setSqliUrl(e.target.value)} className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="sqli-request">Request String (optional)</Label>
                  <Textarea id="sqli-request" placeholder="Paste the HTTP request string..." value={sqliRequest} onChange={(e) => setSqliRequest(e.target.value)} rows={4} className="mt-2 font-mono text-sm" />
                </div>
                <Button onClick={() => runScan('sqli', { url: sqliUrl, requestString: sqliRequest })} disabled={loading || (!sqliUrl && !sqliRequest)} className="w-full sm:w-auto glow-cyan">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Scan for SQLi
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Malware */}
          <TabsContent value="malware" className="mt-8">
            <div className="cyber-card">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
                <Bug className="h-5 w-5 text-primary" />{MODULE_CONFIG.malware.name}
              </h3>
              <p className="text-muted-foreground mb-6">{MODULE_CONFIG.malware.description}</p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="malware-file">Upload File for Analysis</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <label htmlFor="malware-file" className="flex items-center gap-2 px-4 py-2 rounded-md border border-dashed border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors text-sm text-foreground">
                      <Upload className="h-4 w-4 text-primary" />
                      {malwareFile ? malwareFile.name : 'Choose a file to scan'}
                    </label>
                    <input
                      id="malware-file" type="file" className="hidden"
                      onChange={(e) => setMalwareFile(e.target.files?.[0] ?? null)}
                    />
                    {malwareFile && (
                      <Button variant="ghost" size="sm" onClick={() => setMalwareFile(null)}>Clear</Button>
                    )}
                  </div>
                  {malwareFile && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <FileIcon className="h-3 w-3" />
                      {(malwareFile.size / 1024).toFixed(1)} KB · {malwareFile.type || 'unknown type'}
                    </div>
                  )}
                </div>
                <Button onClick={handleMalwareScan} disabled={loading || !malwareFile} className="w-full sm:w-auto glow-cyan">
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Scan for Malware
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <ScanResultCard result={result} loading={loading} error={error} />
      </div>
    </div>
  );
}

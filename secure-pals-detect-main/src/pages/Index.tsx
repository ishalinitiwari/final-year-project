import { Link, useNavigate } from 'react-router-dom';
import { Shield, Zap, Database, Lock, ArrowRight, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const features = [
  {
    icon: Zap,
    title: 'AI-Based Threat Detection',
    description: 'Advanced machine learning models detect phishing, DDoS attacks, SQL injection, and malware with high accuracy.',
  },
  {
    icon: Database,
    title: 'Decentralized Incident Logging',
    description: 'Log security incidents to IPFS and blockchain for immutable, verifiable records. (Coming Soon)',
  },
  {
    icon: Lock,
    title: 'Open & Transparent',
    description: 'Built with transparency in mind. Understand how threats are detected and verified.',
  },
];

const steps = [
  { number: '01', title: 'Upload Data', description: 'Submit suspicious emails, URLs, logs, or files for analysis.' },
  { number: '02', title: 'AI Analysis', description: 'Our ML models analyze the data and score the threat level.' },
  { number: '03', title: 'Log & Verify', description: 'Incidents can be logged to IPFS & blockchain for verification.' },
];

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
        
        <div className="container relative mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-8 animate-fade-in">
              <Shield className="h-4 w-4" />
              <span>AI × Blockchain Security Platform</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-slide-up">
              <span className="text-foreground">CyberBuddy</span>
              <br />
              <span className="text-gradient-primary">AI-Powered Threat Detection</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
              Detect phishing, DDoS attacks, SQL injection, and malware with advanced AI. 
              Log incidents to IPFS & blockchain for immutable verification.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '200ms' }}>
              <Button 
                size="lg" 
                onClick={() => navigate(user ? '/threat-scanner' : '/auth')}
                className="gap-2 glow-cyan text-lg px-8"
              >
                Start Scanning
                <ArrowRight className="h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate(user ? '/dashboard' : '/auth')}
                className="gap-2 text-lg px-8"
              >
                View Dashboard
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-gradient-secondary">Key Features</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A comprehensive security platform combining AI detection with decentralized verification.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="cyber-card group cursor-pointer transition-all duration-300 hover:-translate-y-1"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-glow">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-card opacity-50" />
        <div className="container relative mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              <span className="text-gradient-primary">How It Works</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Three simple steps to detect and log security threats.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-16 left-1/3 w-1/3 h-0.5 bg-gradient-to-r from-primary/50 to-secondary/50" />
            <div className="hidden md:block absolute top-16 right-1/3 w-1/3 h-0.5 bg-gradient-to-r from-secondary/50 to-accent/50" />

            {steps.map((step) => (
              <div key={step.number} className="relative text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-background text-primary font-display text-2xl font-bold mb-6 relative z-10">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="cyber-card max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-6 text-center text-foreground">System Architecture</h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center">
              <div className="flex-1 p-4 rounded-lg bg-muted/50 border border-border">
                <div className="text-3xl mb-2">👤</div>
                <div className="font-semibold text-foreground">User</div>
                <div className="text-xs text-muted-foreground">Submit Data</div>
              </div>
              <ArrowRight className="h-6 w-6 text-primary rotate-90 md:rotate-0" />
              <div className="flex-1 p-4 rounded-lg bg-primary/10 border border-primary/30">
                <div className="text-3xl mb-2">🌐</div>
                <div className="font-semibold text-foreground">CyberBuddy</div>
                <div className="text-xs text-muted-foreground">Web Application</div>
              </div>
              <ArrowRight className="h-6 w-6 text-primary rotate-90 md:rotate-0" />
              <div className="flex-1 p-4 rounded-lg bg-secondary/10 border border-secondary/30">
                <div className="text-3xl mb-2">🤖</div>
                <div className="font-semibold text-foreground">AI Models</div>
                <div className="text-xs text-muted-foreground">Threat Detection</div>
              </div>
              <ArrowRight className="h-6 w-6 text-primary rotate-90 md:rotate-0" />
              <div className="flex-1 p-4 rounded-lg bg-accent/10 border border-accent/30">
                <div className="text-3xl mb-2">⛓️</div>
                <div className="font-semibold text-foreground">IPFS + Blockchain</div>
                <div className="text-xs text-muted-foreground">Incident Logging</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-card p-8 md:p-12 text-center">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">Ready to Secure Your Digital Assets?</h2>
              <p className="text-muted-foreground max-w-xl mx-auto mb-8">
                Start scanning for threats today. Our AI-powered platform is ready to help you detect and log security incidents.
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate(user ? '/threat-scanner' : '/auth')}
                className="gap-2 glow-cyan text-lg px-8"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

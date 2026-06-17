import { Link } from 'react-router-dom';
import { Shield, Github, FileText, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-bold text-primary">CyberBuddy</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-md">
              AI-Powered Cyber Threat Detection & Decentralized Incident Reporting.
              Built with AI, Blockchain, and IPFS (testnet placeholder).
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/threat-scanner" className="text-sm text-muted-foreground hover:text-primary transition-colors">Threat Scanner</Link></li>
              <li><Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">Dashboard</Link></li>
              <li><Link to="/documentation" className="text-sm text-muted-foreground hover:text-primary transition-colors">Documentation</Link></li>
              <li><Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"><Github className="h-4 w-4" />GitHub Repository</a></li>
              <li><a href="#" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"><FileText className="h-4 w-4" />Project Documentation</a></li>
              <li><a href="#" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"><Mail className="h-4 w-4" />Contact / Feedback</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} CyberBuddy. All rights reserved.</p>
            <p className="text-xs text-muted-foreground/70">Academic Project • AI × Blockchain × IPFS</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

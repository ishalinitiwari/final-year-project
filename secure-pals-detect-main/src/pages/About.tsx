import { Shield, Users, Target, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const teamMembers = [
  { name: 'Shivansh Srivastava', role: 'Blockchain Development', avatar: '👨‍💻' },
  { name: 'Shivangi Patel', role: 'AI Model Development', avatar: '🤖' },
  { name: 'Shreya Asthana', role: 'Backend Integration', avatar: '⛓️' },
  { name: 'Shalini Tiwari', role: 'Frontend Development', avatar: '🎨' },
];

const objectives = [
  { icon: Shield, title: 'Real-time Threat Detection', description: 'Leverage machine learning to identify cyber threats as they happen, reducing response time significantly.' },
  { icon: Target, title: 'Comprehensive Coverage', description: 'Cover multiple threat vectors including phishing, DDoS attacks, SQL injection, and malware.' },
  { icon: Lightbulb, title: 'Decentralized Verification', description: 'Use IPFS and blockchain technology to create immutable, verifiable security incident records.' },
];

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-6">
          <Shield className="h-4 w-4" />Academic Research Project
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold mb-6"><span className="text-gradient-primary">About CyberBuddy</span></h1>
        <p className="text-lg text-muted-foreground">
          An AI-powered cyber threat detection and decentralized incident reporting platform, 
          developed as an academic project exploring the intersection of machine learning, 
          cybersecurity, and blockchain technology.
        </p>
      </div>

      <Card className="cyber-card mb-12">
        <CardHeader><CardTitle className="text-foreground">Project Overview</CardTitle></CardHeader>
        <CardContent className="text-muted-foreground space-y-4">
          <p>CyberBuddy is a comprehensive cybersecurity platform that combines advanced AI/ML models with decentralized technologies to provide robust threat detection and incident management capabilities.</p>
          <p>The project addresses the growing need for automated, intelligent security solutions that can keep pace with evolving cyber threats. By leveraging machine learning for threat detection and blockchain for immutable incident logging, CyberBuddy provides a trustworthy and transparent security platform.</p>
        </CardContent>
      </Card>

      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-8 text-center"><span className="text-gradient-secondary">Objectives</span></h2>
        <div className="grid md:grid-cols-3 gap-8">
          {objectives.map(obj => (
            <div key={obj.title} className="cyber-card text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <obj.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{obj.title}</h3>
              <p className="text-muted-foreground text-sm">{obj.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-8 text-center"><span className="text-gradient-primary">Technology Stack</span></h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'React + TypeScript', desc: 'Frontend Framework' },
            { name: 'Python + Flask', desc: 'ML Backend' },
            { name: 'IPFS + Pinata', desc: 'Decentralized Storage' },
            { name: 'Scikit-learn / TensorFlow', desc: 'ML Models' },
            { name: 'Tailwind CSS', desc: 'Styling' },
            { name: 'Supabase', desc: 'Auth & Database' },
          ].map(tech => (
            <div key={tech.name} className="cyber-card text-center py-4">
              <h4 className="font-semibold text-foreground text-sm">{tech.name}</h4>
              <p className="text-xs text-muted-foreground">{tech.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-8 text-center"><span className="text-gradient-secondary">Team</span></h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {teamMembers.map(member => (
            <div key={member.name} className="cyber-card text-center">
              <div className="text-4xl mb-3">{member.avatar}</div>
              <h4 className="font-semibold text-foreground">{member.name}</h4>
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

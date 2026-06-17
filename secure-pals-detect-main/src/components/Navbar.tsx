import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Shield, User, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/threat-scanner', label: 'Threat Scanner', protected: true },
  { href: '/incident-logs', label: 'Incident Logs', protected: true },
  { href: '/documentation', label: 'Documentation' },
  { href: '/about', label: 'About' },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const filteredLinks = navLinks.filter(link => !link.protected || user);

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Shield className="h-8 w-8 text-primary transition-all duration-300 group-hover:drop-shadow-[0_0_10px_hsl(var(--primary))]" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl font-bold text-primary">CyberBuddy</span>
              <span className="hidden text-[10px] text-muted-foreground sm:block">AI × Blockchain Security</span>
            </div>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {filteredLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="max-w-[120px] truncate text-sm">{user.email}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/auth')}>Login</Button>
                <Button variant="default" onClick={() => navigate('/auth?mode=signup')} className="glow-cyan">Sign Up</Button>
              </>
            )}
          </div>

          <button
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <div className={cn(
          'overflow-hidden transition-all duration-300 md:hidden',
          mobileMenuOpen ? 'max-h-96 pb-4' : 'max-h-0'
        )}>
          <div className="flex flex-col gap-2 pt-2">
            {filteredLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 border-t border-border" />
            {user ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <>
                <Link to="/auth" className="rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                <Link to="/auth?mode=signup" className="rounded-lg bg-primary px-4 py-3 text-center text-sm font-medium text-primary-foreground" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

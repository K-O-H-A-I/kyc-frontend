import React from 'react';
import { ShieldCheck, Bell, User } from 'lucide-react';

export function NavBar() {
  return (
    <nav className="h-16 border-b border-border bg-panel sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src="/brand-logo.png" 
            alt="Reagvis Labs Pvt. Ltd." 
            className="h-[34px] md:h-[40px] max-w-[280px] object-contain block" 
          />
        </div>

        <div className="flex items-center gap-4">
          <button className="relative btn btn-ghost p-2 rounded-full hover:bg-white/5 transition-colors">
            <Bell className="w-5 h-5 text-[var(--muted)]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--danger)] rounded-full border border-panel" />
          </button>
          
          <div className="h-8 w-[1px] bg-border mx-1" />
          
          <div className="flex items-center gap-3 pl-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-[var(--text)]">User</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-[var(--panel2)] border border-[var(--border)] flex items-center justify-center">
              <User className="w-5 h-5 text-[var(--muted)]" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

import React from "react";
import { Shield, MessageSquare, Activity, Database, FileCode, LogOut, Terminal, Users } from "lucide-react";

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Navigation({ activeTab, setActiveTab, onLogout }: NavigationProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "whatsapp", label: "WhatsApp Scanner", icon: Users },
    { id: "ai", label: "Intelligence AI", icon: Shield },
    { id: "monitoring", label: "Live Monitor", icon: Terminal },
    { id: "audit", label: "Logs & Backups", icon: Database },
    { id: "deployment", label: "Local Deployment", icon: FileCode },
  ];

  return (
    <div className="w-64 bg-[#0a0a0a] border-r border-zinc-800 flex flex-col justify-between h-full text-zinc-300">
      <div>
        {/* Branding */}
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-xs tracking-widest text-blue-500 uppercase">Intelligence WA</h1>
            <p className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase">LOCAL ANALYZER v1.2</p>
          </div>
        </div>

        {/* User Badge */}
        <div className="p-4 mx-4 my-4 bg-[#050505] rounded-xl border border-zinc-850 flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-xs text-blue-400 font-bold font-mono">
              AD
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-blue-500 border-2 border-[#050505] rounded-full"></span>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-200">admin</p>
            <p className="text-[10px] text-blue-400 font-mono">STATION_LOCAL</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="px-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-medium tracking-wide transition-all ${
                  isActive
                    ? "bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 shadow-[inset_1px_0_0_0_rgba(37,99,235,0.2)]"
                    : "text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-zinc-500"}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-zinc-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-medium text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all"
        >
          <LogOut className="w-4 h-4 text-zinc-500 hover:text-rose-400" />
          Logout Terminal
        </button>
      </div>
    </div>
  );
}

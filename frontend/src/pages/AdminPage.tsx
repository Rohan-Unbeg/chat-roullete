import { useState, useEffect, useCallback } from "react";
import {
  Users, Radio, MessageSquare, Swords, Flag,
  Clock, Shield, Activity, Eye, EyeOff, ChevronDown, ChevronUp,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";

interface Stats {
  realUsers: number;
  inflatedUsers: number;
  activeRooms: number;
  queueSize: number;
  matchesToday: number;
  messagesToday: number;
  reportsToday: number;
  totalReports: number;
  uptimeHours: number;
}

interface Report {
  id: string;
  timestamp: string;
  roomId: string;
  reporterId: string;
  reportedId: string;
  messages: { senderId: string; nickname: string; message: string; timestamp: string }[];
}

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState("");
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!adminKey) return;
    try {
      const res = await fetch(`${API_BASE}/admin/stats?key=${encodeURIComponent(adminKey)}`);
      if (!res.ok) {
        if (res.status === 401) {
          setError("Invalid admin key");
          setAuthenticated(false);
        }
        return;
      }
      const data = await res.json();
      setStats(data);
      setError("");
      setAuthenticated(true);
    } catch {
      setError("Failed to connect to server");
    }
  }, [adminKey]);

  const fetchReports = useCallback(async () => {
    if (!adminKey) return;
    try {
      const res = await fetch(`${API_BASE}/admin/reports?key=${encodeURIComponent(adminKey)}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch {
      // silently fail for reports
    }
  }, [adminKey]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey.trim()) {
      fetchStats();
      fetchReports();
    }
  };

  // Auto-refresh every 3 seconds
  useEffect(() => {
    if (!authenticated || !autoRefresh) return;
    const interval = setInterval(() => {
      fetchStats();
      fetchReports();
    }, 3000);
    return () => clearInterval(interval);
  }, [authenticated, autoRefresh, fetchStats, fetchReports]);

  const formatUptime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d ${Math.round(hours % 24)}h`;
  };

  // ============================================
  // LOGIN SCREEN
  // ============================================
  if (!authenticated) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4" style={{ background: '#0a0618' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-anime text-white mb-2">
              Admin <span className="neon-text text-anime-primary">Panel</span>
            </h1>
            <p className="text-gray-400 text-sm">Anime Roulette — Owner Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="glass-panel rounded-2xl p-6">
            <label className="block text-xs text-gray-400 font-medium mb-2 uppercase tracking-wider">
              <Shield size={12} className="inline mr-1" />
              Admin Key
            </label>
            <div className="relative mb-4">
              <input
                type={showKey ? "text" : "password"}
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Enter your admin key..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-anime-primary/50 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 cursor-pointer"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <p className="text-red-400 text-xs mb-3">⚠️ {error}</p>
            )}
            <button
              type="submit"
              className="anime-btn w-full py-3 rounded-xl font-bold text-sm"
            >
              Access Dashboard
            </button>
          </form>

          <p className="text-center text-gray-600 text-[10px] mt-4">
            Set ADMIN_KEY in your backend .env file
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // DASHBOARD
  // ============================================
  return (
    <div className="min-h-[100dvh] text-white" style={{ background: '#0a0618' }}>
      {/* Background effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-anime-secondary opacity-10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-anime-primary opacity-10 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-anime text-white">
              Admin <span className="neon-text text-anime-primary">Dashboard</span>
            </h1>
            <p className="text-gray-400 text-xs mt-1">Live server stats — refreshing every 3s</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                autoRefresh ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400'
              }`}
            >
              <Activity size={12} className={autoRefresh ? 'animate-pulse' : ''} />
              {autoRefresh ? 'Live' : 'Paused'}
            </button>
            <button
              onClick={() => { setAuthenticated(false); setAdminKey(""); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {/* Real Users */}
            <div className="glass-panel rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-2">
                <Users size={14} className="text-anime-accent" />
                Real Users
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-anime-accent font-mono">
                {stats.realUsers}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                Shown as {stats.inflatedUsers} (inflated)
              </div>
            </div>

            {/* Active Rooms */}
            <div className="glass-panel rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-2">
                <Radio size={14} className="text-anime-primary" />
                Active Chats
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-anime-primary font-mono">
                {stats.activeRooms}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                {stats.queueSize} in queue
              </div>
            </div>

            {/* Matches Today */}
            <div className="glass-panel rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-2">
                <Swords size={14} className="text-anime-pink" />
                Matches Today
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-anime-pink font-mono">
                {stats.matchesToday}
              </div>
            </div>

            {/* Messages Today */}
            <div className="glass-panel rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-2">
                <MessageSquare size={14} className="text-green-400" />
                Messages Today
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-green-400 font-mono">
                {stats.messagesToday}
              </div>
            </div>

            {/* Reports Today */}
            <div className="glass-panel rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-2">
                <Flag size={14} className="text-red-400" />
                Reports Today
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-red-400 font-mono">
                {stats.reportsToday}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                {stats.totalReports} total
              </div>
            </div>

            {/* Uptime */}
            <div className="glass-panel rounded-xl p-4 sm:p-5">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium mb-2">
                <Clock size={14} className="text-anime-violet" />
                Uptime
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-anime-violet font-mono">
                {formatUptime(stats.uptimeHours)}
              </div>
            </div>
          </div>
        )}

        {/* Reports Section */}
        <div className="glass-panel rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-anime text-white flex items-center gap-2">
              <Flag size={18} className="text-red-400" />
              Recent Reports
            </h2>
            <span className="text-xs text-gray-500">{reports.length} reports</span>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No reports yet. That's a good sign! 🎉
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {reports.map((report) => (
                <div key={report.id} className="bg-white/5 rounded-xl overflow-hidden">
                  {/* Report Header */}
                  <button
                    onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                    className="w-full flex items-center justify-between p-3 sm:p-4 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <Flag size={14} className="text-red-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-white">
                          Report #{report.id.slice(-6)}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {new Date(report.timestamp).toLocaleString()} · {report.messages.length} messages
                        </p>
                      </div>
                    </div>
                    {expandedReport === report.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {/* Expanded Messages */}
                  {expandedReport === report.id && (
                    <div className="border-t border-white/5 p-3 sm:p-4 space-y-2 bg-black/20">
                      <div className="flex flex-col gap-4">
                        <div className="flex gap-4 text-[10px] text-gray-500">
                          <span>Reporter: <span className="text-anime-accent">{report.reporterId}</span></span>
                          <span>Reported: <span className="text-red-400 font-bold">{report.reportedId}</span></span>
                        </div>
                        
                        {/* Admin Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              if (confirm(`Kick ${report.reportedId}?`)) {
                                fetch(`${API_BASE}/admin/kick?key=${encodeURIComponent(adminKey)}`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ socketId: report.reportedId, reason: 'Kicked by admin review' })
                                }).then(() => alert('Kicked!'));
                              }
                            }}
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Kick User
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Permanently BAN ${report.reportedId}?`)) {
                                fetch(`${API_BASE}/admin/ban?key=${encodeURIComponent(adminKey)}`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ socketId: report.reportedId, reason: 'Banned by admin review' })
                                }).then(() => alert('Banned!'));
                              }
                            }}
                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/30 rounded text-[10px] font-bold cursor-pointer transition-colors"
                          >
                            Permanent Ban
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        {report.messages.map((msg, i) => (
                          <div
                            key={i}
                            className={`flex gap-2 text-xs ${
                              msg.senderId === report.reportedId ? 'text-red-300' : 'text-gray-300'
                            }`}
                          >
                            <span className={`font-semibold flex-shrink-0 ${
                              msg.senderId === report.reportedId ? 'text-red-400' : 'text-anime-accent'
                            }`}>
                              {msg.nickname}:
                            </span>
                            <span className="break-all">{msg.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

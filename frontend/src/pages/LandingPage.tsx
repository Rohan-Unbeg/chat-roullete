import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Sparkles, MessageSquare, Clock, Zap, Shield, Users, Share2 } from "lucide-react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (window.location.hostname === "localhost" ? "http://localhost:3001" : window.location.origin);

// Kanji characters for the rain effect
const KANJI_CHARS = ["友", "話", "出会い", "アニメ", "絆", "夢", "光", "戦", "心", "魂", "力", "愛"];

export default function LandingPage() {
  const [nickname, setNickname] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  
  // LAUNCH CONFIG
  const LAUNCH_DATE = new Date(2026, 3, 26, 20, 0, 0); 
  const [searchParams] = useSearchParams();
  const isAdmin = searchParams.get("admin") === "true";
  
  const [isLaunched, setIsLaunched] = useState(isAdmin);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const navigate = useNavigate();

  const [onlineUsers, setOnlineUsers] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  // Countdown Logic
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = LAUNCH_DATE.getTime() - now.getTime();

      if (diff <= 0) {
        if (!isLaunched && !isAdmin) {
          // Play launch sound!
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2861/2861-preview.mp3");
          audio.volume = 0.5;
          audio.play().catch(() => {});
        }
        setIsLaunched(true);
        clearInterval(timer);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  useEffect(() => {
    // Get live online users count
    const socket = io(SOCKET_URL);
    socket.on("online_users_update", (count: number) => {
      setOnlineUsers(count);
    });

    // Fetch actual lifetime matches from server
    fetch(`${import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'}/admin/stats`)
      .then(res => res.json())
      .then(data => {
        if (data.matchesToday) setTotalMatches(data.matchesToday + 120); // Add a small base for hype
      })
      .catch(() => setTotalMatches(124));

    return () => { socket.disconnect(); };
  }, []);


  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      navigate(`/chat?nickname=${encodeURIComponent(nickname.trim())}`);
    }
  };



  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Kanji Rain Background */}
      <div className="kanji-rain">
        {KANJI_CHARS.map((char, i) => (
          <span
            key={i}
            className="kanji-char"
            style={{
              left: `${(i / KANJI_CHARS.length) * 100}%`,
              animationDuration: `${10 + Math.random() * 8}s`,
              animationDelay: `${Math.random() * 10}s`,
              fontSize: `${1 + Math.random() * 1.5}rem`,
            }}
          >
            {char}
          </span>
        ))}
      </div>

      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={`particle-${i}`}
          className="particle"
          style={{
            left: `${15 + Math.random() * 70}%`,
            bottom: `${Math.random() * 40}%`,
            animationDelay: `${i * 1.5}s`,
            animationDuration: `${6 + Math.random() * 4}s`,
            background: i % 2 === 0 ? '#ff007f' : '#00f0ff',
            width: `${3 + Math.random() * 4}px`,
            height: `${3 + Math.random() * 4}px`,
          }}
        />
      ))}

      {/* Background Blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] rounded-full bg-anime-secondary opacity-15 blur-[140px] animate-glow-pulse" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full bg-anime-primary opacity-15 blur-[140px] animate-glow-pulse" style={{ animationDelay: '1s' }} />

      <div className="z-10 w-full max-w-2xl text-center flex flex-col items-center">
        {/* Online Users Badge */}
        {onlineUsers > 0 && (
          <div className="animate-fade-in-up flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-anime-accent text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <Users size={14} />
            <span>{onlineUsers} weebs online right now</span>
          </div>
        )}

        {/* Badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-panel text-anime-accent text-sm font-semibold mb-8" style={{ animationDelay: '0.1s' }}>
          <Sparkles size={16} className="text-anime-primary" />
          <span>The safest way to meet fellow weebs</span>
          <Sparkles size={16} className="text-anime-accent" />
        </div>

        {/* Hero Title */}
        <div className="animate-hero-entrance">
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-2 tracking-tight text-white font-anime">
            Anime{" "}
            <span className="neon-text text-anime-primary">Roulette</span>
          </h1>

          <div className="flex flex-col items-center justify-center gap-4 mb-8">
            <p className="text-gray-400 max-w-lg mx-auto text-sm sm:text-base px-4">
              Connect with fellow anime fans instantly. Anonymous, fun, and exactly 5 minutes of chaos.
            </p>
            <div className="px-4 py-1.5 bg-anime-accent/5 border border-anime-accent/20 rounded-full">
              <span className="text-anime-accent text-xs font-bold uppercase tracking-widest">
                ✦ {totalMatches.toLocaleString()} Matches Summoned ✦
              </span>
            </div>
          </div>


          <p className="text-sm sm:text-lg md:text-xl text-anime-accent/60 font-anime tracking-widest mb-4 sm:mb-6">
            アニメルーレット
          </p>
        </div>
        
        <p className="animate-fade-in-up text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-12 max-w-lg mx-auto leading-relaxed" style={{ animationDelay: '0.3s' }}>
          5-minute text chats with random strangers.{" "}
          <span className="text-anime-primary font-semibold">No camera.</span>{" "}
          <span className="text-anime-accent font-semibold">No cringe.</span>{" "}
          Just pure anime vibes.
        </p>

        {/* Mascot Image */}
        <div className="animate-fade-in-up mb-6 sm:mb-10 relative" style={{ animationDelay: '0.4s' }}>
          <div className="absolute inset-0 bg-anime-primary/20 rounded-full blur-[60px]" />
          <img
            src="/mascot.png"
            alt="Anime Roulette Mascot"
            className="relative w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 object-contain mx-auto animate-float drop-shadow-[0_0_30px_rgba(255,0,127,0.3)]"
          />
        </div>

        {/* Feature Cards */}
        <div className="animate-fade-in-up grid grid-cols-3 gap-2 sm:gap-4 mb-8 sm:mb-12 w-full max-w-lg" style={{ animationDelay: '0.5s' }}>
          <div className="tilt-card glass-panel rounded-xl p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2">
            <MessageSquare size={18} className="sm:w-[22px] sm:h-[22px] text-anime-primary" />
            <span className="text-[10px] sm:text-xs font-semibold text-gray-300">Text Only</span>
          </div>
          <div className="tilt-card glass-panel rounded-xl p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2">
            <Clock size={18} className="sm:w-[22px] sm:h-[22px] text-anime-accent" />
            <span className="text-[10px] sm:text-xs font-semibold text-gray-300">5 Min Timer</span>
          </div>
          <div className="tilt-card glass-panel rounded-xl p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2">
            <Shield size={18} className="sm:w-[22px] sm:h-[22px] text-anime-violet" />
            <span className="text-[10px] sm:text-xs font-semibold text-gray-300">Anonymous</span>
          </div>
        </div>

        {/* Entry Form */}
        {!isLaunched ? (
          <div className="animate-fade-in-up mb-8 w-full max-w-md" style={{ animationDelay: '0.6s' }}>
            <div className="glass-panel rounded-2xl p-6 sm:p-8 text-center border border-anime-primary/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-anime-primary/5 group-hover:bg-anime-primary/10 transition-colors" />
              <p className="text-anime-accent text-xs font-black uppercase tracking-[0.3em] mb-6 relative z-10">
                Matchmaking Portal Opens In:
              </p>
              <div className="flex gap-4 justify-center items-center font-mono relative z-10">
                <div className="flex flex-col">
                  <span className="text-4xl sm:text-5xl font-black text-white">{timeLeft.hours.toString().padStart(2, '0')}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Hrs</span>
                </div>
                <span className="text-3xl text-anime-primary animate-pulse">:</span>
                <div className="flex flex-col">
                  <span className="text-4xl sm:text-5xl font-black text-white">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Min</span>
                </div>
                <span className="text-3xl text-anime-primary animate-pulse">:</span>
                <div className="flex flex-col">
                  <span className="text-4xl sm:text-5xl font-black text-white">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Sec</span>
                </div>
              </div>
              <p className="mt-6 text-gray-400 text-xs relative z-10 leading-relaxed mb-6">
                Be here when the timer hits zero.<br />
                <span className="text-anime-primary font-bold">First 50 matches get a custom badge!</span>
              </p>
              
              <button 
                onClick={() => {
                  navigator.share?.({
                    title: 'Anime Roulette Launch',
                    text: 'Join me for the big launch of Anime Roulette! 5-minute anonymous chats for weebs.',
                    url: window.location.origin
                  }).catch(() => {
                    navigator.clipboard.writeText(window.location.origin);
                    alert("Link copied! Share it with your squad!");
                  });
                }}
                className="relative z-10 px-6 py-3 bg-anime-primary/20 border border-anime-primary/40 rounded-xl text-anime-primary text-xs font-bold uppercase tracking-widest hover:bg-anime-primary/30 transition-all flex items-center gap-2 mx-auto"
              >
                <Share2 size={14} />
                Call for Backup
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleJoin}
            className="animate-fade-in-up w-full max-w-md rotating-border"
            style={{ animationDelay: '0.6s' }}
          >
          <div className="relative glass-panel rounded-xl p-2 flex flex-col sm:flex-row gap-2">
            <input
              id="nickname-input"
              type="text"
              required
              maxLength={20}
              placeholder="Enter your nickname..."
              className="flex-1 bg-transparent border-none outline-none px-5 py-3.5 text-white placeholder-gray-500 focus:ring-0 font-medium text-lg"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <button
              id="start-chatting-btn"
              type="submit"
              className="anime-btn py-3.5 px-8 rounded-lg text-base font-bold whitespace-nowrap flex items-center gap-2 justify-center"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <Zap size={18} className={isHovered ? 'animate-shake' : ''} />
              Start Chatting
            </button>
          </div>
        </form>
      )}
        
        <p className="animate-fade-in-up mt-8 text-xs text-gray-500/70 max-w-sm text-center" style={{ animationDelay: '0.7s' }}>
          ⚡ Please be respectful. Toxic behavior will result in a ban.
          <br />
          <span className="text-anime-primary/40">No personal info. Stay safe. Have fun.</span>
        </p>
        <p className="text-gray-600 text-[10px] mt-3">
          🔒 Chats are anonymous &amp; not stored · By joining you agree to our{" "}
          <a href="/terms" className="text-gray-500 hover:text-anime-accent transition-colors underline">Terms</a>
          {" & "}
          <a href="/privacy" className="text-gray-500 hover:text-anime-accent transition-colors underline">Privacy Policy</a>
        </p>
      </div>
    </main>
  );
}

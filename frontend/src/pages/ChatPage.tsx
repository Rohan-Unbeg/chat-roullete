import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { Send, SkipForward, Users, Clock, Flag, X, Check, Volume2, VolumeX } from "lucide-react";
import { soundManager } from "../utils/soundEffects";


// For local dev use 3001, for prod use env var
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (window.location.hostname === "localhost" ? "http://localhost:3001" : window.location.origin);

// Avatar assignments — CSS emoji avatars for zero-dependency randomness
const AVATAR_EMOJIS = ["⚔️", "🌸", "🔮", "🐱", "🗡️", "🎧", "🦊", "💀", "🌙", "🔥"];

const SEARCH_STATUSES = [
  "Scanning Shibuya District...",
  "Filtering through Akihabara...",
  "Checking Neo Tokyo servers...",
  "Searching Isekai portals...",
  "Locating fellow weebs...",
  "Synchronizing Soul Resonance...",
  "Analyzing power levels...",
  "Contacting the Hidden Leaf...",
  "Summoning potential partners..."
];

// Anime-vibe placeholder prompts that cycle in the input
const PLACEHOLDER_PROMPTS = [
  "What's your favorite anime?",
  "Sub or dub? Choose wisely...",
  "Top 3 waifus/husbandos, go!",
  "What anime made you cry?",
  "Hot take: best anime studio?",
  "Currently watching anything?",
  "Recommend me something dark...",
  "Shonen or seinen?",
  "Best anime fight scene ever?",
  "Manga or anime, which is better?",
];

// Weeb-flavored quotes for the searching screen
const SEARCHING_QUOTES = [
  "\"The world isn't perfect. But it's there for us, trying the best it can.\"",
  "\"If you don't take risks, you can't create a future.\"",
  "\"People's dreams... never end!\"",
  "\"A lesson without pain is meaningless.\"",
  "\"The only thing we're allowed to do is believe.\"",
  "\"Knowing what it feels to be in pain, is exactly why we try to be kind.\"",
  "\"I'll leave tomorrow's problems to tomorrow's me.\"",
  "\"Sometimes, the things that matter the most are right in front of you.\"",
];

interface Message {
  id: string;
  senderId: string;
  nickname: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

export default function ChatPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nickname = searchParams.get("nickname");

  const [socket, setSocket] = useState<Socket | null>(null);

  const [status, setStatus] = useState<"connecting" | "searching" | "matched">("connecting");
  const [onlineUsers, setOnlineUsers] = useState<number>(0);
  const [partner, setPartner] = useState<{ nickname: string; id: string } | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState<number>(300);
  const [showMatchFlash, setShowMatchFlash] = useState(false);
  const [partnerAvatar, setPartnerAvatar] = useState("⚔️");
  const [myAvatar, setMyAvatar] = useState("🌸");
  const [currentQuote, setCurrentQuote] = useState(0);
  const [currentStatusIdx, setCurrentStatusIdx] = useState(0);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // New feature states
  const [reported, setReported] = useState(false);
  const [showExtendPrompt, setShowExtendPrompt] = useState(false);
  const [partnerWantsExtend, setPartnerWantsExtend] = useState(false);
  const [extendVoted, setExtendVoted] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.isMuted());


  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cycle quotes during searching
  useEffect(() => {
    if (status === "searching") {
      const interval = setInterval(() => {
        setCurrentQuote((prev) => (prev + 1) % SEARCHING_QUOTES.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Cycle search statuses
  useEffect(() => {
    if (status === "searching") {
      const interval = setInterval(() => {
        setCurrentStatusIdx((prev) => (prev + 1) % SEARCH_STATUSES.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Cycle placeholder prompts
  useEffect(() => {
    if (status === "matched") {
      const interval = setInterval(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_PROMPTS.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Assign random avatars on match
  const assignPartnerAvatar = useCallback(() => {
    const shuffled = [...AVATAR_EMOJIS].sort(() => Math.random() - 0.5);
    setMyAvatar(shuffled[0]);
    setPartnerAvatar(shuffled[1]);
  }, []);


  useEffect(() => {
    if (!nickname) {
      navigate("/");
      return;
    }

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setStatus("searching");
      newSocket.emit("join_queue", { nickname });
    });

    newSocket.on("online_users_update", (count: number) => {
      setOnlineUsers(count);
    });

    newSocket.on("match_found", (data: { roomId: string; partnerNickname: string; partnerId: string }) => {
      setRoomId(data.roomId);
      setPartner({ nickname: data.partnerNickname, id: data.partnerId });
      setStatus("matched");
      setReported(false);
      setShowExtendPrompt(false);
      setExtendVoted(false);
      setPartnerWantsExtend(false);
      assignPartnerAvatar();
      soundManager.play('match');

      // Trigger match flash
      setShowMatchFlash(true);
      setTimeout(() => setShowMatchFlash(false), 800);

      setMessages([{
        id: "sys-match",
        senderId: "system",
        nickname: "System",
        text: `⚔️ A new challenger has appeared! You matched with ${data.partnerNickname}! ⚔️`,
        timestamp: new Date().toISOString(),
        isMe: false
      }]);
    });

    newSocket.on("receive_message", (data: { senderId: string; nickname: string; message: string; timestamp: string }) => {
      setMessages((prev) => [...prev, {
        id: Math.random().toString(36),
        senderId: data.senderId,
        nickname: data.nickname,
        text: data.message,
        timestamp: data.timestamp,
        isMe: false
      }]);
      soundManager.play('message');
    });


    // Content filter: message blocked
    newSocket.on("message_blocked", (data: { reason: string }) => {
      setMessages((prev) => [...prev, {
        id: `sys-blocked-${Date.now()}`,
        senderId: "system",
        nickname: "System",
        text: `⚠️ Message blocked: ${data.reason}. Keep it clean, weeb!`,
        timestamp: new Date().toISOString(),
        isMe: false
      }]);
    });

    // Content filter: kicked for violations
    newSocket.on("kicked_for_violations", () => {
      setMessages((prev) => [...prev, {
        id: "sys-kicked",
        senderId: "system",
        nickname: "System",
        text: "🚫 You've been kicked for repeated violations.",
        timestamp: new Date().toISOString(),
        isMe: false
      }]);
      setTimeout(() => navigate("/"), 3000);
    });

    // Extend chat: offer
    newSocket.on("extend_offer", () => {
      setShowExtendPrompt(true);
      setExtendVoted(false);
      setPartnerWantsExtend(false);
      soundManager.play('alert');
    });


    // Extend chat: partner voted yes
    newSocket.on("partner_wants_extend", () => {
      setPartnerWantsExtend(true);
    });

    // Extend chat: extended successfully
    newSocket.on("chat_extended", (data: { newTime: number }) => {
      setShowExtendPrompt(false);
      setExtendVoted(false);
      setPartnerWantsExtend(false);
      setTimeLeft(data.newTime);
      setMessages((prev) => [...prev, {
        id: `sys-extended-${Date.now()}`,
        senderId: "system",
        nickname: "System",
        text: "⏰ Chat extended! You got 5 more minutes! ⏰",
        timestamp: new Date().toISOString(),
        isMe: false
      }]);
    });

    // Report confirmed
    newSocket.on("report_confirmed", () => {
      setReported(true);
    });

    newSocket.on("timer_update", (time: number) => {
      setTimeLeft(time);
    });

    newSocket.on("partner_left", () => {
      setShowExtendPrompt(false);
      setMessages((prev) => [...prev, {
        id: "sys-left",
        senderId: "system",
        nickname: "System",
        text: "Your partner left the chat.",
        timestamp: new Date().toISOString(),
        isMe: false
      }]);
      setTimeout(() => {
        handleNext(newSocket);
      }, 2000);
    });

    newSocket.on("chat_ended", (reason: string) => {
      setShowExtendPrompt(false);
      setMessages((prev) => [...prev, {
        id: "sys-end",
        senderId: "system",
        nickname: "System",
        text: reason,
        timestamp: new Date().toISOString(),
        isMe: false
      }]);
      setTimeout(() => {
        handleNext(newSocket);
      }, 3000);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [nickname, navigate, assignPartnerAvatar]);


  const handleNext = (currentSocket = socket) => {
    if (!currentSocket) return;
    if (roomId) {
      currentSocket.emit("leave_chat", roomId);
    }
    setStatus("searching");
    setPartner(null);
    setRoomId(null);
    setMessages([]);
    setTimeLeft(300);
    setReported(false);
    setShowExtendPrompt(false);
    setExtendVoted(false);
    setPartnerWantsExtend(false);
    currentSocket.emit("join_queue", { nickname });
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket || !roomId) return;

    const messageData = {
      room: roomId,
      message: input.trim(),
      nickname
    };

    socket.emit("send_message", messageData);
    
    setMessages((prev) => [...prev, {
      id: Math.random().toString(36),
      senderId: socket.id || "me",
      nickname: nickname || "Me",
      text: input.trim(),
      timestamp: new Date().toISOString(),
      isMe: true
    }]);
    
    setInput("");
  };

  const handleReport = () => {
    if (!socket || !roomId || reported) return;
    socket.emit("report_user", { roomId });
  };

  const handleExtendVote = (accept: boolean) => {
    if (!socket || !roomId) return;
    if (accept) {
      socket.emit("extend_vote", roomId);
      setExtendVoted(true);
    } else {
      socket.emit("extend_decline", roomId);
      setShowExtendPrompt(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isCriticalTime = timeLeft < 60 && timeLeft > 0;

  if (!nickname) return null;

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden text-white relative bg-[#0a0618]">
      {/* Header — Rendered FIRST to ensure visibility */}
      <header className="px-3 sm:px-6 py-2.5 sm:py-3 flex justify-between items-center z-[100] bg-[#0d0921] border-b border-white/10 min-h-[60px] sm:min-h-[70px] flex-shrink-0 relative">
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="text-base sm:text-xl font-bold text-white tracking-tight font-anime">
            Anime<span className="neon-text text-anime-primary ml-1">R</span>
          </h1>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full text-xs text-anime-accent font-medium">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            <Users size={12} />
            {onlineUsers} Online
          </div>
        </div>

        {/* Timer */}
        {status === "matched" && (
          <div className={`relative flex items-center gap-1.5 sm:gap-2 font-mono text-base sm:text-lg font-bold px-2 sm:px-3 py-1 rounded-lg ${
            isCriticalTime
              ? 'text-red-400 timer-critical bg-red-500/10'
              : 'text-white'
          }`}>
            <Clock size={16} className={`sm:w-[18px] sm:h-[18px] ${isCriticalTime ? 'animate-pulse' : ''}`} />
            <span>{formatTime(timeLeft)}</span>
            {isCriticalTime && (
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-1 hidden sm:inline animate-pulse">
                Final
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mute Toggle */}
          <button
            onClick={() => setIsMuted(soundManager.toggleMute())}
            className="p-1.5 sm:p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Report Button */}

          {status === "matched" && (
            <button
              id="report-btn"
              onClick={handleReport}
              disabled={reported}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs font-bold border transition-all ${
                reported
                  ? 'bg-green-500/20 border-green-500/40 text-green-400 cursor-default'
                  : 'bg-red-500/10 border-red-500/40 hover:bg-red-500/30 hover:border-red-500/60 text-red-500 cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.1)]'
              }`}
              title={reported ? "Reported" : "Report user"}
            >
              <Flag size={18} className={reported ? "text-green-400" : "text-red-500"} />
              <span className="hidden sm:inline ml-1">{reported ? "Reported" : "Report"}</span>
            </button>
          )}

          {/* Next Button */}
          <button
            id="next-btn"
            onClick={() => handleNext()}
            className="anime-btn flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold"
          >
            <SkipForward size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Next</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col px-3 sm:px-6 max-w-3xl mx-auto w-full min-h-0 z-10">
        {status !== "matched" ? (
          /* ===== SEARCHING STATE — SUMMONING CIRCLE ===== */
          <div className="flex-1 flex flex-col items-center justify-center px-2">
            {/* Summoning Circle */}
            <div className="summoning-circle mb-6 sm:mb-10 scale-75 sm:scale-100">
              <div className="summoning-ring" />
              <div className="summoning-ring" />
              <div className="summoning-ring" />
              <div className="summoning-core" />
              {/* Center Kanji */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl text-anime-primary/60 font-anime animate-pulse">召</span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white font-anime tracking-tighter">
                {status === "connecting" ? "Establishing Connection..." : "Matchmaking in Progress"}
              </h2>
              <div className="h-6 overflow-hidden">
                <p className="text-anime-primary font-anime text-sm sm:text-base tracking-widest animate-fade-in-up uppercase" key={currentStatusIdx}>
                  ✦ {SEARCH_STATUSES[currentStatusIdx]} ✦
                </p>
              </div>
            </div>

            <p className="text-gray-400 mb-6 sm:mb-8 flex items-center gap-2 text-sm">
              <Users size={14} className="text-anime-accent" />
              {onlineUsers} users online right now
            </p>


            {/* Cycling Anime Quote */}
            <div className="glass-panel rounded-xl px-4 sm:px-6 py-3 sm:py-4 max-w-sm sm:max-w-md text-center mx-4">
              <p className="text-gray-300/80 text-xs sm:text-sm italic transition-opacity duration-500" key={currentQuote}>
                {SEARCHING_QUOTES[currentQuote]}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Partner Info Bar Removed to avoid redundancy with system message */}

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden pr-1 sm:pr-2 flex flex-col gap-2 sm:gap-3 min-h-0 pt-10 pb-24">
              {messages.map((msg, index) => {
                if (msg.senderId === "system") {
                  return (
                    <div key={msg.id} className="flex justify-center my-4 animate-fade-in-up w-full px-2">
                      <div className="anime-system-msg w-full max-w-md text-center">
                        <span className="px-2">{msg.text}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-1.5 sm:gap-2 w-full ${
                      msg.isMe ? 'justify-end animate-slide-in-right' : 'justify-start animate-slide-in-left'
                    }`}
                    style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
                  >
                    {/* Partner Avatar */}
                    {!msg.isMe && (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/5 border border-anime-accent/20 flex items-center justify-center text-xs sm:text-sm flex-shrink-0 mb-1">
                        {partnerAvatar}
                      </div>
                    )}

                    <div className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'} max-w-[80%] sm:max-w-[75%]`}>
                      <span className="text-[9px] sm:text-[10px] text-gray-500 mb-0.5 sm:mb-1 px-1 font-medium tracking-wide">
                        {msg.isMe ? 'You' : msg.nickname}
                      </span>
                      <div className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm leading-relaxed ${
                        msg.isMe 
                          ? 'manga-bubble-me' 
                          : 'manga-bubble-partner'
                      }`}>
                        {msg.text}
                      </div>
                    </div>

                    {/* My Avatar */}
                    {msg.isMe && (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-anime-primary/10 border border-anime-primary/20 flex items-center justify-center text-xs sm:text-sm flex-shrink-0 mb-1">
                        {myAvatar}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </>
        )}
      </main>

      {/* Input Form — FIXED TO BOTTOM */}
      {status === "matched" && (
        <div className="fixed bottom-0 left-0 right-0 z-20 p-2 sm:p-4 bg-gradient-to-t from-[#0a0618] via-[#0a0618]/90 to-transparent pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <form onSubmit={sendMessage} className="max-w-4xl mx-auto w-full rotating-border">
            <div className="relative flex items-center gap-1.5 sm:gap-2 glass-panel p-1.5 sm:p-2 rounded-xl">
              <input
                id="chat-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={PLACEHOLDER_PROMPTS[placeholderIndex]}
                className="flex-1 bg-transparent border-none outline-none text-white px-3 sm:px-4 py-2 sm:py-2.5 placeholder-gray-500/60 text-xs sm:text-sm font-medium"
                autoFocus
              />
              <button
                id="send-btn"
                type="submit"
                disabled={!input.trim()}
                className="anime-btn p-2.5 sm:p-3 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
              >
                <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

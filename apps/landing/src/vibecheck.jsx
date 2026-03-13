import { useState, useEffect, useRef, useCallback } from "react";

const VENUES = [
  {
    id: 1,
    name: "Neon Serpent",
    type: "Nightclub",
    location: "Downtown Arts District",
    rating: 4.7,
    vibeScore: 87,
    currentCapacity: 78,
    maxCapacity: 100,
    tags: ["Electronic", "Dancing", "Late Night"],
    scenes: [
      { id: "main", label: "Main Floor", color: "#ff2d55" },
      { id: "vip", label: "VIP Lounge", color: "#af52de" },
      { id: "rooftop", label: "Rooftop Bar", color: "#5ac8fa" },
    ],
    liveViewers: 234,
    musicGenre: "Deep House / Techno",
    dressCode: "Smart Casual",
    priceRange: "$$$",
    hours: "10PM – 4AM",
    description: "Underground electronic music venue with world-class sound system and immersive light installations.",
    coverCharge: "$20",
    drinks: ["Signature Cocktails", "Premium Spirits", "Craft Beer"],
    isLive: true,
    trend: "rising",
    lat: -33.961,
    lng: 25.619,
  },
  {
    id: 2,
    name: "Copper & Thyme",
    type: "Restaurant & Bar",
    location: "Waterfront Promenade",
    rating: 4.5,
    vibeScore: 72,
    currentCapacity: 55,
    maxCapacity: 100,
    tags: ["Jazz", "Fine Dining", "Cocktails"],
    scenes: [
      { id: "dining", label: "Dining Room", color: "#ff9f0a" },
      { id: "bar", label: "Cocktail Bar", color: "#30d158" },
      { id: "garden", label: "Garden Terrace", color: "#64d2ff" },
    ],
    liveViewers: 89,
    musicGenre: "Live Jazz / Soul",
    dressCode: "Business Casual",
    priceRange: "$$$$",
    hours: "6PM – 1AM",
    description: "Elegant jazz supper club with craft cocktails, farm-to-table cuisine, and nightly live performances.",
    coverCharge: "Free",
    drinks: ["Wine Selection", "Craft Cocktails", "Single Malt"],
    isLive: true,
    trend: "steady",
    lat: -33.963,
    lng: 25.625,
  },
  {
    id: 3,
    name: "BLKBOX",
    type: "Club",
    location: "Industrial Quarter",
    rating: 4.8,
    vibeScore: 94,
    currentCapacity: 91,
    maxCapacity: 100,
    tags: ["Hip-Hop", "R&B", "Hype"],
    scenes: [
      { id: "stage", label: "Main Stage", color: "#ff375f" },
      { id: "booth", label: "DJ Booth", color: "#bf5af2" },
      { id: "outside", label: "Smoking Area", color: "#ffd60a" },
    ],
    liveViewers: 512,
    musicGenre: "Hip-Hop / Afrobeats",
    dressCode: "Streetwear / No dress code",
    priceRange: "$$",
    hours: "11PM – 5AM",
    description: "Raw, stripped-back warehouse venue hosting the city's hottest DJs and MC nights. Pure energy.",
    coverCharge: "$15",
    drinks: ["Hennessy Specials", "Bucket Deals", "Energy Mixes"],
    isLive: true,
    trend: "rising",
    lat: -33.958,
    lng: 25.611,
  },
  {
    id: 4,
    name: "Driftwood",
    type: "Beach Bar",
    location: "Summerstrand Beach",
    rating: 4.3,
    vibeScore: 65,
    currentCapacity: 42,
    maxCapacity: 100,
    tags: ["Chill", "Sunset", "Tropical"],
    scenes: [
      { id: "deck", label: "Ocean Deck", color: "#5ac8fa" },
      { id: "firepit", label: "Fire Pit", color: "#ff9f0a" },
    ],
    liveViewers: 67,
    musicGenre: "Amapiano / Lounge",
    dressCode: "Beach Casual",
    priceRange: "$$",
    hours: "3PM – 12AM",
    description: "Barefoot beach bar with sunset views, bonfires, and the smoothest amapiano sets in the city.",
    coverCharge: "Free",
    drinks: ["Frozen Daiquiris", "Local Craft", "Rum Punch"],
    isLive: true,
    trend: "cooling",
    lat: -33.972,
    lng: 25.661,
  },
  {
    id: 5,
    name: "Velvet Room",
    type: "Lounge",
    location: "Richmond Hill",
    rating: 4.6,
    vibeScore: 58,
    currentCapacity: 35,
    maxCapacity: 100,
    tags: ["Intimate", "Acoustic", "Wine"],
    scenes: [
      { id: "stage", label: "Acoustic Stage", color: "#ff6482" },
      { id: "cellar", label: "Wine Cellar", color: "#8e5572" },
      { id: "balcony", label: "Balcony", color: "#a8dadc" },
    ],
    liveViewers: 41,
    musicGenre: "Acoustic / Indie",
    dressCode: "Come as you are",
    priceRange: "$$",
    hours: "5PM – 11PM",
    description: "Intimate listening room with exposed brick, candlelight, and the best up-and-coming acoustic acts.",
    coverCharge: "$5",
    drinks: ["Natural Wine", "Craft Beer", "Espresso Martini"],
    isLive: false,
    trend: "steady",
    lat: -33.960,
    lng: 25.623,
  },
  {
    id: 6,
    name: "PRISM",
    type: "Mega Club",
    location: "Boardwalk Casino Complex",
    rating: 4.4,
    vibeScore: 81,
    currentCapacity: 70,
    maxCapacity: 100,
    tags: ["EDM", "Laser Show", "Bottle Service"],
    scenes: [
      { id: "main", label: "Arena Floor", color: "#0a84ff" },
      { id: "skybox", label: "Skybox VIP", color: "#ffd60a" },
      { id: "ice", label: "Ice Bar", color: "#98e4ff" },
      { id: "outdoor", label: "Palm Court", color: "#30d158" },
    ],
    liveViewers: 378,
    musicGenre: "EDM / Progressive House",
    dressCode: "Smart / No sneakers",
    priceRange: "$$$$",
    hours: "9PM – 4AM",
    description: "Multi-room mega venue with world-class laser shows, CO2 cannons, and international headline DJs.",
    coverCharge: "$30",
    drinks: ["Bottle Service", "Premium Cocktails", "Champagne"],
    isLive: true,
    trend: "rising",
    lat: -33.978,
    lng: 25.652,
  },
];

// Simulated live chat messages
const CHAT_TEMPLATES = [
  "🔥 Energy is INSANE right now",
  "Just got here, vibes are immaculate",
  "DJ is going OFF 🎵",
  "Not too crowded yet, perfect time to come",
  "Dance floor is packed!! Love it",
  "The cocktails here are elite 🍸",
  "Dress code is strict tonight heads up",
  "Line outside is about 15 min",
  "Sound system hits different in person",
  "Chill vibes, perfect for a date night",
  "Security is super friendly tonight",
  "They just dropped Amapiano 🇿🇦🔥",
  "VIP section is worth it trust me",
  "Cover charge went up to $25 btw",
  "Best night out I've had in months",
  "Sunset from the terrace is unreal rn 🌅",
  "Kitchen closing soon, order food now!",
  "Live band is killing it 🎷",
  "Parking is full, take an Uber",
  "Happy hour still on for 30 more min",
];

const USERNAMES = [
  "NightOwl", "VibeHunter", "CityExplorer", "PartyStarter",
  "MidnightRider", "SocialButterfly", "UrbanNomad", "DanceAddict",
  "CocktailKing", "JazzCat", "BeachBum", "Wanderlust",
  "NeonDreamer", "SunsetChaser", "GrooveMaster", "CultureVulture",
];

// Fake waveform / audio visualizer data generator
function generateWaveform(length = 40) {
  return Array.from({ length }, () => Math.random() * 0.6 + 0.1);
}

// Capacity bar color
function capacityColor(pct) {
  if (pct > 85) return "#ff3b30";
  if (pct > 60) return "#ff9f0a";
  return "#30d158";
}

function vibeLabel(score) {
  if (score >= 90) return "🔥 ON FIRE";
  if (score >= 75) return "⚡ Electric";
  if (score >= 60) return "✨ Buzzing";
  if (score >= 40) return "🎵 Mellow";
  return "😴 Quiet";
}

function trendIcon(trend) {
  if (trend === "rising") return "📈";
  if (trend === "cooling") return "📉";
  return "➡️";
}

// --- Fake "Live Stream" Canvas Component ---
function LiveStreamCanvas({ venue, activeScene, style }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    const scene = venue.scenes.find((s) => s.id === activeScene) || venue.scenes[0];
    const baseColor = scene.color;

    // Parse hex to rgb
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);

    // Initialize particles
    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: 60 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 4 + 1,
        alpha: Math.random() * 0.5 + 0.2,
        pulse: Math.random() * Math.PI * 2,
      }));
    }

    let animId;
    const render = () => {
      frameRef.current++;
      const t = frameRef.current * 0.02;

      // Background gradient shifts
      const grad = ctx.createRadialGradient(
        W / 2 + Math.sin(t * 0.3) * 80,
        H / 2 + Math.cos(t * 0.2) * 60,
        50,
        W / 2,
        H / 2,
        W * 0.8
      );
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
      grad.addColorStop(0.5, `rgba(${Math.floor(r * 0.3)}, ${Math.floor(g * 0.3)}, ${Math.floor(b * 0.3)}, 0.8)`);
      grad.addColorStop(1, `rgba(10, 10, 15, 1)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Animated light beams
      const beamCount = venue.vibeScore > 80 ? 5 : 3;
      for (let i = 0; i < beamCount; i++) {
        const angle = t * 0.5 + (i * Math.PI * 2) / beamCount;
        const x1 = W / 2 + Math.cos(angle) * 20;
        const y1 = H * 0.1;
        const x2 = W / 2 + Math.cos(angle) * W * 0.6;
        const y2 = H;
        const beamGrad = ctx.createLinearGradient(x1, y1, x2, y2);
        beamGrad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.15 + Math.sin(t + i) * 0.1})`);
        beamGrad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.fillStyle = beamGrad;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2 - 40, y2);
        ctx.lineTo(x2 + 40, y2);
        ctx.closePath();
        ctx.fill();
      }

      // Floating particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.05;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        const flicker = Math.sin(p.pulse) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * flicker, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * flicker})`;
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3 * flicker, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * 0.1 * flicker})`;
        ctx.fill();
      });

      // Simulated crowd silhouettes at bottom
      ctx.fillStyle = `rgba(0, 0, 0, 0.6)`;
      for (let i = 0; i < 20; i++) {
        const cx = (i / 20) * W + Math.sin(t * 0.8 + i * 0.5) * 8;
        const cy = H - 20 + Math.sin(t * 1.2 + i * 0.7) * 5;
        const headR = 8 + Math.random() * 3;
        ctx.beginPath();
        ctx.arc(cx, cy - 25, headR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx - 10, cy - 18, 20, 30);
      }

      // Audio waveform at bottom
      const waveY = H - 6;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < W; i += 3) {
        const amp = Math.sin(i * 0.05 + t * 3) * 4 + Math.sin(i * 0.1 + t * 5) * 2;
        ctx.lineTo(i, waveY + amp * (venue.vibeScore / 100));
      }
      ctx.stroke();

      // LIVE badge glow
      const pulseAlpha = Math.sin(t * 2) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 45, 85, ${pulseAlpha})`;
      ctx.beginPath();
      ctx.arc(25, 25, 6, 0, Math.PI * 2);
      ctx.fill();

      // Noise / grain overlay
      const imageData = ctx.getImageData(0, 0, W, H);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 16) {
        const noise = (Math.random() - 0.5) * 15;
        data[i] += noise;
        data[i + 1] += noise;
        data[i + 2] += noise;
      }
      ctx.putImageData(imageData, 0, 0);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [venue, activeScene]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={360}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        borderRadius: "12px",
        ...style,
      }}
    />
  );
}

// --- Audio Visualizer Bar ---
function AudioVisualizer({ color, intensity = 0.5 }) {
  const [bars, setBars] = useState(() => generateWaveform(28));

  useEffect(() => {
    const iv = setInterval(() => {
      setBars((prev) =>
        prev.map((v) => {
          const target = Math.random() * intensity + 0.05;
          return v + (target - v) * 0.3;
        })
      );
    }, 120);
    return () => clearInterval(iv);
  }, [intensity]);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height: "28px" }}>
      {bars.map((v, i) => (
        <div
          key={i}
          style={{
            width: "3px",
            height: `${v * 100}%`,
            background: color,
            borderRadius: "2px",
            opacity: 0.8,
            transition: "height 0.12s ease",
          }}
        />
      ))}
    </div>
  );
}

// --- Main App ---
export default function VibeCheckApp() {
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [activeScene, setActiveScene] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [viewerCounts, setViewerCounts] = useState({});
  const [vibeScores, setVibeScores] = useState({});
  const [sortBy, setSortBy] = useState("vibe");
  const [showMobileNav, setShowMobileNav] = useState(false);

  // Initialize live data
  useEffect(() => {
    const counts = {};
    const scores = {};
    VENUES.forEach((v) => {
      counts[v.id] = v.liveViewers;
      scores[v.id] = v.vibeScore;
    });
    setViewerCounts(counts);
    setVibeScores(scores);
  }, []);

  // Simulate live viewer count fluctuation
  useEffect(() => {
    const iv = setInterval(() => {
      setViewerCounts((prev) => {
        const next = { ...prev };
        VENUES.forEach((v) => {
          const delta = Math.floor((Math.random() - 0.45) * 5);
          next[v.id] = Math.max(10, (next[v.id] || v.liveViewers) + delta);
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  // Simulate vibe score drift
  useEffect(() => {
    const iv = setInterval(() => {
      setVibeScores((prev) => {
        const next = { ...prev };
        VENUES.forEach((v) => {
          const delta = (Math.random() - 0.48) * 2;
          next[v.id] = Math.max(20, Math.min(99, (next[v.id] || v.vibeScore) + delta));
        });
        return next;
      });
    }, 5000);
    return () => clearInterval(iv);
  }, []);

  // Simulate incoming chat messages when a venue is selected
  useEffect(() => {
    if (!selectedVenue) return;
    const iv = setInterval(() => {
      const msg = CHAT_TEMPLATES[Math.floor(Math.random() * CHAT_TEMPLATES.length)];
      const user = USERNAMES[Math.floor(Math.random() * USERNAMES.length)];
      setChatMessages((prev) => [
        ...prev.slice(-30),
        { user, text: msg, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), id: Date.now() },
      ]);
    }, 2500 + Math.random() * 3000);
    return () => clearInterval(iv);
  }, [selectedVenue]);

  // Reset chat when venue changes
  useEffect(() => {
    setChatMessages([]);
    if (selectedVenue) {
      setActiveScene(selectedVenue.scenes[0].id);
    }
  }, [selectedVenue]);

  const filters = ["All", "Nightclub", "Restaurant & Bar", "Club", "Beach Bar", "Lounge", "Mega Club"];

  const filteredVenues = VENUES.filter((v) => {
    const matchesFilter = activeFilter === "All" || v.type === activeFilter;
    const matchesSearch =
      searchQuery === "" ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === "vibe") return (vibeScores[b.id] || b.vibeScore) - (vibeScores[a.id] || a.vibeScore);
    if (sortBy === "viewers") return (viewerCounts[b.id] || b.liveViewers) - (viewerCounts[a.id] || a.liveViewers);
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  const sendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { user: "You", text: chatInput.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), id: Date.now(), isOwn: true },
    ]);
    setChatInput("");
  };

  // ========== DETAIL VIEW ==========
  if (selectedVenue) {
    const venue = selectedVenue;
    const currentScene = venue.scenes.find((s) => s.id === activeScene) || venue.scenes[0];
    const score = Math.round(vibeScores[venue.id] || venue.vibeScore);
    const viewers = viewerCounts[venue.id] || venue.liveViewers;

    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
        {/* Top Bar */}
        <div style={{ display: "flex", alignItems: "center", padding: "16px 20px", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,10,15,0.95)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100 }}>
          <button onClick={() => setSelectedVenue(null)} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", borderRadius: "10px", padding: "8px 14px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
            ← Back
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "18px", letterSpacing: "-0.3px" }}>{venue.name}</div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "1px" }}>{venue.type} · {venue.location}</div>
          </div>
          {venue.isLive && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(255,45,85,0.15)", padding: "6px 12px", borderRadius: "20px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ff2d55", animation: "pulse 1.5s infinite" }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#ff2d55" }}>LIVE</span>
              <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>· {viewers} watching</span>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "0", minHeight: "calc(100vh - 60px)" }}>
          {/* Left: Stream + Info */}
          <div style={{ padding: "20px", overflowY: "auto" }}>
            {/* Live Stream */}
            <div style={{ position: "relative", borderRadius: "14px", overflow: "hidden", aspectRatio: "16/9", background: "#111", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <LiveStreamCanvas venue={venue} activeScene={activeScene} />
              {/* Scene overlay label */}
              <div style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", fontWeight: 600, color: currentScene.color, border: `1px solid ${currentScene.color}33` }}>
                📹 {currentScene.label}
              </div>
              {/* Vibe score overlay */}
              <div style={{ position: "absolute", bottom: "14px", left: "14px", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", borderRadius: "10px", padding: "8px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ fontSize: "22px", fontWeight: 800, color: currentScene.color }}>{score}</div>
                <div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px" }}>Vibe Score</div>
                  <div style={{ fontSize: "13px", fontWeight: 600 }}>{vibeLabel(score)}</div>
                </div>
              </div>
              {/* Audio visualizer overlay */}
              <div style={{ position: "absolute", bottom: "14px", right: "14px" }}>
                <AudioVisualizer color={currentScene.color} intensity={score / 100} />
              </div>
            </div>

            {/* Scene Selector */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
              {venue.scenes.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => setActiveScene(sc.id)}
                  style={{
                    background: activeScene === sc.id ? `${sc.color}22` : "rgba(255,255,255,0.04)",
                    border: activeScene === sc.id ? `1.5px solid ${sc.color}` : "1.5px solid rgba(255,255,255,0.08)",
                    color: activeScene === sc.id ? sc.color : "rgba(255,255,255,0.6)",
                    borderRadius: "10px",
                    padding: "10px 18px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    transition: "all 0.2s ease",
                  }}
                >
                  {sc.label}
                </button>
              ))}
            </div>

            {/* Venue Info Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              <InfoCard icon="🎵" label="Music" value={venue.musicGenre} />
              <InfoCard icon="👔" label="Dress Code" value={venue.dressCode} />
              <InfoCard icon="🎟️" label="Cover" value={venue.coverCharge} />
              <InfoCard icon="🕐" label="Hours" value={venue.hours} />
              <InfoCard icon="💰" label="Price Range" value={venue.priceRange} />
              <InfoCard icon="⭐" label="Rating" value={`${venue.rating} / 5`} />
            </div>

            {/* Capacity */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>Capacity</span>
                <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>{venue.currentCapacity}% full</span>
              </div>
              <div style={{ height: "8px", background: "rgba(255,255,255,0.06)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${venue.currentCapacity}%`, background: capacityColor(venue.currentCapacity), borderRadius: "4px", transition: "width 0.5s ease" }} />
              </div>
            </div>

            {/* Description */}
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", lineHeight: "1.6", color: "rgba(255,255,255,0.7)", margin: 0 }}>{venue.description}</p>
            </div>

            {/* Tags & Drinks */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
              {venue.tags.map((tag) => (
                <span key={tag} style={{ background: "rgba(255,255,255,0.06)", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
                  {tag}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {venue.drinks.map((d) => (
                <span key={d} style={{ background: `${currentScene.color}11`, border: `1px solid ${currentScene.color}33`, borderRadius: "6px", padding: "4px 10px", fontSize: "12px", color: currentScene.color }}>
                  🍹 {d}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Live Chat */}
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.015)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontWeight: 700, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              💬 Live Chat
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", fontWeight: 400 }}>{chatMessages.length} messages</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {chatMessages.length === 0 && (
                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: "13px", marginTop: "40px" }}>
                  Chat messages will appear here...
                </div>
              )}
              {chatMessages.map((msg) => (
                <div key={msg.id} style={{ animation: "fadeSlideIn 0.3s ease" }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "8px",
                      background: msg.isOwn ? currentScene.color : `hsl(${(msg.user.charCodeAt(0) * 47) % 360}, 60%, 45%)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px", fontWeight: 700, flexShrink: 0,
                    }}>
                      {msg.user[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "baseline" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: msg.isOwn ? currentScene.color : "rgba(255,255,255,0.8)" }}>{msg.user}</span>
                        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.25)" }}>{msg.time}</span>
                      </div>
                      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", margin: "2px 0 0", lineHeight: "1.4" }}>{msg.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "8px" }}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="Say something..."
                style={{
                  flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px", padding: "10px 14px", color: "#fff", fontSize: "13px", outline: "none",
                }}
              />
              <button
                onClick={sendChat}
                style={{
                  background: currentScene.color, border: "none", borderRadius: "10px",
                  padding: "10px 16px", color: "#fff", fontWeight: 700, cursor: "pointer",
                  fontSize: "13px",
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
          @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800&display=swap');
        `}</style>
      </div>
    );
  }

  // ========== BROWSE VIEW ==========
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#fff", fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 0", background: "linear-gradient(180deg, rgba(255,45,85,0.06) 0%, transparent 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", background: "linear-gradient(135deg, #ff2d55, #af52de, #5ac8fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                VIBECHECK
              </span>
              <span style={{ fontSize: "10px", fontWeight: 700, background: "rgba(255,45,85,0.2)", color: "#ff2d55", padding: "3px 8px", borderRadius: "4px", letterSpacing: "1px" }}>LIVE</span>
            </div>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", margin: 0 }}>See the vibe before you arrive</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#30d158" }} />
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
              {VENUES.filter(v => v.isLive).length} venues live now
            </span>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontSize: "16px", opacity: 0.4 }}>🔍</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search venues, locations, vibes..."
            style={{
              width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px",
              padding: "12px 14px 12px 42px", color: "#fff", fontSize: "14px", outline: "none",
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "16px", scrollbarWidth: "none" }}>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                background: activeFilter === f ? "rgba(255,45,85,0.15)" : "rgba(255,255,255,0.04)",
                border: activeFilter === f ? "1.5px solid rgba(255,45,85,0.5)" : "1.5px solid rgba(255,255,255,0.08)",
                color: activeFilter === f ? "#ff2d55" : "rgba(255,255,255,0.5)",
                borderRadius: "20px", padding: "7px 16px",
                fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Sort Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 24px 16px" }}>
        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{filteredVenues.length} venues found</span>
        <div style={{ display: "flex", gap: "4px" }}>
          {[
            { key: "vibe", label: "🔥 Vibe" },
            { key: "viewers", label: "👁 Viewers" },
            { key: "rating", label: "⭐ Rating" },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setSortBy(s.key)}
              style={{
                background: sortBy === s.key ? "rgba(255,255,255,0.1)" : "transparent",
                border: "none", borderRadius: "6px", padding: "4px 10px",
                color: sortBy === s.key ? "#fff" : "rgba(255,255,255,0.35)",
                fontSize: "11px", cursor: "pointer", fontWeight: sortBy === s.key ? 600 : 400,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Venue Cards */}
      <div style={{ padding: "0 24px 40px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
        {filteredVenues.map((venue) => {
          const score = Math.round(vibeScores[venue.id] || venue.vibeScore);
          const viewers = viewerCounts[venue.id] || venue.liveViewers;
          const mainColor = venue.scenes[0].color;
          return (
            <div
              key={venue.id}
              onClick={() => setSelectedVenue(venue)}
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "16px",
                overflow: "hidden",
                cursor: "pointer",
                transition: "all 0.25s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.borderColor = `${mainColor}44`;
                e.currentTarget.style.boxShadow = `0 8px 32px ${mainColor}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Card Header - Mini stream preview */}
              <div style={{ height: "140px", position: "relative", overflow: "hidden", background: `linear-gradient(135deg, ${mainColor}22, #0a0a0f)` }}>
                <LiveStreamCanvas venue={venue} activeScene={venue.scenes[0].id} />
                {/* Overlay badges */}
                <div style={{ position: "absolute", top: "10px", left: "10px", display: "flex", gap: "6px" }}>
                  {venue.isLive ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", borderRadius: "6px", padding: "4px 8px" }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ff2d55", animation: "pulse 1.5s infinite" }} />
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#ff2d55" }}>LIVE</span>
                    </div>
                  ) : (
                    <div style={{ background: "rgba(0,0,0,0.7)", borderRadius: "6px", padding: "4px 8px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>OFFLINE</span>
                    </div>
                  )}
                  <div style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", borderRadius: "6px", padding: "4px 8px", fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>
                    👁 {viewers}
                  </div>
                </div>
                <div style={{ position: "absolute", top: "10px", right: "10px", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", borderRadius: "8px", padding: "4px 10px" }}>
                  <span style={{ fontSize: "16px", fontWeight: 800, color: mainColor }}>{score}</span>
                  <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginLeft: "4px" }}>{trendIcon(venue.trend)}</span>
                </div>
                {/* Audio vis */}
                <div style={{ position: "absolute", bottom: "8px", left: "10px", right: "10px" }}>
                  <AudioVisualizer color={mainColor} intensity={score / 120} />
                </div>
              </div>

              {/* Card Body */}
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "16px", letterSpacing: "-0.2px", marginBottom: "2px" }}>{venue.name}</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{venue.type} · {venue.location}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                    <span style={{ color: "#ffd60a", fontSize: "12px" }}>★</span>
                    <span style={{ fontSize: "12px", fontWeight: 600 }}>{venue.rating}</span>
                  </div>
                </div>

                {/* Capacity bar */}
                <div style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>Capacity</span>
                    <span style={{ fontSize: "11px", color: capacityColor(venue.currentCapacity), fontWeight: 600 }}>{venue.currentCapacity}%</span>
                  </div>
                  <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${venue.currentCapacity}%`, background: capacityColor(venue.currentCapacity), borderRadius: "2px" }} />
                  </div>
                </div>

                {/* Tags */}
                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "10px" }}>
                  {venue.tags.map((tag) => (
                    <span key={tag} style={{ background: "rgba(255,255,255,0.05)", borderRadius: "4px", padding: "2px 8px", fontSize: "10px", color: "rgba(255,255,255,0.45)" }}>
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Scenes preview */}
                <div style={{ display: "flex", gap: "4px" }}>
                  {venue.scenes.map((sc) => (
                    <div
                      key={sc.id}
                      style={{
                        flex: 1, height: "3px", borderRadius: "2px",
                        background: sc.color, opacity: 0.5,
                      }}
                    />
                  ))}
                </div>
                <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                  {venue.scenes.map((sc) => (
                    <span key={sc.id} style={{ fontSize: "9px", color: "rgba(255,255,255,0.25)" }}>{sc.label}</span>
                  ))}
                </div>

                {/* Quick info */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>🎵 {venue.musicGenre.split("/")[0].trim()}</span>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>🕐 {venue.hours}</span>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>{venue.priceRange}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800&display=swap');
        * { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
      `}</style>
    </div>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: "14px", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

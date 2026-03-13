import { useState, useEffect, useRef } from "react";

const VENUES = [
  {
    id: 1, name: "Neon Pulse", type: "Nightclub",
    tagline: "Electronic beats, electric nights",
    location: "Downtown East, 42 Volt St", city: "Cape Town",
    rating: 4.7, vibeScore: 92, crowdLevel: "Packed",
    musicGenre: "House / Techno", coverCharge: "R120", hours: "10PM – 4AM",
    scenes: [
      { name: "Main Floor", viewers: 342, vibe: "🔥 On Fire" },
      { name: "VIP Lounge", viewers: 128, vibe: "✨ Exclusive" },
      { name: "Rooftop Bar", viewers: 256, vibe: "🌙 Chill" },
    ],
    tags: ["DJ Set", "Bottle Service", "Rooftop", "Late Night"],
    color: "#ff2d55",
    currentDJ: "DJ Zara", drinks: "Cocktails from R85", capacity: "450 / 500",
  },
  {
    id: 2, name: "The Slow Ember", type: "Restaurant & Bar",
    tagline: "Farm to table, flame to soul",
    location: "Waterfront District, 8 Harbor Rd", city: "Cape Town",
    rating: 4.9, vibeScore: 78, crowdLevel: "Moderate",
    musicGenre: "Jazz / Neo-Soul", coverCharge: "Free", hours: "5PM – 12AM",
    scenes: [
      { name: "Dining Hall", viewers: 89, vibe: "🍷 Intimate" },
      { name: "Cocktail Bar", viewers: 201, vibe: "🎵 Groovy" },
      { name: "Garden Terrace", viewers: 167, vibe: "🌿 Serene" },
    ],
    tags: ["Live Jazz", "Craft Cocktails", "Date Night", "Garden"],
    color: "#ff9500",
    currentDJ: "Live Band: The Embers", drinks: "Wine from R65", capacity: "120 / 180",
  },
  {
    id: 3, name: "Void", type: "Underground Club",
    tagline: "Descend into sound",
    location: "Industrial Zone, Unit 7B", city: "Johannesburg",
    rating: 4.5, vibeScore: 88, crowdLevel: "Filling Up",
    musicGenre: "Amapiano / Deep House", coverCharge: "R80", hours: "11PM – 6AM",
    scenes: [
      { name: "The Pit", viewers: 412, vibe: "💀 Intense" },
      { name: "Side Room", viewers: 98, vibe: "🎧 Focused" },
      { name: "Smoking Area", viewers: 145, vibe: "💨 Social" },
    ],
    tags: ["Amapiano", "Underground", "Late Night", "No Photos"],
    color: "#5856d6",
    currentDJ: "Uncle Waffles", drinks: "Beers from R35", capacity: "280 / 350",
  },
  {
    id: 4, name: "Botanica", type: "Cocktail Lounge",
    tagline: "Where nature meets nightlife",
    location: "Green Point, 15 Flora Ave", city: "Cape Town",
    rating: 4.8, vibeScore: 71, crowdLevel: "Relaxed",
    musicGenre: "Lo-fi / Indie", coverCharge: "Free", hours: "4PM – 1AM",
    scenes: [
      { name: "Greenhouse Bar", viewers: 134, vibe: "🌺 Lush" },
      { name: "Library Corner", viewers: 45, vibe: "📖 Quiet" },
      { name: "Courtyard", viewers: 178, vibe: "🕯️ Warm" },
    ],
    tags: ["Craft Cocktails", "Botanical", "Chill", "Instagrammable"],
    color: "#34c759",
    currentDJ: "Playlist: Forest Frequencies", drinks: "Botanical cocktails from R95", capacity: "65 / 100",
  },
  {
    id: 5, name: "Horizon 360", type: "Rooftop Bar",
    tagline: "Sky high, spirits higher",
    location: "CBD Tower, 55th Floor", city: "Johannesburg",
    rating: 4.6, vibeScore: 85, crowdLevel: "Busy",
    musicGenre: "Afrobeats / R&B", coverCharge: "R150", hours: "6PM – 2AM",
    scenes: [
      { name: "Sky Deck", viewers: 289, vibe: "🌅 Scenic" },
      { name: "Indoor Lounge", viewers: 156, vibe: "💎 Upscale" },
      { name: "Pool Area", viewers: 203, vibe: "🏊 Party" },
    ],
    tags: ["Skyline Views", "Pool Party", "Premium", "Dress Code"],
    color: "#007aff",
    currentDJ: "DJ Maphorisa", drinks: "Premium spirits from R110", capacity: "320 / 400",
  },
  {
    id: 6, name: "Mama's Kitchen", type: "Shisa Nyama & Bar",
    tagline: "Braai, beats & belonging",
    location: "Soweto, Vilakazi St", city: "Johannesburg",
    rating: 4.4, vibeScore: 95, crowdLevel: "Packed",
    musicGenre: "Amapiano / Gqom", coverCharge: "Free", hours: "12PM – Late",
    scenes: [
      { name: "Braai Yard", viewers: 567, vibe: "🔥 Lit" },
      { name: "Dance Floor", viewers: 423, vibe: "💃 Moving" },
      { name: "Chill Zone", viewers: 189, vibe: "🍺 Easy" },
    ],
    tags: ["Shisa Nyama", "Day Party", "Local Vibe", "Family Friendly"],
    color: "#ff9500",
    currentDJ: "DJ Stokie", drinks: "Beers from R25", capacity: "Full House",
  },
];

const FILTERS = ["All", "Nightclub", "Restaurant & Bar", "Cocktail Lounge", "Rooftop Bar", "Shisa Nyama & Bar", "Underground Club"];
const CITIES = ["All Cities", "Cape Town", "Johannesburg"];

function LiveStreamCanvas({ venue, sceneIdx = 0, isActive }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    const baseHue = venue.id * 55 + sceneIdx * 30;
    const intensity = venue.vibeScore / 100;

    particlesRef.current = Array.from({ length: 50 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 3 + 1,
      dx: (Math.random() - 0.5) * intensity * 2.5,
      dy: (Math.random() - 0.5) * intensity * 1.5,
      hue: baseHue + Math.random() * 50 - 25,
      alpha: Math.random() * 0.5 + 0.2,
      phase: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    const draw = () => {
      t += 0.018;

      ctx.fillStyle = `hsla(${baseHue}, 25%, 6%, 0.18)`;
      ctx.fillRect(0, 0, w, h);

      // Ambient glow
      const grd = ctx.createRadialGradient(w * 0.5, h * 0.55, 0, w * 0.5, h * 0.55, w * 0.55);
      grd.addColorStop(0, `hsla(${baseHue}, 55%, 25%, ${0.07 + Math.sin(t * 0.8) * 0.025})`);
      grd.addColorStop(0.6, `hsla(${baseHue + 30}, 40%, 12%, 0.04)`);
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      // Light beams for high-energy venues
      if (intensity > 0.75 && isActive) {
        for (let i = 0; i < 3; i++) {
          ctx.save();
          ctx.globalAlpha = 0.04 + Math.sin(t * 2.5 + i * 2) * 0.02;
          ctx.strokeStyle = `hsl(${baseHue + i * 45 + t * 15}, 100%, 55%)`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(w * (0.2 + i * 0.3), 0);
          ctx.lineTo(w * (0.2 + i * 0.3) + Math.sin(t * 1.2 + i) * w * 0.25, h);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Crowd silhouettes
      ctx.fillStyle = `hsla(${baseHue}, 15%, 4%, 0.85)`;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 15) {
        const ch = h * (0.2 + intensity * 0.08) + Math.sin(x * 0.025 + t * 1.2) * 12 + Math.sin(x * 0.06 + t * 1.8) * 6;
        ctx.lineTo(x, h - ch);
      }
      ctx.lineTo(w, h);
      ctx.fill();

      // Particles
      particlesRef.current.forEach((p) => {
        p.x += p.dx; p.y += p.dy; p.phase += 0.04;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        const a = p.alpha * (0.5 + Math.sin(p.phase) * 0.4);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 + Math.sin(p.phase) * 0.25), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue + t * 8}, 75%, 55%, ${a})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue + t * 8}, 75%, 55%, ${a * 0.12})`;
        ctx.fill();
      });

      // Audio bars
      if (isActive) {
        const bc = 28;
        const bw = w / bc;
        for (let i = 0; i < bc; i++) {
          const bh = (Math.sin(t * 3.5 + i * 0.55) * 0.5 + 0.5) * h * 0.07 * intensity + 1;
          ctx.fillStyle = `hsla(${baseHue + i * 4}, 65%, 50%, 0.35)`;
          ctx.fillRect(i * bw + 1, h - bh, bw - 2, bh);
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); particlesRef.current = []; };
  }, [venue.id, sceneIdx, venue.vibeScore, isActive]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />;
}

function AudioWaveform({ active, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, height: 18 }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2, background: color || "#fff",
          animation: active ? `wave 0.75s ease-in-out ${i * 0.1}s infinite alternate` : "none",
          height: active ? undefined : 4,
        }} />
      ))}
    </div>
  );
}

function VibeMeter({ score, size = 54, color }) {
  const r = size / 2 - 4;
  const circ = Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size / 2 + 6} viewBox={`0 0 ${size} ${size / 2 + 6}`}>
      <path d={`M 4 ${size / 2} A ${r} ${r} 0 0 1 ${size - 4} ${size / 2}`} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" strokeLinecap="round" />
      <path d={`M 4 ${size / 2} A ${r} ${r} 0 0 1 ${size - 4} ${size / 2}`} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 1s ease" }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700" fontFamily="inherit">{score}</text>
    </svg>
  );
}

export default function VibeCheck() {
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [activeScene, setActiveScene] = useState(0);
  const [filter, setFilter] = useState("All");
  const [city, setCity] = useState("All Cities");
  const [sortBy, setSortBy] = useState("Vibe Score");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState(new Set());
  const [liveViewers, setLiveViewers] = useState({});

  useEffect(() => {
    const iv = setInterval(() => {
      const nv = {};
      VENUES.forEach(v => v.scenes.forEach((s, i) => {
        nv[`${v.id}-${i}`] = s.viewers + Math.floor(Math.random() * 24 - 12);
      }));
      setLiveViewers(nv);
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  const gv = (vid, si, base) => liveViewers[`${vid}-${si}`] || base;

  const toggleFav = (id) => setFavorites(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  const filtered = VENUES.filter(v => {
    if (filter !== "All" && v.type !== filter) return false;
    if (city !== "All Cities" && v.city !== city) return false;
    if (searchQuery && !v.name.toLowerCase().includes(searchQuery.toLowerCase()) && !v.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    return true;
  }).sort((a, b) => sortBy === "Vibe Score" ? b.vibeScore - a.vibeScore : b.rating - a.rating);

  const venue = selectedVenue ? VENUES.find(v => v.id === selectedVenue) : null;

  return (
    <div style={{ minHeight: "100vh", background: "#08080d", color: "#fff", fontFamily: "'Syne', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes wave { from{height:4px} to{height:16px} }
        @keyframes liveDot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:5px } ::-webkit-scrollbar-track { background:transparent } ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.12); border-radius:3px }
        .vc-card { transition:all 0.35s cubic-bezier(0.16,1,0.3,1); cursor:pointer; animation:slideUp 0.5s ease backwards }
        .vc-card:hover { transform:translateY(-3px) scale(1.005) }
        .vc-chip { transition:all 0.25s ease; cursor:pointer; user-select:none; white-space:nowrap }
        .vc-chip:hover { background:rgba(255,255,255,0.1)!important }
        .vc-tab { transition:all 0.25s ease; cursor:pointer; user-select:none }
        .vc-tab:hover { background:rgba(255,255,255,0.1)!important }
        .vc-btn { transition:all 0.2s ease; cursor:pointer }
        .vc-btn:hover { background:rgba(255,255,255,0.1)!important }
        .vc-fav { transition:transform 0.2s ease; cursor:pointer }
        .vc-fav:hover { transform:scale(1.2) }
        .vc-fav:active { transform:scale(0.9) }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(8,8,13,0.88)", backdropFilter: "blur(20px) saturate(1.4)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {venue && (
            <div className="vc-btn" onClick={() => { setSelectedVenue(null); setActiveScene(0); }}
              style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>←</div>
          )}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff2d55", animation: "liveDot 1.5s ease infinite" }} />
              <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>VIBE<span style={{ color: "#ff2d55" }}>CHECK</span></h1>
            </div>
            <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 3, textTransform: "uppercase", fontFamily: "JetBrains Mono", marginTop: 1 }}>Live venue streams</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            padding: "6px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 13 }}>🔍</span>
            <input type="text" placeholder="Search venues..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{ background: "none", border: "none", outline: "none", color: "#fff", fontSize: 12, width: 120, fontFamily: "DM Sans" }} />
          </div>
        </div>
      </header>

      {/* ── DETAIL VIEW ── */}
      {venue ? (
        <div style={{ animation: "fadeIn 0.35s ease", maxWidth: 860, margin: "0 auto", padding: "16px 20px 40px" }}>
          {/* Stream */}
          <div style={{ borderRadius: 18, overflow: "hidden", position: "relative", aspectRatio: "16/9", maxHeight: 400, background: "#000", marginBottom: 16 }}>
            <LiveStreamCanvas venue={venue} sceneIdx={activeScene} isActive={true} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.6) 100%)" }} />
            {/* Top overlay */}
            <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ padding: "3px 9px", borderRadius: 20, background: "rgba(255,45,85,0.9)", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, fontFamily: "JetBrains Mono" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", animation: "liveDot 1s ease infinite" }} />LIVE
                </div>
                <div style={{ padding: "3px 9px", borderRadius: 20, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", fontSize: 10, fontFamily: "JetBrains Mono", color: "rgba(255,255,255,0.8)" }}>
                  👁 {gv(venue.id, activeScene, venue.scenes[activeScene]?.viewers)} watching
                </div>
              </div>
              <div style={{ padding: "3px 9px", borderRadius: 20, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(10px)", fontSize: 11 }}>
                {venue.scenes[activeScene]?.vibe}
              </div>
            </div>
            {/* Bottom overlay */}
            <div style={{ position: "absolute", bottom: 12, left: 14, right: 14, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", fontFamily: "JetBrains Mono", letterSpacing: 1, marginBottom: 2 }}>NOW PLAYING</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <AudioWaveform active={true} color={venue.color} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{venue.currentDJ}</span>
                </div>
              </div>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", fontFamily: "JetBrains Mono" }}>{venue.musicGenre}</span>
            </div>
          </div>

          {/* Scene tabs */}
          <div style={{ display: "flex", gap: 7, marginBottom: 16, overflowX: "auto" }}>
            {venue.scenes.map((sc, i) => (
              <div key={i} className="vc-tab" onClick={() => setActiveScene(i)} style={{
                padding: "9px 14px", borderRadius: 11, minWidth: 130, flex: "1 0 auto",
                background: i === activeScene ? `${venue.color}18` : "rgba(255,255,255,0.03)",
                border: i === activeScene ? `1px solid ${venue.color}35` : "1px solid rgba(255,255,255,0.05)",
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{sc.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.45)" }}>
                  <span>👁 {gv(venue.id, i, sc.viewers)}</span>
                  <span>{sc.vibe}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Info grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[
              { l: "Crowd", v: venue.crowdLevel, i: "👥" },
              { l: "Capacity", v: venue.capacity, i: "🏠" },
              { l: "Cover", v: venue.coverCharge, i: "🎫" },
              { l: "Drinks", v: venue.drinks, i: "🍸" },
              { l: "Hours", v: venue.hours, i: "🕐" },
              { l: "Rating", v: `${venue.rating} ★`, i: "⭐" },
            ].map((item, idx) => (
              <div key={idx} style={{
                padding: "10px 12px", borderRadius: 11,
                background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", gap: 10,
                animation: `slideUp 0.4s ease ${idx * 0.04}s backwards`,
              }}>
                <span style={{ fontSize: 17 }}>{item.i}</span>
                <div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "JetBrains Mono" }}>{item.l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, marginTop: 1 }}>{item.v}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
            {venue.tags.map((tag, i) => (
              <span key={i} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)" }}>{tag}</span>
            ))}
          </div>

          {/* Location */}
          <div style={{ padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "JetBrains Mono", marginBottom: 5 }}>Location</div>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{venue.location}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{venue.city}</div>
          </div>
        </div>
      ) : (

        /* ── BROWSE VIEW ── */
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "14px 20px 40px" }}>
          {/* Filters row */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 8, marginBottom: 8 }}>
              {FILTERS.map(f => (
                <div key={f} className="vc-chip" onClick={() => setFilter(f)} style={{
                  padding: "5px 13px", borderRadius: 20, fontSize: 11, fontWeight: 500, fontFamily: "DM Sans",
                  background: filter === f ? "rgba(255,45,85,0.14)" : "rgba(255,255,255,0.03)",
                  border: filter === f ? "1px solid rgba(255,45,85,0.25)" : "1px solid rgba(255,255,255,0.05)",
                  color: filter === f ? "#ff2d55" : "rgba(255,255,255,0.45)",
                }}>{f}</div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
              {CITIES.map(c => (
                <div key={c} className="vc-chip" onClick={() => setCity(c)} style={{
                  padding: "4px 11px", borderRadius: 20, fontSize: 10, fontWeight: 500, fontFamily: "DM Sans",
                  background: city === c ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                  border: city === c ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(255,255,255,0.04)",
                  color: city === c ? "#fff" : "rgba(255,255,255,0.35)",
                }}>{c}</div>
              ))}
              <div style={{ flex: 1 }} />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 20, padding: "4px 10px", color: "rgba(255,255,255,0.45)",
                fontSize: 10, fontFamily: "DM Sans", outline: "none", cursor: "pointer",
              }}>
                <option value="Vibe Score" style={{ background: "#15151f" }}>Vibe Score</option>
                <option value="Rating" style={{ background: "#15151f" }}>Rating</option>
              </select>
            </div>
          </div>

          {/* Banner */}
          <div style={{
            padding: "12px 16px", borderRadius: 14, marginBottom: 16,
            background: "linear-gradient(135deg, rgba(255,45,85,0.08) 0%, rgba(88,86,214,0.08) 100%)",
            border: "1px solid rgba(255,45,85,0.12)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff2d55", animation: "liveDot 1.5s ease infinite" }} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>{filtered.length} venues live</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "DM Sans" }}>
                · {filtered.reduce((a, v) => a + v.scenes.reduce((s, sc) => s + sc.viewers, 0), 0).toLocaleString()} viewers
              </span>
            </div>
            <AudioWaveform active={true} color="#ff2d55" />
          </div>

          {/* Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((v, idx) => (
              <div key={v.id} className="vc-card" onClick={() => { setSelectedVenue(v.id); setActiveScene(0); }}
                style={{
                  borderRadius: 16, overflow: "hidden",
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
                  animationDelay: `${idx * 0.07}s`,
                }}>
                {/* Preview */}
                <div style={{ height: 170, position: "relative", overflow: "hidden" }}>
                  <LiveStreamCanvas venue={v} sceneIdx={0} isActive={false} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 35%, rgba(8,8,13,0.95) 100%)" }} />
                  {/* Badges */}
                  <div style={{ position: "absolute", top: 10, left: 10, display: "flex", gap: 5 }}>
                    <div style={{ padding: "2px 7px", borderRadius: 20, background: "rgba(255,45,85,0.9)", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, fontFamily: "JetBrains Mono" }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#fff", animation: "liveDot 1s ease infinite" }} />LIVE
                    </div>
                    <div style={{ padding: "2px 7px", borderRadius: 20, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", fontSize: 9, fontFamily: "JetBrains Mono", color: "rgba(255,255,255,0.7)" }}>
                      👁 {v.scenes.reduce((a, s) => a + s.viewers, 0)}
                    </div>
                  </div>
                  <div className="vc-fav" onClick={e => { e.stopPropagation(); toggleFav(v.id); }}
                    style={{ position: "absolute", top: 10, right: 10, fontSize: 16 }}>
                    {favorites.has(v.id) ? "❤️" : "🤍"}
                  </div>
                  {/* Bottom info */}
                  <div style={{ position: "absolute", bottom: 10, left: 12, right: 12, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: 1, fontFamily: "JetBrains Mono", marginBottom: 2 }}>
                        {v.type} · {v.city}
                      </div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>{v.name}</h2>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontStyle: "italic", fontFamily: "DM Sans", marginTop: 1 }}>{v.tagline}</p>
                    </div>
                    <VibeMeter score={v.vibeScore} color={v.color} />
                  </div>
                </div>
                {/* Body */}
                <div style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                    {v.scenes.map((sc, i) => (
                      <div key={i} style={{
                        flex: 1, padding: "5px 7px", borderRadius: 7,
                        background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.04)",
                        textAlign: "center",
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 600, marginBottom: 1 }}>{sc.name}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{sc.vibe}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "DM Sans" }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <span>👥 {v.crowdLevel}</span>
                      <span>🎵 {v.musicGenre}</span>
                      <span>🎫 {v.coverCharge}</span>
                    </div>
                    <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>⭐ {v.rating}</span>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: 50, color: "rgba(255,255,255,0.25)" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🔇</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>No venues match your filters</div>
                <div style={{ fontSize: 12, marginTop: 4, fontFamily: "DM Sans" }}>Try adjusting your search</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

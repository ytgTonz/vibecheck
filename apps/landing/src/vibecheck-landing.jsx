import { useState, useEffect } from "react";

export default function VibeCheckLanding() {
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState("goer");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);
  const [signups, setSignups] = useState([]);
  const [faqOpen, setFaqOpen] = useState(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await window.storage.get("vibecheck-waitlist-v2");
        if (r?.value) {
          const d = JSON.parse(r.value);
          setSignups(d.entries || []);
          setCount(d.entries?.length || 0);
        }
      } catch { setCount(0); }
    };
    load();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSubmit = async () => {
    setError("");
    if (!email || !email.includes("@") || !email.includes(".")) { setError("Valid email required"); return; }
    if (!city) { setError("Pick your city"); return; }
    setLoading(true);
    try {
      const entry = { email, city, role, ts: new Date().toISOString() };
      const updated = [...signups, entry];
      await window.storage.set("vibecheck-waitlist-v2", JSON.stringify({ entries: updated }));
      setSignups(updated);
      setCount(updated.length);
    } catch { setCount(c => c + 1); }
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div style={{ background: "#000", color: "#fff", minHeight: "100vh", position: "relative", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Serif+4:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap');
        :root { --hd:'Bebas Neue',Impact,sans-serif; --bd:'Source Serif 4',Georgia,serif; --mn:'IBM Plex Mono',monospace; --red:#FF2D55; --lime:#BFFF00; }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::selection { background:var(--red); color:#000; }
        .grain::after { content:''; position:fixed; inset:0; z-index:9999; pointer-events:none; opacity:0.035; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); background-size:128px; }
        .marquee-track { display:flex; animation:marquee 20s linear infinite; width:max-content; }
        @keyframes marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .fi { animation:fadeUp 0.6s ease both; }
        .fi-1{animation-delay:0.1s} .fi-2{animation-delay:0.2s} .fi-3{animation-delay:0.3s} .fi-4{animation-delay:0.4s}
        input:focus,select:focus{outline:none}
        .hovlift{transition:transform 0.25s ease} .hovlift:hover{transform:translateY(-3px)}
        @media(max-width:700px){ .hero-title{font-size:17vw!important} .two-col{grid-template-columns:1fr!important} .hero-sub{font-size:16px!important;max-width:100%!important} }
      `}</style>

      <div className="grain"/>

      {/* NAV */}
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:100,padding:"14px 28px",
        background:scrollY>50?"rgba(0,0,0,0.92)":"transparent",
        backdropFilter:scrollY>50?"blur(12px)":"none",
        transition:"all 0.3s ease",
        display:"flex",justifyContent:"space-between",alignItems:"center",
        borderBottom:scrollY>50?"1px solid rgba(255,255,255,0.06)":"1px solid transparent",
      }}>
        <div style={{fontFamily:"var(--hd)",fontSize:22,letterSpacing:2}}>VIBE<span style={{color:"var(--red)"}}>CHECK</span></div>
        {count>0&&<div style={{fontFamily:"var(--mn)",fontSize:11,color:"rgba(255,255,255,0.4)",letterSpacing:1}}>{count} ON WAITLIST</div>}
      </nav>

      {/* HERO */}
      <section style={{padding:"160px 28px 60px",position:"relative"}}>
        <div style={{position:"absolute",top:40,right:-40,fontSize:"45vw",fontFamily:"var(--hd)",color:"rgba(255,255,255,0.015)",lineHeight:0.85,pointerEvents:"none",userSelect:"none",transform:`translateY(${scrollY*-0.1}px)`}}>V</div>

        <div className="fi fi-1" style={{fontFamily:"var(--mn)",fontSize:11,letterSpacing:3,color:"var(--red)",marginBottom:28,textTransform:"uppercase"}}>
          <span style={{display:"inline-block",width:8,height:8,background:"var(--red)",borderRadius:"50%",marginRight:10,animation:"blink 1.5s ease infinite"}}/>
          Coming 2026 · South Africa
        </div>

        <h1 className="hero-title fi fi-2" style={{fontFamily:"var(--hd)",fontSize:"clamp(60px,12vw,140px)",lineHeight:0.9,letterSpacing:-1,marginBottom:24}}>
          KNOW THE<br/><span style={{color:"var(--red)"}}>VIBE</span> BEFORE<br/>YOU ARRIVE
        </h1>

        <p className="hero-sub fi fi-3" style={{fontFamily:"var(--bd)",fontSize:20,lineHeight:1.65,color:"rgba(255,255,255,0.55)",maxWidth:460,marginBottom:48}}>
          Live streams. Real-time crowd data. Vibe scores. Stop wasting Ubers on dead clubs — see what's actually happening tonight.
        </p>

        {/* FORM */}
        <div className="fi fi-4" style={{maxWidth:400}}>
          {!submitted?(
            <>
              <div style={{display:"flex",gap:0,marginBottom:14,border:"1px solid rgba(255,255,255,0.12)"}}>
                {[{id:"goer",label:"I GO OUT"},{id:"venue",label:"I OWN A VENUE"},{id:"promoter",label:"I PROMOTE"}].map(r=>(
                  <button key={r.id} onClick={()=>setRole(r.id)} style={{
                    flex:1,padding:"12px 8px",border:"none",cursor:"pointer",
                    fontFamily:"var(--mn)",fontSize:10,letterSpacing:1.5,fontWeight:500,
                    background:role===r.id?"var(--red)":"transparent",
                    color:role===r.id?"#fff":"rgba(255,255,255,0.35)",transition:"all 0.2s ease",
                  }}>{r.label}</button>
                ))}
              </div>
              <input type="email" placeholder="EMAIL ADDRESS" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
                style={{width:"100%",padding:"16px 14px",marginBottom:8,background:"transparent",border:"1px solid rgba(255,255,255,0.12)",color:"#fff",fontFamily:"var(--mn)",fontSize:12,letterSpacing:1.5}}/>
              <select value={city} onChange={e=>setCity(e.target.value)}
                style={{width:"100%",padding:"16px 14px",marginBottom:8,background:"#000",border:"1px solid rgba(255,255,255,0.12)",color:city?"#fff":"rgba(255,255,255,0.3)",fontFamily:"var(--mn)",fontSize:12,letterSpacing:1.5,cursor:"pointer",appearance:"none"}}>
                <option value="">SELECT YOUR CITY</option>
                {["Cape Town","Johannesburg","Durban","Pretoria","East London","Gqeberha","Bloemfontein","Other"].map(c=><option key={c} value={c} style={{background:"#000"}}>{c}</option>)}
              </select>
              {error&&<div style={{fontFamily:"var(--mn)",fontSize:11,color:"var(--red)",marginBottom:8}}>{error}</div>}
              <button onClick={handleSubmit} disabled={loading} style={{
                width:"100%",padding:"18px",border:"none",cursor:"pointer",background:"var(--red)",color:"#fff",
                fontFamily:"var(--hd)",fontSize:20,letterSpacing:3,transition:"all 0.2s ease",opacity:loading?0.6:1,
              }}
                onMouseEnter={e=>{if(!loading)e.currentTarget.style.background="#e6254c"}}
                onMouseLeave={e=>{e.currentTarget.style.background="var(--red)"}}
              >{loading?"JOINING...":"GET EARLY ACCESS"}</button>
              <div style={{fontFamily:"var(--mn)",fontSize:10,color:"rgba(255,255,255,0.2)",marginTop:10,letterSpacing:1}}>FREE FOREVER FOR EARLY USERS. NO SPAM.</div>
            </>
          ):(
            <div style={{padding:"40px 0",animation:"fadeUp 0.5s ease"}}>
              <div style={{fontFamily:"var(--hd)",fontSize:48,color:"var(--lime)",marginBottom:10}}>YOU'RE IN.</div>
              <p style={{fontFamily:"var(--bd)",fontSize:16,color:"rgba(255,255,255,0.55)",lineHeight:1.6}}>
                We'll notify you when VibeCheck launches in <strong style={{color:"#fff"}}>{city}</strong>.
                {role==="venue"?" We'll reach out about a venue partnership.":role==="promoter"?" We'll contact you about the promoter program.":""}
              </p>
              <div style={{fontFamily:"var(--mn)",fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:16,letterSpacing:1}}>#{count} ON THE WAITLIST</div>
            </div>
          )}
        </div>
      </section>

      {/* MARQUEE */}
      <div style={{overflow:"hidden",borderTop:"1px solid rgba(255,255,255,0.06)",borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"14px 0"}}>
        <div className="marquee-track">
          {Array(3).fill(null).map((_,i)=>(
            <span key={i} style={{fontFamily:"var(--hd)",fontSize:16,letterSpacing:6,color:"rgba(255,255,255,0.08)",whiteSpace:"nowrap",paddingRight:60}}>
              LIVE STREAMS ★ VIBE SCORES ★ CROWD LEVELS ★ MUSIC FILTER ★ DEALS ★ PRIVACY FIRST ★ CAPE TOWN ★ JOHANNESBURG ★ DURBAN ★ AMAPIANO ★ HOUSE ★ JAZZ ★ AFROBEATS ★&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* WHAT IS IT */}
      <section style={{padding:"80px 28px",maxWidth:900,margin:"0 auto"}}>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:40}}>
          <div style={{width:40,height:1,background:"var(--red)"}}/>
          <span style={{fontFamily:"var(--mn)",fontSize:10,letterSpacing:3,color:"var(--red)"}}>WHAT IS IT</span>
        </div>
        <div className="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:60}}>
          <div>
            <h2 style={{fontFamily:"var(--hd)",fontSize:44,lineHeight:1,letterSpacing:1,marginBottom:20}}>NIGHTLIFE<br/>INTELLIGENCE</h2>
            <p style={{fontFamily:"var(--bd)",fontSize:16,lineHeight:1.7,color:"rgba(255,255,255,0.5)"}}>
              VibeCheck shows you what's actually happening inside clubs, bars, and restaurants across your city — right now. Not a review from last month. Not a curated Instagram post. The real, live vibe.
            </p>
          </div>
          <div>
            <p style={{fontFamily:"var(--bd)",fontSize:16,lineHeight:1.7,color:"rgba(255,255,255,0.5)",marginBottom:24}}>
              Browse live streams, check vibe scores, filter by music genre, see crowd levels — and decide where to go before you spend a cent on an Uber.
            </p>
            <p style={{fontFamily:"var(--bd)",fontSize:16,lineHeight:1.7,color:"rgba(255,255,255,0.5)"}}>
              For venue owners, it's the first marketing channel that reaches people at the exact moment they're deciding where to go tonight.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{padding:"0 28px 80px",maxWidth:900,margin:"0 auto"}}>
        <div className="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:2}}>
          {[
            {n:"01",t:"LIVE STREAMS",d:"Real-time footage from inside venues. Multiple scenes — dance floor, bar, rooftop, entrance queue."},
            {n:"02",t:"VIBE SCORES",d:"0–100 energy rating computed from crowd density, audio levels, and check-in velocity. Updated live."},
            {n:"03",t:"MUSIC FILTER",d:"Amapiano. House. Jazz. Afrobeats. Hip-Hop. R&B. Filter by what you want to hear, not what's promoted."},
            {n:"04",t:"CROWD DATA",d:"Dead, warming up, moderate, busy, packed — plus queue times, cover charges, and capacity."},
            {n:"05",t:"DEALS ENGINE",d:"\"Show this app for 2-for-1 before 11PM.\" Time-gated offers from venues, tracked end-to-end."},
            {n:"06",t:"PRIVACY FIRST",d:"Face-blur tech on all streams. Venue-controlled content. POPIA compliant. We show the vibe, not the faces."},
          ].map((f,i)=>(
            <div key={i} className="hovlift" style={{padding:"32px 28px",borderTop:"1px solid rgba(255,255,255,0.06)",borderLeft:i%2===1?"1px solid rgba(255,255,255,0.06)":"none"}}>
              <div style={{fontFamily:"var(--mn)",fontSize:10,color:"var(--red)",letterSpacing:2,marginBottom:12}}>{f.n}</div>
              <div style={{fontFamily:"var(--hd)",fontSize:26,letterSpacing:1,marginBottom:10}}>{f.t}</div>
              <p style={{fontFamily:"var(--bd)",fontSize:14,lineHeight:1.65,color:"rgba(255,255,255,0.4)"}}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BIG QUOTE */}
      <section style={{padding:"80px 28px",borderTop:"1px solid rgba(255,255,255,0.06)",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        <div style={{maxWidth:700,margin:"0 auto"}}>
          <div style={{fontFamily:"var(--hd)",fontSize:"clamp(32px,6vw,56px)",lineHeight:1.05,letterSpacing:1,marginBottom:24}}>
            "I WASTE SO MUCH ON UBERS TO DEAD CLUBS. IF I COULD CHECK BEFORE LEAVING, I'D SAVE THOUSANDS A YEAR."
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:"var(--red)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--hd)",fontSize:16}}>T</div>
            <div>
              <div style={{fontFamily:"var(--mn)",fontSize:12,letterSpacing:1}}>THANDO M.</div>
              <div style={{fontFamily:"var(--mn)",fontSize:10,color:"rgba(255,255,255,0.3)",letterSpacing:1}}>CLUB-GOER, CAPE TOWN</div>
            </div>
          </div>
        </div>
      </section>

      {/* FOR VENUES */}
      <section style={{padding:"80px 28px",maxWidth:900,margin:"0 auto"}}>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:40}}>
          <div style={{width:40,height:1,background:"var(--lime)"}}/>
          <span style={{fontFamily:"var(--mn)",fontSize:10,letterSpacing:3,color:"var(--lime)"}}>FOR VENUES & PROMOTERS</span>
        </div>
        <h2 style={{fontFamily:"var(--hd)",fontSize:"clamp(36px,7vw,60px)",lineHeight:0.95,letterSpacing:1,marginBottom:28}}>YOUR ENERGY IS<br/>YOUR BEST AD.</h2>
        <div className="two-col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:40}}>
          <p style={{fontFamily:"var(--bd)",fontSize:16,lineHeight:1.7,color:"rgba(255,255,255,0.5)"}}>
            Every impression on VibeCheck happens when someone is actively deciding where to go. Not scrolling on a Tuesday. Not passively watching stories. They've got their shoes on and they're ready.
          </p>
          <div>
            {["Promoted listings — top of browse results","Flash promos to fill dead hours","Analytics dashboard — views, conversions, benchmarks","Privacy tools — face blur, content control","Free to list, pay only for promoted placement"].map((item,i)=>(
              <div key={i} style={{padding:"12px 0",borderBottom:"1px solid rgba(255,255,255,0.06)",fontFamily:"var(--mn)",fontSize:12,letterSpacing:0.5,color:"rgba(255,255,255,0.6)",display:"flex",gap:10,alignItems:"baseline"}}>
                <span style={{color:"var(--lime)",fontSize:10}}>→</span>{item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VENUE QUOTE */}
      <section style={{padding:"60px 28px 80px",maxWidth:700,margin:"0 auto"}}>
        <div style={{fontFamily:"var(--bd)",fontSize:20,lineHeight:1.6,fontStyle:"italic",color:"rgba(255,255,255,0.55)",marginBottom:16,borderLeft:"3px solid var(--lime)",paddingLeft:24}}>
          "My biggest problem is the 9–11PM dead zone. If I could push deals to people actively looking for somewhere to go, that changes everything."
        </div>
        <div style={{paddingLeft:27}}>
          <span style={{fontFamily:"var(--mn)",fontSize:11,letterSpacing:1}}>RYAN K.</span>
          <span style={{fontFamily:"var(--mn)",fontSize:10,color:"rgba(255,255,255,0.3)",letterSpacing:1}}> — VENUE OWNER, JHB</span>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{padding:"80px 28px",borderTop:"1px solid rgba(255,255,255,0.06)",maxWidth:900,margin:"0 auto"}}>
        <div style={{fontFamily:"var(--hd)",fontSize:44,letterSpacing:1,marginBottom:50}}>HOW IT WORKS</div>
        {[
          {n:"01",t:"OPEN",d:"Browse live venues in your city. Filter by music, vibe score, crowd level, or what's trending."},
          {n:"02",t:"WATCH",d:"See real-time footage inside the venue. Switch scenes. Check the vibe score. Read crowd data."},
          {n:"03",t:"GO",d:"Found your spot? Check cover, claim a deal, and head out. No guessing."},
        ].map((s,i)=>(
          <div key={i} style={{display:"flex",gap:28,alignItems:"baseline",padding:"28px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{fontFamily:"var(--hd)",fontSize:64,color:"var(--red)",lineHeight:1,minWidth:80}}>{s.n}</div>
            <div>
              <div style={{fontFamily:"var(--hd)",fontSize:28,letterSpacing:2,marginBottom:6}}>{s.t}</div>
              <p style={{fontFamily:"var(--bd)",fontSize:15,lineHeight:1.6,color:"rgba(255,255,255,0.45)"}}>{s.d}</p>
            </div>
          </div>
        ))}
      </section>

      {/* FAQ */}
      <section style={{padding:"80px 28px",maxWidth:700,margin:"0 auto"}}>
        <div style={{fontFamily:"var(--hd)",fontSize:44,letterSpacing:1,marginBottom:40}}>FAQ</div>
        {[
          {q:"When does it launch?",a:"We're targeting late 2026, starting with Cape Town or Johannesburg based on waitlist demand."},
          {q:"Is it free?",a:"Completely free for people going out. We make money from venue partnerships, promoted listings, and deal commissions."},
          {q:"What about privacy?",a:"All streams use face-blur technology. Content is venue-controlled — no random posts. Fully POPIA compliant with opt-out for patrons."},
          {q:"I own a venue. How do I join?",a:"Select 'I own a venue' in the signup form. We'll reach out about early partnership with free promoted placement during launch."},
          {q:"Why not just use Instagram?",a:"Nobody opens Instagram thinking 'where should I go tonight.' VibeCheck opens with that exact question answered — live data, vibe scores, filters. Intent-based discovery, not passive scrolling."},
        ].map((f,i)=>(
          <div key={i} style={{borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"20px 0",cursor:"pointer"}} onClick={()=>setFaqOpen(faqOpen===i?null:i)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontFamily:"var(--mn)",fontSize:13,letterSpacing:0.5}}>{f.q}</span>
              <span style={{fontFamily:"var(--hd)",fontSize:22,color:"rgba(255,255,255,0.2)",transition:"transform 0.3s ease",transform:faqOpen===i?"rotate(45deg)":"none"}}>+</span>
            </div>
            {faqOpen===i&&<p style={{fontFamily:"var(--bd)",fontSize:14,lineHeight:1.65,color:"rgba(255,255,255,0.45)",marginTop:12,animation:"fadeUp 0.25s ease"}}>{f.a}</p>}
          </div>
        ))}
      </section>

      {/* FINAL CTA */}
      <section style={{padding:"100px 28px",borderTop:"1px solid rgba(255,255,255,0.06)",textAlign:"center"}}>
        <div style={{fontFamily:"var(--hd)",fontSize:"clamp(40px,9vw,100px)",lineHeight:0.95,letterSpacing:1,marginBottom:24}}>STOP<br/>GUESSING.</div>
        <p style={{fontFamily:"var(--bd)",fontSize:17,color:"rgba(255,255,255,0.45)",marginBottom:36,lineHeight:1.5}}>Join the waitlist. Be first when we launch.</p>
        {!submitted?(
          <div style={{maxWidth:400,margin:"0 auto",display:"flex",gap:0}}>
            <input type="email" placeholder="EMAIL" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()}
              style={{flex:1,padding:"16px 14px",background:"transparent",border:"1px solid rgba(255,255,255,0.12)",borderRight:"none",color:"#fff",fontFamily:"var(--mn)",fontSize:12,letterSpacing:1.5}}/>
            <button onClick={handleSubmit} disabled={loading} style={{padding:"16px 28px",border:"none",cursor:"pointer",background:"var(--red)",color:"#fff",fontFamily:"var(--hd)",fontSize:18,letterSpacing:3,opacity:loading?0.6:1}}>JOIN</button>
          </div>
        ):(
          <div style={{fontFamily:"var(--hd)",fontSize:28,color:"var(--lime)"}}>YOU'RE IN ✓</div>
        )}
      </section>

      {/* FOOTER */}
      <footer style={{padding:28,borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
        <div style={{fontFamily:"var(--hd)",fontSize:16,letterSpacing:2}}>VIBE<span style={{color:"var(--red)"}}>CHECK</span></div>
        <div style={{fontFamily:"var(--mn)",fontSize:10,color:"rgba(255,255,255,0.2)",letterSpacing:1}}>© 2026 · KNOW THE VIBE BEFORE YOU ARRIVE</div>
      </footer>
    </div>
  );
}

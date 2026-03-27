# Live Vibe — Business Panel Analysis

**Date**: 2026-03-20
**Mode**: Discussion → Debate on key tensions
**Panel**: All 9 experts convened

---

## Table of Contents

1. [Input Document: Business Model Refinement](#input-document-business-model-refinement)
2. [Round 1: Individual Expert Analyses](#round-1-individual-expert-analyses)
3. [Round 2: Debate — Key Tensions](#round-2-debate--key-tensions)
4. [Synthesis: Panel Recommendations](#synthesis-panel-recommendations)

---

## Input Document: Business Model Refinement

### The Core Insight

The fundamental flaw in every previous attempt at live venue discovery:

- **Installed cameras** — venue controls the narrative, it's passive, and a venue will never point a camera at an empty room. Also a logistical nightmare to install and maintain.
- **Recorded video** — stale by definition. A Friday night crowd at 11pm tells you nothing about Saturday at 10pm.
- **Instagram Live** — broadcast to your existing audience, not to people actively deciding where to go tonight.

The key distinction that makes Live Vibe different:

> **Instagram Live is retention** — keeping your existing followers engaged.
> **Live Vibe is acquisition** — converting undecided people into walk-ins tonight.

Those are completely different jobs. A venue's Instagram following is largely people who've already been there. Live Vibe puts them in front of people who haven't decided yet. That's the pitch to venues.

### The Two-Sided Marketplace Dynamic

Two distinct customers with different motivations:

**Viewers (going-out crowd)**
- Pain: Wasted nights, dead venues, FOMO, indecision
- Gain: Confidence in the decision before leaving home
- Behaviour: Browse, compare vibes, decide, go

**Venues (bars, clubs, restaurants, event spaces)**
- Pain: Empty tables/dancefloors on nights that should be busy, no way to signal "we're popping right now"
- Gain: Converting browsers into walk-ins, real-time foot traffic influence
- Behaviour: Go live when busy, want to be discovered

The beautiful tension: venues are incentivised to only go live when it's actually good — because if someone shows up to a dead room after watching a live stream, that's a trust-destroying experience. The platform self-regulates quality to some degree.

### Feature Architecture — MVP vs Growth

**Tier 1 — MVP (Prove the concept)**
- Live stream discovery sorted by proximity / currently live
- Basic venue profiles (location, vibe category, cover charge)
- Simple viewer count visible to both sides
- Mux-powered RTMP stream, HLS delivery

**Tier 2 — Differentiation (Make it sticky)**
- Vibe Meter — a rolling aggregate score. Viewers tapping reactions that feed a live "temperature" gauge visible on the browse screen. Venues with a hot vibe meter surface higher in discovery.
- Patron social validation — people inside the venue can check in and post a quick 5-second clip or rating. Separates the venue's own stream from independent crowd validation — huge for trust.
- Hype interactions — viewer reactions that show on the venue's broadcast screen in real time.
- "I'm Coming" button — viewer taps it, venue sees a counter of people inbound. The virtual bouncer feature. Venues can prep, offer a welcome, even message inbound guests.

**Tier 3 — Monetisation Layer**
- Venue subscription tiers — basic listing free, premium unlocks analytics, featured placement, inbound guest notifications
- Promoted placement — venue pays to be surfaced at the top of discovery during peak hours
- Pre-arrival offers — venue pushes a "first 10 people who tap I'm Coming get a free drink" — Live Vibe takes a small transaction fee or flat feature fee
- Data play — anonymised foot traffic intent data is genuinely valuable to venues for staffing, stock, and marketing decisions

### The Moat — Why This Is Hard To Copy

The features alone aren't the moat. The moat builds from:

1. **Geographic density** — once Live Vibe owns Friday night in one neighbourhood, venues in that neighbourhood have to be on it. Network effects are hyper-local.
2. **The "I'm Coming" loop** — this creates a direct operational relationship between Live Vibe and venue staff. That's sticky in a way an Instagram Live never will be.
3. **Vibe history / reputation** — over time, venues build a Live Vibe track record. That data becomes a trust asset that can't be migrated.
4. **Patron validation layer** — user-generated real-time check-ins from people inside the venue is something no venue-controlled platform can replicate. It's independent signal.

### The One Strategic Risk

Instagram and TikTok could replicate the discovery angle if they added location-sorted live filtering. They have the streams, the users, and the distribution. The defence:

- Move fast and own the going-out vertical with purpose-built UX they'll never prioritise
- The operational integration (I'm Coming, virtual bouncer, vibe analytics) creates switching costs they won't bother matching
- The audience intent is different — Live Vibe users are in decision mode, not scroll mode. That's a different product even if the feature looks similar on the surface

### The Pitch In One Sentence

> Live Vibe turns a venue's best nights into real-time walk-in marketing, and turns a viewer's indecision into a confident night out — live, unfiltered, right now.

### The Beachhead Question

Where do you launch first? One city, one neighbourhood, one night of the week — that's your beachhead. Everything else is noise until that works.

---

## Round 1: Individual Expert Analyses

---

### Clayton Christensen — Disruption & Jobs-to-be-Done

The Jobs-to-be-Done framing here is exceptionally clean, and I want to underscore why that matters strategically.

**The job is NOT "watch a live stream."** The job is: *"Help me feel confident that the next two hours of my Friday night won't be wasted."* That's the hiring criteria. The live stream is just the mechanism — and this distinction should govern every product decision you make.

What concerns me is that the document frames this as disruption, but **this isn't disruption in the classical sense**. You're not entering at the low end of an existing market with a worse product that improves. You're creating a *new market* — nobody is currently being served for this job. The "non-consumption" here is people sitting on their couch scrolling Instagram, unable to decide, and either staying home or picking randomly. That's your competition: **inertia and guesswork**.

This matters because new-market creation has a different playbook than disruption:

- You don't need to be cheaper than an incumbent — there is no incumbent
- You need to **create the behaviour**, not redirect it
- Your biggest enemy isn't a competitor, it's the user thinking "I'll just check Instagram"

**The "I'm Coming" button is the most strategically important feature in this document.** Here's why: it transforms a passive consumption job ("show me what's happening") into an active commitment job ("I've decided, I'm going"). That commitment loop is what makes this a *product* and not a *feature*. Without it, you're a live stream directory. With it, you're an intent-to-action conversion engine.

**One risk to flag**: the document assumes venues will self-regulate quality by only going live when busy. This is optimistic. Venues that are *struggling* have the most incentive to go live, and they'll go live when it's dead, hoping to attract people. You need a mechanism — the Vibe Meter, patron check-ins — to prevent venues from gaming the signal. **Trust is the product. If the stream lies once, the user doesn't come back.**

---

### Michael Porter — Competitive Strategy & Five Forces

**1. Threat of New Entrants: HIGH**

The document correctly identifies Instagram and TikTok as existential risks but underestimates the entry threat from:
- **Google Maps** — already has venue data, reviews, "busy times" graphs, and the distribution. Adding a live stream layer is a feature addition for them, not a new product.
- **Yelp** — similar position, already in the venue discovery business
- **Vertical competitors** — someone in another city builds the same thing. Two-sided marketplaces with hyper-local network effects can have multiple winners in different geographies.

Your barriers to entry are **not** technical. Mux, HLS, RTMP — any competent team can build this. Your barrier is **demand-side network density in a specific geography at a specific time**. That's real, but it's also fragile until it reaches critical mass.

**2. Bargaining Power of Suppliers (Venues): MODERATE → HIGH**

Venues are your supply. In the early days, *you need them more than they need you*. A venue can go live on Instagram for free tonight. You're asking them to adopt a new tool, a new workflow, for an audience that doesn't exist yet. This is the classic cold-start problem, and your power dynamic with venues will be weak until you can demonstrate measurable walk-in conversion.

**Critical implication**: your Tier 3 monetisation is premature to think about. You will likely need to *pay* venues or heavily incentivise them to participate in Year 1, not charge them.

**3. Bargaining Power of Buyers (Viewers): HIGH**

Switching costs for viewers are zero. They can check Instagram, call a friend, or just go to their usual spot. You need to become a **habit**, not a tool they use once. The Vibe Meter and patron validation help here — they create content that only exists on your platform.

**4. Threat of Substitutes: HIGH**

The substitute isn't another app. It's the group chat. "Hey, anyone been to [venue] tonight?" That text message is your biggest competitor, and it's been winning for decades.

**5. Competitive Rivalry: LOW (today), UNKNOWN (tomorrow)**

You're currently in white space. Enjoy it. But the moment you show traction, you'll have imitators within 90 days.

**Strategic positioning recommendation**: Don't try to be the "everything nightlife" app. **Own the decision moment.** The 30-minute window between "should we go out?" and "we're in an Uber." Everything in the product should serve that window. If a feature doesn't help someone decide faster and with more confidence, cut it.

---

### Peter Drucker — Management & Execution

The strategy is intellectually satisfying. Now let me ask the questions that will determine whether it actually works.

**"What is our business?"** — You are not in the live streaming business. You are in the **real-time decision confidence** business. Never confuse the delivery mechanism with the value proposition. The moment you start thinking of yourself as a streaming platform, you'll make infrastructure decisions that don't serve the customer.

**"Who is our customer?"** — The document says two: viewers and venues. I'd argue you have **three**:

1. **The decider** — the person in the friend group who picks where to go. This is your *primary* user. In most groups, one person does the research and makes the call. Your UX should be optimised for this person sharing a link in a group chat: "Look at this place right now, let's go."
2. **The venue operator** — not the owner, the *operator*. The person working the door or behind the bar on a Thursday night. If they don't use it, it doesn't matter what the owner signed up for.
3. **The group** — the people who follow the decider. They need to see the stream on a shared link without downloading the app. **This is critical for growth.**

**On execution**: the document says "one city, one neighbourhood, one night of the week." This is correct and I want to reinforce it with a principle: **Management by Objectives**.

Your objective for the first 90 days is not "build a platform." It is:

> *"On Friday nights in [neighbourhood], have 15+ venues live-streaming simultaneously, with 500+ unique viewers making decisions."*

That's it. That's measurable, time-bound, and falsifiable. If you can't hit that number with direct, manual, on-the-ground hustle in one neighbourhood, the product doesn't work and no amount of technology will save it.

**The operational question nobody is asking**: who holds the phone? At the venue, is it a staff member? A mounted device? The DJ? This is not a trivial question — it determines stream quality, consistency, and whether the venue actually does it every night. I'd argue you need a **dedicated device program** — a cheap tablet or phone on a mount that the venue places in a designated spot. Remove the friction of "whose phone is this on?"

---

### Seth Godin — Marketing & Tribe Building

Stop thinking about "users." Start thinking about **the tribe**.

The going-out tribe already exists. They're in group chats, they follow nightlife Instagram accounts, they have opinions about which neighbourhood is better on which night. Your job isn't to create a community — it's to give an existing tribe a **better campfire to gather around**.

**The purple cow in this business model is the patron validation layer.** Not the venue stream — that's expected. The moment a random person *inside* the venue posts a 5-second clip saying "this place is going off" — that's the remarkable thing. That's what gets shared. That's what someone screenshots and sends to their group chat.

**Marketing strategy should be bottom-up, not top-down:**

1. **Don't market to "people who go out."** Market to **the person in every friend group who decides where to go.** They're the tastemaker. They're the connector. They're your early adopter. Give them status — "I found this place on Live Vibe before anyone else."
2. **The venue's stream IS the marketing.** You don't need an ad budget if you have 20 venues live on a Friday night. The content IS the acquisition channel. Your job is to make that content discoverable and shareable outside the app.
3. **Create scarcity and FOMO on the platform itself.** "Only 12 venues live right now" is more compelling than 200. In the early days, scarcity signals exclusivity.

**The "I'm Coming" counter is brilliant marketing disguised as a feature.** When a viewer sees "47 people are heading to this venue right now," that's not information — that's social proof operating in real time. It's the digital equivalent of seeing a line outside a club. **Make that number visible, prominent, and shareable.**

**One provocation**: the document mentions "pre-arrival offers" (free drink for first 10 who tap I'm Coming). This is dangerous. The moment you attach monetary incentives to the "I'm Coming" action, you corrupt the signal. People will tap it for the free drink, not because they're actually coming. **Protect the integrity of the signal above all else.** The "I'm Coming" counter only works if it's honest. The moment it becomes a coupon, it's dead.

---

### W. Chan Kim & Renee Mauborgne — Blue Ocean Strategy

**The Red Ocean** (where competition exists today):
- Yelp / Google Maps: static reviews, historical data, "popular times" graphs
- Instagram / TikTok: social content, influencer posts, Stories
- Event platforms (Eventbrite, Dice): ticketed events, scheduled programming

All of these compete on: **retrospective information** (reviews, past data) or **curated content** (influencer posts, professional photos). None compete on **real-time, unfiltered, live signal**.

**Four Actions Framework:**

| Action | Factor | Rationale |
|--------|--------|-----------|
| **ELIMINATE** | Reviews, ratings, written descriptions | Stale information that doesn't answer "what's it like *right now*?" |
| **REDUCE** | Venue profile detail, menu information, event listings | Enough to know what kind of place it is, not a full Yelp page |
| **RAISE** | Real-time signal, decision confidence, social proof | The core value no one else delivers |
| **CREATE** | Live patron validation, "I'm Coming" intent signal, Vibe Meter | Entirely new factors that redefine the competitive landscape |

**This is a clear Blue Ocean move.** You're not competing with Yelp on reviews or Instagram on content. You're creating a new value curve around *real-time decision confidence*.

**The critical Blue Ocean risk**: the temptation to drift back into the Red Ocean. Every feature request from venues will pull you toward "can we add our menu?" "can we post photos?" "can we add our event schedule?" **Say no.** The moment you become a venue profile platform, you're competing with Google. Stay in the blue water: live, now, real.

**Non-customer analysis** — three tiers of non-customers to study:

1. **Soon-to-be non-customers**: people who currently use Instagram to scope venues but find it unreliable — they're one good alternative away from switching
2. **Refusing non-customers**: people who've given up trying to find good spots and just go to the same 2-3 places — your biggest growth market
3. **Unexplored non-customers**: people who *would* go out more often if they had confidence in the decision — this is where real market expansion lives

---

### Jim Collins — Organisational Excellence

Three frameworks to apply: the Hedgehog Concept, the Flywheel, and the Stockdale Paradox.

**Hedgehog Concept** — the intersection of three circles:

1. **What can you be best in the world at?** Real-time venue discovery in a single geography. Not live streaming (Mux is better). Not venue marketing (Instagram is bigger). The *intersection* of live video + local discovery + intent signalling.
2. **What drives your economic engine?** The per-venue economics once you achieve density. One neighbourhood with 20 venues paying $200/month is $48K ARR from a 10-block radius. That's a repeatable, scalable unit.
3. **What are you deeply passionate about?** This needs to come from you — but the document radiates conviction that the going-out experience is broken and fixable. That's fuel.

**The Flywheel:**

```
More venues live --> More viewer choice --> More viewers browsing
        ^                                          |
        |                                          v
   Venues see ROI <-- More "I'm Coming" taps <-- More engagement
```

Every turn of this flywheel makes the next turn easier. **But the flywheel doesn't start spinning on its own.** You need to push it manually, venue by venue, night by night, in one neighbourhood, until momentum takes over.

The document's beachhead strategy is correct. But go further: **identify your "first who, then what."** Who are the first 10 venue operators who will champion this? Not the biggest venues — the *hungriest*. The new cocktail bar that opened 3 months ago and is struggling for Thursday traffic. The DJ night that's great but nobody knows about. Those are your early evangelists. Get them results, and they'll recruit the next 10 for you.

**Stockdale Paradox**: confront the brutal facts while maintaining faith.

- Brutal fact #1: Two-sided marketplace cold starts have a >90% failure rate.
- Brutal fact #2: You will likely need 6-12 months of manual, unscalable work before any network effect kicks in.
- Brutal fact #3: Your first 1,000 viewers will come from you personally telling people to check the app on Friday night.
- Faith: the job-to-be-done is real, the timing is right (post-COVID going-out culture is booming), and no one is purpose-building for this moment.

---

### Nassim Nicholas Taleb — Risk & Antifragility

Everyone else is telling you what could go right. Let me tell you what will kill you, and how to survive it.

**Fragility analysis — where you break:**

1. **Single point of failure: stream quality.** One laggy, dark, poorly-aimed stream on a user's first experience = uninstall. You're not Netflix where people tolerate a buffer. You're competing with "just go to the usual place." **Your quality floor must be high.** This means device requirements, minimum bandwidth checks before going live, and possibly refusing to let a venue stream if conditions are poor.

2. **Trust asymmetry.** It takes 20 good experiences to build trust and 1 bad one to destroy it. If someone shows up to a venue that looked great on stream and it's dead? They don't blame the venue — they blame you. **You own the trust layer, which means you own the downside.** Build in warnings: "This stream is from 45 minutes ago" (for replays), show viewer counts declining in real time, show "I'm Coming" numbers cooling off.

3. **Liability surface.** Live video from nightlife venues. Think about what will eventually be on those streams. Fights. Underage drinking. Harassment. A stream that captures something illegal or harmful becomes *your* problem because it's *your* platform. **Moderation is not a Tier 2 feature. It's a Tier 0 requirement.** You need both automated content moderation and rapid human review. Budget for it from day one.

4. **Concentration risk.** Hyper-local network effects are a moat but also a vulnerability. If your top 5 venues in your beachhead neighbourhood close, rebrand, or get poached by a competitor, you lose 50% of your supply overnight. **Diversify your venue base early.** Don't let any single venue represent more than 10% of your streams.

**How to be antifragile (gain from disorder):**

- **Stressor: a venue streams when dead.** Response: the Vibe Meter drops, patron check-ins are absent, and the venue gets deprioritised. The system gets *better* at filtering because it learned from the failure.
- **Stressor: a big platform copies the feature.** Response: they can copy the stream, but they can't copy the "I'm Coming" operational loop, the venue-staff relationship, or the hyper-local density. If Instagram adds location-filtered live, it actually *validates your market* and sends users looking for the purpose-built version. **Copycats in this space are marketing for you.**
- **Stressor: a bad night.** Response: build a "came alive" signal — if a venue starts dead but fills up, that's *more* compelling content than a place that's always busy. Design for the comeback story.

**The barbell strategy for launch**: invest 80% of resources in the **boring fundamentals** (stream reliability, basic discovery UX, venue onboarding) and 20% in **one asymmetric bet** (I'd pick the "I'm Coming" counter — it's the feature with the highest optionality). Ignore everything in the middle. No Vibe Meter, no patron clips, no analytics dashboard in V1. Reliable streams + the one killer feature. That's your barbell.

---

### Donella Meadows — Systems Thinking

**Reinforcing Loop 1 (Virtuous): The Density Flywheel**
```
More venues live --> Better viewer experience --> More viewers -->
Higher "I'm Coming" conversion --> Venues see walk-in results -->
More venues want to be live --> [cycle reinforces]
```
This is the growth engine. The leverage point is **venue-to-walk-in conversion evidence**. If you can show a venue owner "14 people tapped I'm Coming and 9 walked through your door," the loop accelerates.

**Reinforcing Loop 2 (Vicious): The Ghost Town Spiral**
```
Few venues live --> Viewer opens app, sees nothing --> Viewer leaves -->
Lower viewer count --> Venues see no audience --> Fewer venues go live -->
[cycle reinforces downward]
```
This is the cold-start death spiral. **This is the most likely way you die.** The leverage point to break it is **guaranteed supply**. You need to ensure that on launch night, every viewer who opens the app sees at least 8-10 live venues. Even if you have to station your own team at venues with phones.

**Balancing Loop 1: Trust Regulation**
```
Venue streams when dead --> Viewers arrive disappointed -->
Negative trust signal --> Viewer stops using app -->
Venue sees fewer viewers --> Venue stops streaming when dead
```
The document identifies this self-regulation correctly. But it takes **multiple cycles** to calibrate, and each disappointed viewer is a potential permanent loss. **Don't wait for the balancing loop to work organically. Accelerate it.** Show venues their own "arrival vs. stream" data — "12 people saw your stream, 3 tapped I'm Coming, 0 checked in." That feedback loop needs to be fast and visible to venue operators.

**The highest-leverage intervention point in this entire system**: the delay between a viewer seeing a stream and making a decision. If that takes 30 seconds, you win. If it takes 5 minutes of browsing, comparing, and deliberating, many will abandon. **Reduce decision latency ruthlessly.** Show the three most important signals immediately: live thumbnail, vibe meter, and "X people heading there." Don't make them tap into a profile page to decide.

**System archetype warning: "Success to the Successful."** Once popular venues get more viewers, they get more "I'm Coming" taps, which makes them appear even more popular, which concentrates all demand on 3-4 hot spots while other venues get ignored. This is good for those venues but bad for the ecosystem. **Build in discovery mechanics for less-popular venues** — "hidden gem" tags, "rising vibe" indicators, or randomised featured spots. A healthy ecosystem needs distribution, not just concentration.

---

### Jean-luc Doumont — Communication & Structured Clarity

The document's communication is strong. The one-line pitch is excellent. Refinements to the messaging architecture for different audiences:

**The Pitch Hierarchy** (adapt by audience):

**To a venue owner (30 seconds):**
> "Your best nights are invisible to the people who would come if they knew. Live Vibe lets you broadcast your vibe in real time to people nearby who are deciding where to go tonight — and shows you how many are on their way."

**To a viewer (15 seconds):**
> "Stop guessing. See what's happening at venues near you, live, right now. Tap 'I'm Coming' and go."

**To an investor (60 seconds):**
> "Live Vibe is a real-time venue discovery marketplace. Venues live-stream when they're busy. Going-out crowds browse, compare, and commit — we show venues a count of inbound guests. We monetise through venue subscriptions, promoted placement, and intent data. Our moat is hyper-local network density and operational integration that platforms like Instagram will never purpose-build. We're launching in one neighbourhood to prove the unit economics, then expanding city by city."

**Structural recommendation**: the document conflates *strategic analysis* with *business plan*. These should be separated:

1. **The pitch deck** — what and why, aimed at venues, investors, and early hires
2. **The strategy document** — competitive analysis, moats, risks (what you have now)
3. **The execution plan** — beachhead selection, 90-day milestones, success metrics

Right now everything lives in one document. That dilutes the impact of each message for its intended audience.

---

## Round 2: DEBATE — Key Tensions

---

### Debate 1: MVP Scope

**Taleb**: The barbell strategy is clear — reliable streams plus "I'm Coming." Nothing else in V1.

**Christensen**: I disagree on cutting the Vibe Meter. Without it, you have a list of live streams with no signal for quality. The viewer has to watch each one to decide. That's too much friction. A simple aggregate reaction metric is essential to the *job* of deciding quickly.

**Meadows**: Christensen is right. My systems analysis shows decision latency is the highest-leverage intervention point. The Vibe Meter directly reduces it. Without it, you're asking viewers to do the work — and they won't.

**Taleb**: Fine. But keep it brutally simple — a single number or icon, not a dashboard. The moment you over-engineer the Vibe Meter, you've added complexity that can break.

**Panel consensus**: MVP = live streams + proximity discovery + Vibe Meter (simple) + "I'm Coming" counter. Four features. Nothing else.

---

### Debate 2: Monetisation Timing

**Porter**: I flagged that venue power is high early on. You may need to *pay* venues to participate, not charge them.

**Godin**: Stronger than that — the early venues aren't customers, they're **co-creators**. Treat them like founding partners. Give them equity in the outcome — "You're one of our first 20 venues, you'll always have premium features free."

**Collins**: The economics need to work at the unit level eventually. $200/month/venue is the target. But you're 12-18 months away from being able to charge that. Revenue in Year 1 should be zero. **Prove the flywheel, then monetise the momentum.**

**Drucker**: I'll add: the first revenue should come from **promoted placement**, not subscriptions. It's transaction-based, requires no long-term commitment from venues, and directly ties your revenue to the value you deliver (visibility during peak hours).

**Panel consensus**: No venue charges for 12+ months. First revenue = promoted placement. Subscriptions come after you've proven walk-in conversion consistently.

---

### Debate 3: Platform Risk from Instagram/TikTok

**Porter**: This is the existential question. If Instagram adds a "Live Near Me" filter, your entire discovery advantage evaporates overnight.

**Godin**: No, it doesn't. **Intent is different.** Someone opening Instagram is in consumption mode. Someone opening Live Vibe is in *decision* mode. That's a fundamentally different mindset and UX. Instagram will never optimise for "help me decide where to go in the next 30 minutes" because that's not what 99.9% of their users are doing.

**Kim & Mauborgne**: Seth is correct from a Blue Ocean perspective. The value curve is different. But Porter isn't wrong about the *risk*. The defence isn't "they won't do it" — it's **"even if they do, our operational integration (I'm Coming loop, venue staff workflow, vibe analytics) creates value they can't replicate with a feature toggle."**

**Taleb**: I'll add the antifragile angle. If Instagram launches "Live Near Me," it validates the market, trains users on the behaviour, and then those users go looking for the purpose-built app. **Pray for Instagram to copy the surface feature.** It's the best marketing you'll ever get.

**Panel consensus**: Platform risk is real but manageable. The defence is operational depth (I'm Coming, venue integration, patron validation), not feature differentiation. Speed matters — you need to have the operational layer built before a big platform enters.

---

## Synthesis: Panel Recommendations

### Unanimous Agreement

1. **The "I'm Coming" feature is the strategic centrepiece.** Every expert identified it as the most novel, defensible, and high-leverage element. Build it early, protect its signal integrity, and make it visible everywhere.

2. **Beachhead strategy is correct and should be even narrower.** One neighbourhood, one night, 15+ venues, 500+ viewers. Drucker's 90-day OKR is the right frame.

3. **Trust is the product.** Not the stream, not the app, not the features. If the platform lies — even once, even by omission — you lose. Every design decision should ask: "does this increase or decrease trust in what the viewer sees?"

4. **Don't monetise for 12+ months.** Prove the flywheel, demonstrate walk-in conversion, then charge. First revenue = promoted placement, not subscriptions.

5. **Content moderation is Tier 0, not Tier 2.** Live nightlife video will surface harmful content. Budget for moderation from day one.

### Strategic Priorities (Ranked)

| Priority | Action | Owner |
|----------|--------|-------|
| 1 | Select beachhead neighbourhood and recruit first 15-20 venues personally | Founder |
| 2 | Build MVP: live discovery + Vibe Meter + "I'm Coming" | Engineering |
| 3 | Solve the device/streaming workflow for venues (dedicated mount/device) | Operations |
| 4 | Implement content moderation pipeline | Trust & Safety |
| 5 | Launch on a single night (Friday) with guaranteed supply | Growth |
| 6 | Measure: streams -> viewers -> "I'm Coming" taps -> actual walk-ins | Analytics |
| 7 | Share conversion data with venues to accelerate the flywheel | Venue Relations |

### The One Question That Determines Everything

**Meadows**: Does seeing a live stream actually change someone's behaviour? Does it convert a "maybe I'll go out" into "I'm going there"? Everything in this document — the strategy, the moat, the monetisation — rests on that single behavioural assumption. **Test it before you build anything.** Set up 10 venues on Instagram Live with location tags, text 200 friends the links on a Friday night, and see if anyone changes their plans. If they do, build the platform. If they don't, the premise is wrong and no amount of product will fix it.

---

*Panel adjourned.*

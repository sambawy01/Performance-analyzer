# Opsnerve AI Sports OS — Architecture & Brainstorm Document

**Working Document | March 2026 | Confidential**
**Last Updated: March 21, 2026**

---

## 1. Company Structure

### Opsnerve (Parent Company)
- **Ownership:** 100% founders
- **Role:** AI integration company — builds the horizontal AI OS platform
- **Scope:** Cross-vertical (sports today, expandable to healthcare, education, logistics, etc.)
- **IP:** Owns all core platform technology, AI engine, infrastructure

### Sports Entity (New Company — Name TBD)
- **Ownership:** 50% Opsnerve founders / 50% Ahmed Hossam (Mido)
- **Role:** Vertical application layer for football — go-to-market, sales, domain expertise
- **Scope:** Football academies first, then first teams
- **Revenue:** SaaS subscriptions from academies + potential data licensing + transfer-linked revenue
- **Licensing:** Exclusively licenses Opsnerve's AI OS platform for the football vertical

### The Maker Football Incubator (Founding Client)
- **Relationship:** First paying client — not a freebie
- **Role:** Live R&D lab / showcase / proof of concept
- **Data Ownership:** All data generated on the platform belongs to The Maker with all rights reserved
- **Player Consent:** All players sign consent forms at enrollment covering biometric, performance, video, medical, and psychological data
- **Current Scale:** 65 staff, 3 age groups (2010, 2012, 2013), 4 locations (October, New Cairo, Maadi, + scholarship HQ)

### Strategic Moat
- Mido at 50% equity = co-founder narrative, not endorsement deal
- "Built by Mido" = football company that built tech FROM football, not tech company selling TO football
- Franchise model potential: replicate the vertical co-ownership model across sports (basketball, cricket, athletics — each with a domain legend co-owning a vertical entity, all powered by Opsnerve platform)

---

## 2. OS Layer Architecture

### Layer 0 — Data Governance & Consent (Foundation)

Everything sits on top of this. Nothing moves without it.

**Components:**
- Player consent management system
  - Tiered consent model:
    - **Tier 1 — Internal Only:** Coaching staff, medical, S&C see all data
    - **Tier 2 — Scout Visible:** Player profile appears in scout-facing layer with approved metrics only
    - **Tier 3 — Full Visibility:** Video highlights, medical clearance, full development profile for European club trials
  - Parent/guardian controls the tier per player
- Digital consent flow at enrollment (parent/guardian signs digitally)
- Data retention policies with configurable timelines
- Right to deletion workflows (player/family can request full data removal)
- Audit trails for every data access event (who accessed what, when, why)
- Compliance framework:
  - Egyptian Data Protection Law (Law No. 151)
  - GDPR (required for European scout/club interactions)
  - FIFA regulations on minors
- Academy-level data ownership: all player data belongs to the academy, not the platform
- Anonymized/aggregated data layer: platform can generate anonymized benchmarks across the network without exposing individual player data

**Why this matters:** Solves a problem most academies don't even know they have. When a European club's legal team asks "do you have consent to share this player's data?" — The Maker can show the system. Competitive advantage and reputation protection for Mido.

---

### Layer 1 — Data Infrastructure

The raw pipes. Storage, schemas, real-time data.

**Structured Data:**
- Player profiles (personal info, position, age group, development phase)
- Staff records (role, department, certifications, schedule)
- Training session logs (date, type, duration, participants, objectives, outcomes)
- Match data (lineups, stats, tactical notes, opponent info)
- Medical records (injuries, treatments, rehabilitation timelines, clearances)
- Fitness testing results (speed, agility, endurance, strength benchmarks)
- Financial transactions (fees, salaries, expenses, sponsor payments)
- Attendance records (players, staff, across all locations)
- Facility bookings and utilization
- Academic/education records (subjects, grades, tutor assignments)
- Psychological assessments and wellbeing logs

**Unstructured Data:**
- Video footage (training sessions, matches, highlights)
- Photos (events, marketing, player progression)
- Scouting reports and observation notes
- Documents (contracts, consent forms, sponsor agreements)
- Communication logs

**Architecture:**
- Multi-tenant from day one (every academy isolated, shared schema)
- Real-time subscriptions for live dashboards
- Cloud-hosted with regional compliance (data residency for MENA)
- Backup and disaster recovery protocols

---

### Layer 2 — Device & Integration Layer

Where the physical world connects to the OS.

**Hardware Integrations (ingest, don't manufacture):**
- GPS tracking vests (Catapult, STATSports, Playermaker)
- Heart rate monitors
- Force plates and jump testing equipment
- Speed gates and timing systems
- Video cameras (training and match footage feeds)
- Biometric scanners (attendance)
- Body composition analyzers

**External Platform Integrations:**
- Federation registration systems (Egyptian FA, FIFA Connect)
- League scheduling databases
- School/university academic systems (for education module)
- Payment gateways (for parent fee collection)
- Social media APIs (for content distribution)
- Communication platforms (WhatsApp Business API, email)
- Video analysis platforms (Hudl, Wyscout — import/export)

**Integration Architecture:**
- Open APIs and webhook receivers
- Standardized data ingestion pipelines
- Device-agnostic: the OS doesn't care which GPS vest brand you use
- SDK for third-party developers to build integrations

---

### Layer 3 — AI Engine (Opsnerve Core IP)

This is what makes it an OS, not just a database with a UI. The horizontal intelligence layer.

**Sub-Engines:**

#### 3a. Pattern Recognition Engine
- Correlates data across departments automatically
- Connects training load → injury risk → match performance → psychological readiness
- Identifies development patterns: which training methods produce the fastest improvement for specific player profiles
- Detects anomalies: sudden performance drops, unusual attendance patterns, behavioral changes

#### 3b. Prediction Engine
- Injury probability scoring based on load, history, fatigue markers, growth spurts
- Player development trajectory forecasting (where will this player be in 6/12/24 months?)
- Readiness scoring: is this player ready for a European trial? For a step-up in competition?
- Team performance prediction based on training data and squad fitness

#### 3c. Natural Language Engine
- Query the system in plain Arabic or English
- "Show me the fitness test trends for the 2010 group over the last 3 months"
- "Which players are at high injury risk this week?"
- "Compare Ahmed's development curve to the top 5 center backs in his age group"
- No SQL, no dashboard navigation — just ask

#### 3d. Automation Engine
- Trigger-based workflows:
  - If player load exceeds threshold → alert medical + reduce next session intensity
  - If player misses 3 sessions → notify parent + flag for welfare check
  - If fitness test results decline → schedule S&C review
  - If sponsor report is due → auto-generate from latest data
- Scheduling automation: AI-optimized training schedules based on match calendar, facility availability, staff allocation, and player load management

#### 3e. Reporting Engine
- Auto-generates documents that currently take hours:
  - Player assessment PDFs (currently manual at The Maker)
  - Sponsor reports with KPIs and branding
  - Parent update summaries
  - Federation compliance filings
  - Monthly board reports for academy directors
  - Scout-facing player profiles with standardized metrics
- Multi-language output (Arabic + English minimum)

---

### Layer 4 — Department Modules

Each department gets its own workspace. All share the same underlying data. Mirrors The Maker's actual operational structure.

#### 4a. Football / Coaching Module
- Session planning with drag-and-drop tactical board
- Training periodization and curriculum management by age group
- Match analysis tools (post-match review, tactical breakdowns)
- Player evaluation forms (standardized across coaches)
- Age-group philosophy documentation and enforcement
- Video tagging and clip creation
- Opposition scouting and preparation
- **Primary Users:** Technical Directors (Mohamed Fawzy — 2010s, Tarek Shaaban), coaches, assistants

#### 4b. Physical Performance Module
- Fitness testing protocols and automated result tracking
- GPS load monitoring dashboards (acute:chronic workload ratio)
- S&C programming and exercise library
- Fatigue and readiness indices (daily player status)
- Growth and maturation tracking (critical for youth)
- Return-to-play protocols (bridges to medical module)
- **Solves The Maker's biggest gap:** Currently zero GPS, zero data, pure observation-based S&C

#### 4c. Medical Module
- Injury tracking (type, mechanism, severity, location on body)
- Treatment logs and rehabilitation timelines
- Medical clearance workflows (return-to-train, return-to-play)
- Prescription and referral management
- Insurance and medical provider integration
- Historical injury patterns (feeds into prediction engine)
- **Integration:** Pulls data from physical performance module for injury risk correlation

#### 4d. Education & Psychology Module
- Academic scheduling and tutor assignment
- Lesson tracking and progress reporting
- Psychological assessment tools (age-appropriate)
- Wellbeing check-ins (mood tracking, life events)
- Life skills curriculum management
- Parent communication on academic progress
- **Critical context:** Education is The Maker's biggest structural weakness (only 3% of staff). AI multiplies the impact of those 2 staff members by automating scheduling, tracking, and reporting

#### 4e. Scouting & Recruitment Module
- Player discovery database (internal talent pool)
- Trial management workflows (invite → assess → decide)
- Evaluation tools with standardized metrics
- Comparison tools against development benchmarks
- Scout-facing layer for outbound visibility (consent-gated)
- Agent/intermediary management
- European trial pipeline tracking

#### 4f. Commercial & Marketing Module
- Sponsor management dashboard (deliverables, deadlines, ROI reporting)
- Social media content calendar and scheduling
- Brand asset library
- Parent communication portal (announcements, events, updates)
- Enrollment pipeline tracking (leads → trials → enrolled → retained)
- Event management (open days, tournaments, showcases)
- Merchandise and ancillary revenue tracking
- **Missing at The Maker today:** Video/content producer, sponsorship manager, digital analytics — AI fills these gaps

#### 4g. Operations & Admin Module
- Staff scheduling and attendance
- Facility management (pitch bookings, gym slots, classroom allocation)
- Equipment inventory and procurement
- Transport logistics (bus routes, match day travel)
- Catering management (meal planning, dietary tracking for players)
- Financial tracking (budgets, expenses, revenue)
- Payroll integration
- **Highest automation potential** per The Maker's own playbook analysis

---

### Layer 5 — Role-Based Portals

Same data, different views. Every user sees exactly what they need.

#### 5a. Academy Director Portal (Command Center)
- KPIs across all departments at a glance
- Headcount and budget overview
- Player pipeline health (enrollment, retention, graduation, trials)
- Facility utilization rates
- Sponsor relationship status
- Alerts and exceptions that need attention
- **User:** Tamer Hossam (GM), board members

#### 5b. Coach Portal (Mobile-First)
- Today's sessions with player availability
- Quick video review and clip sharing
- Session feedback forms (one-tap ratings + notes)
- Player status dashboard (fitness, medical clearance, mood)
- Direct messaging with parents (templated for speed)
- **User:** All coaching staff (22 people at The Maker)

#### 5c. Parent Portal
- Child's development journey (timeline view)
- Attendance history
- Progress reports (coaching, academic, physical)
- Upcoming schedule
- Consent management (change tier at any time)
- Fee payments and financial history
- Direct messaging with relevant staff
- **User:** Parents/guardians of all enrolled players

#### 5d. Scout Portal (External-Facing)
- Searchable player profiles (only Tier 2 and Tier 3 consent)
- Standardized metrics with percentile benchmarks
- Video highlights (curated by coaching staff, approved by family)
- Development trajectories and trend data
- Contact/inquiry workflow (request a trial, request more info)
- **User:** Registered scouts, agents, club representatives
- **This is the marketplace angle** — creates network effects at scale

#### 5e. Player Portal (Age-Appropriate)
- Personal schedule (training, matches, education, meals)
- Goals and targets set by coaching staff
- Feedback from coaches (positive reinforcement focused)
- Educational assignments and progress
- Wellbeing resources and self-check-in tools
- **User:** Players (UI adapted for age group)

#### 5f. Mido's Strategic Portal
- Cross-location overview (all Maker branches)
- Aggregated platform metrics (if multiple academies onboarded)
- Player showcase highlights (top talent for his network)
- Commercial pipeline and sponsor health
- Media/PR dashboard
- **User:** Ahmed Hossam (Mido) — founder/investor view

---

### Layer 6 — Network Layer (Multi-Academy)

Activates when multiple academies join the platform. This is the moat.

**Components:**
- Anonymized developmental benchmarks across all academies
  - Percentile curves by age, position, region
  - "How does this 14-year-old CB compare to all 14-year-old CBs on the platform?"
- Transfer/loan facilitation between academies on the network
- Shared scouting pools (opt-in by academy)
- Federation-level reporting (aggregate data for national associations)
- Best practice sharing (anonymized operational insights)
- Network-wide event coordination (inter-academy tournaments, showcase events)

**Network Effects:**
- Every new academy makes benchmarks more accurate
- Every new academy adds players to the scout-facing catalogue
- Every new academy generates more training data for the AI engine
- Switching cost increases as historical data accumulates

---

## 3. Go-To-Market Strategy

### Phase 1 — The Maker (Months 1–6)
- Build and deploy the OS for The Maker across all locations
- Prove the technology works in production
- Document transformation metrics (time saved, data quality, player outcomes)
- Generate case study material for sales

### Phase 2 — Egyptian Academy Market (Months 6–18)
- Target paid academies: Wadi Degla, Future FC youth, LaLiga Academy Cairo
- Pricing model: SaaS subscription tiered by academy size
- Mido's personal network as primary sales channel
- Demo approach: "Come see how The Maker runs — this is the same system"

### Phase 3 — MENA Expansion (Months 12–30)
- Saudi Arabia (Vision 2030 sports infrastructure investment)
- UAE, Qatar (established academy ecosystems)
- Morocco (growing football development culture)
- Greenfield advantage: new academies need an OS from day one

### Phase 4 — African Football (Months 24–48)
- Nigeria, Ghana, South Africa, Senegal
- Right to Dream counter-positioning (better tech, lower cost, data-driven)
- Federation partnerships for national youth development programs

### Phase 5 — First Team Extension
- Extend OS to professional first teams
- Squad management, match preparation, medical compliance, transfer analytics
- Players developed on the platform carry longitudinal data to first team
- Mido's European relationships open doors at club level

---

## 4. Key Decisions Still Open

- [ ] Name for the new sports entity
- [ ] Shareholders' agreement terms (decision rights, exit mechanics, non-compete)
- [ ] Licensing structure between Opsnerve and sports entity (flat fee vs. revenue share vs. per-academy)
- [ ] The Maker pricing (founding partner rate — discounted but not free)
- [ ] Technology stack decisions (cloud provider, database, mobile framework)
- [ ] Data residency requirements for MENA markets
- [ ] Scout portal: free access or subscription model?
- [ ] First hires for the sports entity (CTO? Head of Sales? Product lead?)
- [ ] Fundraising strategy: bootstrap with The Maker revenue or raise seed capital?

---

## 5. Competitive Landscape

| Competitor | What They Do | Our Advantage |
|---|---|---|
| Catapult | GPS wearables + analytics | We're device-agnostic, full operations not just physical |
| Hudl | Video analysis | We integrate video into the full player picture |
| Wyscout | Scouting data marketplace | We own the development data, not just match data |
| SAP Sports One | Enterprise sports management | Too expensive and complex for academies |
| Right to Dream | Full academy competitor | Legacy systems, no AI OS, we out-operate with tech |
| PlayerMaker | Foot-mounted tracking | Niche hardware play, we're the OS layer above all hardware |

---

## 6. Revenue Model (Brainstorm)

### Primary Revenue Streams
- **SaaS Subscription:** Monthly/annual fee per academy, tiered by size and modules
- **Implementation Fee:** One-time onboarding, data migration, customization
- **Hardware Partnerships:** Revenue share with device manufacturers (GPS vest vendors, etc.)

### Secondary Revenue Streams (Future)
- **Data Licensing:** Anonymized benchmarks sold to federations, agents, research institutions
- **Scout Portal Access:** Premium subscription for scouts/agents to access the player marketplace
- **Transfer Revenue Share:** Small percentage when a player developed on the platform completes a paid transfer (requires contractual framework)
- **Training/Certification:** Academy staff training on the OS, certified "Opsnerve Academy" badge

---

## 7. Brainstorm Notes & Ideas

*This section is for raw ideas captured during ongoing brainstorming sessions.*

### Session 1 — March 21, 2026
- The Maker's 65-person operation is the perfect R&D lab — big enough to be meaningful, small enough to iterate fast
- Mido's 50% equity transforms every conversation from "let me sell you software" to "let me show you what I built for my own academy"
- Consent architecture as a first-class product feature, not legal compliance checkbox — parents choosing data tiers is a selling point
- The franchise model: Mido for football, find legends in other sports for other verticals, Opsnerve platform underneath all of them
- "Built by Mido" > "Endorsed by Mido" — the narrative matters
- Created CONTEXT.md — full technical specification for developers covering: Supabase + Next.js + React Native stack, complete database schema (25+ tables), multi-tenant RLS architecture, role/permission system, consent enforcement logic, API design, project folder structure, and 6-sprint build plan

---

*Document will be updated as brainstorming continues.*

-- seed-full-demo.sql
-- Full one-month demo data for Coach M8 / The Maker U16
-- Simulates Feb 22 - Mar 22, 2026
-- Shows clear improvement trajectory over 4 weeks

-- Clear existing demo data first
TRUNCATE sessions, videos, video_tags, wearable_sessions, wearable_metrics,
  load_records, tactical_metrics, player_baselines, development_snapshots CASCADE;

-- ============================================================
-- SESSIONS (28 sessions: Feb 22 - Mar 22, 2026)
-- U16 = age_group '2010'
-- ============================================================

INSERT INTO sessions (id, academy_id, date, type, location, duration_minutes, age_group, weather_conditions, coach_id, notes) VALUES

-- WEEK 1: Feb 22-28 — Base fitness, getting used to HR monitoring
('c1000001-0000-0000-0000-000000000001','a0000000-0000-0000-0000-000000000001','2026-02-22','training','HQ',75,'2010','Clear, 18°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 1 Day 1 — Fitness baseline assessments. HR monitor orientation. 4-4-2 shape introduction. Players unfamiliar with chest straps — elevated readings expected.'),
('c1000001-0000-0000-0000-000000000002','a0000000-0000-0000-0000-000000000001','2026-02-23','training','HQ',75,'2010','Partly cloudy, 17°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 1 Day 2 — Aerobic base work. 4-4-2 defensive shape. Long slow distance runs. HR zones targeted Z2-Z3.'),
('c1000001-0000-0000-0000-000000000003','a0000000-0000-0000-0000-000000000001','2026-02-24','training','October',80,'2010','Clear, 20°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 1 Day 3 — Ball mastery circuits. 4-4-2 positioning drills. Passing patterns under low pressure.'),
('c1000001-0000-0000-0000-000000000004','a0000000-0000-0000-0000-000000000001','2026-02-26','training','October',80,'2010','Clear, 21°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 1 Day 4 — Small-sided games (SSG) 4v4. Shooting drills. Introduce pressing cues off the ball.'),
('c1000001-0000-0000-0000-000000000005','a0000000-0000-0000-0000-000000000001','2026-02-27','training','New Cairo',75,'2010','Windy, 16°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 1 Day 5 — Recovery session. Stretching + light technical work. Pre-match prep in 4-4-2.'),
('c1000001-0000-0000-0000-000000000006','a0000000-0000-0000-0000-000000000001','2026-02-28','friendly','New Cairo',90,'2010','Clear, 19°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 1 Saturday Friendly — vs Heliopolis U16. 4-4-2. First match in monitoring system. Result: 1-1. Players showing fatigue in second half.'),

-- WEEK 2: Mar 1-7 — Technical work + first competitive match data
('c1000001-0000-0000-0000-000000000007','a0000000-0000-0000-0000-000000000001','2026-03-02','training','HQ',75,'2010','Clear, 20°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 2 Day 1 — Recovery review post-friendly. Begin 4-3-3 shape introduction. Positional principles for wide forwards.'),
('c1000001-0000-0000-0000-000000000008','a0000000-0000-0000-0000-000000000001','2026-03-03','training','HQ',80,'2010','Clear, 22°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 2 Day 2 — 4-3-3 transition drills. Rondos. Midfield triangle movement patterns.'),
('c1000001-0000-0000-0000-000000000009','a0000000-0000-0000-0000-000000000001','2026-03-05','training','Maadi',80,'2010','Overcast, 18°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 2 Day 3 — Pressing triggers introduction. 4-3-3 high press shape. Ball-side overload patterns.'),
('c1000001-0000-0000-0000-000000000010','a0000000-0000-0000-0000-000000000001','2026-03-06','training','Maadi',75,'2010','Partly cloudy, 19°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 2 Day 4 — SSG 5v5 with pressing rules. Counter-attack scenarios. Players adapting to new shape.'),
('c1000001-0000-0000-0000-000000000011','a0000000-0000-0000-0000-000000000001','2026-03-07','match','October',90,'2010','Clear, 21°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 2 Saturday Match — vs Zamalek Academy U16. First competitive match in 4-3-3. Result: 2-1 win. Good pressing in first half, faded in second.'),

-- WEEK 3: Mar 8-14 — Tactical pressing drills, formation work
('c1000001-0000-0000-0000-000000000012','a0000000-0000-0000-0000-000000000001','2026-03-09','training','HQ',75,'2010','Clear, 23°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 3 Day 1 — Video review of Zamalek match. Pressing triggers reinforcement. 4-3-3 compactness drills.'),
('c1000001-0000-0000-0000-000000000013','a0000000-0000-0000-0000-000000000001','2026-03-10','training','HQ',80,'2010','Clear, 24°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 3 Day 2 — High press 4-3-3 vs 4-4-2 shadow. PPDA target: under 10. Defensive line height drills.'),
('c1000001-0000-0000-0000-000000000014','a0000000-0000-0000-0000-000000000001','2026-03-12','training','October',85,'2010','Clear, 25°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 3 Day 3 — Positional play in 4-3-3. Wide forward support runs. Transition from press to counter.'),
('c1000001-0000-0000-0000-000000000015','a0000000-0000-0000-0000-000000000001','2026-03-13','training','October',80,'2010','Partly cloudy, 22°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 3 Day 4 — Set pieces training. Corner routines. Free kick formations. Build-out-from-back patterns.'),
('c1000001-0000-0000-0000-000000000016','a0000000-0000-0000-0000-000000000001','2026-03-14','friendly','New Cairo',90,'2010','Clear, 21°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 3 Saturday Friendly — vs Al Ahly Academy U16. 4-3-3 fully deployed. Result: 3-0 win. Pressing much improved, compactness excellent.'),

-- WEEK 4: Mar 15-22 — Match prep, competitive matches, peak performance
('c1000001-0000-0000-0000-000000000017','a0000000-0000-0000-0000-000000000001','2026-03-16','training','HQ',70,'2010','Clear, 26°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 4 Day 1 — Recovery + tactical review. 4-2-3-1 shape introduction as alternative. Light technical work.'),
('c1000001-0000-0000-0000-000000000018','a0000000-0000-0000-0000-000000000001','2026-03-17','training','HQ',80,'2010','Clear, 27°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 4 Day 2 — 4-2-3-1 vs 4-3-3 shape rotation. Players showing tactical maturity. High intensity pressing maintained.'),
('c1000001-0000-0000-0000-000000000019','a0000000-0000-0000-0000-000000000001','2026-03-19','training','Maadi',80,'2010','Clear, 25°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 4 Day 3 — Final match prep. 11v11 practice match. Fluid between 4-3-3 and 4-2-3-1. Fitness peak observed.'),
('c1000001-0000-0000-0000-000000000020','a0000000-0000-0000-0000-000000000001','2026-03-20','training','Maadi',75,'2010','Partly cloudy, 24°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 4 Day 4 — Pre-match activation. Set pieces review. Penalty practice. Light technical circuits.'),
('c1000001-0000-0000-0000-000000000021','a0000000-0000-0000-0000-000000000001','2026-03-21','match','October',90,'2010','Clear, 23°C','c7ebe0b1-772a-4e89-a995-78a94c92116a','Week 4 Saturday Match — vs Pyramids FC Academy U16. Season highlight match. 4-3-3. Result: 4-1 win. Best performance of month. PPDA 7.2, exceptional transitions.');

-- ============================================================
-- VIDEOS — matches + key training sessions
-- ============================================================

INSERT INTO videos (id, session_id, source_type, source_url, duration_seconds, resolution, fps, processing_status) VALUES
-- Friendlies and matches all get Veo links
('e1000001-0000-0000-0000-000000000001','c1000001-0000-0000-0000-000000000006','veo_link','https://app.veo.co/matches/themaker-u16-heliopolis-20260228/',5400,'1080p',30,'linked'),
('e1000001-0000-0000-0000-000000000002','c1000001-0000-0000-0000-000000000011','veo_link','https://app.veo.co/matches/themaker-u16-zamalek-20260307/',5400,'1080p',30,'linked'),
('e1000001-0000-0000-0000-000000000003','c1000001-0000-0000-0000-000000000016','veo_link','https://app.veo.co/matches/themaker-u16-alahly-20260314/',5400,'1080p',30,'linked'),
('e1000001-0000-0000-0000-000000000004','c1000001-0000-0000-0000-000000000021','veo_link','https://app.veo.co/matches/themaker-u16-pyramids-20260321/',5400,'1080p',30,'linked'),
-- Key training sessions also get Veo links
('e1000001-0000-0000-0000-000000000005','c1000001-0000-0000-0000-000000000013','veo_link','https://app.veo.co/matches/themaker-u16-training-press-20260310/',4800,'1080p',30,'linked'),
('e1000001-0000-0000-0000-000000000006','c1000001-0000-0000-0000-000000000019','veo_link','https://app.veo.co/matches/themaker-u16-training-11v11-20260319/',4800,'1080p',30,'linked'),
('e1000001-0000-0000-0000-000000000007','c1000001-0000-0000-0000-000000000009','veo_link','https://app.veo.co/matches/themaker-u16-training-press-intro-20260305/',4800,'1080p',30,'linked');

-- ============================================================
-- VIDEO TAGS — match moments
-- tagged_by = coach user ID c7ebe0b1-772a-4e89-a995-78a94c92116a
-- ============================================================

-- MATCH 1: Friendly vs Heliopolis (session 6, video 1) — 1-1 draw
INSERT INTO video_tags (video_id, player_id, timestamp_start, timestamp_end, tag_type, label, tagged_by) VALUES
('e1000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000011',312.0,320.0,'goal','Goal — Tamer Reda tap-in from corner (38:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000008',480.0,495.0,'press','Good press trigger by Ali Tarek, won ball back (40:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000003',890.0,900.0,'tackle','Strong tackle Omar Saeed — defensive recovery (49:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000009',1580.0,1595.0,'sprint','Mostafa Ibrahim — counter-attack burst (66:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000010',2100.0,2115.0,'dribble','Adel Sherif beat two defenders — wide run (75:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000006',2980.0,2990.0,'tackle','Ziad Mohamed — crucial block near area (83:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000007',3200.0,3210.0,'press','Hassan Khaled — midfield press, turnovers forced (89:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000001',3360.0,3375.0,'custom','Ahmed Hassan — big save in 94th minute — kept draw','c7ebe0b1-772a-4e89-a995-78a94c92116a');

-- MATCH 2: vs Zamalek (session 11, video 2) — 2-1 win
INSERT INTO video_tags (video_id, player_id, timestamp_start, timestamp_end, tag_type, label, tagged_by) VALUES
('e1000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000009',420.0,432.0,'goal','Goal — Mostafa Ibrahim through-ball finish (7:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000008',780.0,795.0,'press','Ali Tarek — pressing trigger won ball, led to chance (13:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000010',1050.0,1065.0,'sprint','Adel Sherif — wing run, beat offside trap (17:30)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000011',1500.0,1510.0,'goal','Goal — Tamer Reda header from corner (25:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000002',2100.0,2112.0,'tackle','Youssef Ali — important interception to hold lead (35:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000007',2800.0,2815.0,'pass','Hassan Khaled — switch of play, unlocked Adel on wing (46:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000004',3400.0,3415.0,'sprint','Mahmoud Fathy — overlapping run, cross created chance (57:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000006',4200.0,4212.0,'tackle','Ziad Mohamed — vital tackle, game winner secure (70:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000001',4800.0,4815.0,'custom','Ahmed Hassan — one-on-one save, preserved 2-1 lead (80:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000005',5100.0,5112.0,'press','Karim Nabil — late press, crowd loved it (85:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a');

-- MATCH 3: Friendly vs Al Ahly (session 16, video 3) — 3-0 win
INSERT INTO video_tags (video_id, player_id, timestamp_start, timestamp_end, tag_type, label, tagged_by) VALUES
('e1000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000008',540.0,552.0,'goal','Goal — Ali Tarek curling effort from edge (9:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000007',900.0,915.0,'press','Hassan Khaled — textbook pressing trigger, turnover leads to goal (15:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000009',1200.0,1215.0,'goal','Goal — Mostafa Ibrahim solo run, 2-0 (20:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000010',1800.0,1815.0,'sprint','Adel Sherif — blistering wing run set up third (30:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000011',2040.0,2052.0,'goal','Goal — Tamer Reda headed finish, 3-0 (34:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000006',2700.0,2712.0,'tackle','Ziad Mohamed — brilliant press recovery in midfield (45:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000003',3300.0,3315.0,'tackle','Omar Saeed — dominant heading duel, cleared danger (55:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000004',3900.0,3915.0,'sprint','Mahmoud Fathy — full-back bomb forward (65:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000008',4500.0,4515.0,'dribble','Ali Tarek — nutmeg in midfield, sparked counter (75:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000005',5000.0,5015.0,'press','Karim Nabil — backs to the wall press held clean sheet (83:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a');

-- MATCH 4: vs Pyramids (session 21, video 4) — 4-1 win (BEST MATCH)
INSERT INTO video_tags (video_id, player_id, timestamp_start, timestamp_end, tag_type, label, tagged_by) VALUES
('e1000001-0000-0000-0000-000000000004','b0000001-0000-0000-0000-000000000007',360.0,372.0,'press','Hassan Khaled — perfect pressing trigger, team follows (6:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000004','b0000001-0000-0000-0000-000000000009',600.0,612.0,'goal','Goal — Mostafa Ibrahim counter-attack, 1-0 (10:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000004','b0000001-0000-0000-0000-000000000010',1080.0,1095.0,'sprint','Adel Sherif — incredible wing burst, 2 defenders beaten (18:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000004','b0000001-0000-0000-0000-000000000008',1440.0,1452.0,'goal','Goal — Ali Tarek free kick top corner, 2-0 (24:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000004','b0000001-0000-0000-0000-000000000011',2100.0,2112.0,'goal','Goal — Tamer Reda penalty, 3-0 (35:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000004','b0000001-0000-0000-0000-000000000002',2700.0,2712.0,'tackle','Youssef Ali — outstanding cover tackle (45:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000004','b0000001-0000-0000-0000-000000000006',3000.0,3015.0,'press','Ziad Mohamed — press recycled, team compactness shown (50:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000004','b0000001-0000-0000-0000-000000000004',3600.0,3615.0,'sprint','Mahmoud Fathy — overlapping goal run (60:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000004','b0000001-0000-0000-0000-000000000009',4200.0,4215.0,'goal','Goal — Mostafa Ibrahim brace, 4-1 (70:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000004','b0000001-0000-0000-0000-000000000005',4800.0,4815.0,'press','Karim Nabil — sustained press lasting 90 mins (80:00)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000004','b0000001-0000-0000-0000-000000000003',5200.0,5215.0,'tackle','Omar Saeed — composed clearance late on (86:40)','c7ebe0b1-772a-4e89-a995-78a94c92116a'),
('e1000001-0000-0000-0000-000000000004','b0000001-0000-0000-0000-000000000001',5350.0,5365.0,'custom','Ahmed Hassan — commanding presence throughout (89:10)','c7ebe0b1-772a-4e89-a995-78a94c92116a');

-- ============================================================
-- WEARABLE SESSIONS
-- All 11 U16 players (b0000001-0000-0000-0000-00000000000{1-11})
-- All 21 sessions
-- hr_stream: 6 sample readings per session showing HR arc
-- ============================================================

-- Helper: session start times (training at 17:00, matches at 16:00)
-- We insert all 11 players × 21 sessions = 231 rows

INSERT INTO wearable_sessions (session_id, player_id, device_type, device_id, started_at, ended_at, hr_stream)
SELECT
  s.id AS session_id,
  p.player_id,
  'magene_h303',
  'strap-' || p.jersey_num,
  (s.session_date::date + (CASE WHEN s.stype IN ('match','friendly') THEN INTERVAL '16:00' ELSE INTERVAL '17:00' END))::timestamptz AS started_at,
  (s.session_date::date + (CASE WHEN s.stype IN ('match','friendly') THEN INTERVAL '16:00' ELSE INTERVAL '17:00' END) + (s.dur_min * INTERVAL '1 minute'))::timestamptz AS ended_at,
  -- hr_stream: 6-point arc: warmup -> ramp up -> peak -> sustain -> cool -> finish
  jsonb_build_array(
    jsonb_build_object('timestamp_ms', 0,              'hr', p.hr_rest + p.week_offset),
    jsonb_build_object('timestamp_ms', (s.dur_min * 60000 / 5),    'hr', p.hr_rest + p.week_offset + 35),
    jsonb_build_object('timestamp_ms', (s.dur_min * 60000 * 2 / 5),'hr', p.hr_peak - p.week_offset * 2),
    jsonb_build_object('timestamp_ms', (s.dur_min * 60000 * 3 / 5),'hr', p.hr_peak - p.week_offset),
    jsonb_build_object('timestamp_ms', (s.dur_min * 60000 * 4 / 5),'hr', p.hr_rest + p.week_offset + 20),
    jsonb_build_object('timestamp_ms', (s.dur_min * 60000),        'hr', p.hr_rest + p.week_offset + 5)
  )
FROM (VALUES
  -- session_id alias, session date, type, duration
  ('c1000001-0000-0000-0000-000000000001'::uuid,'2026-02-22','training',75),
  ('c1000001-0000-0000-0000-000000000002'::uuid,'2026-02-23','training',75),
  ('c1000001-0000-0000-0000-000000000003'::uuid,'2026-02-24','training',80),
  ('c1000001-0000-0000-0000-000000000004'::uuid,'2026-02-26','training',80),
  ('c1000001-0000-0000-0000-000000000005'::uuid,'2026-02-27','training',75),
  ('c1000001-0000-0000-0000-000000000006'::uuid,'2026-02-28','friendly',90),
  ('c1000001-0000-0000-0000-000000000007'::uuid,'2026-03-02','training',75),
  ('c1000001-0000-0000-0000-000000000008'::uuid,'2026-03-03','training',80),
  ('c1000001-0000-0000-0000-000000000009'::uuid,'2026-03-05','training',80),
  ('c1000001-0000-0000-0000-000000000010'::uuid,'2026-03-06','training',75),
  ('c1000001-0000-0000-0000-000000000011'::uuid,'2026-03-07','match',90),
  ('c1000001-0000-0000-0000-000000000012'::uuid,'2026-03-09','training',75),
  ('c1000001-0000-0000-0000-000000000013'::uuid,'2026-03-10','training',80),
  ('c1000001-0000-0000-0000-000000000014'::uuid,'2026-03-12','training',85),
  ('c1000001-0000-0000-0000-000000000015'::uuid,'2026-03-13','training',80),
  ('c1000001-0000-0000-0000-000000000016'::uuid,'2026-03-14','friendly',90),
  ('c1000001-0000-0000-0000-000000000017'::uuid,'2026-03-16','training',70),
  ('c1000001-0000-0000-0000-000000000018'::uuid,'2026-03-17','training',80),
  ('c1000001-0000-0000-0000-000000000019'::uuid,'2026-03-19','training',80),
  ('c1000001-0000-0000-0000-000000000020'::uuid,'2026-03-20','training',75),
  ('c1000001-0000-0000-0000-000000000021'::uuid,'2026-03-21','match',90)
) AS s(id, session_date, stype, dur_min)
CROSS JOIN (VALUES
  -- player_id, jersey_num, hr_rest (week1 base), hr_peak, week_offset (decreases each week, proxy by session order)
  ('b0000001-0000-0000-0000-000000000001'::uuid, 1,  62, 188, 4),
  ('b0000001-0000-0000-0000-000000000002'::uuid, 4,  65, 190, 5),
  ('b0000001-0000-0000-0000-000000000003'::uuid, 5,  63, 192, 4),
  ('b0000001-0000-0000-0000-000000000004'::uuid, 2,  64, 191, 5),
  ('b0000001-0000-0000-0000-000000000005'::uuid, 3,  66, 189, 5),
  ('b0000001-0000-0000-0000-000000000006'::uuid, 6,  63, 190, 4),
  ('b0000001-0000-0000-0000-000000000007'::uuid, 8,  64, 191, 4),
  ('b0000001-0000-0000-0000-000000000008'::uuid,10,  61, 193, 3),
  ('b0000001-0000-0000-0000-000000000009'::uuid, 7,  63, 194, 4),
  ('b0000001-0000-0000-0000-000000000010'::uuid,11,  65, 192, 5),
  ('b0000001-0000-0000-0000-000000000011'::uuid, 9,  64, 191, 5)
) AS p(player_id, jersey_num, hr_rest, hr_peak, week_offset)
ON CONFLICT (session_id, player_id) DO UPDATE SET
  hr_stream = EXCLUDED.hr_stream,
  started_at = EXCLUDED.started_at,
  ended_at = EXCLUDED.ended_at;

-- ============================================================
-- WEARABLE METRICS — per player per session
-- Shows 4-week improvement:
--   Week 1 (sessions 1-6):   higher hr_avg, lower trimp, lower recovery, higher RPE
--   Week 2 (sessions 7-11):  slight improvement
--   Week 3 (sessions 12-16): noticeable improvement
--   Week 4 (sessions 17-21): clear peak fitness
-- ============================================================

INSERT INTO wearable_metrics (
  wearable_session_id, player_id, session_id,
  hr_avg, hr_max, hr_min,
  hr_zone_1_pct, hr_zone_2_pct, hr_zone_3_pct, hr_zone_4_pct, hr_zone_5_pct,
  hr_recovery_60s, trimp_score, session_rpe, calories_estimated
)
SELECT
  ws.id AS wearable_session_id,
  ws.player_id,
  ws.session_id,
  -- hr_avg: starts higher, trends down ~1 bpm per week
  (p.hr_avg_base - wk.avg_offset)::int,
  -- hr_max: relatively stable ±2
  (p.hr_max_base + (random() * 4 - 2)::int)::int,
  -- hr_min: trends down as resting fitness improves
  (p.hr_min_base - wk.min_offset)::int,
  -- HR zones: improve from Z5-heavy to Z3/Z4-focused
  (wk.z1 + (random() * 2 - 1))::numeric(5,2),
  (wk.z2 + (random() * 2 - 1))::numeric(5,2),
  (wk.z3 + (random() * 3 - 1.5))::numeric(5,2),
  (wk.z4 + (random() * 3 - 1.5))::numeric(5,2),
  (wk.z5 + (random() * 2 - 1))::numeric(5,2),
  -- hr_recovery_60s: trends up (better = higher)
  (wk.recovery_base + p.recovery_bonus + (random() * 4 - 2)::int)::int,
  -- trimp: trends up as load tolerance improves
  (wk.trimp_base * p.trimp_factor + (random() * 5 - 2.5))::numeric(8,2),
  -- session_rpe: starts high, comes down with fitness
  wk.rpe_base,
  -- calories
  (wk.trimp_base * p.trimp_factor * 4.5)::int
FROM wearable_sessions ws
JOIN (VALUES
  -- player_id, hr_avg_base (week1), hr_max_base, hr_min_base, recovery_bonus, trimp_factor
  ('b0000001-0000-0000-0000-000000000001'::uuid, 158, 188, 68, 2, 1.00),
  ('b0000001-0000-0000-0000-000000000002'::uuid, 162, 190, 70, 0, 1.05),
  ('b0000001-0000-0000-0000-000000000003'::uuid, 160, 192, 69, 1, 1.02),
  ('b0000001-0000-0000-0000-000000000004'::uuid, 161, 191, 70, 1, 1.03),
  ('b0000001-0000-0000-0000-000000000005'::uuid, 163, 189, 71, 0, 1.01),
  ('b0000001-0000-0000-0000-000000000006'::uuid, 159, 190, 68, 1, 1.04),
  ('b0000001-0000-0000-0000-000000000007'::uuid, 160, 191, 69, 2, 1.05),
  ('b0000001-0000-0000-0000-000000000008'::uuid, 157, 193, 67, 3, 1.08),
  ('b0000001-0000-0000-0000-000000000009'::uuid, 161, 194, 69, 2, 1.06),
  ('b0000001-0000-0000-0000-000000000010'::uuid, 163, 192, 71, 0, 1.02),
  ('b0000001-0000-0000-0000-000000000011'::uuid, 162, 191, 70, 1, 1.04)
) AS p(player_id, hr_avg_base, hr_max_base, hr_min_base, recovery_bonus, trimp_factor)
  ON ws.player_id = p.player_id
JOIN (VALUES
  -- session_id, week_num, avg_offset, min_offset, z1, z2, z3, z4, z5, recovery_base, trimp_base, rpe_base
  -- WEEK 1: high hr_avg, low recovery, lower trimp tolerance
  ('c1000001-0000-0000-0000-000000000001'::uuid, 1,  0, 0,  5.0, 12.0, 28.0, 32.0, 23.0, 18, 55.0, 8),
  ('c1000001-0000-0000-0000-000000000002'::uuid, 1,  0, 0,  6.0, 13.0, 29.0, 31.0, 21.0, 17, 58.0, 7),
  ('c1000001-0000-0000-0000-000000000003'::uuid, 1,  0, 0,  5.0, 12.0, 30.0, 32.0, 21.0, 18, 60.0, 8),
  ('c1000001-0000-0000-0000-000000000004'::uuid, 1,  1, 0,  5.0, 11.0, 29.0, 33.0, 22.0, 19, 62.0, 8),
  ('c1000001-0000-0000-0000-000000000005'::uuid, 1,  0, 0,  7.0, 14.0, 30.0, 30.0, 19.0, 18, 52.0, 7),
  ('c1000001-0000-0000-0000-000000000006'::uuid, 1,  1, 0,  4.0, 10.0, 27.0, 34.0, 25.0, 20, 75.0, 9),
  -- WEEK 2: slight improvement
  ('c1000001-0000-0000-0000-000000000007'::uuid, 2,  1, 1,  5.0, 12.0, 30.0, 33.0, 20.0, 21, 58.0, 7),
  ('c1000001-0000-0000-0000-000000000008'::uuid, 2,  2, 1,  5.0, 12.0, 31.0, 33.0, 19.0, 22, 62.0, 7),
  ('c1000001-0000-0000-0000-000000000009'::uuid, 2,  2, 1,  4.0, 11.0, 32.0, 34.0, 19.0, 22, 65.0, 8),
  ('c1000001-0000-0000-0000-000000000010'::uuid, 2,  2, 1,  5.0, 12.0, 31.0, 33.0, 19.0, 23, 62.0, 7),
  ('c1000001-0000-0000-0000-000000000011'::uuid, 2,  1, 1,  4.0, 10.0, 29.0, 35.0, 22.0, 23, 80.0, 8),
  -- WEEK 3: noticeable improvement
  ('c1000001-0000-0000-0000-000000000012'::uuid, 3,  3, 2,  4.0, 11.0, 32.0, 35.0, 18.0, 26, 60.0, 7),
  ('c1000001-0000-0000-0000-000000000013'::uuid, 3,  3, 2,  4.0, 11.0, 33.0, 35.0, 17.0, 27, 68.0, 7),
  ('c1000001-0000-0000-0000-000000000014'::uuid, 3,  3, 2,  4.0, 10.0, 33.0, 36.0, 17.0, 27, 72.0, 7),
  ('c1000001-0000-0000-0000-000000000015'::uuid, 3,  3, 2,  4.0, 11.0, 32.0, 35.0, 18.0, 26, 65.0, 6),
  ('c1000001-0000-0000-0000-000000000016'::uuid, 3,  3, 2,  3.0, 10.0, 30.0, 36.0, 21.0, 27, 82.0, 8),
  -- WEEK 4: clear peak fitness
  ('c1000001-0000-0000-0000-000000000017'::uuid, 4,  5, 3,  5.0, 12.0, 33.0, 34.0, 16.0, 30, 55.0, 6),
  ('c1000001-0000-0000-0000-000000000018'::uuid, 4,  5, 3,  4.0, 11.0, 34.0, 36.0, 15.0, 31, 70.0, 7),
  ('c1000001-0000-0000-0000-000000000019'::uuid, 4,  5, 3,  4.0, 10.0, 34.0, 37.0, 15.0, 32, 74.0, 7),
  ('c1000001-0000-0000-0000-000000000020'::uuid, 4,  5, 3,  5.0, 12.0, 33.0, 35.0, 15.0, 31, 65.0, 6),
  ('c1000001-0000-0000-0000-000000000021'::uuid, 4,  5, 3,  3.0,  9.0, 31.0, 38.0, 19.0, 33, 88.0, 8)
) AS wk(session_id, week_num, avg_offset, min_offset, z1, z2, z3, z4, z5, recovery_base, trimp_base, rpe_base)
  ON ws.session_id = wk.session_id
ON CONFLICT (session_id, player_id) DO UPDATE SET
  hr_avg           = EXCLUDED.hr_avg,
  hr_max           = EXCLUDED.hr_max,
  hr_min           = EXCLUDED.hr_min,
  hr_zone_1_pct    = EXCLUDED.hr_zone_1_pct,
  hr_zone_2_pct    = EXCLUDED.hr_zone_2_pct,
  hr_zone_3_pct    = EXCLUDED.hr_zone_3_pct,
  hr_zone_4_pct    = EXCLUDED.hr_zone_4_pct,
  hr_zone_5_pct    = EXCLUDED.hr_zone_5_pct,
  hr_recovery_60s  = EXCLUDED.hr_recovery_60s,
  trimp_score      = EXCLUDED.trimp_score,
  session_rpe      = EXCLUDED.session_rpe,
  calories_estimated = EXCLUDED.calories_estimated;

-- ============================================================
-- LOAD RECORDS — ACWR progression
-- Week 1-2: higher ACWR (1.4-1.8), more amber/red flags
-- Week 3-4: stabilising (0.9-1.2), mostly green
-- ============================================================

INSERT INTO load_records (player_id, session_id, date, daily_load, acute_load_7d, chronic_load_28d, acwr_ratio, risk_flag)
SELECT
  ws.player_id,
  ws.session_id,
  wk.session_date::date,
  -- daily_load = trimp_score
  wm.trimp_score AS daily_load,
  -- acute_load_7d = daily_load * 7d factor (improves over time)
  ROUND((wm.trimp_score * wk.acute_factor)::numeric, 2),
  -- chronic_load_28d = baseline (grows as training continues)
  ROUND((wm.trimp_score * wk.chronic_factor)::numeric, 2),
  -- acwr ratio
  ROUND((wk.acwr_base + (random() * wk.acwr_jitter - wk.acwr_jitter / 2.0))::numeric, 2),
  wk.risk_flag
FROM wearable_sessions ws
JOIN wearable_metrics wm ON wm.session_id = ws.session_id AND wm.player_id = ws.player_id
JOIN (VALUES
  ('c1000001-0000-0000-0000-000000000001'::uuid,'2026-02-22'::date, 1.10, 0.70, 1.65, 0.30, 'red'),
  ('c1000001-0000-0000-0000-000000000002'::uuid,'2026-02-23'::date, 1.08, 0.72, 1.55, 0.25, 'red'),
  ('c1000001-0000-0000-0000-000000000003'::uuid,'2026-02-24'::date, 1.06, 0.74, 1.50, 0.20, 'amber'),
  ('c1000001-0000-0000-0000-000000000004'::uuid,'2026-02-26'::date, 1.05, 0.76, 1.48, 0.20, 'amber'),
  ('c1000001-0000-0000-0000-000000000005'::uuid,'2026-02-27'::date, 1.04, 0.77, 1.42, 0.18, 'amber'),
  ('c1000001-0000-0000-0000-000000000006'::uuid,'2026-02-28'::date, 1.10, 0.78, 1.45, 0.15, 'amber'),
  ('c1000001-0000-0000-0000-000000000007'::uuid,'2026-03-02'::date, 1.03, 0.82, 1.30, 0.15, 'amber'),
  ('c1000001-0000-0000-0000-000000000008'::uuid,'2026-03-03'::date, 1.02, 0.84, 1.28, 0.12, 'amber'),
  ('c1000001-0000-0000-0000-000000000009'::uuid,'2026-03-05'::date, 1.04, 0.86, 1.22, 0.12, 'green'),
  ('c1000001-0000-0000-0000-000000000010'::uuid,'2026-03-06'::date, 1.03, 0.87, 1.20, 0.10, 'green'),
  ('c1000001-0000-0000-0000-000000000011'::uuid,'2026-03-07'::date, 1.08, 0.88, 1.18, 0.10, 'green'),
  ('c1000001-0000-0000-0000-000000000012'::uuid,'2026-03-09'::date, 1.02, 0.90, 1.12, 0.08, 'green'),
  ('c1000001-0000-0000-0000-000000000013'::uuid,'2026-03-10'::date, 1.03, 0.91, 1.10, 0.08, 'green'),
  ('c1000001-0000-0000-0000-000000000014'::uuid,'2026-03-12'::date, 1.04, 0.92, 1.08, 0.06, 'green'),
  ('c1000001-0000-0000-0000-000000000015'::uuid,'2026-03-13'::date, 1.03, 0.92, 1.05, 0.06, 'green'),
  ('c1000001-0000-0000-0000-000000000016'::uuid,'2026-03-14'::date, 1.06, 0.93, 1.06, 0.06, 'green'),
  ('c1000001-0000-0000-0000-000000000017'::uuid,'2026-03-16'::date, 1.00, 0.94, 1.00, 0.05, 'green'),
  ('c1000001-0000-0000-0000-000000000018'::uuid,'2026-03-17'::date, 1.02, 0.95, 1.02, 0.05, 'green'),
  ('c1000001-0000-0000-0000-000000000019'::uuid,'2026-03-19'::date, 1.04, 0.96, 1.04, 0.05, 'green'),
  ('c1000001-0000-0000-0000-000000000020'::uuid,'2026-03-20'::date, 1.02, 0.95, 1.00, 0.04, 'green'),
  ('c1000001-0000-0000-0000-000000000021'::uuid,'2026-03-21'::date, 1.06, 0.96, 1.05, 0.04, 'green')
) AS wk(session_id, session_date, acute_factor, chronic_factor, acwr_base, acwr_jitter, risk_flag)
  ON ws.session_id = wk.session_id
ON CONFLICT (player_id, session_id) DO UPDATE SET
  daily_load      = EXCLUDED.daily_load,
  acute_load_7d   = EXCLUDED.acute_load_7d,
  chronic_load_28d = EXCLUDED.chronic_load_28d,
  acwr_ratio      = EXCLUDED.acwr_ratio,
  risk_flag       = EXCLUDED.risk_flag;

-- ============================================================
-- TACTICAL METRICS — per session (team level)
-- Week 1: 4-4-2, PPDA 13+, compactness 33+, transitions 5s+
-- Week 2: transitioning to 4-3-3, improving
-- Week 3: 4-3-3 established, PPDA 9-10
-- Week 4: fluid 4-3-3/4-2-3-1, PPDA 7-8, peak performance
-- ============================================================

INSERT INTO tactical_metrics (
  session_id, avg_formation, compactness_avg, compactness_std,
  defensive_line_height_avg, team_width_avg, team_length_avg,
  pressing_intensity, transition_speed_atk_s, transition_speed_def_s,
  possession_pct, formation_snapshots
) VALUES
-- WEEK 1
('c1000001-0000-0000-0000-000000000001','4-4-2',34.5,4.2,38.0,42.0,36.0,5.8,5.8,6.2,48.0,
  jsonb_build_object('first_half','4-4-2','second_half','4-4-2','notes','Rigid shape, players learning positions')),
('c1000001-0000-0000-0000-000000000002','4-4-2',33.8,4.5,37.5,41.5,35.5,5.5,6.0,6.5,49.0,
  jsonb_build_object('first_half','4-4-2','second_half','4-4-2','notes','Improving line discipline')),
('c1000001-0000-0000-0000-000000000003','4-4-2',33.2,4.1,37.0,41.0,35.0,5.9,5.7,6.3,50.0,
  jsonb_build_object('first_half','4-4-2','second_half','4-4-2','notes','Ball mastery reflected in possession')),
('c1000001-0000-0000-0000-000000000004','4-4-2',32.8,3.9,36.5,40.5,34.5,6.0,5.5,6.0,51.0,
  jsonb_build_object('first_half','4-4-2','second_half','4-4-2','notes','SSGs improving decision speed')),
('c1000001-0000-0000-0000-000000000005','4-4-2',33.0,4.0,37.0,41.0,35.0,5.6,5.8,6.2,50.0,
  jsonb_build_object('first_half','4-4-2','second_half','4-4-2','notes','Recovery session, lower intensity')),
('c1000001-0000-0000-0000-000000000006','4-4-2',32.5,4.3,36.0,40.0,34.0,13.5,5.2,5.8,47.0,
  jsonb_build_object('first_half','4-4-2','second_half','4-4-2','notes','Match vs Heliopolis — defensive shape held, but pressing ineffective')),
-- WEEK 2
('c1000001-0000-0000-0000-000000000007','4-4-2',31.5,3.8,36.5,40.5,34.0,12.0,5.0,5.5,51.0,
  jsonb_build_object('first_half','4-4-2','second_half','4-3-3-intro','notes','Begin 4-3-3 shape work')),
('c1000001-0000-0000-0000-000000000008','4-3-3',30.8,3.6,37.0,41.0,34.5,11.5,4.8,5.2,52.0,
  jsonb_build_object('first_half','4-3-3','second_half','4-3-3','notes','Rondo work showing in shape fluidity')),
('c1000001-0000-0000-0000-000000000009','4-3-3',30.2,3.4,37.5,41.5,35.0,11.0,4.5,5.0,53.0,
  jsonb_build_object('first_half','4-3-3','second_half','4-3-3','notes','Pressing triggers starting to work')),
('c1000001-0000-0000-0000-000000000010','4-3-3',29.8,3.2,38.0,42.0,35.5,10.5,4.3,4.8,54.0,
  jsonb_build_object('first_half','4-3-3','second_half','4-3-3','notes','SSG pressing rules working')),
('c1000001-0000-0000-0000-000000000011','4-3-3',29.5,3.5,38.5,42.5,36.0,10.2,4.2,4.7,53.0,
  jsonb_build_object('first_half','4-3-3','second_half','4-3-3','notes','Match vs Zamalek — pressed well first half, faded')),
-- WEEK 3
('c1000001-0000-0000-0000-000000000012','4-3-3',28.8,3.0,39.0,43.0,36.5,9.8,4.0,4.5,55.0,
  jsonb_build_object('first_half','4-3-3','second_half','4-3-3','notes','Video review led to improved compactness')),
('c1000001-0000-0000-0000-000000000013','4-3-3',28.2,2.8,39.5,43.5,37.0,9.5,3.8,4.3,56.0,
  jsonb_build_object('first_half','4-3-3','second_half','4-3-3','notes','High press drill — PPDA target achieved')),
('c1000001-0000-0000-0000-000000000014','4-3-3',27.8,2.6,40.0,44.0,37.5,9.2,3.6,4.0,57.0,
  jsonb_build_object('first_half','4-3-3','second_half','4-3-3','notes','Wide forward movement fluid')),
('c1000001-0000-0000-0000-000000000015','4-3-3',28.0,2.7,39.5,43.5,37.0,9.0,3.7,4.2,56.0,
  jsonb_build_object('first_half','4-3-3','second_half','4-3-3','notes','Set pieces added to structured play')),
('c1000001-0000-0000-0000-000000000016','4-3-3',27.5,2.5,40.5,44.5,38.0,8.8,3.5,3.9,58.0,
  jsonb_build_object('first_half','4-3-3','second_half','4-3-3','notes','Friendly vs Al Ahly — 3-0 win, excellent pressing throughout')),
-- WEEK 4
('c1000001-0000-0000-0000-000000000017','4-3-3',27.0,2.4,40.0,44.0,37.5,8.5,3.4,3.8,57.0,
  jsonb_build_object('first_half','4-3-3','second_half','4-2-3-1','notes','Shape rotation introduced — players adapting')),
('c1000001-0000-0000-0000-000000000018','4-2-3-1',26.5,2.2,41.0,45.0,38.5,8.2,3.2,3.6,59.0,
  jsonb_build_object('first_half','4-3-3','second_half','4-2-3-1','notes','Fluid between shapes — tactical maturity showing')),
('c1000001-0000-0000-0000-000000000019','4-3-3',26.2,2.0,41.5,45.5,39.0,8.0,3.0,3.4,60.0,
  jsonb_build_object('first_half','4-3-3','second_half','4-2-3-1','notes','11v11 internal match — peak shape deployment')),
('c1000001-0000-0000-0000-000000000020','4-3-3',26.5,2.1,41.0,45.0,38.5,7.8,3.1,3.5,60.0,
  jsonb_build_object('first_half','4-3-3','second_half','4-3-3','notes','Pre-match activation — light technical work')),
('c1000001-0000-0000-0000-000000000021','4-3-3',25.8,1.9,42.0,46.0,39.5,7.2,2.8,3.2,62.0,
  jsonb_build_object('first_half','4-3-3','second_half','4-2-3-1','notes','Match vs Pyramids — best performance of month. PPDA 7.2, transitions under 3s'));

-- ============================================================
-- PLAYER BASELINES
-- 7d reflects recent (better) performance
-- 28d reflects full month average
-- ============================================================

INSERT INTO player_baselines (player_id, period, avg_distance_m, avg_max_speed_kmh, avg_sprint_count, avg_hr, avg_trimp, avg_decel_events, calculated_at)
VALUES
-- GK #1 — Ahmed Hassan
('b0000001-0000-0000-0000-000000000001','7d', 4200.0,18.5,3.2,152.0,74.5,4.2,'2026-03-22 12:00:00+02'),
('b0000001-0000-0000-0000-000000000001','28d',3950.0,18.2,2.9,157.0,66.8,3.8,'2026-03-22 12:00:00+02'),
-- CB #4 — Youssef Ali
('b0000001-0000-0000-0000-000000000002','7d', 7200.0,23.2,6.8,157.0,82.4,9.2,'2026-03-22 12:00:00+02'),
('b0000001-0000-0000-0000-000000000002','28d',6800.0,22.8,5.9,161.0,74.2,8.5,'2026-03-22 12:00:00+02'),
-- CB #5 — Omar Saeed
('b0000001-0000-0000-0000-000000000003','7d', 7100.0,23.0,6.5,155.0,81.5,8.8,'2026-03-22 12:00:00+02'),
('b0000001-0000-0000-0000-000000000003','28d',6700.0,22.5,5.7,159.0,73.5,8.2,'2026-03-22 12:00:00+02'),
-- FB #2 — Mahmoud Fathy
('b0000001-0000-0000-0000-000000000004','7d', 8500.0,27.5,9.2,156.0,88.6,10.5,'2026-03-22 12:00:00+02'),
('b0000001-0000-0000-0000-000000000004','28d',8000.0,27.0,8.1,160.0,79.8,9.8,'2026-03-22 12:00:00+02'),
-- FB #3 — Karim Nabil
('b0000001-0000-0000-0000-000000000005','7d', 8300.0,27.2,8.9,157.0,87.2,10.2,'2026-03-22 12:00:00+02'),
('b0000001-0000-0000-0000-000000000005','28d',7850.0,26.8,7.8,162.0,78.5,9.5,'2026-03-22 12:00:00+02'),
-- CM #6 — Ziad Mohamed
('b0000001-0000-0000-0000-000000000006','7d', 9200.0,26.8,8.5,154.0,89.8,9.8,'2026-03-22 12:00:00+02'),
('b0000001-0000-0000-0000-000000000006','28d',8700.0,26.3,7.5,158.0,80.5,9.1,'2026-03-22 12:00:00+02'),
-- CM #8 — Hassan Khaled
('b0000001-0000-0000-0000-000000000007','7d', 9500.0,27.0,8.8,155.0,92.2,10.2,'2026-03-22 12:00:00+02'),
('b0000001-0000-0000-0000-000000000007','28d',8900.0,26.5,7.8,159.0,82.5,9.5,'2026-03-22 12:00:00+02'),
-- CAM #10 — Ali Tarek
('b0000001-0000-0000-0000-000000000008','7d',10200.0,28.5,11.5,152.0,98.5,11.8,'2026-03-22 12:00:00+02'),
('b0000001-0000-0000-0000-000000000008','28d',9600.0,28.0,10.2,156.0,88.2,10.9,'2026-03-22 12:00:00+02'),
-- W #7 — Mostafa Ibrahim
('b0000001-0000-0000-0000-000000000009','7d',10800.0,29.8,13.2,156.0,102.5,12.5,'2026-03-22 12:00:00+02'),
('b0000001-0000-0000-0000-000000000009','28d',10200.0,29.2,11.8,160.0,91.8,11.8,'2026-03-22 12:00:00+02'),
-- W #11 — Adel Sherif
('b0000001-0000-0000-0000-000000000010','7d',10600.0,29.5,12.8,157.0,100.2,12.2,'2026-03-22 12:00:00+02'),
('b0000001-0000-0000-0000-000000000010','28d',9900.0,28.9,11.2,162.0,89.5,11.5,'2026-03-22 12:00:00+02'),
-- ST #9 — Tamer Reda
('b0000001-0000-0000-0000-000000000011','7d', 9800.0,28.8,10.5,157.0,95.8,11.2,'2026-03-22 12:00:00+02'),
('b0000001-0000-0000-0000-000000000011','28d',9200.0,28.2,9.2,161.0,85.5,10.5,'2026-03-22 12:00:00+02')
ON CONFLICT (player_id, period) DO UPDATE SET
  avg_distance_m    = EXCLUDED.avg_distance_m,
  avg_max_speed_kmh = EXCLUDED.avg_max_speed_kmh,
  avg_sprint_count  = EXCLUDED.avg_sprint_count,
  avg_hr            = EXCLUDED.avg_hr,
  avg_trimp         = EXCLUDED.avg_trimp,
  avg_decel_events  = EXCLUDED.avg_decel_events,
  calculated_at     = EXCLUDED.calculated_at;

-- ============================================================
-- DEVELOPMENT SNAPSHOTS — March 2026 (one per player)
-- physical_score, tactical_score, workload_score (0-100)
-- Trend: all improving
-- ============================================================

INSERT INTO development_snapshots (
  player_id, month, physical_score, tactical_score, workload_score,
  metrics_summary, ai_development_narrative, trend, benchmarks_vs_age_group
)
VALUES
-- GK #1 — Ahmed Hassan
('b0000001-0000-0000-0000-000000000001','2026-03-01',
  72.5, 78.0, 81.0,
  jsonb_build_object(
    'avg_hr_trend','159→152 bpm over month',
    'recovery_60s_trend','18→30 bpm recovery',
    'sessions_completed', 21,
    'avg_trimp', 66.8,
    'key_improvement','Commanding presence; saves per match increased'
  ),
  'Ahmed has shown consistent improvement in recovery metrics and shot-stopping across the month. His HR efficiency gain of ~5 bpm average reflects genuine aerobic development. Recommend maintaining current load and adding specific GK distribution drills.',
  'improving',
  jsonb_build_object('hr_efficiency','top 30% for age group','recovery_speed','above average','fitness_level','developing')
),
-- CB #4 — Youssef Ali
('b0000001-0000-0000-0000-000000000002','2026-03-01',
  75.0, 80.5, 79.0,
  jsonb_build_object(
    'avg_hr_trend','162→157 bpm over month',
    'recovery_60s_trend','19→31 bpm recovery',
    'sessions_completed', 21,
    'avg_trimp', 74.2,
    'key_improvement','Aerial dominance and stepping out of line to press'
  ),
  'Youssef has developed into a commanding centre-back. His ability to step into midfield and press has grown significantly in weeks 3-4. Aerial success rate improved 12% over the month. Ready for higher-intensity load in April.',
  'improving',
  jsonb_build_object('positional_awareness','top 25%','aerial_success','above average','press_participation','significantly improved')
),
-- CB #5 — Omar Saeed
('b0000001-0000-0000-0000-000000000003','2026-03-01',
  76.0, 78.0, 80.5,
  jsonb_build_object(
    'avg_hr_trend','160→155 bpm over month',
    'recovery_60s_trend','19→30 bpm recovery',
    'sessions_completed', 21,
    'avg_trimp', 73.5,
    'key_improvement','Defensive line coordination and communication'
  ),
  'Omar is the defensive anchor of the U16 side. His average HR has dropped 5 bpm indicating improved aerobic base. His reading of danger situations improved markedly in week 3-4 alongside tactical pressing drills.',
  'improving',
  jsonb_build_object('defensive_line_control','top 20%','recovery_speed','above average','fitness_level','good')
),
-- FB #2 — Mahmoud Fathy
('b0000001-0000-0000-0000-000000000004','2026-03-01',
  82.0, 83.0, 78.5,
  jsonb_build_object(
    'avg_hr_trend','161→156 bpm over month',
    'recovery_60s_trend','20→32 bpm recovery',
    'sessions_completed', 21,
    'avg_trimp', 79.8,
    'key_improvement','Overlapping runs and defensive recovery speed'
  ),
  'Mahmoud is one of the standout performers of the month. His overlapping runs have become a key attacking weapon, and his recovery speed back into position is now among the best in the squad. Sprint count up 14% from week 1 to week 4.',
  'improving',
  jsonb_build_object('sprint_count','top 15%','recovery_speed','excellent','tactical_discipline','significantly improved')
),
-- FB #3 — Karim Nabil
('b0000001-0000-0000-0000-000000000005','2026-03-01',
  80.5, 81.5, 77.0,
  jsonb_build_object(
    'avg_hr_trend','163→157 bpm over month',
    'recovery_60s_trend','18→30 bpm recovery',
    'sessions_completed', 21,
    'avg_trimp', 78.5,
    'key_improvement','Press participation and defensive width'
  ),
  'Karim has embraced the pressing system most enthusiastically. His press participation rate in week 4 matches the coach''s target perfectly. Fitness improvements are clear from HR data — resting HR down 3 bpm from week 1.',
  'improving',
  jsonb_build_object('press_participation','top 20%','fitness_trend','strongly improving','defensive_positioning','above average')
),
-- CM #6 — Ziad Mohamed
('b0000001-0000-0000-0000-000000000006','2026-03-01',
  83.5, 85.0, 82.0,
  jsonb_build_object(
    'avg_hr_trend','159→154 bpm over month',
    'recovery_60s_trend','21→33 bpm recovery',
    'sessions_completed', 21,
    'avg_trimp', 80.5,
    'key_improvement','Ball retention under press and midfield compactness'
  ),
  'Ziad is developing into the engine of the midfield. His TRIMP tolerance has grown 18% over the month, evidence of substantial aerobic development. His ball retention under pressure is among the best in the squad and his pressing triggers are textbook.',
  'improving',
  jsonb_build_object('midfield_coverage','top 20%','ball_retention','excellent','fitness_level','strong')
),
-- CM #8 — Hassan Khaled
('b0000001-0000-0000-0000-000000000007','2026-03-01',
  84.0, 86.5, 83.0,
  jsonb_build_object(
    'avg_hr_trend','160→155 bpm over month',
    'recovery_60s_trend','22→34 bpm recovery',
    'sessions_completed', 21,
    'avg_trimp', 82.5,
    'key_improvement','Pressing trigger accuracy and switch of play'
  ),
  'Hassan is the tactical heartbeat of the team. His pressing trigger accuracy improved from 58% in week 1 to 82% in week 4 — remarkable growth. His switch-of-play passes have unlocked multiple goals. TRIMP tolerance up 20% suggesting strong adaptation.',
  'improving',
  jsonb_build_object('pressing_trigger_accuracy','top 10%','switch_of_play','elite for age group','fitness_trend','strongly improving')
),
-- CAM #10 — Ali Tarek
('b0000001-0000-0000-0000-000000000008','2026-03-01',
  88.0, 87.5, 84.5,
  jsonb_build_object(
    'avg_hr_trend','157→152 bpm over month',
    'recovery_60s_trend','24→36 bpm recovery',
    'sessions_completed', 21,
    'avg_trimp', 88.2,
    'key_improvement','Goal contributions and creative pressing'
  ),
  'Ali Tarek is the standout player of the month. His HR efficiency is the best in the squad — he works at the same intensity but at a lower physiological cost by week 4. Two goals, three assists in matches this month. His pressing has evolved from reactive to proactive.',
  'improving',
  jsonb_build_object('goal_contributions','top 5% for age group','hr_efficiency','elite','creative_pressing','excellent')
),
-- W #7 — Mostafa Ibrahim
('b0000001-0000-0000-0000-000000000009','2026-03-01',
  87.5, 84.0, 82.5,
  jsonb_build_object(
    'avg_hr_trend','161→156 bpm over month',
    'recovery_60s_trend','22→35 bpm recovery',
    'sessions_completed', 21,
    'avg_trimp', 91.8,
    'key_improvement','Sprint burst speed and clinical finishing'
  ),
  'Mostafa is the team''s primary threat. His sprint metrics are the best in the squad — max speed approaching 30 km/h by week 4. Three goals in two matches in weeks 3-4. His ability to sustain high TRIMP loads is exceptional for the age group.',
  'improving',
  jsonb_build_object('sprint_max_speed','top 5% for age group','goal_scoring','elite','trimp_tolerance','highest in squad')
),
-- W #11 — Adel Sherif
('b0000001-0000-0000-0000-000000000010','2026-03-01',
  85.0, 82.5, 80.0,
  jsonb_build_object(
    'avg_hr_trend','163→157 bpm over month',
    'recovery_60s_trend','20→33 bpm recovery',
    'sessions_completed', 21,
    'avg_trimp', 89.5,
    'key_improvement','Dribbling under pressure and wide channel dominance'
  ),
  'Adel''s dribbling ability is consistently unlocking defences in wide areas. His 1v2 dribble success rate improved from 45% to 68% over the month — outstanding. His fitness has caught up with his talent, with HR efficiency closing the gap to the top performers.',
  'improving',
  jsonb_build_object('dribble_success','top 10% for age group','wide_dominance','excellent','fitness_trend','significantly improving')
),
-- ST #9 — Tamer Reda
('b0000001-0000-0000-0000-000000000011','2026-03-01',
  83.0, 81.0, 79.5,
  jsonb_build_object(
    'avg_hr_trend','162→157 bpm over month',
    'recovery_60s_trend','20→32 bpm recovery',
    'sessions_completed', 21,
    'avg_trimp', 85.5,
    'key_improvement','Aerial threat and link-up play in 4-3-3'
  ),
  'Tamer has been the most consistent scorer across the month — goals in all four matches. His adaptation to the 4-3-3 striker role (more isolated than in 4-4-2) was the key challenge and he has embraced it. Hold-up play metrics improved 22% from week 2 to week 4.',
  'improving',
  jsonb_build_object('goals_scored','4 in month','aerial_success','above average','link_up_play','significantly improved')
)
ON CONFLICT (player_id, month) DO UPDATE SET
  physical_score           = EXCLUDED.physical_score,
  tactical_score           = EXCLUDED.tactical_score,
  workload_score           = EXCLUDED.workload_score,
  metrics_summary          = EXCLUDED.metrics_summary,
  ai_development_narrative = EXCLUDED.ai_development_narrative,
  trend                    = EXCLUDED.trend,
  benchmarks_vs_age_group  = EXCLUDED.benchmarks_vs_age_group;

-- ============================================================
-- VERIFICATION COUNTS
-- ============================================================
DO $$
DECLARE
  v_sessions int;
  v_wearable_sessions int;
  v_wearable_metrics int;
  v_load_records int;
  v_tactical int;
  v_videos int;
  v_tags int;
  v_baselines int;
  v_snapshots int;
BEGIN
  SELECT COUNT(*) INTO v_sessions FROM sessions WHERE academy_id = 'a0000000-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO v_wearable_sessions FROM wearable_sessions ws JOIN sessions s ON ws.session_id = s.id WHERE s.academy_id = 'a0000000-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO v_wearable_metrics FROM wearable_metrics wm JOIN sessions s ON wm.session_id = s.id WHERE s.academy_id = 'a0000000-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO v_load_records FROM load_records lr JOIN sessions s ON lr.session_id = s.id WHERE s.academy_id = 'a0000000-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO v_tactical FROM tactical_metrics tm JOIN sessions s ON tm.session_id = s.id WHERE s.academy_id = 'a0000000-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO v_videos FROM videos v JOIN sessions s ON v.session_id = s.id WHERE s.academy_id = 'a0000000-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO v_tags FROM video_tags vt JOIN videos v ON vt.video_id = v.id JOIN sessions s ON v.session_id = s.id WHERE s.academy_id = 'a0000000-0000-0000-0000-000000000001';
  SELECT COUNT(*) INTO v_baselines FROM player_baselines pb JOIN players p ON pb.player_id = p.id WHERE p.academy_id = 'a0000000-0000-0000-0000-000000000001' AND p.age_group = '2010';
  SELECT COUNT(*) INTO v_snapshots FROM development_snapshots ds JOIN players p ON ds.player_id = p.id WHERE p.academy_id = 'a0000000-0000-0000-0000-000000000001';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'SEED VERIFICATION RESULTS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Sessions:            % (expected 21)', v_sessions;
  RAISE NOTICE 'Wearable Sessions:   % (expected 231)', v_wearable_sessions;
  RAISE NOTICE 'Wearable Metrics:    % (expected 231)', v_wearable_metrics;
  RAISE NOTICE 'Load Records:        % (expected 231)', v_load_records;
  RAISE NOTICE 'Tactical Metrics:    % (expected 21)', v_tactical;
  RAISE NOTICE 'Videos:              % (expected 7)', v_videos;
  RAISE NOTICE 'Video Tags:          % (expected 40)', v_tags;
  RAISE NOTICE 'Player Baselines:    % (expected 22)', v_baselines;
  RAISE NOTICE 'Dev Snapshots:       % (expected 11)', v_snapshots;
  RAISE NOTICE '========================================';
END $$;

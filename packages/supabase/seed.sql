-- seed.sql
-- Seed data for The Maker Football Incubator.
-- This runs after migrations via `supabase db reset`.

-- Academy
INSERT INTO academies (id, name, country)
VALUES ('a0000000-0000-0000-0000-000000000001', 'The Maker Football Incubator', 'EG');

-- Sample players (10 from each age group)
-- U14 (2010)
INSERT INTO players (academy_id, name, dob, position, jersey_number, age_group, dominant_foot, consent_status, consent_date) VALUES
('a0000000-0000-0000-0000-000000000001', 'Ahmed Mohamed', '2010-03-15', 'CAM', 10, '2010', 'right', 'granted', '2026-01-15'),
('a0000000-0000-0000-0000-000000000001', 'Youssef Khaled', '2010-07-22', 'W', 7, '2010', 'left', 'granted', '2026-01-15'),
('a0000000-0000-0000-0000-000000000001', 'Omar Samir', '2010-01-10', 'ST', 9, '2010', 'right', 'granted', '2026-01-15'),
('a0000000-0000-0000-0000-000000000001', 'Hassan Ali', '2010-11-05', 'CB', 4, '2010', 'right', 'granted', '2026-01-15'),
('a0000000-0000-0000-0000-000000000001', 'Karim Mostafa', '2010-06-18', 'CM', 8, '2010', 'both', 'granted', '2026-01-15'),
('a0000000-0000-0000-0000-000000000001', 'Mahmoud Tarek', '2010-09-03', 'FB', 2, '2010', 'left', 'granted', '2026-01-15'),
('a0000000-0000-0000-0000-000000000001', 'Ali Fathy', '2010-04-28', 'GK', 1, '2010', 'right', 'granted', '2026-01-15'),
('a0000000-0000-0000-0000-000000000001', 'Mohamed Essam', '2010-12-14', 'CM', 6, '2010', 'right', 'granted', '2026-01-15'),
('a0000000-0000-0000-0000-000000000001', 'Adham Nabil', '2010-08-07', 'W', 11, '2010', 'right', 'granted', '2026-01-15'),
('a0000000-0000-0000-0000-000000000001', 'Seif Hossam', '2010-02-20', 'FB', 3, '2010', 'right', 'granted', '2026-01-15');

-- U12 (2012)
INSERT INTO players (academy_id, name, dob, position, jersey_number, age_group, dominant_foot, consent_status, consent_date) VALUES
('a0000000-0000-0000-0000-000000000001', 'Ziad Amr', '2012-05-12', 'CAM', 10, '2012', 'right', 'granted', '2026-01-15'),
('a0000000-0000-0000-0000-000000000001', 'Younis Ibrahim', '2012-03-25', 'ST', 9, '2012', 'right', 'granted', '2026-01-15'),
('a0000000-0000-0000-0000-000000000001', 'Anas Waleed', '2012-10-08', 'CB', 4, '2012', 'left', 'granted', '2026-01-15'),
('a0000000-0000-0000-0000-000000000001', 'Hamza Sherif', '2012-07-17', 'CM', 8, '2012', 'right', 'granted', '2026-01-15'),
('a0000000-0000-0000-0000-000000000001', 'Abdallah Ramy', '2012-01-30', 'W', 7, '2012', 'right', 'granted', '2026-01-15');

-- U11 (2013)
INSERT INTO players (academy_id, name, dob, position, jersey_number, age_group, dominant_foot, consent_status, consent_date) VALUES
('a0000000-0000-0000-0000-000000000001', 'Marwan Hazem', '2013-04-09', 'ST', 9, '2013', 'right', 'granted', '2026-01-15'),
('a0000000-0000-0000-0000-000000000001', 'Taha Magdy', '2013-08-21', 'CM', 8, '2013', 'left', 'granted', '2026-01-15'),
('a0000000-0000-0000-0000-000000000001', 'Yassin Ashraf', '2013-11-14', 'CB', 4, '2013', 'right', 'granted', '2026-01-15'),
('a0000000-0000-0000-0000-000000000001', 'Nour Ayman', '2013-06-03', 'GK', 1, '2013', 'right', 'granted', '2026-01-15'),
('a0000000-0000-0000-0000-000000000001', 'Fares Khattab', '2013-02-16', 'W', 7, '2013', 'right', 'granted', '2026-01-15');

-- Note: Users cannot be seeded here because they depend on Supabase Auth user IDs.
-- Create users via the admin UI or a setup script after deploying.

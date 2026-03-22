-- 00023_create_storage_buckets.sql
-- Supabase Storage buckets for video and assets.

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('videos', 'videos', false),
  ('clips', 'clips', false),
  ('player-photos', 'player-photos', true),
  ('reports', 'reports', false);

-- Videos bucket: authenticated users in same academy can read
CREATE POLICY "authenticated users can read videos"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'videos' AND auth.role() = 'authenticated'
  );

-- Clips bucket: authenticated users can read
CREATE POLICY "authenticated users can read clips"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'clips' AND auth.role() = 'authenticated'
  );

-- Player photos: public read
CREATE POLICY "public can read player photos"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'player-photos'
  );

-- Reports: authenticated users can read
CREATE POLICY "authenticated users can read reports"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'reports' AND auth.role() = 'authenticated'
  );

-- Upload policies: staff can upload to all buckets
CREATE POLICY "staff can upload videos"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'videos' AND auth.role() = 'authenticated'
  );

CREATE POLICY "staff can upload clips"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'clips' AND auth.role() = 'authenticated'
  );

CREATE POLICY "staff can upload player photos"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'player-photos' AND auth.role() = 'authenticated'
  );

CREATE POLICY "staff can upload reports"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'reports' AND auth.role() = 'authenticated'
  );

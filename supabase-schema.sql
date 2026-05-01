-- =============================================
-- VerifyDocs Blog — Supabase Schema
-- Supabase SQL Editor mein run karo
-- =============================================

-- 1. Table banao
CREATE TABLE IF NOT EXISTS blog_posts (
  id          bigserial PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  emoji       TEXT DEFAULT '📄',
  category    TEXT DEFAULT 'Blog',
  read_time   TEXT DEFAULT '5 min read',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  is_published BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Row Level Security enable karo
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- 3. Public sirf published posts padh sake
CREATE POLICY "public_read_published"
  ON blog_posts FOR SELECT
  USING (is_published = TRUE);

-- 4. Sirf logged-in admin CRUD kar sake
CREATE POLICY "admin_full_access"
  ON blog_posts FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 5. updated_at auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 6. Existing posts seed karo
-- =============================================

INSERT INTO blog_posts (slug, title, description, emoji, category, read_time, published_at) VALUES
(
  'online-document-verification-guide',
  'Online Document Verification: Detect Fake, Edited & AI-Generated Files Instantly',
  'Learn how to verify documents online and detect fake, forged, edited, or AI-generated files instantly using VerifyDocs. Fast, secure, and AI-powered.',
  '🔐', 'Blog', '6 min read', '2026-05-01'
),
(
  'why-document-verification-matters-2026',
  'Why Document Verification Matters in 2026: Protect Yourself from Fake & AI-Generated Documents',
  'Discover why document verification is essential in 2026. Learn how to detect fake, forged, edited, and AI-generated documents online with VerifyDocs.',
  '🛡️', 'Blog', '7 min read', '2026-04-29'
),
(
  'how-to-verify-documents-online',
  'How to Verify Documents Online and Detect Fake, Forged, or AI-Generated Files',
  'Learn how to verify documents online and detect fake, forged, edited, or AI-generated files instantly with VerifyDocs. Secure, fast, and AI-powered fraud detection.',
  '📄', 'Blog', '5 min read', '2026-04-28'
),
(
  'verify-documents-online',
  'Verify Documents Online – Detect Fake, Forged & AI-Generated Files Instantly',
  'VerifyDocs helps you detect fake, forged, edited, or AI-generated documents instantly. Upload PDFs, images, and certificates for fast online verification and fraud detection.',
  '🔍', 'Blog', '4 min read', '2026-04-28'
),
(
  'how-to-validate-aadhaar',
  'How to Validate Your Aadhaar Number Online — Complete Guide',
  'Everything you need to know about Aadhaar format validation, the Verhoeff algorithm, common mistakes, and how to check if a number is valid without contacting UIDAI.',
  '🆔', 'Aadhaar', '8 min read', '2024-01-15'
),
(
  'pan-card-format-explained',
  'PAN Card Format Explained — What Each Character Means',
  'A deep dive into the 10-character PAN format: jurisdiction codes, entity types, surname initials, and the logic behind each position. With real examples.',
  '💳', 'PAN', '6 min read', '2024-01-12'
),
(
  'gst-number-structure',
  'GST Number Structure Decoded — State Code, PAN, Entity Number',
  'Breaking down the 15-character GSTIN: what each segment means, how to find the state from any GST number, and why the Z is always there.',
  '🏢', 'GST', '7 min read', '2024-01-10'
),
(
  'aadhaar-masking-why-important',
  'Why You Should Always Mask Your Aadhaar Before Sharing',
  'UIDAI recommends sharing only masked Aadhaar. Here''s why it matters, what risks you face by sharing full Aadhaar, and how to create a masked copy for free.',
  '🔒', 'Privacy', '5 min read', '2024-01-08'
)
ON CONFLICT (slug) DO NOTHING;

-- Supabase SQL Editor'da çalıştırılacak migration
-- Posts tablosuna status kolonu ekler

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'published';

-- Mevcut yazılar 'published' olarak kalır (DEFAULT zaten 'published')
-- Yeni oluşturulan yazılar 'draft' olarak kaydedilecek

-- İsteğe bağlı: status alanına index ekle (filtreleme performansı için)
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);

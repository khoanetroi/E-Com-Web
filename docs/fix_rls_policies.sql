-- ==============================================================================
-- CẤU HÌNH FIX LỖI RLS (Row-Level Security) TRÊN SUPABASE
-- Danh sách 14 bảng THỰC TẾ đang được sử dụng trong dự án TELECTRIC:
-- 1. categories
-- 2. products
-- 3. product_variants
-- 4. product_categories_mapping
-- 5. orders
-- 6. order_items
-- 7. warranty_cards
-- 8. warranty_history
-- 9. warranty_tickets
-- 10. home_banners
-- 11. campaigns
-- 12. campaign_items
-- 13. news
-- 14. profiles
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- CÁCH 1: TẮT RLS HOÀN TOÀN CHO 14 BẢNG (KHUYÊN DÙNG CHO DEV/TESTING - NHANH NHẤT)
-- Copy đoạn SQL bên dưới dán vào Supabase SQL Editor và nhấn RUN
-- ------------------------------------------------------------------------------

ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_categories_mapping DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS warranty_cards DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS warranty_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS warranty_tickets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS home_banners DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS campaign_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS news DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;


-- ------------------------------------------------------------------------------
-- CÁCH 2: GIỮ RLS VÀ TẠO POLICY FULL ACCESS CHO 14 BẢNG
-- Chạy phần bên dưới nếu bạn muốn giữ RLS BẬT nhưng mở toàn quyền SELECT/INSERT/UPDATE/DELETE
-- ------------------------------------------------------------------------------

/*
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_categories_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS warranty_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS warranty_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS warranty_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS home_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS campaign_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS news ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access categories" ON categories;
DROP POLICY IF EXISTS "Public full access products" ON products;
DROP POLICY IF EXISTS "Public full access product_variants" ON product_variants;
DROP POLICY IF EXISTS "Public full access product_categories_mapping" ON product_categories_mapping;
DROP POLICY IF EXISTS "Public full access orders" ON orders;
DROP POLICY IF EXISTS "Public full access order_items" ON order_items;
DROP POLICY IF EXISTS "Public full access warranty_cards" ON warranty_cards;
DROP POLICY IF EXISTS "Public full access warranty_history" ON warranty_history;
DROP POLICY IF EXISTS "Public full access warranty_tickets" ON warranty_tickets;
DROP POLICY IF EXISTS "Public full access home_banners" ON home_banners;
DROP POLICY IF EXISTS "Public full access campaigns" ON campaigns;
DROP POLICY IF EXISTS "Public full access campaign_items" ON campaign_items;
DROP POLICY IF EXISTS "Public full access news" ON news;
DROP POLICY IF EXISTS "Public full access profiles" ON profiles;

CREATE POLICY "Public full access categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access product_variants" ON product_variants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access product_categories_mapping" ON product_categories_mapping FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access order_items" ON order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access warranty_cards" ON warranty_cards FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access warranty_history" ON warranty_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access warranty_tickets" ON warranty_tickets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access home_banners" ON home_banners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access campaigns" ON campaigns FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access campaign_items" ON campaign_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access news" ON news FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
*/

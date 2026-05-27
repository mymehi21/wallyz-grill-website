/*
  # Fix Security Issues

  ## Changes Made

  1. **Enable RLS on All Tables**
     - Enables Row Level Security on all 13 public tables
     - Critical security requirement - prevents unauthorized data access

  2. **Add Missing Foreign Key Indexes**
     - `approved_admins.created_by` - improves join performance with admin_users
     - `order_items.menu_item_id` - improves join performance with menu_items

  3. **Remove Unused Indexes**
     - Drops 7 unused indexes that add overhead without benefit
     - Keeps necessary indexes for foreign keys and primary keys

  ## Security Impact
     - All tables now have RLS enabled (policies already exist)
     - Foreign key queries will perform better
     - Database overhead reduced by removing unused indexes
*/

-- ============================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE approved_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE catering_menu_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_truck_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ADD MISSING FOREIGN KEY INDEXES
-- ============================================

-- Index for approved_admins.created_by foreign key
CREATE INDEX IF NOT EXISTS idx_approved_admins_created_by 
ON approved_admins(created_by);

-- Index for order_items.menu_item_id foreign key
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id 
ON order_items(menu_item_id);

-- ============================================
-- DROP UNUSED INDEXES
-- ============================================

DROP INDEX IF EXISTS idx_pickup_orders_status;
DROP INDEX IF EXISTS idx_order_items_order;
DROP INDEX IF EXISTS idx_site_settings_key;
DROP INDEX IF EXISTS idx_orders_location;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_pickup_orders_deleted_at;
DROP INDEX IF EXISTS idx_job_applications_deleted_at;

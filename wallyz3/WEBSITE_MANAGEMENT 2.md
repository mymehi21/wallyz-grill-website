# Wallyz Grill Website Management Guide

## Overview
This website is built for Wallyz Grill restaurant with support for multiple locations, online ordering, and Clover POS integration.

## Current Configuration

### Restaurant Information
- **Name**: Wallyz Grill
- **Current Location**: Oak Park - 25000 Greenfield Rd, Oak Park, MI
- **Phone**: (248) 993-9330
- **Email**: wallyzgrill@gmail.com
- **Instagram**: @Wallysgrill
- **TikTok**: @Wallysgrill

### Color Theme
- **Primary Color**: Orange (#FF6B35 / #FFA500)
- **Secondary Color**: Black (#000000)

## Features

### 1. Multiple Locations Support
The website is built to support multiple locations. Currently, one location (Oak Park) is active.

**To add a new location:**
1. Access your Supabase dashboard
2. Navigate to the `locations` table
3. Insert a new row with:
   - `name`: Location name (e.g., "Detroit")
   - `address`: Full address
   - `phone`: Phone number
   - `is_active`: true
   - `display_order`: Number (controls order shown on site)
   - `clover_merchant_id`: (Optional) Your Clover merchant ID for this location

Customers will be able to select their preferred location when placing orders.

### 2. Menu Management
Add and manage your menu items through the database.

**To add menu categories:**
1. Go to the `menu_categories` table
2. Add categories like "Burgers", "Sides", "Drinks", etc.
3. Set `is_active` to true and use `display_order` to control the order

**To add menu items:**
1. Go to the `menu_items` table
2. For each item, provide:
   - `category_id`: Link to a category
   - `name`: Item name
   - `description`: Item description (optional)
   - `price`: Price as a decimal (e.g., 12.99)
   - `is_available`: true/false
   - `display_order`: Controls order within category

### 3. Order Management
Orders submitted through the website are stored in the `orders` table.

**Order workflow:**
1. Customer fills out the order form with their details
2. Order is saved to database with status "pending"
3. Restaurant receives order notification
4. Call customer to confirm details and payment
5. Update order status as needed (pending → confirmed → ready → completed)

### 4. Clover Integration
The website is prepared for Clover POS integration.

**Current setup:**
- Orders are stored in the database
- Each location can have a `clover_merchant_id`
- Clover integration code is in `src/lib/clover.ts`

**To activate Clover integration:**
You'll need to:
1. Create a Clover developer account
2. Get API credentials (merchant ID and access token)
3. Create an edge function to handle order submission to Clover
4. Update the order form to send orders to Clover

Contact your developer to implement the full Clover integration.

### 5. Color Customization
Colors are stored in the database and can be changed.

**To change colors:**
1. Go to the `site_settings` table
2. Update these keys:
   - `primary_color`: Main brand color (currently orange)
   - `secondary_color`: Secondary color (currently black)
   - `accent_color`: Accent color (currently orange)
3. Use hex color codes (e.g., #FF6B35)

Note: After changing colors in the database, you may need to update the Tailwind config for full effect.

### 6. Changing Restaurant Name
To change the restaurant name from "Wallyz Grill":

1. Update all occurrences in these files:
   - `src/components/Header.tsx`
   - `src/components/Hero.tsx`
   - `src/components/Footer.tsx`
   - Update the page title in `index.html`

## Database Tables

### locations
Stores restaurant location information

### menu_categories
Menu categories (e.g., Entrees, Sides, Drinks)

### menu_items
Individual menu items with prices

### orders
Customer orders with status tracking

### order_items
Line items for each order

### site_settings
Customizable website settings (colors, etc.)

## Support
For technical support or modifications, contact your web developer.

## Important Notes
- No dine-in service - only pickup and catering
- Orders require phone confirmation
- All customer data is stored securely in Supabase
- Website is fully responsive for mobile and desktop

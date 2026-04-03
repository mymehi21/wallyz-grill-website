# Wallyz Grill - Admin Guide

## Accessing the Admin Dashboard

1. Navigate to your website URL followed by `/admin` (e.g., `https://yoursite.com/admin`)
2. Log in with your admin credentials
3. You'll be taken to the admin dashboard

## Admin Dashboard Features

### Navigation
The admin dashboard has a collapsible sidebar with the following sections:
- **Pickup Orders**: View all customer pickup orders
- **Catering**: View catering menu orders and food truck requests
- **Job Applications**: View all job applications
- **Reviews**: View and approve/disapprove customer reviews

### Viewing Orders
- All orders display customer contact information
- Order items and customizations are clearly shown
- Special instructions are visible when provided
- Each order has a "Print" button to generate a printable receipt

### Managing Reviews
- Reviews show up in the Reviews section
- Each review has an "Approved" or "Pending" button
- Click the button to toggle approval status
- Only approved reviews are visible to customers on the website

### Printing
- Click the "Print" button on any order, application, or request
- A new window will open with a printer-friendly version
- The print dialog will appear automatically

## Website Features

### Customer Navigation
The website has a hamburger menu (3 horizontal lines) that opens a sidebar with:
- Home
- About
- Menu
- Reviews
- Careers
- Contact

### Location Management
- Location selector appears in the navigation when multiple locations are added
- Changing location updates:
  - Phone number displayed everywhere
  - Address and directions
  - Orders are tagged with the selected location

### Order Flow
1. Customer clicks "Pickup Orders" box on home page
2. Taken to Menu page where they can:
   - Add/remove items with +/- buttons
   - Customize items (add/remove ingredients)
   - Add items to cart
3. View cart and modify quantities
4. Checkout with required information:
   - Name (required)
   - Email (required)
   - Phone (required)
   - Pickup time (required)
   - Special instructions (optional)
5. Order submitted to admin dashboard

### Catering Flow
1. Customer clicks "Catering Services" box on home page
2. Choose between:
   - **Menu Catering**: Order from catering menu (coming soon)
   - **Food Truck Service**: Request food truck for events
3. Fill out event details and submit
4. Request appears in admin dashboard

### Reviews
- Customers can leave reviews with 1-5 star ratings
- Reviews require admin approval before appearing on the site
- Customers can optionally provide their email

### Job Applications
- Customers can apply for positions through the Careers page
- Applications include:
  - Contact information
  - Position applied for
  - Work experience
  - Availability
  - Additional information

## Adding a Second Location

To add a second location, you'll need to update the `LocationContext.tsx` file in the codebase.

Current location data is stored here:
```
src/contexts/LocationContext.tsx
```

Add a new location object to the `defaultLocations` array with:
- Unique ID
- Location name
- Address
- Phone number
- Clover merchant ID
- Clover API token
- Google Maps directions link

Once multiple locations exist, the location selector will automatically appear in the navigation.

## Important Notes

- All customer data is stored securely in the database
- Orders are tagged with location information
- The fake menu is currently in use - send the official menu to replace it
- Admin authentication uses Supabase - create admin users through Supabase dashboard
- Location-specific information (phone, address, Clover) automatically updates when location is changed

## Need Help?

Contact your developer if you need to:
- Add/modify locations
- Update the menu
- Create admin user accounts
- Customize any features

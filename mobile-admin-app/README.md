# Wally's Grill - Mobile Admin App

This is the mobile admin application for Wally's Grill, built with React Native and Expo. It connects to the same Supabase backend as the web admin dashboard.

## Features

- Admin authentication using Supabase
- Dashboard with real-time statistics
- View orders, reviews, career applications, and catering requests
- Pull-to-refresh functionality
- Cross-platform (iOS and Android)

## Prerequisites

Before running the mobile app, make sure you have:

1. **Node.js** installed (v16 or higher)
2. **Expo Go** app installed on your phone:
   - [iOS - Download from App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Android - Download from Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Installation

1. Navigate to the mobile app directory:
```bash
cd mobile-admin-app
```

2. Install dependencies:
```bash
npm install
```

## Running the App

### Option 1: Run on Your Phone (Recommended)

1. Start the development server:
```bash
npm start
```

2. A QR code will appear in your terminal

3. Open **Expo Go** app on your phone

4. Scan the QR code:
   - **iOS**: Use the Camera app to scan the QR code
   - **Android**: Use the Expo Go app's built-in scanner

5. The app will load on your phone!

### Option 2: Run on iOS Simulator (Mac Only)

```bash
npm run ios
```

### Option 3: Run on Android Emulator

Make sure you have Android Studio installed with an emulator set up, then:

```bash
npm run android
```

## Using the App

1. **Login**: Use your admin credentials (same as the web dashboard)
2. **Dashboard**: View statistics for orders, reviews, applications, and catering requests
3. **Pull to Refresh**: Swipe down on the dashboard to refresh the data
4. **Logout**: Tap the logout button in the top right

## Important Notes

- The mobile app connects to the same Supabase database as your web application
- Changes made on the web dashboard will be reflected in the mobile app and vice versa
- Make sure you're on the same network as your development machine when using Expo Go
- The app requires an active internet connection to function

## Troubleshooting

### QR Code Won't Scan
- Make sure your phone and computer are on the same WiFi network
- Try using the manual connection option in Expo Go

### App Won't Load
- Check that the development server is still running
- Restart the Expo server with `npm start` and try again

### Can't Login
- Verify your admin credentials are correct
- Check that your email is in the `approved_admins` table in Supabase

## Building for Production

To create standalone apps for the App Store or Google Play:

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Configure your project:
```bash
eas build:configure
```

3. Build for iOS:
```bash
eas build --platform ios
```

4. Build for Android:
```bash
eas build --platform android
```

For more information, visit the [Expo documentation](https://docs.expo.dev/).

## Tech Stack

- **React Native**: Mobile framework
- **Expo**: Development platform
- **TypeScript**: Type safety
- **Supabase**: Backend and authentication
- **AsyncStorage**: Local data persistence

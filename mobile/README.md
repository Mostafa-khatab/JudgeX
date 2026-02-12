# JudgeX Mobile App

React Native mobile app for JudgeX built with Expo.

## Setup

1. Install dependencies:
```bash
cd mobile
npm install
```

2. Start the development server:
```bash
npx expo start
```

3. Run on device:
- **Android Emulator**: Press `a`
- **iOS Simulator**: Press `i`
- **Physical Device**: Scan QR code with Expo Go app

## Project Structure

```
mobile/
├── App.js                    # Entry point
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Button.js
│   │   ├── Card.js
│   │   ├── Input.js
│   │   └── Logo.js
│   ├── context/              # React Context providers
│   │   └── AuthContext.js
│   ├── navigation/           # Navigation configuration
│   │   └── AppNavigator.js
│   ├── screens/              # App screens
│   │   ├── IndexScreen.js
│   │   ├── SignUpScreen.js
│   │   ├── LoginScreen.js
│   │   └── HomeScreen.js
│   ├── services/             # API services
│   │   ├── api.js
│   │   └── authService.js
│   └── theme/                # Design system
│       └── theme.js
└── assets/                   # Images and fonts
```

## Backend Configuration

Update the API base URL in `src/services/api.js`:

```javascript
// For Android Emulator
const API_BASE_URL = 'http://10.0.2.2:5000';

// For iOS Simulator
const API_BASE_URL = 'http://localhost:5000';

// For Physical Device (use your computer's IP)
const API_BASE_URL = 'http://YOUR_IP:5000';
```

## Features

- ✅ Dark theme matching web design
- ✅ User authentication (login/signup)
- ✅ Google OAuth (placeholder)
- ✅ Password strength validation
- ✅ Secure token storage

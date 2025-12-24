# JudgeX Mobile - Flutter App

Cross-platform mobile app for JudgeX coding platform.

## Quick Start

1. Install Flutter SDK: https://docs.flutter.dev/get-started/install
2. Run `flutter pub get`
3. Update API URL in `lib/core/constants/api_constants.dart`
4. Run `flutter run`

## Features

- ✅ Authentication (Login/Register)
- ✅ Home Dashboard
- ✅ Problems List with Search/Filter
- ✅ Interview Mode (Split View)
- ✅ User Profile
- ✅ Dark Theme with Glassmorphism

## Tech Stack

- Flutter 3.x
- Provider (State Management)
- GoRouter (Navigation)
- Dio (HTTP Client)
- Google Fonts (Inter)

## Structure

```
lib/
├── core/         # Theme, constants, network, widgets
├── models/       # Data models
├── providers/    # State management
├── router/       # Navigation
├── screens/      # UI screens
├── services/     # API services
└── main.dart     # Entry point
```

## Configuration

Update the backend API URL in `lib/core/constants/api_constants.dart`:
```dart
static const String baseUrl = 'http://YOUR_BACKEND_URL:5000';
```

## Build

- Android: `flutter build apk`
- iOS: `flutter build ios`

---
Built for JudgeX Project

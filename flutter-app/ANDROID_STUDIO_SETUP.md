# Creating JudgeX Flutter App with Android Studio

This guide walks you through creating the Flutter project using Android Studio's Flutter plugin.

## Prerequisites

1. ✅ Java Development Kit (JDK) 8 or higher
2. ⬜ Android Studio installed
3. ⬜ Flutter SDK installed
4. ⬜ Flutter and Dart plugins for Android Studio

## Step 1: Install Android Studio

1. **Download Android Studio**:
   - Go to https://developer.android.com/studio
   - Download the latest version for Windows
   - Run the installer

2. **During Installation**:
   - ✅ Android SDK
   - ✅ Android SDK Platform  
   - ✅ Android Virtual Device

3. **Complete Setup Wizard**:
   - Launch Android Studio
   - Follow the setup wizard
   - Install recommended SDK packages

## Step 2: Install Flutter SDK

### Option A: Using Android Studio (Recommended)

1. Open Android Studio
2. Go to **File** → **Settings** (or **Configure** → **Settings** from welcome screen)
3. Navigate to **Plugins**
4. Search for "**Flutter**"
5. Click **Install**
6. **Restart Android Studio** when prompted
7. After restart, Android Studio will prompt you to download Flutter SDK - follow the prompts

### Option B: Manual Installation

1. Download Flutter SDK from https://docs.flutter.dev/get-started/install/windows
2. Extract to `C:\src\flutter`
3. Add `C:\src\flutter\bin` to your PATH environment variable
4. Open a new command prompt and run:
   ```cmd
   flutter doctor
   ```
5. Accept Android licenses:
   ```cmd
   flutter doctor --android-licenses
   ```

## Step 3: Verify Flutter Installation

1. Open **Terminal** in Android Studio (View → Tool Windows → Terminal)

2. Run:
   ```bash
   flutter doctor
   ```

3. Expected output:
   ```
   [✓] Flutter (Channel stable)
   [✓] Android toolchain
   [✓] Android Studio
   [!] Connected device (if no emulator is running)
   ```

## Step 4: Create Flutter Project

### Using Android Studio UI:

1. **Start New Project**:
   - File → New → New Flutter Project...
   - Or from Welcome screen: **New Flutter Project**

2. **Select Flutter Application**:
   - Choose "Flutter Application"
   - Click **Next**

3. **Configure Project**:
   - **Project name**: `judgex_mobile`
   - **Project location**: `D:\JudgeX\JudgeX\flutter-app`
   - **Description**: `JudgeX mobile app for coding practice`
   - **Organization**: `com.judgex`
   - **Android language**: Kotlin
   - **iOS language**: Swift
   - **Platforms**: ✅ Android, ✅ iOS, ✅ Web (optional)
   - Click **Finish**

4. Android Studio will:
   - Create project structure
   - Download dependencies
   - Index files

### Using Terminal (Alternative):

1. Navigate to project parent directory:
   ```bash
   cd D:\JudgeX\JudgeX
   ```

2. Create Flutter project:
   ```bash
   flutter create --org com.judgex --project-name judgex_mobile -a kotlin -i swift flutter-app
   ```

3. Open in Android Studio:
   - File → Open
   - Select `D:\JudgeX\JudgeX\flutter-app`

## Step 5: Set Up Android Emulator

1. **Open AVD Manager**:
   - Tools → Device Manager
   - Or click device icon in toolbar

2. **Create Virtual Device**:
   - Click **Create Device**
   - Select hardware: **Pixel 5** or **Pixel 6**
   - Click **Next**

3. **Select System Image**:
   - Choose **Tiramisu** (API 33) or **UpsideDownCake** (API 34)
   - Download if needed
   - Click **Next**

4. **Verify Configuration**:
   - Name: Pixel 5 API 33
   - Click **Finish**

5. **Launch Emulator**:
   - Click ▶️ (Play icon) in Device Manager
   - Wait for emulator to boot

## Step 6: Run Default Flutter App

1. **Select Device**:
   - Top toolbar: Select your emulator from device dropdown

2. **Run App**:
   - Click ▶️ (Run) button
   - Or press **Shift+F10**
   - Or use menu: Run → Run 'main.dart'

3. **Verify**:
   - App should launch on emulator
   - You'll see the default Flutter counter app

## Step 7: Configure Project Dependencies

1. **Open `pubspec.yaml`**:
   - Located at project root
   - Double-click to open

2. **Add Dependencies** (replace dependencies section):
   ```yaml
   dependencies:
     flutter:
       sdk: flutter
     
     # UI & Theming
     google_fonts: ^6.1.0
     
     # State Management
     provider: ^6.1.1
     
     # Navigation
     go_router: ^13.0.0
     
     # Networking
     dio: ^5.4.0
     http: ^1.1.2
     
     # Storage
     flutter_secure_storage: ^9.0.0
     shared_preferences: ^2.2.2
     
     # Caching
     cached_network_image: ^3.3.1
     
     # Code Display
     flutter_highlight: ^0.7.0
     
     # Icons
     cupertino_icons: ^1.0.6
   ```

3. **Save file** (Ctrl+S)

4. Android Studio will prompt **"Pub get"** - click it, or manually run:
   ```bash
   flutter pub get
   ```

## Step 8: Project Structure Overview

After creation, your project will have:

```
flutter-app/
├── android/          # Android-specific code
├── ios/              # iOS-specific code
├── lib/              # Dart code (your app)
│   └── main.dart     # App entry point
├── test/             # Unit tests
├── web/              # Web platform files
├── pubspec.yaml      # Dependencies
└── README.md
```

## Step 9: Enable Hot Reload

Hot reload allows you to see changes instantly without restarting:

1. Make a change in `lib/main.dart`
2. Press **Ctrl+S** (Save)
3. Or click ⚡ (Hot Reload) button in toolbar
4. Changes appear in emulator immediately

## Next Steps

Now that you have a working Flutter project in Android Studio:

1. ✅ Project created
2. ⬜ Implement JudgeX features:
   - Authentication screens
   - Home dashboard
   - Problems list
   - Interview mode
   - Profile

3. ⬜ Configure backend API connection
4. ⬜ Test on emulator/device

## Useful Android Studio Shortcuts

- **Run**: Shift+F10
- **Hot Reload**: Ctrl+S or ⚡ button
- **Hot Restart**: Ctrl+Shift+S
- **Stop**: Ctrl+F2
- **Flutter Doctor**: View → Tool Windows → Terminal → `flutter doctor`
- **Flutter Commands**: Ctrl+Shift+A → type "flutter"

## Troubleshooting

### "Flutter SDK not found"
- Go to File → Settings → Languages & Frameworks → Flutter
- Set Flutter SDK path (e.g., `C:\src\flutter`)

### Build errors
```bash
flutter clean
flutter pub get
```

### Emulator not showing up
- Make sure emulator is running in Device Manager
- Restart Android Studio
- Run: `flutter devices`

### Gradle build fails
- Update Android Gradle Plugin in `android/build.gradle`
- Sync project (File → Sync Project with Gradle Files)

## Resources

- Android Studio Flutter Guide: https://docs.flutter.dev/tools/android-studio
- Flutter DevTools: https://docs.flutter.dev/tools/devtools
- Dart Packages: https://pub.dev

---

**Ready to code!** 🚀 Follow the implementation plan to build the JudgeX mobile app.

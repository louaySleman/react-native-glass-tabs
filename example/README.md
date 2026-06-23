# Glass Tabs Example

Demo app for [react-native-glass-tabs](https://github.com/louaySleman/react-native-glass-tabs).

## Structure

```
example/
├── App.tsx                    # Root — NavigationContainer + GlassTabs setup
├── src/
│   ├── screens/
│   │   ├── index.ts           # Barrel export
│   │   ├── ConfigScreen.tsx   # Live config editor (primary color, floating, labeled, haptics)
│   │   ├── SearchScreen.tsx   # Scrollable search results
│   │   ├── ChatScreen.tsx     # Chat list with contact rows
│   │   └── ProfileScreen.tsx  # Profile with scrollable cards
│   └── utils/
│       ├── icons.ts           # createNativeIcon() helper for Android Material 3
│       └── theme.ts           # useTheme() hook, shared styles, dark mode support
└── android/
    └── app/src/main/res/values/
        └── styles.xml         # Theme.Material3.DayNight.NoActionBar
```

## Features demonstrated

- **Config tab** — change primary color, toggle floating/labeled/haptics in real-time
- **Dark mode** — follows system preference, adapts all screens + tab bar + headers
- **Platform icons** — SF Symbols (iOS 26+), Ionicons render function (floating), native image sources (Android Material 3)
- **Header customization** — custom header title on Config tab, no header on Profile tab
- **Badge** — Chat tab shows a badge count of 3

## Running

```bash
# Install dependencies
yarn install

# iOS
cd ios && pod install && cd ..
yarn ios

# Android
yarn android
```

## Android setup

The example uses `Theme.Material3.DayNight.NoActionBar` in `styles.xml` for native Material 3 bottom navigation support. Make sure this is set in your own app too.

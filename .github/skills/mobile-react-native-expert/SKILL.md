---
name: mobile-react-native-expert
description: Mobile application development using React Native and Expo SDK. Trigger when building mobile UI components, handling native device APIs, navigation, or mobile performance optimization.
---

# Mobile & React Native Expert Skill Instructions

When developing cross-platform iOS and Android applications using React Native and Expo, follow these guidelines:

## 1. Native Layouts & UI Components
- Utilize `StyleSheet.create()` or utility styling engines rather than raw inline style objects to reduce JS bridge allocations.
- Safe Area Handling: Use `react-native-safe-area-context` (`SafeAreaView`, `useSafeAreaInsets`) to accommodate device notches, status bars, and home indicators.
- Use `FlatList` or `FlashList` with key extractors and memoized renders (`getItemLayout`, `removeClippedSubviews`) for high-performance long lists.

## 2. Navigation & Device Integration
- Structure application routes cleanly using `expo-router` or `@react-navigation/native` (Stack, Tab, Drawer navigators).
- Access device capabilities (Camera, Location, Push Notifications, Secure Store) via verified Expo SDK modules (`expo-camera`, `expo-secure-store`).
- Protect sensitive credentials using native encrypted storage rather than unencrypted `AsyncStorage`.

## 3. Gestures & Animation Performance
- Drive complex touch interactions using `react-native-gesture-handler` and native-thread animations with `react-native-reanimated`.
- Avoid heavy computations or synchronous JSON parsing on the JavaScript main thread.

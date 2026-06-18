import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="token" />
      <Stack.Screen name="booking-confirm" />
      <Stack.Screen name="ai-chat" />
      <Stack.Screen name="queue" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="branches" />
      <Stack.Screen name="notifications" />
    </Stack>
  );
}

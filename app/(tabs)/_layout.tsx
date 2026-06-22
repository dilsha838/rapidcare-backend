import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { View, Text, StyleSheet, Platform } from "react-native";

// ─── CUSTOM TAB BAR ICON ──────────────────────────────────────────────────────
function TabIcon({
  name,
  focused,
  color,
  label,
}: {
  name: any;
  focused: boolean;
  color: string;
  label: string;
}) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      {focused && <View style={styles.activeIndicator} />}
      <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
        <Ionicons name={name} size={22} color={color} />
      </View>
      <Text
        style={[styles.tabLabel, { color }, focused && styles.tabLabelActive]}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#334155",
        tabBarStyle: {
          backgroundColor: "#080818",
          borderTopWidth: 0.5,
          borderTopColor: "#1C1C3A",
          height: Platform.OS === "ios" ? 85 : 70,
          paddingBottom: Platform.OS === "ios" ? 20 : 8,
          paddingTop: 8,
          paddingHorizontal: 8,
          elevation: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
      }}
    >
      {/* HOME */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "home" : "home-outline"}
              focused={focused}
              color={color}
              label="Home"
            />
          ),
        }}
      />

      {/* DOCTORS */}
      <Tabs.Screen
        name="doctors"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "medical" : "medical-outline"}
              focused={focused}
              color={color}
              label="Doctors"
            />
          ),
        }}
      />

      {/* BOOKING — center highlight */}
      <Tabs.Screen
        name="booking"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.centerTabWrap}>
              <View
                style={[
                  styles.centerTab,
                  { backgroundColor: focused ? "#3B82F6" : "#1C1C3A" },
                ]}
              >
                <Ionicons
                  name={focused ? "calendar" : "calendar-outline"}
                  size={24}
                  color={focused ? "#fff" : "#555580"}
                />
              </View>
              <Text
                style={[
                  styles.centerTabLabel,
                  { color: focused ? "#3B82F6" : "#334155" },
                ]}
              >
                Booking
              </Text>
            </View>
          ),
        }}
      />

      {/* PROFILE */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name={focused ? "person" : "person-outline"}
              focused={focused}
              color={color}
              label="Profile"
            />
          ),
        }}
      />

      {/* Hidden tabs — not in tab bar */}
      <Tabs.Screen name="context/_layout" options={{ href: null }} />
    </Tabs>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
    width: 70,
    gap: 3,
    position: "relative",
  },
  tabItemActive: {},

  activeIndicator: {
    position: "absolute",
    top: -8,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#3B82F6",
  },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapActive: {
    backgroundColor: "rgba(59,130,246,0.12)",
  },

  tabLabel: {
    fontSize: 8,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    fontWeight: "800",
  },
  tabBarStyle: {
    backgroundColor: "#080818",
    borderTopWidth: 0.5,
    borderTopColor: "#1C1C3A",
    height: Platform.OS === "ios" ? 85 : 70,
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
    paddingTop: 8,
    paddingHorizontal: 8,
    marginBottom: 20, // ← මේක add කරන්න
    marginHorizontal: 16, // ← sides ෙකන් float
    borderRadius: 20, // ← round corners
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  // Center booking button
  centerTabWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingTop: 4, // ← same as tabItem
  },
  centerTab: {
    width: 40, // ← 52 → 40
    height: 40, // ← 52 → 40
    borderRadius: 12, // ← 16 → 12
    justifyContent: "center",
    alignItems: "center",
    // ← marginTop: -16 DELETE
    elevation: 8,
  },
  centerTabLabel: {
    fontSize: 8,
    fontWeight: "700",
    // ← marginTop: 2 DELETE
  },
});

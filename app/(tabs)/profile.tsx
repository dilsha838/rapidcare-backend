import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
  Alert,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

interface User {
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState(true);
  const [biometric, setBiometric] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    loadUser();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const loadUser = async () => {
    try {
      const data = await AsyncStorage.getItem("user");
      if (data) setUser(JSON.parse(data));
    } catch {}
  };

  const handleLogout = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "user",
            "authToken",
            "savedEmail",
            "savedPassword",
            "lastToken",
            "upcomingAppointment",
          ]);
          router.replace("/login");
        },
      },
    ]);
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear App Data",
      "This will clear all cached data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.multiRemove([
              "lastToken",
              "upcomingAppointment",
              "cartItems",
              "bookingData",
            ]);
            Alert.alert("✅ Done", "App data cleared successfully.");
          },
        },
      ],
    );
  };

  const displayName = user?.fullName || user?.name || "Patient";
  const firstName = displayName.split(" ")[0];
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  // ── Menu sections ─────────────────────────────────────────────────────────
  const MENU = [
    {
      title: "My Health",
      items: [
        {
          icon: "calendar-outline" as const,
          label: "My Bookings",
          color: "#3B82F6",
          onPress: () => router.push("/payment"),
        },
        {
          icon: "document-text-outline" as const,
          label: "My Reports",
          color: "#10B981",
          onPress: () => router.push("/reports"),
        },
        {
          icon: "qr-code-outline" as const,
          label: "My Token",
          color: "#F59E0B",
          onPress: () => router.push("/token"),
        },
        {
          icon: "time-outline" as const,
          label: "Queue Status",
          color: "#A855F7",
          onPress: () => router.push("/queue"),
        },
      ],
    },
    {
      title: "Quick Access",
      items: [
        {
          icon: "flask-outline" as const,
          label: "Book a Test",
          color: "#3B82F6",
          onPress: () => router.push("/(tabs)/booking"),
        },
        {
          icon: "medical-outline" as const,
          label: "Our Doctors",
          color: "#EC4899",
          onPress: () => router.push("/(tabs)/doctors"),
        },
        {
          icon: "location-outline" as const,
          label: "Find Branch",
          color: "#06B6D4",
          onPress: () => router.push("/branches"),
        },
        {
          icon: "sparkles-outline" as const,
          label: "AI Assistant",
          color: "#EC4899",
          onPress: () => router.push("/ai-chat"),
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          icon: "notifications-outline" as const,
          label: "Notifications",
          color: "#F59E0B",
          toggle: true,
          value: notifications,
          onToggle: setNotifications,
        },
        {
          icon: "finger-print-outline" as const,
          label: "Fingerprint Login",
          color: "#10B981",
          toggle: true,
          value: biometric,
          onToggle: setBiometric,
        },
        {
          icon: "trash-outline" as const,
          label: "Clear App Data",
          color: "#EF4444",
          onPress: handleClearData,
        },
      ],
    },
    {
      title: "About",
      items: [
        {
          icon: "information-circle-outline" as const,
          label: "App Version",
          color: "#6366F1",
          value: "v1.0.0",
        },
        {
          icon: "shield-checkmark-outline" as const,
          label: "Privacy Policy",
          color: "#10B981",
          onPress: () =>
            Alert.alert("Privacy Policy", "RapidCare respects your privacy."),
        },
        {
          icon: "help-circle-outline" as const,
          label: "Help & Support",
          color: "#3B82F6",
          onPress: () =>
            Alert.alert(
              "Support",
              "Email: support@rapidcare.lk\nCall: +94 11 234 5678",
            ),
        },
      ],
    },
  ];

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050510" />

      {/* Bg */}
      <View style={s.bgAbs} pointerEvents="none">
        <Animated.View style={[s.blobTL, { opacity: glowOpacity }]} />
        <Animated.View style={[s.blobBR, { opacity: glowOpacity }]} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* ── PROFILE HERO ───────────────────────────────────────────────── */}
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          <LinearGradient colors={["#0D0D28", "#131340"]} style={s.hero}>
            {/* Avatar */}
            <Animated.View
              style={[s.avatarWrap, { transform: [{ scale: scaleAnim }] }]}
            >
              <LinearGradient
                colors={["#3B82F6", "#6366F1", "#A855F7"]}
                style={s.avatarGrad}
              >
                <Text style={s.avatarInitials}>{initials}</Text>
              </LinearGradient>
              <Animated.View style={[s.avatarGlow, { opacity: glowOpacity }]} />
            </Animated.View>

            {/* Name */}
            <Text style={s.heroName}>{displayName}</Text>
            <Text style={s.heroEmail}>{user?.email || "—"}</Text>
            {user?.phone && <Text style={s.heroPhone}>📱 {user.phone}</Text>}

            {/* Badges */}
            <View style={s.badgeRow}>
              <View style={s.badge}>
                <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                <Text style={s.badgeText}>Verified Patient</Text>
              </View>
              <View
                style={[
                  s.badge,
                  {
                    borderColor: "rgba(59,130,246,0.3)",
                    backgroundColor: "rgba(59,130,246,0.1)",
                  },
                ]}
              >
                <Ionicons name="star" size={12} color="#3B82F6" />
                <Text style={[s.badgeText, { color: "#3B82F6" }]}>Member</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={s.statsRow}>
              {[
                {
                  label: "Bookings",
                  value: "3",
                  icon: "calendar-outline" as const,
                  color: "#3B82F6",
                },
                {
                  label: "Reports",
                  value: "2",
                  icon: "document-outline" as const,
                  color: "#10B981",
                },
                {
                  label: "Doctors",
                  value: "6",
                  icon: "medical-outline" as const,
                  color: "#EC4899",
                },
              ].map((stat, i) => (
                <View key={i} style={s.statBox}>
                  <Ionicons name={stat.icon} size={16} color={stat.color} />
                  <Text style={[s.statNum, { color: stat.color }]}>
                    {stat.value}
                  </Text>
                  <Text style={s.statLbl}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── MENU SECTIONS ──────────────────────────────────────────────── */}
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {MENU.map((section) => (
            <View key={section.title} style={s.section}>
              <Text style={s.sectionTitle}>{section.title}</Text>
              <View style={s.sectionCard}>
                <LinearGradient
                  colors={["#0C0C22", "#0E0E28"]}
                  style={s.sectionGrad}
                >
                  {section.items.map((item: any, i: number) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        s.menuItem,
                        i < section.items.length - 1 && s.menuItemBorder,
                      ]}
                      onPress={item.onPress}
                      activeOpacity={item.onPress ? 0.7 : 1}
                      disabled={!item.onPress && !item.toggle}
                    >
                      <View
                        style={[
                          s.menuIconWrap,
                          { backgroundColor: `${item.color}15` },
                        ]}
                      >
                        <Ionicons
                          name={item.icon}
                          size={18}
                          color={item.color}
                        />
                      </View>
                      <Text style={s.menuLabel}>{item.label}</Text>
                      <View style={s.menuRight}>
                        {item.toggle ? (
                          <Switch
                            value={item.value}
                            onValueChange={item.onToggle}
                            trackColor={{
                              false: "#1C1C3A",
                              true: `${item.color}60`,
                            }}
                            thumbColor={item.value ? item.color : "#555580"}
                          />
                        ) : item.value ? (
                          <Text style={s.menuValue}>{item.value}</Text>
                        ) : item.onPress ? (
                          <Ionicons
                            name="chevron-forward"
                            size={16}
                            color="#333358"
                          />
                        ) : null}
                      </View>
                    </TouchableOpacity>
                  ))}
                </LinearGradient>
              </View>
            </View>
          ))}

          {/* Sign Out */}
          <TouchableOpacity
            style={s.signOutBtn}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["rgba(239,68,68,0.12)", "rgba(239,68,68,0.08)"]}
              style={s.signOutGrad}
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={s.signOutText}>Sign Out</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={s.footer}>
            RapidCare Smart Lab · v1.0.0{"\n"}© 2026 RapidCare (Pvt) Ltd
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const BORDER = "#1C1C3A";
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050510" },
  bgAbs: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  blobTL: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: "rgba(99,102,241,0.1)",
    top: -60,
    left: -60,
  },
  blobBR: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(168,85,247,0.08)",
    bottom: 80,
    right: -50,
  },
  scroll: { paddingBottom: 120 },

  // Hero
  hero: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  avatarWrap: { position: "relative", marginBottom: 14 },
  avatarGrad: {
    width: 90,
    height: 90,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
  },
  avatarGlow: {
    position: "absolute",
    bottom: -8,
    left: -8,
    right: -8,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(99,102,241,0.3)",
  },
  heroName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  heroEmail: { fontSize: 13, color: "#555580", marginBottom: 4 },
  heroPhone: { fontSize: 12, color: "#555580", marginBottom: 14 },
  badgeRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16,185,129,0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "rgba(16,185,129,0.3)",
  },
  badgeText: { fontSize: 11, color: "#10B981", fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 8, width: "100%" },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 4,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  statNum: { fontSize: 18, fontWeight: "900" },
  statLbl: { fontSize: 9, color: "#555580", letterSpacing: 0.3 },

  // Sections
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555580",
    letterSpacing: 1,
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionCard: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  sectionGrad: {},
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  menuItemBorder: { borderBottomWidth: 0.5, borderBottomColor: BORDER },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  menuLabel: { flex: 1, fontSize: 14, color: "#fff", fontWeight: "500" },
  menuRight: { alignItems: "flex-end" },
  menuValue: { fontSize: 12, color: "#555580" },

  // Sign out
  signOutBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(239,68,68,0.2)",
  },
  signOutGrad: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    height: 54,
  },
  signOutText: { fontSize: 15, fontWeight: "800", color: "#EF4444" },

  footer: {
    textAlign: "center",
    fontSize: 11,
    color: "#1C1C30",
    marginTop: 20,
    lineHeight: 18,
  },
});

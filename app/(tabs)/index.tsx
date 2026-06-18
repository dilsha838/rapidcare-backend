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
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

interface User {
  fullName: string;
  email: string;
  role: string;
}

const SERVICES = [
  {
    id: "1",
    icon: "flask" as const,
    label: "Blood Test Booking",
    desc: "Book CBC, Lipid, Sugar & more",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.12)",
    route: "/booking",
  },
  {
    id: "2",
    icon: "time" as const,
    label: "Queue Tracking",
    desc: "Real-time queue position & ETA",
    color: "#A855F7",
    bg: "rgba(168,85,247,0.12)",
    route: "/queue",
  },
  {
    id: "3",
    icon: "document-text" as const,
    label: "Download Reports",
    desc: "View & download test results (PDF)",
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    route: "/reports",
  },
  {
    id: "4",
    icon: "qr-code" as const,
    label: "My Token",
    desc: "Show QR token at lab entry",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    route: "/token",
  },
  {
    id: "5",
    icon: "sparkles" as const,
    label: "AI Health Assistant",
    desc: "Ask about tests, fasting & health",
    color: "#EC4899",
    bg: "rgba(236,72,153,0.12)",
    route: "/ai-chat",
  },
  {
    id: "6",
    icon: "location" as const,
    label: "Find Branch",
    desc: "Nearest Smart Lab locations",
    color: "#06B6D4",
    bg: "rgba(6,182,212,0.12)",
    route: "/branches",
  },
];

const QUICK_STATS = [
  {
    label: "Tests Available",
    value: "50+",
    icon: "flask-outline" as const,
    color: "#3B82F6",
  },
  {
    label: "Branches",
    value: "3",
    icon: "location-outline" as const,
    color: "#A855F7",
  },
  {
    label: "Reports Ready",
    value: "2",
    icon: "document-outline" as const,
    color: "#10B981",
  },
];

export default function HomeScreen() {
  const router = useRouter();

  // ✅ useState MUST be inside component
  const [user, setUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [upcoming, setUpcoming] = useState<{
    time: string;
    tests: string;
  } | null>({ time: "Tomorrow, 7:00 AM", tests: "CBC + Lipid Profile" });

  const headerAnim = useRef(new Animated.Value(-20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(30)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUser();
    loadNotifCount(); // ✅ Call here

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(headerAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnim, {
        toValue: 0,
        duration: 600,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 3000,
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

  // ✅ loadNotifCount — proper function
  const loadNotifCount = async () => {
    try {
      const t = await AsyncStorage.getItem("lastToken");
      if (t) setUnreadCount(2);
      else setUnreadCount(0);
    } catch {}
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove([
      "authToken",
      "user",
      "savedEmail",
      "savedPassword",
    ]);
    router.replace("/login");
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.5],
  });
  const firstName = user?.fullName?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050510" />

      <View style={s.bgAbs} pointerEvents="none">
        <Animated.View style={[s.blob, s.blobTL, { opacity: glowOpacity }]} />
        <Animated.View style={[s.blob, s.blobBR, { opacity: glowOpacity }]} />
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: headerAnim }] }}
        >
          <LinearGradient colors={["#0D0D28", "#131340"]} style={s.header}>
            <View style={s.headerTop}>
              <View>
                <Text style={s.greetingText}>{greeting},</Text>
                <Text style={s.userName}>{firstName} 👋</Text>
              </View>
              <View style={s.headerActions}>
                {/* ✅ SINGLE notification button — correctly connected */}
                <TouchableOpacity
                  style={s.iconBtn}
                  onPress={() => {
                    setUnreadCount(0); // clear badge on open
                    router.push("/notifications");
                  }}
                >
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color="#fff"
                  />
                  {unreadCount > 0 && (
                    <View style={s.notifDot}>
                      <Text style={s.notifDotText}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={s.iconBtn} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.logoRow}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={s.logoImg}
                resizeMode="contain"
              />
            </View>

            <View style={s.statsRow}>
              {QUICK_STATS.map((stat) => (
                <View key={stat.label} style={s.statBox}>
                  <Ionicons name={stat.icon} size={16} color={stat.color} />
                  <Text style={s.statValue}>{stat.value}</Text>
                  <Text style={s.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: cardAnim }] }}
        >
          {/* ── UPCOMING ─────────────────────────────────────────────── */}
          {upcoming && (
            <TouchableOpacity
              style={s.upcomingCard}
              onPress={() => router.push("/token")}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#1A1A40", "#1E1E48"]}
                style={s.upcomingGrad}
              >
                <View style={s.upcomingLeft}>
                  <View style={s.upcomingIconWrap}>
                    <Ionicons name="calendar" size={20} color="#3B82F6" />
                  </View>
                  <View>
                    <Text style={s.upcomingLabel}>Upcoming Appointment</Text>
                    <Text style={s.upcomingTests}>{upcoming.tests}</Text>
                    <Text style={s.upcomingTime}>{upcoming.time}</Text>
                  </View>
                </View>
                <View style={s.tokenBadge}>
                  <Text style={s.tokenText}>#12</Text>
                  <Ionicons name="chevron-forward" size={14} color="#3B82F6" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* ── AI BANNER ────────────────────────────────────────────── */}
          <TouchableOpacity
            style={s.aiBanner}
            onPress={() => router.push("/ai-chat")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#1A0A2E", "#2D1B4E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.aiGrad}
            >
              <View style={s.aiLeft}>
                <View style={s.aiIconWrap}>
                  <Ionicons name="sparkles" size={20} color="#EC4899" />
                </View>
                <View>
                  <Text style={s.aiTitle}>AI Health Assistant</Text>
                  <Text style={s.aiSub}>
                    Ask about fasting, tests & results
                  </Text>
                </View>
              </View>
              <LinearGradient colors={["#EC4899", "#A855F7"]} style={s.aiArrow}>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </LinearGradient>
            </LinearGradient>
          </TouchableOpacity>

          {/* ── SERVICES ─────────────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Available Services</Text>
            <View style={s.servicesGrid}>
              {SERVICES.map((svc) => (
                <TouchableOpacity
                  key={svc.id}
                  style={s.serviceCard}
                  onPress={() => router.push(svc.route as any)}
                  activeOpacity={0.82}
                >
                  <View style={[s.svcIconWrap, { backgroundColor: svc.bg }]}>
                    <Ionicons name={svc.icon} size={24} color={svc.color} />
                  </View>
                  <Text style={s.svcLabel}>{svc.label}</Text>
                  <Text style={s.svcDesc}>{svc.desc}</Text>
                  <View style={s.svcArrow}>
                    <Ionicons
                      name="arrow-forward-outline"
                      size={12}
                      color={svc.color}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>How It Works</Text>
            <View style={s.stepsWrap}>
              {[
                {
                  num: "1",
                  icon: "search-outline" as const,
                  title: "Select Tests",
                  desc: "Choose from 50+ lab tests",
                  color: "#3B82F6",
                },
                {
                  num: "2",
                  icon: "calendar-outline" as const,
                  title: "Book Slot",
                  desc: "Pick branch & time slot",
                  color: "#A855F7",
                },
                {
                  num: "3",
                  icon: "card-outline" as const,
                  title: "Pay Online",
                  desc: "Secure PayHere payment",
                  color: "#10B981",
                },
                {
                  num: "4",
                  icon: "qr-code-outline" as const,
                  title: "Get Token",
                  desc: "QR token — skip the queue",
                  color: "#F59E0B",
                },
              ].map((step, i) => (
                <View key={step.num} style={s.stepRow}>
                  <View
                    style={[
                      s.stepNumWrap,
                      { backgroundColor: `${step.color}22` },
                    ]}
                  >
                    <Text style={[s.stepNum, { color: step.color }]}>
                      {step.num}
                    </Text>
                  </View>
                  <View
                    style={[
                      s.stepIconWrap,
                      { backgroundColor: `${step.color}15` },
                    ]}
                  >
                    <Ionicons name={step.icon} size={18} color={step.color} />
                  </View>
                  <View style={s.stepInfo}>
                    <Text style={s.stepTitle}>{step.title}</Text>
                    <Text style={s.stepDesc}>{step.desc}</Text>
                  </View>
                  {i < 3 && <View style={s.stepLine} />}
                </View>
              ))}
            </View>
          </View>

          {/* ── BOOK NOW ─────────────────────────────────────────────── */}
          <TouchableOpacity
            style={s.ctaBtn}
            onPress={() => router.push("/(tabs)/booking")}
            activeOpacity={0.87}
          >
            <LinearGradient
              colors={["#3B82F6", "#6366F1", "#A855F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.ctaGrad}
            >
              <Ionicons name="flask" size={20} color="#fff" />
              <Text style={s.ctaText}>Book a Lab Test Now</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const CARD_BG = "#0E0E24";
const BORDER = "#1C1C3A";
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050510" },
  scroll: { flex: 1 },
  bgAbs: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  blob: { position: "absolute", borderRadius: 999 },
  blobTL: {
    width: 320,
    height: 320,
    backgroundColor: "rgba(99,102,241,0.10)",
    top: -80,
    left: -60,
  },
  blobBR: {
    width: 260,
    height: 260,
    backgroundColor: "rgba(168,85,247,0.09)",
    bottom: 100,
    right: -50,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    borderBottomWidth: 0.5,
    borderColor: BORDER,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  greetingText: { fontSize: 13, color: "rgba(255,255,255,0.5)" },
  userName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 2,
    letterSpacing: -0.3,
  },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notifDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#EC4899",
    borderWidth: 1.5,
    borderColor: "#050510",
    justifyContent: "center",
    alignItems: "center",
  },
  notifDotText: { fontSize: 7, color: "#fff", fontWeight: "800" },
  logoRow: { alignItems: "center", marginBottom: 20 },
  logoImg: { width: width * 0.55, height: 48 },
  statsRow: { flexDirection: "row", gap: 8 },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 4,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  statValue: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  statLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  upcomingCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  upcomingGrad: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  upcomingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  upcomingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(59,130,246,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  upcomingLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  upcomingTests: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  upcomingTime: { fontSize: 12, color: "#3B82F6", marginTop: 2 },
  tokenBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(59,130,246,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tokenText: { fontSize: 13, fontWeight: "800", color: "#3B82F6" },
  aiBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "#2D1B4E",
  },
  aiGrad: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aiLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  aiIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(236,72,153,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  aiTitle: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  aiSub: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  aiArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  servicesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  serviceCard: {
    width: (width - 42) / 2,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 16,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  svcIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  svcLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  svcDesc: { fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 16 },
  svcArrow: { marginTop: 10 },
  stepsWrap: {
    backgroundColor: CARD_BG,
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    borderColor: BORDER,
    gap: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    position: "relative",
  },
  stepNumWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNum: { fontSize: 12, fontWeight: "800" },
  stepIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  stepInfo: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  stepDesc: { fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 },
  stepLine: {
    position: "absolute",
    left: 13,
    bottom: -4,
    width: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  ctaBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 18,
    overflow: "hidden",
  },
  ctaGrad: {
    height: 60,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});

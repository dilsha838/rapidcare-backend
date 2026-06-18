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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

interface TokenData {
  tokenNumber: number;
  branch: string;
  date: string;
  timeSlot: string;
  tests: { name: string; price: number }[];
  totalAmount: number;
  orderId: string;
  paidAt: string;
  bookingId?: string;
  status?: string;
}

export default function TokenScreen() {
  const router = useRouter();
  const [token, setToken] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadToken();
  }, []);

  useEffect(() => {
    if (token) {
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.04,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();

      // Glow loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [token]);

  const loadToken = async () => {
    try {
      const data = await AsyncStorage.getItem("lastToken");
      if (data) setToken(JSON.parse(data));
    } catch {}
    setLoading(false);
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      if (d.toDateString() === today.toDateString()) return "Today";
      if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
      return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // QR grid pattern
  const QRGrid = ({ tokenNum }: { tokenNum: number }) => {
    const seed = tokenNum * 7;
    const filled = (r: number, c: number) =>
      (r < 2 && c < 2) ||
      (r < 2 && c > 4) ||
      (r > 4 && c < 2) ||
      (r === 3 && c === 3) ||
      (r * 3 + c * 7 + seed) % 4 === 0;
    return (
      <View style={st.qrGrid}>
        {Array.from({ length: 7 }).map((_, row) => (
          <View key={row} style={st.qrRow}>
            {Array.from({ length: 7 }).map((_, col) => (
              <View
                key={col}
                style={[st.qrCell, filled(row, col) && st.qrCellOn]}
              />
            ))}
          </View>
        ))}
      </View>
    );
  };

  // ── No token screen ───────────────────────────────────────────────────────
  if (!loading && !token) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor="#050510" />
        <View style={s.bgAbs} pointerEvents="none">
          <View style={s.blobTL} />
          <View style={s.blobBR} />
        </View>

        {/* Header */}
        <LinearGradient colors={["#0D0D28", "#131340"]} style={s.header}>
          <View style={s.headerRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>My Token</Text>
            <View style={{ width: 36 }} />
          </View>
        </LinearGradient>

        <View style={s.emptyWrap}>
          <View style={s.emptyIconWrap}>
            <Ionicons name="qr-code-outline" size={48} color="#1C1C3A" />
          </View>
          <Text style={s.emptyTitle}>No Token Found</Text>
          <Text style={s.emptySub}>
            Book a lab test to get your queue token
          </Text>
          <TouchableOpacity
            style={s.emptyBtn}
            onPress={() => router.push("/(tabs)/booking")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#3B82F6", "#6366F1", "#A855F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.emptyBtnGrad}
            >
              <Ionicons name="flask" size={16} color="#fff" />
              <Text style={s.emptyBtnText}>Book a Test</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Token screen ──────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050510" />

      {/* Bg */}
      <View style={s.bgAbs} pointerEvents="none">
        <Animated.View style={[s.blobTL, { opacity: glowOpacity }]} />
        <Animated.View style={[s.blobBR, { opacity: glowOpacity }]} />
      </View>

      {/* Header */}
      <LinearGradient colors={["#0D0D28", "#131340"]} style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>My Token</Text>
          <View style={s.headerBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={s.headerBadgeText}>Confirmed</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {token && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              width: "100%",
            }}
          >
            {/* ── TOKEN CARD ─────────────────────────────────────────── */}
            <Animated.View
              style={[s.tokenCard, { transform: [{ scale: pulseAnim }] }]}
            >
              <LinearGradient
                colors={["#0E0E28", "#131340"]}
                style={s.tokenCardInner}
              >
                {/* Top shimmer bar */}
                <LinearGradient
                  colors={["#3B82F6", "#6366F1", "#A855F7", "#EC4899"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.tokenTopBar}
                />

                <View style={s.tokenBody}>
                  {/* Token label + number */}
                  <View style={s.tokenCenter}>
                    <Text style={s.tokenLabel}>YOUR QUEUE TOKEN</Text>
                    <Text style={s.tokenNumber}>
                      #{String(token.tokenNumber).padStart(2, "0")}
                    </Text>
                  </View>

                  {/* QR code */}
                  <View style={s.qrWrap}>
                    <QRGrid tokenNum={token.tokenNumber} />
                  </View>
                  <Text style={s.qrHint}>
                    <Ionicons
                      name="phone-portrait-outline"
                      size={12}
                      color="#555580"
                    />{" "}
                    Show this at lab entry
                  </Text>

                  <View style={s.tokenDivider} />

                  {/* Booking details */}
                  <View style={s.tokenDetails}>
                    <View style={s.tokenDetailRow}>
                      <View style={s.tokenDetailIcon}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color="#3B82F6"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.tokenDetailLabel}>Branch</Text>
                        <Text style={s.tokenDetailValue} numberOfLines={1}>
                          {token.branch}
                        </Text>
                      </View>
                    </View>

                    <View style={s.tokenDetailRow}>
                      <View style={s.tokenDetailIcon}>
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color="#A855F7"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.tokenDetailLabel}>Appointment</Text>
                        <Text style={s.tokenDetailValue}>
                          {formatDate(token.date)} · {token.timeSlot}
                        </Text>
                      </View>
                    </View>

                    <View style={s.tokenDetailRow}>
                      <View style={s.tokenDetailIcon}>
                        <Ionicons
                          name="flask-outline"
                          size={14}
                          color="#10B981"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.tokenDetailLabel}>Tests</Text>
                        <Text style={s.tokenDetailValue}>
                          {token.tests?.map((t) => t.name).join(", ") ||
                            "Lab Tests"}
                        </Text>
                      </View>
                    </View>

                    <View style={s.tokenDetailRow}>
                      <View style={s.tokenDetailIcon}>
                        <Ionicons
                          name="cash-outline"
                          size={14}
                          color="#F59E0B"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.tokenDetailLabel}>Amount Paid</Text>
                        <Text
                          style={[s.tokenDetailValue, { color: "#10B981" }]}
                        >
                          Rs. {token.totalAmount?.toLocaleString()} ✓
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={s.tokenDivider} />

                  {/* Order ID */}
                  <View style={s.orderIdRow}>
                    <Text style={s.orderIdLabel}>Order ID</Text>
                    <Text style={s.orderIdValue}>{token.orderId}</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* ── INSTRUCTIONS ──────────────────────────────────────── */}
            <View style={s.instructionsCard}>
              <LinearGradient
                colors={["#0C0C22", "#0E0E28"]}
                style={s.instructionsGrad}
              >
                <Text style={s.instructionsTitle}>📋 Instructions</Text>
                {[
                  {
                    icon: "time-outline" as const,
                    text: "Arrive 10 minutes before your appointment",
                    color: "#3B82F6",
                  },
                  {
                    icon: "phone-portrait-outline" as const,
                    text: "Show this QR token at the reception",
                    color: "#A855F7",
                  },
                  {
                    icon: "water-outline" as const,
                    text: "Bring your NIC or any valid photo ID",
                    color: "#10B981",
                  },
                  {
                    icon: "restaurant-outline" as const,
                    text: token.tests?.some(
                      (t) =>
                        t.name.toLowerCase().includes("sugar") ||
                        t.name.toLowerCase().includes("lipid") ||
                        t.name.toLowerCase().includes("fbs"),
                    )
                      ? "Fasting required — avoid food & drinks (water OK)"
                      : "No fasting required for your selected tests",
                    color: "#F59E0B",
                  },
                ].map((item, i) => (
                  <View key={i} style={s.instructionRow}>
                    <View
                      style={[
                        s.instructionIconWrap,
                        { backgroundColor: `${item.color}15` },
                      ]}
                    >
                      <Ionicons name={item.icon} size={15} color={item.color} />
                    </View>
                    <Text style={s.instructionText}>{item.text}</Text>
                  </View>
                ))}
              </LinearGradient>
            </View>

            {/* ── ACTIONS ───────────────────────────────────────────── */}
            <View style={s.actions}>
              <TouchableOpacity
                style={s.actionBtn}
                onPress={() => router.replace("/(tabs)")}
                activeOpacity={0.87}
              >
                <LinearGradient
                  colors={["#3B82F6", "#6366F1", "#A855F7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.actionBtnGrad}
                >
                  <Ionicons name="home-outline" size={18} color="#fff" />
                  <Text style={s.actionBtnText}>Back to Home</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.actionBtnOutline}
                onPress={() => router.push("/payment")}
                activeOpacity={0.85}
              >
                <Ionicons name="list-outline" size={18} color="#3B82F6" />
                <Text style={s.actionBtnOutlineText}>View All Bookings</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const BORDER = "#1C1C3A";

const st = StyleSheet.create({
  qrGrid: {
    padding: 10,
    backgroundColor: "rgba(59,130,246,0.08)",
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: "rgba(59,130,246,0.2)",
  },
  qrRow: { flexDirection: "row", gap: 3, marginBottom: 3 },
  qrCell: {
    width: 14,
    height: 14,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  qrCellOn: { backgroundColor: "#3B82F6" },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050510" },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 48,
  },
  bgAbs: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  blobTL: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.1)",
    top: -60,
    left: -60,
  },
  blobBR: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(168,85,247,0.09)",
    bottom: 80,
    right: -50,
  },

  // Header
  header: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16,185,129,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "rgba(16,185,129,0.3)",
  },
  headerBadgeText: { fontSize: 11, color: "#10B981", fontWeight: "600" },

  // Token card
  tokenCard: {
    width: "100%",
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 14,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  tokenCardInner: {},
  tokenTopBar: { height: 4, width: "100%" },
  tokenBody: { alignItems: "center", padding: 20 },
  tokenCenter: { alignItems: "center", marginBottom: 16 },
  tokenLabel: {
    fontSize: 10,
    color: "#555580",
    letterSpacing: 1.5,
    fontWeight: "700",
    marginBottom: 6,
  },
  tokenNumber: {
    fontSize: 72,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -3,
    lineHeight: 78,
  },
  qrWrap: { marginBottom: 10 },
  qrHint: { fontSize: 12, color: "#555580", marginBottom: 16 },
  tokenDivider: {
    height: 0.5,
    backgroundColor: BORDER,
    width: "100%",
    marginVertical: 14,
  },
  tokenDetails: { width: "100%", gap: 12 },
  tokenDetailRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  tokenDetailIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(59,130,246,0.1)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  tokenDetailLabel: {
    fontSize: 10,
    color: "#555580",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  tokenDetailValue: { fontSize: 13, fontWeight: "600", color: "#fff" },
  orderIdRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  orderIdLabel: { fontSize: 11, color: "#555580" },
  orderIdValue: { fontSize: 11, color: "#3B82F6", fontWeight: "600" },

  // Instructions
  instructionsCard: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: BORDER,
    marginBottom: 14,
  },
  instructionsGrad: { padding: 16 },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 14,
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },
  instructionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  instructionText: {
    flex: 1,
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 18,
    paddingTop: 7,
  },

  // Actions
  actions: { width: "100%", gap: 10 },
  actionBtn: { borderRadius: 16, overflow: "hidden" },
  actionBtnGrad: {
    flexDirection: "row",
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  actionBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
  actionBtnOutline: {
    flexDirection: "row",
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1C3A5A",
    backgroundColor: "rgba(59,130,246,0.06)",
  },
  actionBtnOutlineText: { fontSize: 15, fontWeight: "700", color: "#3B82F6" },

  // Empty state
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(28,28,58,0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  emptySub: {
    fontSize: 14,
    color: "#555580",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 8,
    width: "100%",
  },
  emptyBtnGrad: {
    flexDirection: "row",
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  emptyBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
});

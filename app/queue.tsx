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
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useEffect, useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const API_BASE = "https://rapidcare-backend-production.up.railway.app";

interface QueueData {
  currentNumber: number;
  myNumber: number;
  peopleAhead: number;
  estimatedWait: number;
  status: "waiting" | "almost" | "ready" | "done";
  branch: string;
  timeSlot: string;
  date: string;
  tests: string[];
}

const getMockQueue = (tokenData: any): QueueData => {
  const myNumber = tokenData?.tokenNumber || 12;
  const currentNumber = Math.max(
    1,
    myNumber - Math.floor(Math.random() * 4) - 1,
  );
  const peopleAhead = Math.max(0, myNumber - currentNumber);
  const waitTime = peopleAhead * 8;
  return {
    currentNumber,
    myNumber,
    peopleAhead,
    estimatedWait: waitTime,
    status:
      peopleAhead === 0 ? "ready" : peopleAhead <= 2 ? "almost" : "waiting",
    branch: tokenData?.branch || "RapidCare — Colombo 03",
    timeSlot: tokenData?.timeSlot || "7:00 AM",
    date: tokenData?.date || new Date().toISOString().split("T")[0],
    tests: tokenData?.tests?.map((t: any) => t.name) || ["CBC", "Blood Sugar"],
  };
};

const STATUS_CONFIG = {
  waiting: {
    label: "Waiting",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.15)",
    icon: "⏳",
    message: "Please wait — we will notify you soon",
  },
  almost: {
    label: "Almost!",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.15)",
    icon: "🔔",
    message: "Get ready! Your turn is coming up",
  },
  ready: {
    label: "Your Turn!",
    color: "#10B981",
    bg: "rgba(16,185,129,0.15)",
    icon: "✅",
    message: "Please proceed to the reception now!",
  },
  done: {
    label: "Completed",
    color: "#6366F1",
    bg: "rgba(99,102,241,0.15)",
    icon: "🎉",
    message: "Your tests are done. Reports coming soon!",
  },
};

export default function QueueScreen() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [hasToken, setHasToken] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadQueue();
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
    ]).start();
    const interval = setInterval(() => loadQueue(true), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!queue) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
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
    const progress =
      queue.myNumber > 0
        ? Math.min(1, queue.currentNumber / queue.myNumber)
        : 0;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [queue]);

  const loadQueue = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const tokenData = await AsyncStorage.getItem("lastToken");
      if (!tokenData) {
        setHasToken(false);
        setLoading(false);
        return;
      }
      setHasToken(true);
      const parsed = JSON.parse(tokenData);
      try {
        const token = await AsyncStorage.getItem("authToken");
        const branch = parsed?.branch || "Colombo 03";
        const date = parsed?.date || new Date().toISOString().split("T")[0];
        const res = await fetch(
          `${API_BASE}/queue/status?branch=${encodeURIComponent(branch)}&date=${date}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (res.ok) {
          const serverData = await res.json();
          // Merge server data with token data
          setQueue({
            currentNumber: serverData.currentNumber || 1,
            myNumber: parsed?.tokenNumber || 12,
            peopleAhead: Math.max(
              0,
              (parsed?.tokenNumber || 12) - (serverData.currentNumber || 1),
            ),
            estimatedWait: Math.max(
              0,
              ((parsed?.tokenNumber || 12) - (serverData.currentNumber || 1)) *
                8,
            ),
            status:
              (parsed?.tokenNumber || 12) <= (serverData.currentNumber || 1)
                ? "ready"
                : (parsed?.tokenNumber || 12) -
                      (serverData.currentNumber || 1) <=
                    2
                  ? "almost"
                  : "waiting",
            branch: branch,
            timeSlot: parsed?.timeSlot || "",
            date: date,
            tests: parsed?.tests?.map((t: any) => t.name) || [],
          });
        } else {
          setQueue(getMockQueue(parsed));
        }
      } catch {
        setQueue(getMockQueue(parsed));
      }
      setLastUpdate(new Date());
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadQueue(true);
  }, []);
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  if (!loading && !hasToken) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor="#050510" />
        <LinearGradient colors={["#0D0D28", "#131340"]} style={s.header}>
          <View style={s.headerRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Queue Tracking</Text>
            <View style={{ width: 36 }} />
          </View>
        </LinearGradient>
        <View style={s.emptyWrap}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>🎟️</Text>
          <Text style={s.emptyTitle}>No Active Booking</Text>
          <Text style={s.emptySub}>
            Book a lab test to track your queue position
          </Text>
          <TouchableOpacity
            style={s.emptyBtn}
            onPress={() => router.push("/(tabs)/booking")}
            activeOpacity={0.87}
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

  const statusCfg = queue ? STATUS_CONFIG[queue.status] : STATUS_CONFIG.waiting;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050510" />
      <View style={s.bgAbs} pointerEvents="none">
        <Animated.View style={[s.blobTL, { opacity: glowOpacity }]} />
        <Animated.View style={[s.blobBR, { opacity: glowOpacity }]} />
      </View>

      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <LinearGradient colors={["#0D0D28", "#131340"]} style={s.header}>
          <View style={s.headerRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Queue Tracking</Text>
              <Text style={s.headerSub}>
                Updated{" "}
                {lastUpdate.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <TouchableOpacity
              style={s.refreshBtn}
              onPress={() => loadQueue(true)}
            >
              <Ionicons name="refresh-outline" size={18} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }
      >
        {queue && (
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Status Badge */}
            <Animated.View
              style={[
                s.statusBadge,
                {
                  backgroundColor: statusCfg.bg,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Text style={{ fontSize: 28 }}>{statusCfg.icon}</Text>
              <View>
                <Text style={[s.statusLabel, { color: statusCfg.color }]}>
                  {statusCfg.label}
                </Text>
                <Text style={s.statusMessage}>{statusCfg.message}</Text>
              </View>
            </Animated.View>

            {/* Token Card */}
            <View style={s.tokenCard}>
              <LinearGradient
                colors={["#0E0E28", "#131340"]}
                style={s.tokenCardInner}
              >
                <LinearGradient
                  colors={[statusCfg.color, "#6366F1"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.tokenTopBar}
                />
                <View style={s.tokenBody}>
                  <View style={s.numbersRow}>
                    <View style={s.numberBox}>
                      <Text style={s.numberLabel}>NOW SERVING</Text>
                      <Text style={[s.bigNumber, { color: "#10B981" }]}>
                        #{String(queue.currentNumber).padStart(2, "0")}
                      </Text>
                    </View>
                    <View style={s.numberDivider} />
                    <View style={s.numberBox}>
                      <Text style={s.numberLabel}>YOUR TOKEN</Text>
                      <Text style={[s.bigNumber, { color: statusCfg.color }]}>
                        #{String(queue.myNumber).padStart(2, "0")}
                      </Text>
                    </View>
                  </View>

                  <View style={s.progressWrap}>
                    <View style={s.progressBg}>
                      <Animated.View
                        style={[
                          s.progressFill,
                          {
                            width: progressAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: ["0%", "100%"],
                            }),
                            backgroundColor: statusCfg.color,
                          },
                        ]}
                      />
                    </View>
                    <View style={s.progressLabels}>
                      <Text style={s.progressTxt}>Start</Text>
                      <Text style={s.progressTxt}>Your Turn</Text>
                    </View>
                  </View>

                  <View style={s.statsRow}>
                    <View style={s.statBox}>
                      <Ionicons
                        name="people-outline"
                        size={18}
                        color="#A855F7"
                      />
                      <Text style={s.statNum}>{queue.peopleAhead}</Text>
                      <Text style={s.statLbl}>Ahead</Text>
                    </View>
                    <View style={[s.statBox, { borderColor: "#F59E0B22" }]}>
                      <Ionicons name="time-outline" size={18} color="#F59E0B" />
                      <Text style={s.statNum}>
                        {queue.estimatedWait === 0
                          ? "Now!"
                          : `~${queue.estimatedWait}m`}
                      </Text>
                      <Text style={s.statLbl}>Wait Time</Text>
                    </View>
                    <View style={s.statBox}>
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color="#3B82F6"
                      />
                      <Text style={s.statNum} numberOfLines={1}>
                        {queue.branch.split("—")[1]?.trim() || "Lab"}
                      </Text>
                      <Text style={s.statLbl}>Branch</Text>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Details */}
            <View style={s.detailCard}>
              <LinearGradient
                colors={["#0C0C22", "#0E0E28"]}
                style={s.detailGrad}
              >
                <Text style={s.cardTitle}>📋 Appointment Details</Text>
                {[
                  {
                    icon: "location-outline" as const,
                    label: "Branch",
                    value: queue.branch,
                    color: "#3B82F6",
                  },
                  {
                    icon: "calendar-outline" as const,
                    label: "Appointment",
                    value: `${queue.date} · ${queue.timeSlot}`,
                    color: "#A855F7",
                  },
                  {
                    icon: "flask-outline" as const,
                    label: "Tests",
                    value: queue.tests.join(", "),
                    color: "#10B981",
                  },
                ].map((item, i) => (
                  <View key={i} style={s.detailRow}>
                    <View
                      style={[
                        s.detailIcon,
                        { backgroundColor: `${item.color}15` },
                      ]}
                    >
                      <Ionicons name={item.icon} size={14} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.detailLbl}>{item.label}</Text>
                      <Text style={s.detailVal}>{item.value}</Text>
                    </View>
                  </View>
                ))}
              </LinearGradient>
            </View>

            {/* Tips */}
            <View style={s.tipsCard}>
              <LinearGradient
                colors={["#0C0C22", "#0E0E28"]}
                style={s.detailGrad}
              >
                <Text style={s.cardTitle}>💡 While You Wait</Text>
                {[
                  {
                    icon: "id-card-outline" as const,
                    text: "Have your NIC ready at reception",
                    color: "#3B82F6",
                  },
                  {
                    icon: "water-outline" as const,
                    text: "Stay hydrated — drink plain water",
                    color: "#06B6D4",
                  },
                  {
                    icon: "restaurant-outline" as const,
                    text: "If fasting, avoid food until after test",
                    color: "#F59E0B",
                  },
                  {
                    icon: "notifications-outline" as const,
                    text: "Queue updates every 30 seconds",
                    color: "#10B981",
                  },
                ].map((tip, i) => (
                  <View key={i} style={s.tipRow}>
                    <View
                      style={[s.tipIcon, { backgroundColor: `${tip.color}15` }]}
                    >
                      <Ionicons name={tip.icon} size={14} color={tip.color} />
                    </View>
                    <Text style={s.tipText}>{tip.text}</Text>
                  </View>
                ))}
              </LinearGradient>
            </View>

            {/* Actions */}
            <View style={s.actions}>
              <TouchableOpacity
                style={s.actionBtn}
                onPress={() => router.push("/token")}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#3B82F6", "#6366F1"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.actionGrad}
                >
                  <Ionicons name="qr-code-outline" size={18} color="#fff" />
                  <Text style={s.actionText}>Show My Token</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.actionOutline}
                onPress={() => router.replace("/(tabs)")}
                activeOpacity={0.85}
              >
                <Ionicons name="home-outline" size={18} color="#3B82F6" />
                <Text style={s.actionOutlineText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
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
    backgroundColor: "rgba(59,130,246,0.1)",
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
  header: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11, color: "#555580", marginTop: 2 },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(59,130,246,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.06)",
  },
  statusLabel: { fontSize: 16, fontWeight: "800" },
  statusMessage: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 },
  tokenCard: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 14,
  },
  tokenCardInner: {},
  tokenTopBar: { height: 4 },
  tokenBody: { padding: 20 },
  numbersRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  numberBox: { flex: 1, alignItems: "center" },
  numberLabel: {
    fontSize: 9,
    color: "#555580",
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },
  bigNumber: {
    fontSize: 52,
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: 56,
  },
  numberDivider: {
    width: 1,
    height: 60,
    backgroundColor: BORDER,
    marginHorizontal: 16,
  },
  progressWrap: { marginBottom: 20 },
  progressBg: {
    height: 8,
    backgroundColor: "#1A1A30",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  progressTxt: { fontSize: 10, color: "#333358" },
  statsRow: { flexDirection: "row", gap: 8 },
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
  statNum: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
  },
  statLbl: { fontSize: 9, color: "#555580", letterSpacing: 0.3 },
  detailCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: BORDER,
    marginBottom: 14,
  },
  tipsCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: BORDER,
    marginBottom: 16,
  },
  detailGrad: { padding: 16, gap: 12 },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 4,
  },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  detailIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  detailLbl: { fontSize: 10, color: "#555580", marginBottom: 2 },
  detailVal: { fontSize: 13, fontWeight: "600", color: "#fff" },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tipIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  tipText: { fontSize: 12, color: "rgba(255,255,255,0.55)", flex: 1 },
  actions: { gap: 10 },
  actionBtn: { borderRadius: 16, overflow: "hidden" },
  actionGrad: {
    flexDirection: "row",
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  actionText: { fontSize: 15, fontWeight: "800", color: "#fff" },
  actionOutline: {
    flexDirection: "row",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1C3A5A",
    backgroundColor: "rgba(59,130,246,0.06)",
  },
  actionOutlineText: { fontSize: 15, fontWeight: "700", color: "#3B82F6" },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 10,
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
    marginTop: 10,
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

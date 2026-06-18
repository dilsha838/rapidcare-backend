import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Notification {
  id: string;
  type: "appointment" | "report" | "queue" | "reminder" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
  route?: string;
}

const TYPE_CONFIG = {
  appointment: {
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.12)",
    icon: "calendar" as const,
  },
  report: {
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    icon: "document-text" as const,
  },
  queue: {
    color: "#A855F7",
    bg: "rgba(168,85,247,0.12)",
    icon: "time" as const,
  },
  reminder: {
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    icon: "alarm" as const,
  },
  info: {
    color: "#6366F1",
    bg: "rgba(99,102,241,0.12)",
    icon: "information-circle" as const,
  },
};

// Generate notifications from booking data
async function generateNotifications(): Promise<Notification[]> {
  const notifs: Notification[] = [];
  try {
    const lastToken = await AsyncStorage.getItem("lastToken");
    const bookingData = await AsyncStorage.getItem("bookingData");

    if (lastToken) {
      const t = JSON.parse(lastToken);
      const testNames =
        t.tests?.map((x: any) => x.name || x).join(", ") || "Lab Tests";
      const bookingDate = new Date(t.date || new Date());
      const now = new Date();
      const diffHours =
        (now.getTime() - bookingDate.getTime()) / (1000 * 60 * 60);

      // Report ready notification
      if (diffHours >= 24) {
        notifs.push({
          id: "rpt-001",
          type: "report",
          title: "✅ Report Ready!",
          message: `Your ${testNames} report is ready. Download now from Reports.`,
          time: getTimeAgo(bookingDate.getTime() + 24 * 60 * 60 * 1000),
          read: false,
          route: "/reports",
        });
      } else if (diffHours >= 2) {
        notifs.push({
          id: "rpt-002",
          type: "report",
          title: "⏳ Report Processing",
          message: `Your ${testNames} report is being processed. Ready in ~${Math.ceil(24 - diffHours)} hours.`,
          time: getTimeAgo(bookingDate.getTime() + 2 * 60 * 60 * 1000),
          read: false,
          route: "/reports",
        });
      }

      // Booking confirmation
      notifs.push({
        id: "bk-001",
        type: "appointment",
        title: "📅 Booking Confirmed",
        message: `Token #${String(t.tokenNumber || 1).padStart(2, "0")} · ${testNames} at ${t.branch || "RapidCare Lab"}`,
        time: getTimeAgo(new Date(t.date || now).getTime()),
        read: true,
        route: "/token",
      });

      // Payment success
      notifs.push({
        id: "pay-001",
        type: "info",
        title: "💳 Payment Successful",
        message: `Rs. ${(t.totalAmount || 0).toLocaleString()} paid. Order: ${t.orderId || "BK001"}`,
        time: getTimeAgo(new Date(t.date || now).getTime()),
        read: true,
        route: "/payment",
      });

      // Tomorrow reminder
      const tomorrow = new Date(bookingDate);
      tomorrow.setDate(tomorrow.getDate() - 1);
      if (now < bookingDate) {
        notifs.push({
          id: "rem-001",
          type: "reminder",
          title: "🔔 Appointment Tomorrow",
          message: `Reminder: ${testNames} at ${t.timeSlot || "7:00 AM"} tomorrow. Don't forget to fast if needed.`,
          time: getTimeAgo(tomorrow.getTime()),
          read: false,
          route: "/token",
        });
      }
    }

    // Queue notification
    notifs.push({
      id: "q-001",
      type: "queue",
      title: "🎟️ Queue Update",
      message: "Your queue position has been updated. Check current status.",
      time: "Just now",
      read: false,
      route: "/queue",
    });

    // General info
    notifs.push({
      id: "info-001",
      type: "info",
      title: "🎉 Welcome to RapidCare!",
      message:
        "Book your first lab test and get results in 24 hours. Use AI Assistant for health tips!",
      time: "2 days ago",
      read: true,
      route: "/(tabs)/booking",
    });
  } catch {}
  return notifs;
}

function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    loadNotifs();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
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
  }, []);

  const loadNotifs = async () => {
    const data = await generateNotifications();
    setNotifs(data);
    setLoading(false);
  };

  const markAllRead = () =>
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));

  const handleNotifPress = (notif: Notification) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
    );
    if (notif.route) router.push(notif.route as any);
  };

  const deleteNotif = (id: string) =>
    setNotifs((prev) => prev.filter((n) => n.id !== id));

  const unreadCount = notifs.filter((n) => !n.read).length;

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
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={s.headerSub}>{unreadCount} unread</Text>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity style={s.markAllBtn} onPress={markAllRead}>
              <Text style={s.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {notifs.length === 0 && !loading && (
            <View style={s.emptyWrap}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🔔</Text>
              <Text style={s.emptyTitle}>No Notifications</Text>
              <Text style={s.emptySub}>You're all caught up!</Text>
            </View>
          )}

          {notifs.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type];
            return (
              <TouchableOpacity
                key={notif.id}
                style={[s.notifCard, !notif.read && s.notifCardUnread]}
                onPress={() => handleNotifPress(notif)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={
                    notif.read ? ["#0C0C22", "#0E0E28"] : ["#0E0E2A", "#10102E"]
                  }
                  style={s.notifGrad}
                >
                  {!notif.read && (
                    <View
                      style={[s.unreadBar, { backgroundColor: cfg.color }]}
                    />
                  )}
                  <View style={s.notifBody}>
                    <View
                      style={[s.notifIconWrap, { backgroundColor: cfg.bg }]}
                    >
                      <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={s.notifTitleRow}>
                        <Text
                          style={[
                            s.notifTitle,
                            !notif.read && s.notifTitleUnread,
                          ]}
                          numberOfLines={1}
                        >
                          {notif.title}
                        </Text>
                        {!notif.read && (
                          <View
                            style={[
                              s.unreadDot,
                              { backgroundColor: cfg.color },
                            ]}
                          />
                        )}
                      </View>
                      <Text style={s.notifMsg} numberOfLines={2}>
                        {notif.message}
                      </Text>
                      <Text style={s.notifTime}>{notif.time}</Text>
                    </View>
                    <TouchableOpacity
                      style={s.deleteBtn}
                      onPress={() => deleteNotif(notif.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close" size={14} color="#333358" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
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
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: "rgba(99,102,241,0.08)",
    top: -50,
    left: -50,
  },
  blobBR: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(168,85,247,0.07)",
    bottom: 60,
    right: -40,
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 14,
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
  headerSub: { fontSize: 11, color: "#EC4899", marginTop: 2 },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(59,130,246,0.1)",
    borderWidth: 0.5,
    borderColor: "rgba(59,130,246,0.3)",
  },
  markAllText: { fontSize: 11, color: "#3B82F6", fontWeight: "600" },
  scroll: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 48 },
  notifCard: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: BORDER,
    marginBottom: 10,
  },
  notifCardUnread: { borderColor: "rgba(99,102,241,0.3)" },
  notifGrad: { position: "relative" },
  unreadBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  notifBody: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
  },
  notifIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    flex: 1,
  },
  notifTitleUnread: { color: "#fff", fontWeight: "800" },
  unreadDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  notifMsg: { fontSize: 12, color: "#555580", lineHeight: 17, marginBottom: 5 },
  notifTime: { fontSize: 10, color: "#333358" },
  deleteBtn: { padding: 2, flexShrink: 0 },
  emptyWrap: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  emptySub: { fontSize: 13, color: "#555580" },
});

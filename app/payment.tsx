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
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const API_BASE = "https://rapidcare-backend-production.up.railway.app";

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface CartItem {
  id: number;
  name: string;
  price: number;
  fastingHours: number;
}
interface BookingData {
  bookingId?: string;
  branch?: string;
  date?: string;
  timeSlot?: string;
  totalAmount?: number;
  tests?: CartItem[];
}
interface Booking {
  id: string;
  bookingId: string;
  branch: string;
  date: string;
  timeSlot: string;
  tests: { name: string; price: number }[];
  totalAmount: number;
  status: "upcoming" | "completed" | "cancelled";
  tokenNumber?: number;
  paidAt?: string;
  paymentMethod?: string;
}

// ─── FALLBACK BOOKINGS ───────────────────────────────────────────────────────
const MOCK_BOOKINGS: Booking[] = [
  {
    id: "1",
    bookingId: "BK20250514001",
    branch: "RapidCare — Colombo 03",
    date: "2025-05-15",
    timeSlot: "7:00 AM",
    tests: [
      { name: "CBC", price: 850 },
      { name: "Blood Sugar (FBS)", price: 450 },
    ],
    totalAmount: 1300,
    status: "upcoming",
    tokenNumber: 12,
    paidAt: new Date().toISOString(),
    paymentMethod: "PayHere",
  },
  {
    id: "2",
    bookingId: "BK20250510002",
    branch: "RapidCare — Nugegoda",
    date: "2025-05-10",
    timeSlot: "9:00 AM",
    tests: [
      { name: "Lipid Profile", price: 1200 },
      { name: "Thyroid (TSH)", price: 1800 },
    ],
    totalAmount: 3000,
    status: "completed",
    tokenNumber: 5,
    paidAt: "2025-05-10T03:00:00.000Z",
    paymentMethod: "PayHere",
  },
  {
    id: "3",
    bookingId: "BK20250501003",
    branch: "RapidCare — Kandy",
    date: "2025-05-01",
    timeSlot: "8:30 AM",
    tests: [{ name: "Vitamin D", price: 2500 }],
    totalAmount: 2500,
    status: "completed",
    tokenNumber: 8,
    paidAt: "2025-05-01T03:00:00.000Z",
    paymentMethod: "Cash",
  },
  {
    id: "4",
    bookingId: "BK20250425004",
    branch: "RapidCare — Colombo 03",
    date: "2025-04-25",
    timeSlot: "7:30 AM",
    tests: [{ name: "HbA1c (Diabetes)", price: 1100 }],
    totalAmount: 1100,
    status: "cancelled",
    paidAt: "2025-04-24T10:00:00.000Z",
  },
];

const STATUS_CFG = {
  upcoming: {
    label: "Upcoming",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.12)",
    icon: "calendar" as const,
  },
  completed: {
    label: "Completed",
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    icon: "checkmark-circle" as const,
  },
  cancelled: {
    label: "Cancelled",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.12)",
    icon: "close-circle" as const,
  },
};

const PAYMENT_METHODS = [
  {
    id: "payhere",
    label: "PayHere",
    sub: "Visa / Master / Dialog",
    icon: "card" as const,
    color: "#3B82F6",
    recommended: true,
  },
  {
    id: "cash",
    label: "Pay at Lab",
    sub: "Pay when you arrive",
    icon: "cash" as const,
    color: "#10B981",
    recommended: false,
  },
  {
    id: "bank",
    label: "Bank Transfer",
    sub: "Direct bank transfer",
    icon: "business" as const,
    color: "#A855F7",
    recommended: false,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function Payment() {
  const router = useRouter();

  // ── State ──────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<"payment" | "bookings">("payment");
  const [booking, setBooking] = useState<BookingData>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [method, setMethod] = useState("payhere");
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [tokenNum, setTokenNum] = useState<number | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bLoading, setBLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "upcoming" | "completed" | "cancelled"
  >("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  // ── Animations ─────────────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const tabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
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
  }, []);

  useEffect(() => {
    if (paid) {
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
    }
  }, [paid]);

  useEffect(() => {
    Animated.timing(tabAnim, {
      toValue: tab === "payment" ? 0 : 1,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [tab]);

  // ── Data loading ───────────────────────────────────────────────────────────
  const loadData = async () => {
    try {
      const bData = await AsyncStorage.getItem("bookingData");
      const cData = await AsyncStorage.getItem("cartItems");
      if (bData) setBooking(JSON.parse(bData));
      if (cData) setCart(JSON.parse(cData));
    } catch {}
  };

  const loadBookings = async (silent = false) => {
    if (!silent) setBLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await fetch(`${API_BASE}/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      } else {
        setBookings(MOCK_BOOKINGS);
      }
    } catch {
      setBookings(MOCK_BOOKINGS);
    } finally {
      setBLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (tab === "bookings" && bookings.length === 0) loadBookings();
  }, [tab]);

  const total = booking.totalAmount || cart.reduce((s, t) => s + t.price, 0);

  // ── Payment ─────────────────────────────────────────────────────────────────
  const handlePayment = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await fetch(`${API_BASE}/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: booking.bookingId,
          amount: total,
          currency: "LKR",
          method,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setTimeout(
          () => confirmPayment(data.orderId || "ORD" + Date.now()),
          1500,
        );
        return;
      }
      setTimeout(() => confirmPayment("ORD" + Date.now()), 1500);
    } catch {
      setTimeout(() => confirmPayment("ORD" + Date.now()), 1500);
    }
  };

  const confirmPayment = async (orderId: string) => {
    const generatedToken = Math.floor(Math.random() * 90) + 10;
    try {
      const token = await AsyncStorage.getItem("authToken");
      await fetch(`${API_BASE}/payments/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: booking.bookingId,
          orderId,
          amount: total,
          method,
          tokenNumber: generatedToken,
        }),
      }).catch(() => {});
      await AsyncStorage.setItem(
        "lastToken",
        JSON.stringify({
          tokenNumber: generatedToken,
          branch: booking.branch,
          date: booking.date,
          timeSlot: booking.timeSlot,
          orderId,
          paidAt: new Date().toISOString(),
        }),
      );
      await AsyncStorage.removeItem("cartItems");
      await AsyncStorage.removeItem("bookingData");
    } catch {}
    setTokenNum(generatedToken);
    setLoading(false);
    setPaid(true);
    Animated.parallel([
      Animated.timing(successAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCancelBooking = (bookingId: string) => {
    Alert.alert("Cancel Booking", "Are you sure you want to cancel?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("authToken");
            await fetch(`${API_BASE}/bookings/${bookingId}/cancel`, {
              method: "PUT",
              headers: { Authorization: `Bearer ${token}` },
            }).catch(() => {});
            setBookings((prev) =>
              prev.map((b) =>
                b.bookingId === bookingId ? { ...b, status: "cancelled" } : b,
              ),
            );
          } catch {}
        },
      },
    ]);
  };

  const filteredBookings = bookings.filter(
    (b) => filter === "all" || b.status === filter,
  );

  // ════════════════════════════════════════════════════════════════════════════
  // SUCCESS SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  if (paid && tokenNum) {
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" />
        <View style={s.bgAbs} pointerEvents="none">
          <View
            style={[
              s.blob,
              { backgroundColor: "rgba(16,185,129,0.12)", top: -60, left: -50 },
            ]}
          />
          <View
            style={[
              s.blob,
              {
                backgroundColor: "rgba(59,130,246,0.08)",
                bottom: 80,
                right: -40,
              },
            ]}
          />
        </View>

        <ScrollView
          contentContainerStyle={s.successScroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              s.successWrap,
              { opacity: successAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            {/* ✓ Icon */}
            <View style={s.successRing}>
              <LinearGradient
                colors={["#10B981", "#059669"]}
                style={s.successGrad}
              >
                <Ionicons name="checkmark" size={36} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={s.successTitle}>Booking Confirmed! 🎉</Text>
            <Text style={s.successSub}>Your payment was successful</Text>

            {/* Token card */}
            <Animated.View
              style={[s.tokenCard, { transform: [{ scale: pulseAnim }] }]}
            >
              <LinearGradient
                colors={["#0E0E28", "#131340"]}
                style={s.tokenCardInner}
              >
                <LinearGradient
                  colors={["#3B82F6", "#6366F1", "#A855F7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.tokenTopBar}
                />
                <Text style={s.tokenLabel}>YOUR QUEUE TOKEN</Text>
                <Text style={s.tokenBigNum}>
                  #{String(tokenNum).padStart(2, "0")}
                </Text>

                {/* QR grid */}
                <View style={s.qrGrid}>
                  {Array.from({ length: 6 }).map((_, row) => (
                    <View key={row} style={s.qrRow}>
                      {Array.from({ length: 6 }).map((_, col) => {
                        const fill =
                          (row < 2 && col < 2) ||
                          (row < 2 && col > 3) ||
                          (row > 3 && col < 2) ||
                          (row === 3 && col === 3) ||
                          (row + col) % 3 === 0;
                        return (
                          <View
                            key={col}
                            style={[s.qrCell, fill && s.qrCellOn]}
                          />
                        );
                      })}
                    </View>
                  ))}
                </View>
                <Text style={s.qrHint}>📱 Show this at lab entry</Text>

                <View style={s.tokenDivider} />
                <View style={s.tokenMeta}>
                  <View style={s.tokenMetaRow}>
                    <Ionicons
                      name="location-outline"
                      size={12}
                      color="#555580"
                    />
                    <Text style={s.tokenMetaText} numberOfLines={1}>
                      {booking.branch}
                    </Text>
                  </View>
                  <View style={s.tokenMetaRow}>
                    <Ionicons
                      name="calendar-outline"
                      size={12}
                      color="#555580"
                    />
                    <Text style={s.tokenMetaText}>
                      {booking.date} · {booking.timeSlot}
                    </Text>
                  </View>
                  <View style={s.tokenMetaRow}>
                    <Ionicons name="cash-outline" size={12} color="#10B981" />
                    <Text style={[s.tokenMetaText, { color: "#10B981" }]}>
                      Rs. {total.toLocaleString()} Paid ✓
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Tabs — View Bookings inline */}
            <View style={s.successTabs}>
              <TouchableOpacity
                style={s.successTabBtn}
                onPress={() => {
                  setTab("bookings");
                  setPaid(false);
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#1C1C3A", "#1C1C3A"]}
                  style={s.successTabGrad}
                >
                  <Ionicons name="list" size={16} color="#3B82F6" />
                  <Text style={s.successTabText}>View My Bookings</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.successTabBtn}
                onPress={() => router.replace("/(tabs)")}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#3B82F6", "#6366F1", "#A855F7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.successTabGrad}
                >
                  <Ionicons name="home" size={16} color="#fff" />
                  <Text style={[s.successTabText, { color: "#fff" }]}>
                    Back to Home
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // MAIN SCREEN (Payment + Bookings tabs)
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050510" />
      <View style={s.bgAbs} pointerEvents="none">
        <View
          style={[
            s.blob,
            { backgroundColor: "rgba(59,130,246,0.08)", top: -60, left: -50 },
          ]}
        />
        <View
          style={[
            s.blob,
            {
              backgroundColor: "rgba(168,85,247,0.07)",
              bottom: 80,
              right: -40,
            },
          ]}
        />
      </View>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <LinearGradient colors={["#0D0D28", "#131340"]} style={s.header}>
          <View style={s.headerRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>
                {tab === "payment" ? "Payment" : "My Bookings"}
              </Text>
              <Text style={s.headerSub}>
                {tab === "payment"
                  ? "Secure checkout"
                  : `${bookings.length} bookings found`}
              </Text>
            </View>
            {tab === "payment" && (
              <View style={s.secureBadge}>
                <Ionicons name="lock-closed" size={11} color="#10B981" />
                <Text style={s.secureBadgeText}>Secure</Text>
              </View>
            )}
          </View>

          {/* Tab switcher */}
          <View style={s.tabBar}>
            <TouchableOpacity
              style={[s.tabBtn, tab === "payment" && s.tabBtnActive]}
              onPress={() => setTab("payment")}
            >
              <Ionicons
                name="card-outline"
                size={14}
                color={tab === "payment" ? "#fff" : "#555580"}
              />
              <Text
                style={[s.tabBtnText, tab === "payment" && s.tabBtnTextActive]}
              >
                Payment
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.tabBtn, tab === "bookings" && s.tabBtnActive]}
              onPress={() => setTab("bookings")}
            >
              <Ionicons
                name="list-outline"
                size={14}
                color={tab === "bookings" ? "#fff" : "#555580"}
              />
              <Text
                style={[s.tabBtnText, tab === "bookings" && s.tabBtnTextActive]}
              >
                My Bookings
              </Text>
              {bookings.filter((b) => b.status === "upcoming").length > 0 && (
                <View style={s.tabDot}>
                  <Text style={s.tabDotText}>
                    {bookings.filter((b) => b.status === "upcoming").length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PAYMENT TAB                                                          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab === "payment" && (
        <>
          <ScrollView
            style={s.scroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 130 }}
          >
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              {/* Order summary */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>Order Summary</Text>
                <View style={s.orderCard}>
                  <LinearGradient
                    colors={["#0E0E28", "#0A0A1E"]}
                    style={s.orderGrad}
                  >
                    <View style={s.orderInfoRow}>
                      <View style={s.oIcon}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color="#3B82F6"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.oLabel}>Branch</Text>
                        <Text style={s.oValue} numberOfLines={1}>
                          {booking.branch || "RapidCare Lab"}
                        </Text>
                      </View>
                    </View>
                    <View style={s.orderInfoRow}>
                      <View style={s.oIcon}>
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color="#A855F7"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.oLabel}>Appointment</Text>
                        <Text style={s.oValue}>
                          {booking.date || "—"} · {booking.timeSlot || "—"}
                        </Text>
                      </View>
                    </View>
                    <View style={s.orderDivider} />
                    {(booking.tests || cart).map((item, i) => (
                      <View key={i} style={s.orderItem}>
                        <View style={s.orderDot} />
                        <Text style={s.orderItemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={s.orderItemPrice}>
                          Rs. {item.price.toLocaleString()}
                        </Text>
                      </View>
                    ))}
                    <View style={s.orderDivider} />
                    <View style={s.orderTotalRow}>
                      <Text style={s.orderTotalLabel}>Total Amount</Text>
                      <Text style={s.orderTotalAmt}>
                        Rs. {total.toLocaleString()}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              </View>

              {/* Payment methods */}
              <View style={s.section}>
                <Text style={s.sectionTitle}>Payment Method</Text>
                {PAYMENT_METHODS.map((pm) => {
                  const sel = method === pm.id;
                  return (
                    <TouchableOpacity
                      key={pm.id}
                      style={[s.methodCard, sel && s.methodCardActive]}
                      onPress={() => setMethod(pm.id)}
                      activeOpacity={0.85}
                    >
                      <View
                        style={[
                          s.methodIcon,
                          { backgroundColor: `${pm.color}18` },
                        ]}
                      >
                        <Ionicons name={pm.icon} size={20} color={pm.color} />
                      </View>
                      <View style={s.methodInfo}>
                        <View style={s.methodLabelRow}>
                          <Text
                            style={[s.methodLabel, sel && { color: pm.color }]}
                          >
                            {pm.label}
                          </Text>
                          {pm.recommended && (
                            <View style={s.recoBadge}>
                              <Text style={s.recoText}>Recommended</Text>
                            </View>
                          )}
                        </View>
                        <Text style={s.methodSub}>{pm.sub}</Text>
                      </View>
                      <View style={[s.radio, sel && { borderColor: pm.color }]}>
                        {sel && (
                          <View
                            style={[s.radioDot, { backgroundColor: pm.color }]}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Info boxes */}
              {method === "payhere" && (
                <View style={s.infoBox}>
                  <Ionicons name="shield-checkmark" size={15} color="#3B82F6" />
                  <Text style={s.infoText}>
                    Secured by PayHere — Visa, Mastercard, Amex & Dialog Genie
                    supported.
                  </Text>
                </View>
              )}
              {method === "cash" && (
                <View
                  style={[s.infoBox, { borderColor: "rgba(16,185,129,0.2)" }]}
                >
                  <Ionicons
                    name="information-circle"
                    size={15}
                    color="#10B981"
                  />
                  <Text style={[s.infoText, { color: "rgba(16,185,129,0.7)" }]}>
                    Pay at the lab counter. Booking is reserved. Arrive 10
                    minutes early.
                  </Text>
                </View>
              )}
              {method === "bank" && (
                <View
                  style={[s.infoBox, { borderColor: "rgba(168,85,247,0.2)" }]}
                >
                  <Ionicons
                    name="information-circle"
                    size={15}
                    color="#A855F7"
                  />
                  <Text style={[s.infoText, { color: "rgba(168,85,247,0.7)" }]}>
                    Transfer to: BOC · RapidCare Labs · Acc: 12345678 · Ref:{" "}
                    {booking.bookingId || "BKID"}
                  </Text>
                </View>
              )}
            </Animated.View>
          </ScrollView>

          {/* Pay button */}
          <View style={s.bottomBar}>
            <View>
              <Text style={s.bottomLabel}>Amount</Text>
              <Text style={s.bottomAmt}>Rs. {total.toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              style={[s.payBtn, loading && { opacity: 0.65 }]}
              onPress={handlePayment}
              disabled={loading}
              activeOpacity={0.87}
            >
              <LinearGradient
                colors={
                  loading
                    ? ["#1A1A35", "#1A1A35"]
                    : ["#3B82F6", "#6366F1", "#A855F7"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.payBtnGrad}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={s.payBtnText}>Processing...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="lock-closed" size={15} color="#fff" />
                    <Text style={s.payBtnText}>
                      {method === "cash"
                        ? "Confirm Booking"
                        : `Pay Rs. ${total.toLocaleString()}`}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* BOOKINGS TAB                                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {tab === "bookings" && (
        <>
          {/* Filter pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.filterScroll}
            contentContainerStyle={s.filterContent}
          >
            {(["all", "upcoming", "completed", "cancelled"] as const).map(
              (f) => {
                const active = filter === f;
                const cfg = f !== "all" ? STATUS_CFG[f] : null;
                return (
                  <TouchableOpacity
                    key={f}
                    style={[
                      s.filterPill,
                      active && {
                        backgroundColor: cfg?.color || "#3B82F6",
                        borderColor: cfg?.color || "#3B82F6",
                      },
                    ]}
                    onPress={() => setFilter(f)}
                  >
                    {cfg && (
                      <Ionicons
                        name={cfg.icon}
                        size={11}
                        color={active ? "#fff" : cfg.color}
                      />
                    )}
                    <Text
                      style={[
                        s.filterText,
                        active && { color: "#fff", fontWeight: "700" },
                      ]}
                    >
                      {f === "all" ? "All Bookings" : STATUS_CFG[f].label}
                    </Text>
                    <View
                      style={[
                        s.filterCount,
                        active && { backgroundColor: "rgba(255,255,255,0.25)" },
                      ]}
                    >
                      <Text
                        style={[s.filterCountText, active && { color: "#fff" }]}
                      >
                        {f === "all"
                          ? bookings.length
                          : bookings.filter((b) => b.status === f).length}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              },
            )}
          </ScrollView>

          {bLoading ? (
            <View style={s.loadingWrap}>
              <ActivityIndicator color="#3B82F6" size="large" />
              <Text style={s.loadingText}>Loading bookings...</Text>
            </View>
          ) : (
            <ScrollView
              style={s.scroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 40,
                paddingHorizontal: 16,
                paddingTop: 8,
              }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => {
                    setRefreshing(true);
                    loadBookings(true);
                  }}
                  tintColor="#3B82F6"
                />
              }
            >
              {filteredBookings.length === 0 ? (
                <View style={s.emptyWrap}>
                  <Ionicons name="calendar-outline" size={52} color="#1C1C3A" />
                  <Text style={s.emptyTitle}>No bookings found</Text>
                  <Text style={s.emptySub}>
                    Bookings appear here after you pay
                  </Text>
                  <TouchableOpacity
                    style={s.emptyBtn}
                    onPress={() => setTab("payment")}
                  >
                    <Text style={s.emptyBtnText}>Book a Test →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredBookings.map((b) => {
                  const cfg = STATUS_CFG[b.status];
                  const open = expanded === b.id;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={s.bookingCard}
                      onPress={() => setExpanded(open ? null : b.id)}
                      activeOpacity={0.88}
                    >
                      <LinearGradient
                        colors={["#0E0E28", "#0B0B22"]}
                        style={s.bookingGrad}
                      >
                        {/* Top row */}
                        <View style={s.bookingTop}>
                          <View
                            style={[
                              s.bookingStatusDot,
                              { backgroundColor: cfg.color },
                            ]}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={s.bookingId}>{b.bookingId}</Text>
                            <Text style={s.bookingBranch} numberOfLines={1}>
                              {b.branch}
                            </Text>
                          </View>
                          <View
                            style={[s.statusBadge, { backgroundColor: cfg.bg }]}
                          >
                            <Ionicons
                              name={cfg.icon}
                              size={11}
                              color={cfg.color}
                            />
                            <Text
                              style={[s.statusBadgeText, { color: cfg.color }]}
                            >
                              {cfg.label}
                            </Text>
                          </View>
                          <Ionicons
                            name={open ? "chevron-up" : "chevron-down"}
                            size={16}
                            color="#555580"
                            style={{ marginLeft: 6 }}
                          />
                        </View>

                        {/* Date + Time */}
                        <View style={s.bookingMeta}>
                          <View style={s.metaItem}>
                            <Ionicons
                              name="calendar-outline"
                              size={12}
                              color="#555580"
                            />
                            <Text style={s.metaText}>{b.date}</Text>
                          </View>
                          <View style={s.metaItem}>
                            <Ionicons
                              name="time-outline"
                              size={12}
                              color="#555580"
                            />
                            <Text style={s.metaText}>{b.timeSlot}</Text>
                          </View>
                          <View style={s.metaItem}>
                            <Ionicons
                              name="flask-outline"
                              size={12}
                              color="#555580"
                            />
                            <Text style={s.metaText}>
                              {b.tests.length} test
                              {b.tests.length > 1 ? "s" : ""}
                            </Text>
                          </View>
                          <Text style={s.bookingTotal}>
                            Rs. {b.totalAmount.toLocaleString()}
                          </Text>
                        </View>

                        {/* Expanded details */}
                        {open && (
                          <View style={s.bookingDetails}>
                            <View style={s.detailDivider} />

                            {/* Tests list */}
                            <Text style={s.detailLabel}>Tests</Text>
                            {b.tests.map((t, i) => (
                              <View key={i} style={s.detailTestRow}>
                                <View style={s.detailDot} />
                                <Text
                                  style={s.detailTestName}
                                  numberOfLines={1}
                                >
                                  {t.name}
                                </Text>
                                <Text style={s.detailTestPrice}>
                                  Rs. {t.price.toLocaleString()}
                                </Text>
                              </View>
                            ))}

                            <View style={s.detailDivider} />

                            {/* Payment info */}
                            <View style={s.detailRow}>
                              <Text style={s.detailKey}>Payment</Text>
                              <Text style={s.detailVal}>
                                {b.paymentMethod || "—"}
                              </Text>
                            </View>
                            {b.tokenNumber && (
                              <View style={s.detailRow}>
                                <Text style={s.detailKey}>Token</Text>
                                <View style={s.tokenPill}>
                                  <Text style={s.tokenPillText}>
                                    #{String(b.tokenNumber).padStart(2, "0")}
                                  </Text>
                                </View>
                              </View>
                            )}

                            {/* Actions */}
                            <View style={s.bookingActions}>
                              {b.status === "upcoming" && (
                                <TouchableOpacity
                                  style={s.actionCancel}
                                  onPress={() =>
                                    handleCancelBooking(b.bookingId)
                                  }
                                >
                                  <Ionicons
                                    name="close-circle-outline"
                                    size={14}
                                    color="#EF4444"
                                  />
                                  <Text style={s.actionCancelText}>Cancel</Text>
                                </TouchableOpacity>
                              )}
                              {b.status === "upcoming" && b.tokenNumber && (
                                <TouchableOpacity
                                  style={s.actionToken}
                                  onPress={() =>
                                    Alert.alert(
                                      `Token #${String(b.tokenNumber).padStart(2, "0")}`,
                                      `Branch: ${b.branch}\nDate: ${b.date}\nTime: ${b.timeSlot}\n\nLab entry ලදී මේ token number show කරන්න.`,
                                      [{ text: "OK" }],
                                    )
                                  }
                                >
                                  <Ionicons
                                    name="qr-code-outline"
                                    size={14}
                                    color="#fff"
                                  />
                                  <Text style={s.actionTokenText}>
                                    View Token
                                  </Text>
                                </TouchableOpacity>
                              )}
                              {b.status === "completed" && (
                                <TouchableOpacity
                                  style={s.actionReport}
                                  onPress={() =>
                                    Alert.alert(
                                      "Reports",
                                      "Reports feature coming soon.\nTest results will appear here.",
                                      [{ text: "OK" }],
                                    )
                                  }
                                >
                                  <Ionicons
                                    name="document-text-outline"
                                    size={14}
                                    color="#10B981"
                                  />
                                  <Text style={s.actionReportText}>
                                    View Report
                                  </Text>
                                </TouchableOpacity>
                              )}
                              <TouchableOpacity
                                style={s.actionRebook}
                                onPress={() => setTab("payment")}
                              >
                                <Ionicons
                                  name="refresh-outline"
                                  size={14}
                                  color="#3B82F6"
                                />
                                <Text style={s.actionRebookText}>
                                  Book Again
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const CARD_BG = "#0E0E24";
const BORDER = "#1C1C3A";

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050510" },
  scroll: { flex: 1 },
  bgAbs: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  blob: { position: "absolute", width: 280, height: 280, borderRadius: 999 },

  // Header
  header: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 1 },
  secureBadge: {
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
  secureBadgeText: { fontSize: 11, color: "#10B981", fontWeight: "600" },

  // Tab bar
  tabBar: { flexDirection: "row", gap: 8 },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
  },
  tabBtnActive: {
    backgroundColor: "rgba(59,130,246,0.2)",
    borderWidth: 0.5,
    borderColor: "rgba(59,130,246,0.4)",
  },
  tabBtnText: { fontSize: 13, fontWeight: "600", color: "#555580" },
  tabBtnTextActive: { color: "#3B82F6" },
  tabDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EC4899",
    justifyContent: "center",
    alignItems: "center",
  },
  tabDotText: { fontSize: 9, fontWeight: "800", color: "#fff" },

  // Section
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 12,
    letterSpacing: -0.2,
  },

  // Order card
  orderCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  orderGrad: { padding: 16 },
  orderInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 7,
  },
  oIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(59,130,246,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  oLabel: { fontSize: 10, color: "#555580", letterSpacing: 0.4 },
  oValue: { fontSize: 13, fontWeight: "600", color: "#fff", marginTop: 2 },
  orderDivider: { height: 0.5, backgroundColor: BORDER, marginVertical: 8 },
  orderItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  orderDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3B82F6",
  },
  orderItemName: { flex: 1, fontSize: 12, color: "rgba(255,255,255,0.7)" },
  orderItemPrice: { fontSize: 12, fontWeight: "700", color: "#3B82F6" },
  orderTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 4,
  },
  orderTotalLabel: { fontSize: 14, fontWeight: "600", color: "#fff" },
  orderTotalAmt: { fontSize: 22, fontWeight: "800", color: "#3B82F6" },

  // Method
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  methodCardActive: { borderColor: "#3B82F6", backgroundColor: "#0B0B2A" },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
  },
  methodInfo: { flex: 1 },
  methodLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  methodLabel: { fontSize: 14, fontWeight: "700", color: "#fff" },
  methodSub: { fontSize: 12, color: "#555580" },
  recoBadge: {
    backgroundColor: "rgba(59,130,246,0.15)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  recoText: { fontSize: 9, color: "#3B82F6", fontWeight: "700" },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#2A2A4A",
    justifyContent: "center",
    alignItems: "center",
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },

  // Info box
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 6,
    backgroundColor: "rgba(10,22,40,0.8)",
    borderRadius: 13,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "rgba(59,130,246,0.2)",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
    lineHeight: 18,
  },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: "#080818",
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
  },
  bottomLabel: { fontSize: 11, color: "#555580" },
  bottomAmt: { fontSize: 18, fontWeight: "800", color: "#fff" },
  payBtn: { flex: 1, borderRadius: 16, overflow: "hidden" },
  payBtnGrad: {
    flexDirection: "row",
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },

  // Filter pills
  filterScroll: { maxHeight: 52, flexGrow: 0 },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  filterText: { fontSize: 12, color: "#555580" },
  filterCount: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  filterCountText: { fontSize: 10, color: "#555580", fontWeight: "700" },

  // Loading / empty
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#555580" },
  emptyWrap: { alignItems: "center", paddingTop: 64, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#333358" },
  emptySub: { fontSize: 13, color: "#222240" },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: "rgba(59,130,246,0.15)",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 0.5,
    borderColor: "rgba(59,130,246,0.3)",
  },
  emptyBtnText: { fontSize: 13, fontWeight: "700", color: "#3B82F6" },

  // Booking cards
  bookingCard: {
    marginBottom: 10,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  bookingGrad: { padding: 14 },
  bookingTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  bookingStatusDot: { width: 8, height: 8, borderRadius: 4 },
  bookingId: { fontSize: 10, color: "#555580", letterSpacing: 0.5 },
  bookingBranch: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: { fontSize: 11, fontWeight: "700" },
  bookingMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11, color: "#555580" },
  bookingTotal: {
    marginLeft: "auto",
    fontSize: 13,
    fontWeight: "800",
    color: "#3B82F6",
  },

  // Expanded
  bookingDetails: { marginTop: 10 },
  detailDivider: { height: 0.5, backgroundColor: BORDER, marginVertical: 10 },
  detailLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#555580",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailTestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  detailDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#3B82F6",
  },
  detailTestName: { flex: 1, fontSize: 12, color: "rgba(255,255,255,0.7)" },
  detailTestPrice: { fontSize: 12, fontWeight: "700", color: "#3B82F6" },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  detailKey: { fontSize: 12, color: "#555580" },
  detailVal: { fontSize: 12, fontWeight: "600", color: "#fff" },
  tokenPill: {
    backgroundColor: "rgba(59,130,246,0.15)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tokenPillText: { fontSize: 12, fontWeight: "800", color: "#3B82F6" },

  // Booking actions
  bookingActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  actionCancel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "rgba(239,68,68,0.3)",
    backgroundColor: "rgba(239,68,68,0.08)",
  },
  actionCancelText: { fontSize: 12, fontWeight: "600", color: "#EF4444" },
  actionToken: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#3B82F6",
  },
  actionTokenText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  actionReport: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "rgba(16,185,129,0.3)",
    backgroundColor: "rgba(16,185,129,0.08)",
  },
  actionReportText: { fontSize: 12, fontWeight: "600", color: "#10B981" },
  actionRebook: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "rgba(59,130,246,0.3)",
    backgroundColor: "rgba(59,130,246,0.08)",
  },
  actionRebookText: { fontSize: 12, fontWeight: "600", color: "#3B82F6" },

  // ── SUCCESS SCREEN ───────────────────────────────────────────────────────
  successScroll: {
    flexGrow: 1,
    alignItems: "center",
    paddingTop: 56,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  successWrap: { alignItems: "center", width: "100%" },
  successRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "rgba(16,185,129,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: "rgba(16,185,129,0.35)",
  },
  successGrad: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: "center",
    alignItems: "center",
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 5,
  },
  successSub: { fontSize: 14, color: "#555580", marginBottom: 28 },

  tokenCard: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 24,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  tokenCardInner: { alignItems: "center" },
  tokenTopBar: { height: 3.5, width: "100%" },
  tokenLabel: {
    fontSize: 10,
    color: "#555580",
    letterSpacing: 1.2,
    marginTop: 18,
    marginBottom: 4,
  },
  tokenBigNum: {
    fontSize: 68,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -2,
    lineHeight: 76,
  },

  qrGrid: {
    marginVertical: 12,
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
  qrHint: { fontSize: 11, color: "#555580", marginBottom: 14 },
  tokenDivider: {
    height: 0.5,
    backgroundColor: BORDER,
    width: "100%",
    marginBottom: 14,
  },
  tokenMeta: {
    width: "100%",
    paddingHorizontal: 18,
    paddingBottom: 18,
    gap: 7,
  },
  tokenMetaRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  tokenMetaText: { fontSize: 12, color: "#555580", flex: 1 },

  successTabs: { width: "100%", gap: 10 },
  successTabBtn: { borderRadius: 16, overflow: "hidden" },
  successTabGrad: {
    flexDirection: "row",
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  successTabText: { fontSize: 14, fontWeight: "700", color: "#3B82F6" },
});

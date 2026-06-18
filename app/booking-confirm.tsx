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
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const API_BASE = "https://rapidcare-backend-production.up.railway.app";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface CartItem {
  id: number;
  name: string;
  price: number;
  fastingHours: number;
  sampleType: string;
  resultTime: string;
}

// ─── STATIC DATA ─────────────────────────────────────────────────────────────
const BRANCHES = [
  {
    id: "b1",
    name: "RapidCare — Colombo 3",
    address: "45 Galle Road, Colombo 03",
    distance: "0.8km",
    wait: "~10 mins",
  },
  {
    id: "b2",
    name: "RapidCare — Nugegoda",
    address: "12 High Level Rd, Nugegoda",
    distance: "3.2km",
    wait: "~5 mins",
  },
  {
    id: "b3",
    name: "RapidCare — Kandy",
    address: "78 Dalada Veediya, Kandy",
    distance: "8.5km",
    wait: "~15 mins",
  },
];

const TIME_SLOTS = [
  "6:30 AM",
  "7:00 AM",
  "7:30 AM",
  "8:00 AM",
  "8:30 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
];
const BOOKED_SLOTS = ["8:00 AM", "8:30 AM"]; // simulate full slots

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function BookingConfirm() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [branch, setBranch] = useState<(typeof BRANCHES)[0] | null>(null);
  const [timeSlot, setTimeSlot] = useState<string>("");
  const [bookingDate, setBookingDate] = useState<Date>(
    new Date(Date.now() + 86400000),
  ); // tomorrow
  const [aiTip, setAiTip] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCart();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate step change
  const animateStep = () => {
    Animated.sequence([
      Animated.timing(stepAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(stepAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Load cart from AsyncStorage
  const loadCart = async () => {
    try {
      const data = await AsyncStorage.getItem("cartItems");
      if (data) setCartItems(JSON.parse(data));
    } catch {}
  };

  const cartTotal = cartItems.reduce((s, c) => s + c.price, 0);
  const maxFasting =
    cartItems.length > 0
      ? Math.max(...cartItems.map((c) => c.fastingHours))
      : 0;

  // ── AI Slot Suggestion ───────────────────────────────────────────────────
  const getAiSuggestion = async () => {
    if (cartItems.length === 0) return;
    setAiLoading(true);
    setAiTip("");
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await fetch(`${API_BASE}/ai/suggest-slot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tests: cartItems.map((t) => t.name),
          date: bookingDate.toLocaleDateString(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiTip(data.suggestion || "");
      } else {
        // Fallback tip
        setAiTip(
          maxFasting >= 8
            ? `Best time: 7:00 AM — ${maxFasting}h fasting needed. Start fasting at ${maxFasting === 12 ? "7 PM" : "11 PM"} tonight.`
            : "Best time: 7:30 AM — No fasting required for your tests.",
        );
      }
    } catch {
      setAiTip(
        maxFasting >= 8
          ? `7:00 AM recommended — ${maxFasting}h fasting required. Minimizes discomfort.`
          : "7:30 AM recommended — No fasting required for your selected tests.",
      );
    } finally {
      setAiLoading(false);
    }
  };

  // ── Step navigation ──────────────────────────────────────────────────────
  const goNext = () => {
    if (step === 1 && !branch) {
      Alert.alert("Select Branch", "Branch  select .");
      return;
    }
    if (step === 2 && !timeSlot) {
      Alert.alert("Select Time", "Time slot  select .");
      return;
    }
    animateStep();
    if (step === 1) {
      setStep(2);
      getAiSuggestion();
    } else if (step === 2) setStep(3);
  };

  const goBack = () => {
    if (step === 1) router.back();
    else {
      animateStep();
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  // ── Confirm Booking ──────────────────────────────────────────────────────
  const handleConfirm = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tests: cartItems.map((t) => t.id),
          branchId: branch?.id,
          branchName: branch?.name,
          timeSlot,
          appointmentDate: bookingDate.toISOString(),
          totalAmount: cartTotal,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await AsyncStorage.removeItem("cartItems");
        await AsyncStorage.setItem("lastBooking", JSON.stringify(data));
        router.replace("/payment");
      } else {
        Alert.alert("Booking Failed", data.message || "Try again.");
      }
    } catch {
      // Simulate success for demo
      await AsyncStorage.removeItem("cartItems");
      router.replace("/payment");
    } finally {
      setLoading(false);
    }
  };

  // ── Fasting start time ───────────────────────────────────────────────────
  const getFastingTime = () => {
    if (maxFasting === 0) return null;
    if (!timeSlot) return `${maxFasting} hours before appointment`;
    const [time, period] = timeSlot.split(" ");
    const [h, m] = time.split(":").map(Number);
    let hour = period === "PM" && h !== 12 ? h + 12 : h;
    hour -= maxFasting;
    if (hour < 0) hour += 24;
    const ampm = hour >= 12 ? "PM" : "AM";
    const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${display}:${m.toString().padStart(2, "0")} ${ampm} (previous day)`;
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050510" />

      {/* Bg blobs */}
      <View style={s.bgAbs} pointerEvents="none">
        <View style={s.blobTL} />
        <View style={s.blobBR} />
      </View>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <LinearGradient colors={["#0D0D28", "#131340"]} style={s.header}>
          <View style={s.headerRow}>
            <TouchableOpacity style={s.backBtn} onPress={goBack}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>
                {step === 1
                  ? "Select Branch"
                  : step === 2
                    ? "Choose Time"
                    : "Confirm Booking"}
              </Text>
              <Text style={s.headerSub}>Step {step} of 3</Text>
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* Progress bar */}
          <View style={s.progressTrack}>
            <Animated.View
              style={[s.progressFill, { width: `${(step / 3) * 100}%` }]}
            />
          </View>

          {/* Step dots */}
          <View style={s.stepDots}>
            {[1, 2, 3].map((n) => (
              <View key={n} style={s.stepDotWrap}>
                <View
                  style={[
                    s.stepDot,
                    step >= n && s.stepDotActive,
                    step > n && s.stepDotDone,
                  ]}
                >
                  {step > n ? (
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  ) : (
                    <Text
                      style={[s.stepDotText, step >= n && s.stepDotTextActive]}
                    >
                      {n}
                    </Text>
                  )}
                </View>
                <Text
                  style={[s.stepDotLabel, step >= n && s.stepDotLabelActive]}
                >
                  {n === 1 ? "Branch" : n === 2 ? "Time" : "Confirm"}
                </Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ── CONTENT ────────────────────────────────────────────────────── */}
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* ── CART SUMMARY (always visible) ──────────────────────────── */}
          <View style={s.cartSummary}>
            <View style={s.cartSummaryLeft}>
              <Ionicons name="cart-outline" size={16} color="#3B82F6" />
              <Text style={s.cartSummaryText}>
                {cartItems.length} test{cartItems.length !== 1 ? "s" : ""}{" "}
                selected
              </Text>
              {cartItems.slice(0, 2).map((c) => (
                <View key={c.id} style={s.cartChip}>
                  <Text style={s.cartChipText} numberOfLines={1}>
                    {c.name.split("(")[0].trim()}
                  </Text>
                </View>
              ))}
              {cartItems.length > 2 && (
                <View style={s.cartChip}>
                  <Text style={s.cartChipText}>+{cartItems.length - 2}</Text>
                </View>
              )}
            </View>
            <Text style={s.cartSummaryTotal}>
              Rs. {cartTotal.toLocaleString()}
            </Text>
          </View>

          {/* ── STEP 1 — BRANCH ────────────────────────────────────────── */}
          {step === 1 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Select a Branch</Text>
              {BRANCHES.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    s.branchCard,
                    branch?.id === b.id && s.branchCardActive,
                  ]}
                  onPress={() => setBranch(b)}
                  activeOpacity={0.85}
                >
                  <View style={s.branchLeft}>
                    <View
                      style={[
                        s.branchIcon,
                        branch?.id === b.id && s.branchIconActive,
                      ]}
                    >
                      <Ionicons
                        name="location"
                        size={18}
                        color={branch?.id === b.id ? "#fff" : "#3B82F6"}
                      />
                    </View>
                    <View style={s.branchInfo}>
                      <Text
                        style={[
                          s.branchName,
                          branch?.id === b.id && { color: "#3B82F6" },
                        ]}
                      >
                        {b.name}
                      </Text>
                      <Text style={s.branchAddress}>{b.address}</Text>
                      <View style={s.branchTags}>
                        <View style={s.branchTag}>
                          <Ionicons
                            name="navigate-outline"
                            size={10}
                            color="#555580"
                          />
                          <Text style={s.branchTagText}>{b.distance}</Text>
                        </View>
                        <View style={s.branchTag}>
                          <Ionicons
                            name="time-outline"
                            size={10}
                            color="#555580"
                          />
                          <Text style={s.branchTagText}>Wait {b.wait}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                  {branch?.id === b.id && (
                    <View style={s.selectedTick}>
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="#3B82F6"
                      />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── STEP 2 — TIME SLOT ─────────────────────────────────────── */}
          {step === 2 && (
            <View style={s.section}>
              {/* AI suggestion */}
              <View style={s.aiCard}>
                <View style={s.aiCardHeader}>
                  <View style={s.aiIconWrap}>
                    <Ionicons name="sparkles" size={14} color="#EC4899" />
                  </View>
                  <Text style={s.aiCardTitle}>AI Slot Suggestion</Text>
                  {aiLoading && (
                    <ActivityIndicator
                      size="small"
                      color="#A855F7"
                      style={{ marginLeft: 8 }}
                    />
                  )}
                </View>
                {aiLoading ? (
                  <Text style={s.aiCardText}>
                    Calculating best time for your tests...
                  </Text>
                ) : (
                  <Text style={s.aiCardText}>
                    {aiTip || "Select a time slot below."}
                  </Text>
                )}
              </View>

              {/* Fasting warning */}
              {maxFasting > 0 && (
                <View style={s.fastingWarn}>
                  <Ionicons name="warning-outline" size={16} color="#F59E0B" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.fastingWarnTitle}>Fasting Required</Text>
                    <Text style={s.fastingWarnText}>
                      {maxFasting} hours fasting needed.
                      {timeSlot
                        ? ` Start fasting at: ${getFastingTime()}`
                        : " Select a time to see fasting start time."}
                    </Text>
                  </View>
                </View>
              )}

              {/* Date info */}
              <View style={s.dateRow}>
                <Ionicons name="calendar-outline" size={16} color="#3B82F6" />
                <Text style={s.dateText}>
                  {bookingDate.toLocaleDateString("en-LK", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>

              <Text style={s.sectionTitle}>Available Time Slots</Text>
              <View style={s.slotsGrid}>
                {TIME_SLOTS.map((slot) => {
                  const isBooked = BOOKED_SLOTS.includes(slot);
                  const isSelected = timeSlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        s.slotPill,
                        isSelected && s.slotPillActive,
                        isBooked && s.slotPillBooked,
                      ]}
                      onPress={() => !isBooked && setTimeSlot(slot)}
                      disabled={isBooked}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          s.slotText,
                          isSelected && s.slotTextActive,
                          isBooked && s.slotTextBooked,
                        ]}
                      >
                        {slot}
                      </Text>
                      {isBooked && <Text style={s.slotFullText}>Full</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── STEP 3 — CONFIRM ───────────────────────────────────────── */}
          {step === 3 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Booking Summary</Text>

              {/* Summary card */}
              <View style={s.summaryCard}>
                <LinearGradient
                  colors={["#0E0E28", "#13133A"]}
                  style={s.summaryGrad}
                >
                  {/* Branch */}
                  <View style={s.summaryRow}>
                    <View style={s.summaryIconWrap}>
                      <Ionicons name="location" size={16} color="#3B82F6" />
                    </View>
                    <View style={s.summaryInfo}>
                      <Text style={s.summaryLabel}>Branch</Text>
                      <Text style={s.summaryValue}>{branch?.name}</Text>
                      <Text style={s.summarySubValue}>{branch?.address}</Text>
                    </View>
                  </View>

                  <View style={s.summaryDivider} />

                  {/* Date & Time */}
                  <View style={s.summaryRow}>
                    <View style={s.summaryIconWrap}>
                      <Ionicons name="calendar" size={16} color="#A855F7" />
                    </View>
                    <View style={s.summaryInfo}>
                      <Text style={s.summaryLabel}>Appointment</Text>
                      <Text style={s.summaryValue}>{timeSlot}</Text>
                      <Text style={s.summarySubValue}>
                        {bookingDate.toLocaleDateString("en-LK", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    </View>
                  </View>

                  <View style={s.summaryDivider} />

                  {/* Tests */}
                  <View style={s.summaryRow}>
                    <View style={s.summaryIconWrap}>
                      <Ionicons name="flask" size={16} color="#10B981" />
                    </View>
                    <View style={s.summaryInfo}>
                      <Text style={s.summaryLabel}>Selected Tests</Text>
                      {cartItems.map((c) => (
                        <View key={c.id} style={s.testSummaryRow}>
                          <Text style={s.testSummaryName} numberOfLines={1}>
                            {c.name}
                          </Text>
                          <Text style={s.testSummaryPrice}>
                            Rs. {c.price.toLocaleString()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={s.summaryDivider} />

                  {/* Total */}
                  <View style={s.totalRow}>
                    <Text style={s.totalLabel}>Total Amount</Text>
                    <Text style={s.totalValue}>
                      Rs. {cartTotal.toLocaleString()}
                    </Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Fasting reminder */}
              {maxFasting > 0 && (
                <View style={s.fastingReminder}>
                  <Ionicons name="alarm-outline" size={18} color="#F59E0B" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.fastingReminderTitle}>Fasting Reminder</Text>
                    <Text style={s.fastingReminderText}>
                      Stop eating/drinking (except water) at: {getFastingTime()}
                    </Text>
                  </View>
                </View>
              )}

              {/* Payment note */}
              <View style={s.payNote}>
                <Ionicons name="card-outline" size={16} color="#3B82F6" />
                <Text style={s.payNoteText}>
                  You will be redirected to PayHere secure payment after
                  confirming.
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* ── BOTTOM ACTION ──────────────────────────────────────────────── */}
      <View style={s.bottomBar}>
        {step > 1 && (
          <TouchableOpacity style={s.prevBtn} onPress={goBack}>
            <Ionicons name="arrow-back" size={20} color="#3B82F6" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.nextBtn, loading && { opacity: 0.6 }]}
          onPress={step === 3 ? handleConfirm : goNext}
          disabled={loading}
          activeOpacity={0.87}
        >
          <LinearGradient
            colors={["#3B82F6", "#6366F1", "#A855F7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.nextBtnGrad}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={s.nextBtnText}>
                  {step === 1
                    ? "Next — Choose Time"
                    : step === 2
                      ? "Next — Review"
                      : "Confirm & Pay"}
                </Text>
                <Ionicons
                  name={step === 3 ? "card" : "arrow-forward"}
                  size={18}
                  color="#fff"
                />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const CARD_BG = "#0E0E24";
const BORDER = "#1C1C3A";

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050510" },
  bgAbs: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  blobTL: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.08)",
    top: -60,
    left: -50,
  },
  blobBR: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 999,
    backgroundColor: "rgba(168,85,247,0.07)",
    bottom: 80,
    right: -40,
  },

  // Header
  header: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  progressTrack: {
    height: 3,
    backgroundColor: "#1C1C3A",
    borderRadius: 2,
    marginBottom: 14,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#3B82F6", borderRadius: 2 },
  stepDots: { flexDirection: "row", justifyContent: "center", gap: 32 },
  stepDotWrap: { alignItems: "center", gap: 4 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1C1C3A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  stepDotActive: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  stepDotDone: { backgroundColor: "#10B981", borderColor: "#10B981" },
  stepDotText: { fontSize: 11, fontWeight: "700", color: "#555580" },
  stepDotTextActive: { color: "#fff" },
  stepDotLabel: { fontSize: 9, color: "#333358", letterSpacing: 0.3 },
  stepDotLabelActive: { color: "rgba(255,255,255,0.6)" },

  // Cart summary bar
  cartSummary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    margin: 16,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 12,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  cartSummaryLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  cartSummaryText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginRight: 4,
  },
  cartChip: {
    backgroundColor: "rgba(59,130,246,0.12)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    maxWidth: 90,
  },
  cartChipText: { fontSize: 9, color: "#3B82F6", fontWeight: "600" },
  cartSummaryTotal: { fontSize: 15, fontWeight: "800", color: "#fff" },

  // Section
  scroll: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 8 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
    letterSpacing: -0.2,
  },

  // Branch cards
  branchCard: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: BORDER,
  },
  branchCardActive: {
    borderColor: "#3B82F6",
    backgroundColor: "rgba(59,130,246,0.05)",
  },
  branchLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  branchIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(59,130,246,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  branchIconActive: { backgroundColor: "#3B82F6" },
  branchInfo: { flex: 1 },
  branchName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 3,
  },
  branchAddress: { fontSize: 11, color: "#555580", marginBottom: 6 },
  branchTags: { flexDirection: "row", gap: 8 },
  branchTag: { flexDirection: "row", alignItems: "center", gap: 3 },
  branchTagText: { fontSize: 10, color: "#555580" },
  selectedTick: { marginLeft: 8 },

  // AI card
  aiCard: {
    backgroundColor: "rgba(168,85,247,0.08)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "rgba(168,85,247,0.25)",
  },
  aiCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  aiIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(236,72,153,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  aiCardTitle: { fontSize: 12, fontWeight: "700", color: "#A855F7" },
  aiCardText: { fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 18 },

  // Fasting warning
  fastingWarn: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(245,158,11,0.08)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "rgba(245,158,11,0.25)",
  },
  fastingWarnTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F59E0B",
    marginBottom: 2,
  },
  fastingWarnText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 16,
  },

  // Date row
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  dateText: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "500" },

  // Time slots
  slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotPill: {
    width: (width - 64) / 4,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: CARD_BG,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  slotPillActive: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  slotPillBooked: {
    backgroundColor: "#08080E",
    borderColor: "#111128",
    opacity: 0.5,
  },
  slotText: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  slotTextActive: { color: "#fff" },
  slotTextBooked: { color: "#333358" },
  slotFullText: { fontSize: 8, color: "#333358", marginTop: 2 },

  // Summary
  summaryCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },
  summaryGrad: { padding: 18 },
  summaryRow: { flexDirection: "row", gap: 12, paddingVertical: 8 },
  summaryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryInfo: { flex: 1 },
  summaryLabel: {
    fontSize: 10,
    color: "#555580",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: { fontSize: 14, fontWeight: "700", color: "#fff" },
  summarySubValue: { fontSize: 11, color: "#555580", marginTop: 2 },
  summaryDivider: { height: 0.5, backgroundColor: BORDER, marginVertical: 4 },
  testSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  testSummaryName: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    flex: 1,
    marginRight: 8,
  },
  testSummaryPrice: { fontSize: 12, fontWeight: "700", color: "#3B82F6" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
  totalValue: { fontSize: 22, fontWeight: "800", color: "#fff" },

  // Fasting reminder
  fastingReminder: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(245,158,11,0.08)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "rgba(245,158,11,0.2)",
  },
  fastingReminderTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F59E0B",
    marginBottom: 3,
  },
  fastingReminderText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 16,
  },

  // Pay note
  payNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(59,130,246,0.07)",
    borderRadius: 12,
    padding: 10,
    borderWidth: 0.5,
    borderColor: "rgba(59,130,246,0.2)",
  },
  payNoteText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    flex: 1,
    lineHeight: 16,
  },

  // Bottom bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 10,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: "rgba(5,5,16,0.95)",
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
  },
  prevBtn: {
    width: 52,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1C3A5A",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(59,130,246,0.08)",
  },
  nextBtn: { flex: 1, borderRadius: 16, overflow: "hidden" },
  nextBtnGrad: {
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
});

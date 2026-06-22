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
const MAX_PER_SLOT = 5;

interface CartItem {
  id: number;
  name: string;
  price: number;
  fastingHours: number;
  sampleType: string;
  resultTime: string;
}

// ✅ LOCAL date — no UTC shift
function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${dd}`;
}

const BRANCHES = [
  {
    id: "b1",
    name: "RapidCare — Colombo 03",
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
    address: "78 Peradeniya Road, Kandy",
    distance: "8.5km",
    wait: "~20 mins",
  },
  {
    id: "b4",
    name: "RapidCare — Kuliyapitiya",
    address: "23 Colombo Road, Kuliyapitiya",
    distance: "12.0km",
    wait: "~10 mins",
  },
  {
    id: "b5",
    name: "RapidCare — Nikaweratiya",
    address: "15 Kurunegala Road, Nikaweratiya",
    distance: "18.5km",
    wait: "~5 mins",
  },
];

const ALL_SLOTS = [
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

export default function BookingConfirm() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [branch, setBranch] = useState<(typeof BRANCHES)[0] | null>(null);
  const [timeSlot, setTimeSlot] = useState("");
  const [bookingDate, setBookingDate] = useState(new Date());
  const [aiTip, setAiTip] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<Record<string, number>>({});
  const [slotsLoading, setSlotsLoading] = useState(false);

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

  const loadCart = async () => {
    try {
      const data = await AsyncStorage.getItem("cartItems");
      const savedDate = await AsyncStorage.getItem("selectedDate");
      if (data) setCartItems(JSON.parse(data));
      if (savedDate) {
        const [y, mo, dd] = savedDate.split("-").map(Number);
        const local = new Date(y, mo - 1, dd, 12, 0, 0);
        console.log(
          "[BookingConfirm] savedDate:",
          savedDate,
          "→ local:",
          localDateStr(local),
        );
        setBookingDate(local);
      } else {
        const t = new Date();
        setBookingDate(
          new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1, 12, 0, 0),
        );
      }
    } catch (e) {
      console.log("[BookingConfirm] loadCart error:", e);
    }
  };

  const loadBookedSlots = async (branchName: string) => {
    setSlotsLoading(true);
    try {
      const date = localDateStr(bookingDate);
      const res = await fetch(
        `${API_BASE}/bookings/slots?branch=${encodeURIComponent(branchName)}&date=${date}`,
      );
      if (res.ok) {
        const data = await res.json();
        const slotMap: Record<string, number> = {};
        data.forEach((row: { time_slot: string; count: number }) => {
          slotMap[row.time_slot] = row.count;
        });
        setBookedSlots(slotMap);
      }
    } catch {
      setBookedSlots({});
    }
    setSlotsLoading(false);
  };

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

  const cartTotal = cartItems.reduce((s, c) => s + c.price, 0);
  const maxFasting =
    cartItems.length > 0
      ? Math.max(...cartItems.map((c) => c.fastingHours))
      : 0;

  const getAiSuggestion = async () => {
    if (cartItems.length === 0) return;
    setAiLoading(true);
    setAiTip("");
    try {
      const res = await fetch(`${API_BASE}/ai/suggest-slot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tests: cartItems.map((t) => t.name),
          date: localDateStr(bookingDate),
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setAiTip(d.suggestion || "");
      } else
        setAiTip(
          maxFasting >= 8
            ? `Best time: 7:00 AM — ${maxFasting}h fasting needed.`
            : "Best time: 7:30 AM — No fasting required.",
        );
    } catch {
      setAiTip(
        maxFasting >= 8
          ? `7:00 AM recommended — ${maxFasting}h fasting required.`
          : "7:30 AM recommended — No fasting required.",
      );
    } finally {
      setAiLoading(false);
    }
  };

  const goNext = () => {
    if (step === 1 && !branch) {
      Alert.alert("Select Branch", "Branch  select ");
      return;
    }
    if (step === 2 && !timeSlot) {
      Alert.alert("Select Time", "Time slot select ");
      return;
    }
    animateStep();
    if (step === 1) {
      setStep(2);
      getAiSuggestion();
      if (branch) loadBookedSlots(branch.name);
    } else if (step === 2) setStep(3);
  };

  const goBack = () => {
    if (step === 1) router.back();
    else {
      animateStep();
      setStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  // ✅ handleConfirm — userEmail added to lastToken & bookingData
  const handleConfirm = async () => {
    setLoading(true);
    const dateStr = localDateStr(bookingDate);
    console.log("[BookingConfirm] saving booking for date:", dateStr);
    try {
      const userData = await AsyncStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : {};
      const orderId = "RC" + Date.now();

      const res = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: user.name || "Patient",
          userEmail: user.email || "",
          branchName: branch?.name,
          bookingDate: dateStr,
          timeSlot,
          tests: cartItems.map((t) => ({ name: t.name, price: t.price })),
          totalAmount: cartTotal,
          orderId,
        }),
      });

      const data = await res.json();
      const tokenNumber =
        data.tokenNumber || Math.floor(Math.random() * 90) + 1;

      // ✅ lastToken — userEmail included for notification isolation
      await AsyncStorage.setItem(
        "lastToken",
        JSON.stringify({
          tokenNumber,
          branch: branch?.name,
          date: dateStr,
          timeSlot,
          userEmail: user.email || "", // ✅ notification user check
          tests: cartItems.map((t) => ({ name: t.name, price: t.price })),
          totalAmount: cartTotal,
          orderId,
          paidAt: new Date().toISOString(),
        }),
      );

      // ✅ bookingData — userEmail included
      await AsyncStorage.setItem(
        "bookingData",
        JSON.stringify({
          bookingId: data.bookingId,
          tokenNumber,
          branch: branch?.name,
          date: dateStr,
          timeSlot,
          userEmail: user.email || "", // ✅
          tests: cartItems.map((t) => ({ name: t.name, price: t.price })),
          totalAmount: cartTotal,
        }),
      );

      await AsyncStorage.removeItem("cartItems");
      await AsyncStorage.removeItem("selectedDate");
      router.replace("/payment");
    } catch (e) {
      console.log("[BookingConfirm] confirm error:", e);
      // catch block ෙකෙකේ ද userEmail save
      const userData2 = await AsyncStorage.getItem("user");
      const user2 = userData2 ? JSON.parse(userData2) : {};
      const orderId2 = "RC" + Date.now();
      const tokenNumber2 = Math.floor(Math.random() * 90) + 1;

      await AsyncStorage.setItem(
        "lastToken",
        JSON.stringify({
          tokenNumber: tokenNumber2,
          branch: branch?.name,
          date: dateStr,
          timeSlot,
          userEmail: user2.email || "", // ✅
          tests: cartItems.map((t) => ({ name: t.name, price: t.price })),
          totalAmount: cartTotal,
          orderId: orderId2,
          paidAt: new Date().toISOString(),
        }),
      );

      await AsyncStorage.removeItem("cartItems");
      await AsyncStorage.removeItem("selectedDate");
      router.replace("/payment");
    } finally {
      setLoading(false);
    }
  };

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

  const getSlotStatus = (slot: string) => {
    const count = bookedSlots[slot] || 0;
    if (count >= MAX_PER_SLOT) return "full";
    if (count >= MAX_PER_SLOT - 2) return "almost";
    return "available";
  };

  const displayDate = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString("en-LK", opts);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050510" />
      <View style={s.bgAbs} pointerEvents="none">
        <View style={s.blobTL} />
        <View style={s.blobBR} />
      </View>

      {/* Header */}
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
          <View style={s.progressTrack}>
            <View
              style={[s.progressFill, { width: `${(step / 3) * 100}%` as any }]}
            />
          </View>
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

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* Cart summary */}
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
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.cartSummaryTotal}>
                Rs. {cartTotal.toLocaleString()}
              </Text>
              <Text style={s.cartSummaryDate}>{localDateStr(bookingDate)}</Text>
            </View>
          </View>

          {/* Step 1 */}
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

          {/* Step 2 */}
          {step === 2 && (
            <View style={s.section}>
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
                <Text style={s.aiCardText}>
                  {aiLoading
                    ? "Calculating best time..."
                    : aiTip || "Select a time slot below."}
                </Text>
              </View>
              {maxFasting > 0 && (
                <View style={s.fastingWarn}>
                  <Ionicons name="warning-outline" size={16} color="#F59E0B" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.fastingWarnTitle}>Fasting Required</Text>
                    <Text style={s.fastingWarnText}>
                      {maxFasting}h fasting needed.
                      {timeSlot
                        ? ` Start at: ${getFastingTime()}`
                        : " Select a time slot."}
                    </Text>
                  </View>
                </View>
              )}
              <View style={s.dateRow}>
                <Ionicons name="calendar-outline" size={16} color="#3B82F6" />
                <Text style={s.dateText}>
                  {displayDate(bookingDate, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
                <View style={s.dateBadge}>
                  <Text style={s.dateBadgeText}>
                    {localDateStr(bookingDate)}
                  </Text>
                </View>
              </View>
              <View style={s.legendRow}>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: "#10B981" }]} />
                  <Text style={s.legendText}>Available</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: "#F59E0B" }]} />
                  <Text style={s.legendText}>Almost Full</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: "#EF4444" }]} />
                  <Text style={s.legendText}>Full</Text>
                </View>
              </View>
              <Text style={s.sectionTitle}>
                Available Time Slots
                {slotsLoading && (
                  <ActivityIndicator
                    size="small"
                    color="#3B82F6"
                    style={{ marginLeft: 8 }}
                  />
                )}
              </Text>
              <View style={s.slotsGrid}>
                {ALL_SLOTS.map((slot) => {
                  const status = getSlotStatus(slot);
                  const isFull = status === "full",
                    isAlmost = status === "almost",
                    isSel = timeSlot === slot;
                  const count = bookedSlots[slot] || 0;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        s.slotPill,
                        isSel && s.slotPillActive,
                        isFull && s.slotPillBooked,
                        isAlmost && !isSel && s.slotPillAlmost,
                      ]}
                      onPress={() => !isFull && setTimeSlot(slot)}
                      disabled={isFull}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          s.slotText,
                          isSel && s.slotTextActive,
                          isFull && s.slotTextBooked,
                        ]}
                      >
                        {slot}
                      </Text>
                      {isFull && <Text style={s.slotFullText}>Full</Text>}
                      {isAlmost && !isFull && (
                        <Text style={s.slotAlmostText}>
                          {MAX_PER_SLOT - count} left
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Booking Summary</Text>
              <View style={s.summaryCard}>
                <LinearGradient
                  colors={["#0E0E28", "#13133A"]}
                  style={s.summaryGrad}
                >
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
                  <View style={s.summaryRow}>
                    <View style={s.summaryIconWrap}>
                      <Ionicons name="calendar" size={16} color="#A855F7" />
                    </View>
                    <View style={s.summaryInfo}>
                      <Text style={s.summaryLabel}>Appointment</Text>
                      <Text style={s.summaryValue}>{timeSlot}</Text>
                      <Text style={s.summarySubValue}>
                        {localDateStr(bookingDate)} ·{" "}
                        {displayDate(bookingDate, {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={s.summaryDivider} />
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
                  <View style={s.totalRow}>
                    <Text style={s.totalLabel}>Total Amount</Text>
                    <Text style={s.totalValue}>
                      Rs. {cartTotal.toLocaleString()}
                    </Text>
                  </View>
                </LinearGradient>
              </View>
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

      {/* Bottom bar */}
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

const CARD_BG = "#0E0E24",
  BORDER = "#1C1C3A";
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
  cartSummaryDate: {
    fontSize: 11,
    color: "#3B82F6",
    marginTop: 2,
    fontWeight: "700",
  },
  scroll: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 8 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
    letterSpacing: -0.2,
  },
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
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
    flex: 1,
  },
  dateBadge: {
    backgroundColor: "rgba(59,130,246,0.15)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dateBadgeText: { fontSize: 11, color: "#3B82F6", fontWeight: "700" },
  legendRow: { flexDirection: "row", gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: "#555580" },
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
    backgroundColor: "#1A0808",
    borderColor: "#3A1010",
    opacity: 0.6,
  },
  slotPillAlmost: {
    borderColor: "#F59E0B",
    backgroundColor: "rgba(245,158,11,0.06)",
  },
  slotText: { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
  slotTextActive: { color: "#fff" },
  slotTextBooked: { color: "#333358" },
  slotFullText: { fontSize: 8, color: "#EF4444", marginTop: 2 },
  slotAlmostText: { fontSize: 8, color: "#F59E0B", marginTop: 2 },
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

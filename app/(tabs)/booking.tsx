import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useEffect, useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const API_BASE =
  "http://https://rapidcare-backend-production.up.railway.app:5000";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Test {
  id: number;
  name: string;
  category: string;
  price: number;
  fastingHours: number;
  sampleType: string;
  resultTime: string;
  description: string;
  popular: boolean;
}

interface CartItem extends Test {
  quantity: number;
}


const FALLBACK_TESTS: Test[] = [
  {
    id: 1,
    name: "CBC (Complete Blood Count)",
    category: "Blood",
    price: 850,
    fastingHours: 0,
    sampleType: "Blood",
    resultTime: "24hrs",
    description: "Measures red/white blood cells, platelets, hemoglobin.",
    popular: true,
  },
  {
    id: 2,
    name: "Blood Sugar (FBS)",
    category: "Blood",
    price: 450,
    fastingHours: 8,
    sampleType: "Blood",
    resultTime: "4hrs",
    description: "Fasting blood glucose level test.",
    popular: true,
  },
  {
    id: 3,
    name: "Lipid Profile",
    category: "Blood",
    price: 1200,
    fastingHours: 12,
    sampleType: "Blood",
    resultTime: "24hrs",
    description: "Cholesterol, triglycerides, HDL, LDL levels.",
    popular: true,
  },
  {
    id: 4,
    name: "Liver Function (LFT)",
    category: "Blood",
    price: 1500,
    fastingHours: 8,
    sampleType: "Blood",
    resultTime: "24hrs",
    description: "Liver enzyme and protein levels.",
    popular: false,
  },
  {
    id: 5,
    name: "Kidney Function (RFT)",
    category: "Urine",
    price: 1400,
    fastingHours: 0,
    sampleType: "Blood",
    resultTime: "24hrs",
    description: "Creatinine, urea, electrolyte levels.",
    popular: false,
  },
  {
    id: 6,
    name: "Thyroid (TSH)",
    category: "Hormone",
    price: 1800,
    fastingHours: 0,
    sampleType: "Blood",
    resultTime: "48hrs",
    description: "Thyroid stimulating hormone level.",
    popular: true,
  },
  {
    id: 7,
    name: "Urine Full Report",
    category: "Urine",
    price: 350,
    fastingHours: 0,
    sampleType: "Urine",
    resultTime: "4hrs",
    description: "Complete urine analysis.",
    popular: false,
  },
  {
    id: 8,
    name: "ESR",
    category: "Blood",
    price: 300,
    fastingHours: 0,
    sampleType: "Blood",
    resultTime: "4hrs",
    description: "Erythrocyte sedimentation rate test.",
    popular: false,
  },
  {
    id: 9,
    name: "HbA1c (Diabetes)",
    category: "Hormone",
    price: 1100,
    fastingHours: 0,
    sampleType: "Blood",
    resultTime: "24hrs",
    description: "3-month average blood sugar level.",
    popular: true,
  },
  {
    id: 10,
    name: "Vitamin D",
    category: "Hormone",
    price: 2500,
    fastingHours: 0,
    sampleType: "Blood",
    resultTime: "48hrs",
    description: "Vitamin D deficiency screening.",
    popular: false,
  },
  {
    id: 11,
    name: "Iron Studies",
    category: "Blood",
    price: 1600,
    fastingHours: 8,
    sampleType: "Blood",
    resultTime: "24hrs",
    description: "Serum iron, ferritin, TIBC levels.",
    popular: false,
  },
  {
    id: 12,
    name: "CRP (Inflammation)",
    category: "Blood",
    price: 900,
    fastingHours: 0,
    sampleType: "Blood",
    resultTime: "24hrs",
    description: "C-reactive protein for inflammation.",
    popular: false,
  },
];

const CATEGORIES = ["All", "Blood", "Urine", "Hormone", "Cardiac"];

const CATEGORY_ICONS: Record<string, string> = {
  All: "apps",
  Blood: "water",
  Urine: "flask",
  Hormone: "pulse",
  Cardiac: "heart",
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function BloodTestBooking() {
  const router = useRouter();

  const [tests, setTests] = useState<Test[]>([]);
  const [filtered, setFiltered] = useState<Test[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showPopular, setShowPopular] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cartAnim = useRef(new Animated.Value(0)).current;
  const cartSlide = useRef(new Animated.Value(300)).current;
  const headerAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    loadTests();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(headerAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate cart panel
  useEffect(() => {
    if (showCart) {
      Animated.parallel([
        Animated.timing(cartAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(cartSlide, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(cartAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(cartSlide, {
          toValue: 300,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showCart]);

  // ── Load tests from backend ─────────────────────────────────────────────
  const loadTests = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await fetch(`${API_BASE}/tests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTests(data);
        setFiltered(data);
      } else {
        // Use fallback
        setTests(FALLBACK_TESTS);
        setFiltered(FALLBACK_TESTS);
      }
    } catch {
      // Backend down — use static data
      setTests(FALLBACK_TESTS);
      setFiltered(FALLBACK_TESTS);
    } finally {
      setLoading(false);
    }
  };

  // ── Search + Filter ─────────────────────────────────────────────────────
  const applyFilter = useCallback(
    (searchText: string, cat: string) => {
      let result = tests;
      if (cat !== "All") result = result.filter((t) => t.category === cat);
      if (searchText.trim()) {
        result = result.filter(
          (t) =>
            t.name.toLowerCase().includes(searchText.toLowerCase()) ||
            t.category.toLowerCase().includes(searchText.toLowerCase()),
        );
      }
      setFiltered(result);
    },
    [tests],
  );

  const handleSearch = (text: string) => {
    setSearch(text);
    applyFilter(text, category);
  };

  const handleCategory = (cat: string) => {
    setCategory(cat);
    applyFilter(search, cat);
  };

  // ── Cart ────────────────────────────────────────────────────────────────
  const isInCart = (id: number) => cart.some((c) => c.id === id);

  const addToCart = (test: Test) => {
    if (isInCart(test.id)) {
      setCart((prev) => prev.filter((c) => c.id !== test.id));
    } else {
      setCart((prev) => [...prev, { ...test, quantity: 1 }]);
    }
  };

  const removeFromCart = (id: number) =>
    setCart((prev) => prev.filter((c) => c.id !== id));

  const cartTotal = cart.reduce((sum, c) => sum + c.price, 0);
  const cartCount = cart.length;

  // ── Proceed to booking ──────────────────────────────────────────────────
  const handleProceed = async () => {
    if (cart.length === 0) {
      Alert.alert("Empty Cart", "Tests select .");
      return;
    }
    await AsyncStorage.setItem("cartItems", JSON.stringify(cart));
    setShowCart(false);
    router.push("/booking-confirm");
  };

  const popularTests = tests.filter((t) => t.popular);

  // ─── RENDER TEST CARD ────────────────────────────────────────────────────
  const renderTestCard = (item: Test) => {
    const inCart = isInCart(item.id);
    return (
      <Animated.View key={item.id} style={[s.testCard, { opacity: fadeAnim }]}>
        <View style={s.testCardInner}>
          {/* Left info */}
          <View style={s.testLeft}>
            <View style={s.testIconWrap}>
              <Ionicons
                name={item.sampleType === "Urine" ? "flask" : "water"}
                size={18}
                color="#3B82F6"
              />
            </View>
            <View style={s.testMeta}>
              <Text style={s.testName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={s.testTags}>
                <View style={s.tag}>
                  <Ionicons name="time-outline" size={10} color="#8888AA" />
                  <Text style={s.tagText}>{item.fastingHours}h fast</Text>
                </View>
                <View style={s.tag}>
                  <Ionicons name="document-outline" size={10} color="#8888AA" />
                  <Text style={s.tagText}>{item.resultTime}</Text>
                </View>
                <View
                  style={[s.tag, { backgroundColor: "rgba(59,130,246,0.1)" }]}
                >
                  <Text style={[s.tagText, { color: "#3B82F6" }]}>
                    {item.category}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right */}
          <View style={s.testRight}>
            <Text style={s.testPrice}>Rs. {item.price.toLocaleString()}</Text>
            <TouchableOpacity
              style={[s.addBtn, inCart && s.addBtnActive]}
              onPress={() => addToCart(item)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={inCart ? "checkmark" : "add"}
                size={16}
                color={inCart ? "#fff" : "#3B82F6"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050510" />

      {/* Bg */}
      <View style={s.bgAbs} pointerEvents="none">
        <View style={s.blobTL} />
        <View style={s.blobBR} />
      </View>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <Animated.View
        style={{ transform: [{ translateY: headerAnim }], opacity: fadeAnim }}
      >
        <LinearGradient colors={["#0D0D28", "#131340"]} style={s.header}>
          <View style={s.headerRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={s.headerCenter}>
              <Text style={s.headerTitle}>Lab Test Booking</Text>
              <Text style={s.headerSub}>{tests.length} tests available</Text>
            </View>
            {/* Cart button */}
            <TouchableOpacity
              style={s.cartBtn}
              onPress={() => setShowCart(true)}
            >
              <Ionicons name="cart" size={20} color="#fff" />
              {cartCount > 0 && (
                <View style={s.cartBadge}>
                  <Text style={s.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={s.searchBar}>
            <Ionicons name="search-outline" size={16} color="#555580" />
            <TextInput
              style={s.searchInput}
              placeholder="Search tests..."
              placeholderTextColor="#333358"
              value={search}
              onChangeText={handleSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch("")}>
                <Ionicons name="close-circle" size={16} color="#555580" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ── CATEGORY PILLS ─────────────────────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.catScroll}
        contentContainerStyle={s.catContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[s.catPill, category === cat && s.catPillActive]}
            onPress={() => handleCategory(cat)}
          >
            <Ionicons
              name={(CATEGORY_ICONS[cat] || "apps") as any}
              size={12}
              color={category === cat ? "#fff" : "#555580"}
            />
            <Text style={[s.catText, category === cat && s.catTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── CONTENT ────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator color="#3B82F6" size="large" />
          <Text style={s.loadingText}>Loading tests...</Text>
        </View>
      ) : (
        <ScrollView
          style={s.listScroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Popular section */}
          {category === "All" && search === "" && (
            <View style={s.section}>
              <TouchableOpacity
                style={s.sectionHeader}
                onPress={() => setShowPopular(!showPopular)}
              >
                <View style={s.sectionLeft}>
                  <View style={s.sectionDot} />
                  <Text style={s.sectionTitle}>Popular Tests</Text>
                  <View style={s.sectionBadge}>
                    <Text style={s.sectionBadgeText}>
                      {popularTests.length}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={showPopular ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#555580"
                />
              </TouchableOpacity>
              {showPopular && popularTests.map(renderTestCard)}
            </View>
          )}

          {/* All / filtered tests */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.sectionLeft}>
                <View style={[s.sectionDot, { backgroundColor: "#A855F7" }]} />
                <Text style={s.sectionTitle}>
                  {search
                    ? `Results for "${search}"`
                    : category === "All"
                      ? "All Tests"
                      : category}
                </Text>
                <View
                  style={[
                    s.sectionBadge,
                    { backgroundColor: "rgba(168,85,247,0.15)" },
                  ]}
                >
                  <Text style={[s.sectionBadgeText, { color: "#A855F7" }]}>
                    {filtered.length}
                  </Text>
                </View>
              </View>
            </View>

            {filtered.length === 0 ? (
              <View style={s.emptyWrap}>
                <Ionicons name="search-outline" size={40} color="#1C1C3A" />
                <Text style={s.emptyText}>No tests found</Text>
                <Text style={s.emptySub}>Try a different search term</Text>
              </View>
            ) : (
              filtered.map(renderTestCard)
            )}
          </View>
        </ScrollView>
      )}

      {/* ── STICKY CART SUMMARY BAR ─────────────────────────────────────── */}
      {cartCount > 0 && !showCart && (
        <Animated.View style={[s.cartBar, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={s.cartBarInner}
            onPress={() => setShowCart(true)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={["#3B82F6", "#6366F1", "#A855F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.cartBarGrad}
            >
              <View style={s.cartBarLeft}>
                <View style={s.cartBarBadge}>
                  <Text style={s.cartBarBadgeText}>{cartCount}</Text>
                </View>
                <Text style={s.cartBarLabel}>
                  {cartCount} test{cartCount > 1 ? "s" : ""} selected
                </Text>
              </View>
              <View style={s.cartBarRight}>
                <Text style={s.cartBarTotal}>
                  Rs. {cartTotal.toLocaleString()}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── CART PANEL (Bottom Sheet) ───────────────────────────────────── */}
      {showCart && (
        <Animated.View style={[s.cartOverlay, { opacity: cartAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={() => setShowCart(false)}
          />
          <Animated.View
            style={[s.cartSheet, { transform: [{ translateY: cartSlide }] }]}
          >
            <LinearGradient
              colors={["#0E0E28", "#0A0A1E"]}
              style={s.cartSheetInner}
            >
              {/* Handle */}
              <View style={s.cartHandle} />
              <View style={s.cartSheetHeader}>
                <Text style={s.cartSheetTitle}>Selected Tests</Text>
                <TouchableOpacity onPress={() => setShowCart(false)}>
                  <Ionicons name="close" size={22} color="#555580" />
                </TouchableOpacity>
              </View>

              {/* Cart items */}
              <ScrollView
                style={{ maxHeight: 260 }}
                showsVerticalScrollIndicator={false}
              >
                {cart.map((item) => (
                  <View key={item.id} style={s.cartItem}>
                    <View style={s.cartItemIcon}>
                      <Ionicons
                        name="flask-outline"
                        size={16}
                        color="#3B82F6"
                      />
                    </View>
                    <View style={s.cartItemInfo}>
                      <Text style={s.cartItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={s.cartItemSub}>
                        {item.fastingHours}h fast · {item.resultTime}
                      </Text>
                    </View>
                    <Text style={s.cartItemPrice}>
                      Rs. {item.price.toLocaleString()}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeFromCart(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              {/* Total */}
              <View style={s.cartTotalRow}>
                <View>
                  <Text style={s.cartTotalLabel}>
                    Total ({cartCount} tests)
                  </Text>
                  <Text style={s.cartTotalAmount}>
                    Rs. {cartTotal.toLocaleString()}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setCart([])}>
                  <Text style={s.clearCartText}>Clear all</Text>
                </TouchableOpacity>
              </View>

              {/* Proceed button */}
              <TouchableOpacity
                style={s.proceedBtn}
                onPress={handleProceed}
                activeOpacity={0.87}
              >
                <LinearGradient
                  colors={["#3B82F6", "#6366F1", "#A855F7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.proceedGrad}
                >
                  <Text style={s.proceedText}>Proceed to Booking →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const CARD_BG = "#0E0E24";
const BORDER = "#1C1C3A";

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050510" },

  // Bg
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
    paddingBottom: 16,
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
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
  },
  headerSub: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 1 },
  cartBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  cartBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EC4899",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#050510",
  },
  cartBadgeText: { fontSize: 9, fontWeight: "800", color: "#fff" },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#08081C",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: BORDER,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#fff" },

  // Categories
  catScroll: { maxHeight: 54, flexGrow: 0 },
  catContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: CARD_BG,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  catPillActive: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },
  catText: { fontSize: 12, color: "#555580" },
  catTextActive: { color: "#fff", fontWeight: "600" },

  // Loading
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#555580" },

  // List
  listScroll: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#3B82F6",
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#fff" },
  sectionBadge: {
    backgroundColor: "rgba(59,130,246,0.15)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  sectionBadgeText: { fontSize: 11, color: "#3B82F6", fontWeight: "700" },

  // Test card
  testCard: { marginBottom: 10 },
  testCardInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 14,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  testLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  testIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(59,130,246,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  testMeta: { flex: 1 },
  testName: { fontSize: 13, fontWeight: "700", color: "#fff", marginBottom: 6 },
  testTags: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  tagText: { fontSize: 9, color: "#8888AA" },
  testRight: { alignItems: "flex-end", gap: 8 },
  testPrice: { fontSize: 13, fontWeight: "800", color: "#3B82F6" },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(59,130,246,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1C3A5A",
  },
  addBtnActive: { backgroundColor: "#3B82F6", borderColor: "#3B82F6" },

  // Empty
  emptyWrap: { alignItems: "center", paddingTop: 48, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#333358" },
  emptySub: { fontSize: 13, color: "#222240" },

  // Cart bar
  cartBar: { position: "absolute", bottom: 20, left: 16, right: 16 },
  cartBarInner: { borderRadius: 18, overflow: "hidden" },
  cartBarGrad: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cartBarLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  cartBarBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  cartBarBadgeText: { fontSize: 12, fontWeight: "800", color: "#fff" },
  cartBarLabel: { fontSize: 14, fontWeight: "600", color: "#fff" },
  cartBarRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  cartBarTotal: { fontSize: 16, fontWeight: "800", color: "#fff" },

  // Cart overlay
  cartOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 100,
  },
  cartSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  cartSheetInner: { paddingTop: 12, paddingHorizontal: 20, paddingBottom: 36 },
  cartHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2A2A4A",
    alignSelf: "center",
    marginBottom: 16,
  },
  cartSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cartSheetTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  cartItemIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(59,130,246,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 13, fontWeight: "600", color: "#fff" },
  cartItemSub: { fontSize: 11, color: "#555580", marginTop: 2 },
  cartItemPrice: { fontSize: 13, fontWeight: "700", color: "#3B82F6" },
  cartTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  cartTotalLabel: { fontSize: 12, color: "#555580" },
  cartTotalAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    marginTop: 2,
  },
  clearCartText: { fontSize: 12, color: "#EF4444", fontWeight: "600" },
  proceedBtn: { borderRadius: 18, overflow: "hidden" },
  proceedGrad: { height: 56, justifyContent: "center", alignItems: "center" },
  proceedText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
});

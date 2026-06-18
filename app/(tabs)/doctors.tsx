import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
  Linking,
  Alert,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

// ─── DOCTORS DATA ─────────────────────────────────────────────────────────────
const DOCTORS = [
  {
    id: "1",
    name: "Dr. Samantha Perera",
    specialty: "General Physician",
    qualifications: "MBBS, MD",
    hospital: "National Hospital, Colombo",
    phone: "+94 77 123 4567",
    whatsapp: "+94771234567",
    email: "dr.samantha@rapidcare.lk",
    experience: "12 years",
    available: "Mon – Fri · 8AM – 5PM",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.12)",
    icon: "👩‍⚕️",
    rating: "4.9",
    patients: "1,200+",
    specialties: ["Blood Tests", "Diabetes", "Cholesterol", "General Health"],
  },
  {
    id: "2",
    name: "Dr. Ruwan Fernando",
    specialty: "Cardiologist",
    qualifications: "MBBS, MD (Cardiology)",
    hospital: "Lanka Hospital, Colombo",
    phone: "+94 77 234 5678",
    whatsapp: "+94772345678",
    email: "dr.ruwan@rapidcare.lk",
    experience: "18 years",
    available: "Mon, Wed, Fri · 9AM – 1PM",
    color: "#EC4899",
    bg: "rgba(236,72,153,0.12)",
    icon: "👨‍⚕️",
    rating: "5.0",
    patients: "2,500+",
    specialties: ["Lipid Profile", "ECG", "Heart Disease", "Hypertension"],
  },
  {
    id: "3",
    name: "Dr. Nirosha Silva",
    specialty: "Endocrinologist",
    qualifications: "MBBS, MD (Endocrinology)",
    hospital: "Asiri Hospital, Colombo",
    phone: "+94 77 345 6789",
    whatsapp: "+94773456789",
    email: "dr.nirosha@rapidcare.lk",
    experience: "10 years",
    available: "Tue, Thu, Sat · 10AM – 4PM",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    icon: "👩‍⚕️",
    rating: "4.8",
    patients: "900+",
    specialties: ["Thyroid", "Diabetes", "HbA1c", "Vitamin D", "Hormones"],
  },
  {
    id: "4",
    name: "Dr. Kasun Jayawardena",
    specialty: "Hepatologist",
    qualifications: "MBBS, MD, MRCP",
    hospital: "Nawaloka Hospital, Colombo",
    phone: "+94 77 456 7890",
    whatsapp: "+94774567890",
    email: "dr.kasun@rapidcare.lk",
    experience: "15 years",
    available: "Mon – Sat · 8AM – 12PM",
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    icon: "👨‍⚕️",
    rating: "4.7",
    patients: "1,800+",
    specialties: ["Liver Function", "Hepatitis", "Kidney", "Urine Tests"],
  },
  {
    id: "5",
    name: "Dr. Priya Wijesinghe",
    specialty: "Pathologist",
    qualifications: "MBBS, MD (Pathology)",
    hospital: "Teaching Hospital, Kandy",
    phone: "+94 77 567 8901",
    whatsapp: "+94775678901",
    email: "dr.priya@rapidcare.lk",
    experience: "8 years",
    available: "Mon – Fri · 9AM – 5PM",
    color: "#A855F7",
    bg: "rgba(168,85,247,0.12)",
    icon: "👩‍⚕️",
    rating: "4.9",
    patients: "600+",
    specialties: ["CBC", "Blood Analysis", "ESR", "CRP", "Urine Full Report"],
  },
  {
    id: "6",
    name: "Dr. Chamara Bandara",
    specialty: "Nephrologist",
    qualifications: "MBBS, MD (Nephrology)",
    hospital: "Kandy Teaching Hospital",
    phone: "+94 77 678 9012",
    whatsapp: "+94776789012",
    email: "dr.chamara@rapidcare.lk",
    experience: "14 years",
    available: "Tue, Thu · 2PM – 6PM",
    color: "#06B6D4",
    bg: "rgba(6,182,212,0.12)",
    icon: "👨‍⚕️",
    rating: "4.8",
    patients: "1,100+",
    specialties: ["Kidney Function", "Creatinine", "Urea", "Uric Acid"],
  },
];

const SPECIALTIES = [
  "All",
  "General",
  "Heart",
  "Diabetes",
  "Liver",
  "Kidney",
  "Thyroid",
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function DoctorsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeFilter, setFilter] = useState("All");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

  const call = (phone: string) => Linking.openURL(`tel:${phone}`);
  const whatsapp = (num: string) => Linking.openURL(`https://wa.me/${num}`);
  const email = (addr: string) => Linking.openURL(`mailto:${addr}`);

  const filtered = DOCTORS.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialty.toLowerCase().includes(search.toLowerCase()) ||
      d.specialties.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchFilter =
      activeFilter === "All" ||
      (activeFilter === "General" && d.specialty.includes("General")) ||
      (activeFilter === "Heart" && d.specialty.includes("Cardio")) ||
      (activeFilter === "Diabetes" &&
        d.specialties.some(
          (s) => s.includes("Diabet") || s.includes("Thyroid"),
        )) ||
      (activeFilter === "Liver" && d.specialty.includes("Hepato")) ||
      (activeFilter === "Kidney" && d.specialty.includes("Nephro")) ||
      (activeFilter === "Thyroid" && d.specialty.includes("Endocrin"));
    return matchSearch && matchFilter;
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050510" />

      {/* Bg */}
      <View style={s.bgAbs} pointerEvents="none">
        <Animated.View style={[s.blobTL, { opacity: glowOpacity }]} />
        <Animated.View style={[s.blobBR, { opacity: glowOpacity }]} />
      </View>

      {/* Header */}
      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <LinearGradient colors={["#0D0D28", "#131340"]} style={s.header}>
          <View style={s.headerTop}>
            <View>
              <Text style={s.headerTitle}>👨‍⚕️ Our Doctors</Text>
              <Text style={s.headerSub}>
                {DOCTORS.length} specialists available
              </Text>
            </View>
            <View style={s.headerBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#10B981" />
              <Text style={s.headerBadgeText}>Verified</Text>
            </View>
          </View>

          {/* Search */}
          <View style={s.searchWrap}>
            <Ionicons name="search-outline" size={16} color="#555580" />
            <TextInput
              style={s.searchInput}
              placeholder="Search doctor or specialty..."
              placeholderTextColor="#2A2A4A"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={16} color="#555580" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.filterScroll}
          >
            {SPECIALTIES.map((f) => (
              <TouchableOpacity
                key={f}
                style={[s.filterPill, activeFilter === f && s.filterPillActive]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    s.filterText,
                    activeFilter === f && s.filterTextActive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {filtered.length === 0 && (
            <View style={s.emptyWrap}>
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text style={s.emptyText}>No doctors found</Text>
              <Text style={s.emptySubText}>Try a different search</Text>
            </View>
          )}

          {filtered.map((doc) => {
            const isOpen = expanded === doc.id;
            return (
              <View key={doc.id} style={s.docCard}>
                <LinearGradient
                  colors={["#0C0C22", "#0E0E28"]}
                  style={s.docGrad}
                >
                  <LinearGradient
                    colors={[doc.color, doc.color + "88"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.docTopBar}
                  />

                  <View style={s.docBody}>
                    {/* Main info row */}
                    <TouchableOpacity
                      style={s.docMainRow}
                      onPress={() => setExpanded(isOpen ? null : doc.id)}
                      activeOpacity={0.85}
                    >
                      {/* Avatar */}
                      <View
                        style={[
                          s.avatar,
                          {
                            backgroundColor: doc.bg,
                            borderColor: doc.color + "40",
                          },
                        ]}
                      >
                        <Text style={s.avatarIcon}>{doc.icon}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={s.docName}>{doc.name}</Text>
                        <Text style={[s.docSpecialty, { color: doc.color }]}>
                          {doc.specialty}
                        </Text>
                        <Text style={s.docQual}>{doc.qualifications}</Text>
                      </View>

                      <View style={s.docRight}>
                        <View style={s.ratingWrap}>
                          <Ionicons name="star" size={11} color="#F59E0B" />
                          <Text style={s.ratingText}>{doc.rating}</Text>
                        </View>
                        <Ionicons
                          name={isOpen ? "chevron-up" : "chevron-down"}
                          size={16}
                          color="#555580"
                          style={{ marginTop: 4 }}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Quick info */}
                    <View style={s.quickInfoRow}>
                      <View style={s.quickInfo}>
                        <Ionicons
                          name="business-outline"
                          size={11}
                          color="#555580"
                        />
                        <Text style={s.quickInfoText} numberOfLines={1}>
                          {doc.hospital}
                        </Text>
                      </View>
                      <View style={s.quickInfo}>
                        <Ionicons
                          name="people-outline"
                          size={11}
                          color="#555580"
                        />
                        <Text style={s.quickInfoText}>{doc.patients}</Text>
                      </View>
                      <View style={s.quickInfo}>
                        <Ionicons
                          name="ribbon-outline"
                          size={11}
                          color="#555580"
                        />
                        <Text style={s.quickInfoText}>{doc.experience}</Text>
                      </View>
                    </View>

                    {/* Availability */}
                    <View style={s.availRow}>
                      <Ionicons
                        name="calendar-outline"
                        size={12}
                        color="#10B981"
                      />
                      <Text style={s.availText}>{doc.available}</Text>
                    </View>

                    {/* Expanded */}
                    {isOpen && (
                      <View style={s.expanded}>
                        <View style={s.divider} />

                        <Text style={s.expandLabel}>Specializes in</Text>
                        <View style={s.tagsWrap}>
                          {doc.specialties.map((sp, i) => (
                            <View
                              key={i}
                              style={[
                                s.tag,
                                {
                                  backgroundColor: doc.bg,
                                  borderColor: doc.color + "40",
                                },
                              ]}
                            >
                              <Text style={[s.tagText, { color: doc.color }]}>
                                {sp}
                              </Text>
                            </View>
                          ))}
                        </View>

                        <Text style={s.expandLabel}>Contact</Text>
                        <View style={s.contactDetails}>
                          <View style={s.contactRow}>
                            <Ionicons
                              name="call-outline"
                              size={13}
                              color="#555580"
                            />
                            <Text style={s.contactText}>{doc.phone}</Text>
                          </View>
                          <View style={s.contactRow}>
                            <Ionicons
                              name="mail-outline"
                              size={13}
                              color="#555580"
                            />
                            <Text style={s.contactText}>{doc.email}</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* Action buttons */}
                    <View style={s.actionRow}>
                      <TouchableOpacity
                        style={s.actionBtn}
                        onPress={() => call(doc.phone)}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={["#1C3A5A", "#1A3060"]}
                          style={s.actionBtnGrad}
                        >
                          <Ionicons name="call" size={15} color="#3B82F6" />
                          <Text style={[s.actionBtnText, { color: "#3B82F6" }]}>
                            Call
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={s.actionBtn}
                        onPress={() => whatsapp(doc.whatsapp)}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={["#0C2A1A", "#0A2218"]}
                          style={s.actionBtnGrad}
                        >
                          <Ionicons
                            name="logo-whatsapp"
                            size={15}
                            color="#25D366"
                          />
                          <Text style={[s.actionBtnText, { color: "#25D366" }]}>
                            WhatsApp
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={s.actionBtn}
                        onPress={() => email(doc.email)}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={["#2A1A0C", "#221408"]}
                          style={s.actionBtnGrad}
                        >
                          <Ionicons name="mail" size={15} color="#F59E0B" />
                          <Text style={[s.actionBtnText, { color: "#F59E0B" }]}>
                            Email
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            );
          })}

          {/* Bottom note */}
          <View style={s.noteCard}>
            <LinearGradient colors={["#0C0C22", "#0E0E28"]} style={s.noteGrad}>
              <Text style={s.noteTitle}>📋 Note</Text>
              <Text style={s.noteText}>
                All doctors are affiliated with RapidCare Smart Lab. Book a test
                first, then share your results with your preferred doctor for a
                consultation.
              </Text>
              <TouchableOpacity
                style={s.noteBtn}
                onPress={() => router.push("/(tabs)/booking")}
                activeOpacity={0.87}
              >
                <LinearGradient
                  colors={["#3B82F6", "#6366F1"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.noteBtnGrad}
                >
                  <Ionicons name="flask" size={15} color="#fff" />
                  <Text style={s.noteBtnText}>Book a Lab Test</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const BORDER = "#1C1C3A";
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050510" },
  bgAbs: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  blobTL: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.08)",
    top: -60,
    left: -60,
  },
  blobBR: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(168,85,247,0.07)",
    bottom: 80,
    right: -50,
  },

  header: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 12, color: "#555580", marginTop: 3 },
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

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#0C0C22",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: "#fff" },

  filterScroll: { marginBottom: 4 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 0.5,
    borderColor: BORDER,
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: "rgba(59,130,246,0.15)",
    borderColor: "rgba(59,130,246,0.4)",
  },
  filterText: { fontSize: 12, color: "#555580", fontWeight: "600" },
  filterTextActive: { color: "#3B82F6" },

  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },

  docCard: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: BORDER,
    marginBottom: 14,
  },
  docGrad: {},
  docTopBar: { height: 4 },
  docBody: { padding: 14 },

  docMainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    flexShrink: 0,
  },
  avatarIcon: { fontSize: 28 },
  docName: { fontSize: 15, fontWeight: "800", color: "#fff", marginBottom: 3 },
  docSpecialty: { fontSize: 12, fontWeight: "700", marginBottom: 2 },
  docQual: { fontSize: 11, color: "#555580" },
  docRight: { alignItems: "flex-end" },
  ratingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(245,158,11,0.12)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: { fontSize: 11, color: "#F59E0B", fontWeight: "700" },

  quickInfoRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  quickInfo: { flexDirection: "row", alignItems: "center", gap: 4 },
  quickInfoText: { fontSize: 11, color: "#555580" },

  availRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 12,
  },
  availText: { fontSize: 11, color: "#10B981", fontWeight: "600" },

  expanded: {},
  divider: { height: 0.5, backgroundColor: BORDER, marginBottom: 12 },
  expandLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#555580",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  tagText: { fontSize: 11, fontWeight: "600" },
  contactDetails: { gap: 8, marginBottom: 14 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactText: { fontSize: 12, color: "rgba(255,255,255,0.6)" },

  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, borderRadius: 12, overflow: "hidden" },
  actionBtnGrad: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    height: 40,
  },
  actionBtnText: { fontSize: 12, fontWeight: "700" },

  noteCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: BORDER,
    marginTop: 4,
  },
  noteGrad: { padding: 16 },
  noteTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  noteText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 18,
    marginBottom: 14,
  },
  noteBtn: { borderRadius: 14, overflow: "hidden" },
  noteBtnGrad: {
    flexDirection: "row",
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  noteBtnText: { fontSize: 14, fontWeight: "800", color: "#fff" },

  emptyWrap: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  emptySubText: { fontSize: 13, color: "#555580" },
});

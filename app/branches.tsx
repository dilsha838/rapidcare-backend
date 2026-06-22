import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated,
  Easing,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useEffect, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

const BRANCHES = [
  {
    id: "1",
    name: "Colombo 03",
    address: "No. 45, Galle Road, Colombo 03",
    phone: "+94 11 234 5678",
    hours: "6:00 AM – 8:00 PM",
    days: "Mon – Sun",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.12)",
    mapUrl: "https://maps.google.com/?q=Colombo+03+Sri+Lanka",
    badge: "Main Branch",
    services: [
      "CBC",
      "Lipid Profile",
      "Thyroid",
      "Vitamin D",
      "HbA1c",
      "Liver Function",
      "Kidney Function",
      "ESR",
      "Urine Full",
    ],
    parking: true,
    ac: true,
    wifi: true,
    waitTime: "~15 mins",
  },
  {
    id: "2",
    name: "Nugegoda",
    address: "No. 12, High Level Road, Nugegoda",
    phone: "+94 11 876 5432",
    hours: "7:00 AM – 7:00 PM",
    days: "Mon – Sun",
    color: "#A855F7",
    bg: "rgba(168,85,247,0.12)",
    mapUrl: "https://maps.google.com/?q=Nugegoda+Sri+Lanka",
    badge: "South Branch",
    services: [
      "CBC",
      "Blood Sugar",
      "Lipid Profile",
      "Thyroid",
      "Liver Function",
      "Kidney Function",
      "Urine Full",
    ],
    parking: true,
    ac: true,
    wifi: false,
    waitTime: "~10 mins",
  },
  {
    id: "3",
    name: "Kandy",
    address: "No. 78, Peradeniya Road, Kandy",
    phone: "+94 81 222 3344",
    hours: "7:00 AM – 6:00 PM",
    days: "Mon – Sat",
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    mapUrl: "https://maps.google.com/?q=Kandy+Sri+Lanka",
    badge: "Central Branch",
    services: [
      "CBC",
      "Blood Sugar",
      "Lipid Profile",
      "Thyroid",
      "Urine Full",
      "ESR",
    ],
    parking: false,
    ac: true,
    wifi: true,
    waitTime: "~20 mins",
  },
  {
    id: "4",
    name: "Kuliyapitiya",
    address: "No. 23, Colombo Road, Kuliyapitiya",
    phone: "+94 37 228 1234",
    hours: "7:00 AM – 5:00 PM",
    days: "Mon – Sat",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    mapUrl: "https://maps.google.com/?q=Kuliyapitiya+Sri+Lanka",
    badge: "North Branch",
    services: ["CBC", "Blood Sugar", "Lipid Profile", "Urine Full", "ESR"],
    parking: true,
    ac: true,
    wifi: false,
    waitTime: "~10 mins",
  },
  {
    id: "5",
    name: "Nikaweratiya",
    address: "No. 15, Kurunegala Road, Nikaweratiya",
    phone: "+94 37 226 5678",
    hours: "7:30 AM – 4:30 PM",
    days: "Mon – Fri",
    color: "#EC4899",
    bg: "rgba(236,72,153,0.12)",
    mapUrl: "https://maps.google.com/?q=Nikaweratiya+Sri+Lanka",
    badge: "West Branch",
    services: ["CBC", "Blood Sugar", "Urine Full", "ESR"],
    parking: false,
    ac: false,
    wifi: false,
    waitTime: "~5 mins",
  },
];

export default function BranchesScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
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

  const openMap = (url: string) =>
    Linking.openURL(url).catch(() => Alert.alert("Error", "Cannot open maps."));
  const callBranch = (phone: string) =>
    Linking.openURL(`tel:${phone}`).catch(() =>
      Alert.alert("Error", "Cannot make call."),
    );

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050510" />

      <View style={s.bgAbs} pointerEvents="none">
        <Animated.View style={[s.blobTL, { opacity: glowOpacity }]} />
        <Animated.View style={[s.blobBR, { opacity: glowOpacity }]} />
      </View>

      {/* HEADER */}
      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <LinearGradient colors={["#0D0D28", "#131340"]} style={s.header}>
          <View style={s.headerRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>Find a Branch</Text>
              <Text style={s.headerSub}>
                {BRANCHES.length} branches islandwide
              </Text>
            </View>
          </View>
          <View style={s.statsRow}>
            {[
              {
                icon: "location" as const,
                label: `${BRANCHES.length} Branches`,
                color: "#3B82F6",
              },
              { icon: "time" as const, label: "Open Daily", color: "#A855F7" },
              { icon: "flask" as const, label: "50+ Tests", color: "#10B981" },
              { icon: "car" as const, label: "Easy Parking", color: "#F59E0B" },
            ].map((item, i) => (
              <View key={i} style={s.statChip}>
                <Ionicons name={item.icon} size={12} color={item.color} />
                <Text style={[s.statChipText, { color: item.color }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {BRANCHES.map((branch) => {
            const isOpen = selected === branch.id;
            return (
              <View key={branch.id} style={s.branchCard}>
                <LinearGradient
                  colors={["#0C0C22", "#0E0E28"]}
                  style={s.branchGrad}
                >
                  {/* Top color bar */}
                  <LinearGradient
                    colors={[branch.color, branch.color + "88"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.branchTopBar}
                  />

                  <View style={s.branchBody}>
                    {/* Header — tap to expand */}
                    <TouchableOpacity
                      style={s.branchHeader}
                      onPress={() => setSelected(isOpen ? null : branch.id)}
                      activeOpacity={0.85}
                    >
                      <View
                        style={[
                          s.branchIconWrap,
                          { backgroundColor: branch.bg },
                        ]}
                      >
                        <Ionicons
                          name="business"
                          size={22}
                          color={branch.color}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={s.nameBadgeRow}>
                          <Text style={s.branchName}>
                            RapidCare {branch.name}
                          </Text>
                          <View
                            style={[
                              s.badge,
                              { backgroundColor: `${branch.color}20` },
                            ]}
                          >
                            <Text
                              style={[s.badgeText, { color: branch.color }]}
                            >
                              {branch.badge}
                            </Text>
                          </View>
                        </View>
                        <View style={s.hoursRow}>
                          <Ionicons
                            name="time-outline"
                            size={12}
                            color="#555580"
                          />
                          <Text style={s.hoursText}>
                            {branch.hours} · {branch.days}
                          </Text>
                        </View>
                      </View>
                      <Ionicons
                        name={isOpen ? "chevron-up" : "chevron-down"}
                        size={18}
                        color="#555580"
                      />
                    </TouchableOpacity>

                    {/* Address */}
                    <View style={s.addressRow}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color={branch.color}
                      />
                      <Text style={s.addressText}>{branch.address}</Text>
                    </View>

                    {/* Amenities */}
                    <View style={s.amenitiesRow}>
                      {branch.parking && (
                        <View style={s.amenity}>
                          <Ionicons
                            name="car-outline"
                            size={12}
                            color="#555580"
                          />
                          <Text style={s.amenityText}>Parking</Text>
                        </View>
                      )}
                      {branch.ac && (
                        <View style={s.amenity}>
                          <Ionicons
                            name="snow-outline"
                            size={12}
                            color="#555580"
                          />
                          <Text style={s.amenityText}>AC</Text>
                        </View>
                      )}
                      {branch.wifi && (
                        <View style={s.amenity}>
                          <Ionicons
                            name="wifi-outline"
                            size={12}
                            color="#555580"
                          />
                          <Text style={s.amenityText}>WiFi</Text>
                        </View>
                      )}
                      <View style={s.amenity}>
                        <Ionicons
                          name="people-outline"
                          size={12}
                          color="#10B981"
                        />
                        <Text style={[s.amenityText, { color: "#10B981" }]}>
                          {branch.waitTime}
                        </Text>
                      </View>
                    </View>

                    {/* Expanded section */}
                    {isOpen && (
                      <View>
                        <View style={s.divider} />
                        <Text style={s.expandTitle}>Available Tests</Text>
                        <View style={s.testsWrap}>
                          {branch.services.map((svc, i) => (
                            <View
                              key={i}
                              style={[
                                s.testPill,
                                {
                                  borderColor: `${branch.color}40`,
                                  backgroundColor: `${branch.color}10`,
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  s.testPillText,
                                  { color: branch.color },
                                ]}
                              >
                                {svc}
                              </Text>
                            </View>
                          ))}
                        </View>
                        <Text style={s.expandTitle}>Contact</Text>
                        <TouchableOpacity
                          style={s.contactRow}
                          onPress={() => callBranch(branch.phone)}
                        >
                          <Ionicons
                            name="call-outline"
                            size={14}
                            color={branch.color}
                          />
                          <Text
                            style={[s.contactText, { color: branch.color }]}
                          >
                            {branch.phone}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Action buttons */}
                    <View style={s.actionRow}>
                      <TouchableOpacity
                        style={s.mapBtn}
                        onPress={() => openMap(branch.mapUrl)}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name="map-outline"
                          size={15}
                          color={branch.color}
                        />
                        <Text style={[s.mapBtnText, { color: branch.color }]}>
                          Directions
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={s.callBtn}
                        onPress={() => callBranch(branch.phone)}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name="call-outline"
                          size={15}
                          color="#555580"
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={s.bookBtn}
                        onPress={() => router.push("/(tabs)/booking")}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={[branch.color, branch.color + "CC"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={s.bookBtnGrad}
                        >
                          <Text style={s.bookBtnText}>Book Now</Text>
                          <Ionicons
                            name="arrow-forward"
                            size={13}
                            color="#fff"
                          />
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            );
          })}

          {/* INFO CARD */}
          <View style={s.infoCard}>
            <LinearGradient colors={["#0C0C22", "#0E0E28"]} style={s.infoGrad}>
              <Text style={s.infoTitle}>📞 General Inquiries</Text>
              <Text style={s.infoSub}>RapidCare Hotline</Text>
              <TouchableOpacity
                onPress={() => Linking.openURL("tel:+94112345678")}
                style={s.hotlineBtn}
              >
                <LinearGradient
                  colors={["#3B82F6", "#6366F1"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.hotlineBtnGrad}
                >
                  <Ionicons name="call" size={16} color="#fff" />
                  <Text style={s.hotlineBtnText}>+94 11 234 5678</Text>
                </LinearGradient>
              </TouchableOpacity>
              <View style={s.infoRowsWrap}>
                {[
                  { icon: "mail-outline" as const, text: "info@rapidcare.lk" },
                  { icon: "globe-outline" as const, text: "www.rapidcare.lk" },
                  { icon: "logo-whatsapp" as const, text: "+94 77 234 5678" },
                ].map((item, i) => (
                  <View key={i} style={s.infoRow}>
                    <Ionicons name={item.icon} size={14} color="#3B82F6" />
                    <Text style={s.infoRowText}>{item.text}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </View>
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
    paddingBottom: 16,
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
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11, color: "#555580", marginTop: 2 },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  statChipText: { fontSize: 11, fontWeight: "600" },

  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },

  branchCard: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: BORDER,
    marginBottom: 14,
  },
  branchGrad: {},
  branchTopBar: { height: 4 },
  branchBody: { padding: 14 },
  branchHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  branchIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  nameBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  branchName: { fontSize: 15, fontWeight: "800", color: "#fff" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: "700" },
  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  hoursText: { fontSize: 11, color: "#555580" },

  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 10,
  },
  addressText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.55)",
    flex: 1,
    lineHeight: 17,
  },

  amenitiesRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  amenity: { flexDirection: "row", alignItems: "center", gap: 4 },
  amenityText: { fontSize: 11, color: "#555580" },

  divider: { height: 0.5, backgroundColor: BORDER, marginVertical: 12 },
  expandTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555580",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  testsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  testPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  testPillText: { fontSize: 11, fontWeight: "600" },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  contactText: { fontSize: 13, fontWeight: "600" },

  actionRow: { flexDirection: "row", gap: 8 },
  mapBtn: {
    flex: 2,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  mapBtnText: { fontSize: 12, fontWeight: "700" },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  bookBtn: { flex: 2, borderRadius: 12, overflow: "hidden" },
  bookBtnGrad: {
    flexDirection: "row",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  bookBtnText: { fontSize: 13, fontWeight: "800", color: "#fff" },

  infoCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: BORDER,
    marginTop: 4,
  },
  infoGrad: { padding: 16 },
  infoTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  infoSub: { fontSize: 11, color: "#555580", marginBottom: 12 },
  hotlineBtn: { borderRadius: 14, overflow: "hidden", marginBottom: 14 },
  hotlineBtnGrad: {
    flexDirection: "row",
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  hotlineBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
  infoRowsWrap: { gap: 10 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoRowText: { fontSize: 13, color: "rgba(255,255,255,0.6)" },
});

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
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useEffect, useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

interface Report {
  id: string;
  bookingId: string;
  date: string;
  tests: string[];
  branch: string;
  status: "ready" | "processing" | "pending";
  totalAmount: number;
  tokenNumber: number;
}

const STATUS = {
  ready: {
    label: "Ready",
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    icon: "checkmark-circle" as const,
  },
  processing: {
    label: "Processing",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    icon: "time" as const,
  },
  pending: {
    label: "Pending",
    color: "#6366F1",
    bg: "rgba(99,102,241,0.12)",
    icon: "hourglass" as const,
  },
};

function getReportStatus(dateStr: string): "ready" | "processing" | "pending" {
  try {
    const [y, mo, d] = dateStr.split("-").map(Number);
    const bookingDate = new Date(y, mo - 1, d);
    const diffHours =
      (new Date().getTime() - bookingDate.getTime()) / (1000 * 60 * 60);
    if (diffHours >= 24) return "ready";
    if (diffHours >= 2) return "processing";
    return "pending";
  } catch {
    return "processing";
  }
}

export default function ReportsScreen() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "ready" | "processing">("all");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadReports();
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

  // ✅ Load reports — current user only
  const loadReports = async () => {
    setLoading(true);
    try {
      // ✅ Get current user email
      const raw = await AsyncStorage.getItem("user");
      const user = raw ? JSON.parse(raw) : {};
      const currentEmail = (user.email || "").toLowerCase();

      const allReports: Report[] = [];

      // ── 1. lastToken ─────────────────────────────────────────────────────
      const lastTokenStr = await AsyncStorage.getItem("lastToken");
      if (lastTokenStr) {
        const t = JSON.parse(lastTokenStr);
        const tokenEmail = (t.userEmail || "").toLowerCase();

        // ✅ different user OR cancelled → skip
        if (
          (!tokenEmail || tokenEmail === currentEmail) &&
          t.status !== "cancelled"
        ) {
          if (!tokenEmail && currentEmail) {
            t.userEmail = currentEmail;
            await AsyncStorage.setItem("lastToken", JSON.stringify(t));
          }
          allReports.push({
            id: `RPT-${t.orderId || "001"}`,
            bookingId: t.orderId || "BK001",
            date: t.date || new Date().toISOString().split("T")[0],
            tests: t.tests?.map((x: any) => x.name || x) || [],
            branch: t.branch || "RapidCare Lab",
            status: getReportStatus(t.date || new Date().toISOString()),
            totalAmount: t.totalAmount || 0,
            tokenNumber: t.tokenNumber || 1,
          });
        }
      }
      // ── 2. bookingData ───────────────────────────────────────────────────
      const bdStr = await AsyncStorage.getItem("bookingData");
      if (bdStr) {
        const b = JSON.parse(bdStr);
        const bdEmail = (b.userEmail || "").toLowerCase();

        if (!bdEmail || bdEmail === currentEmail) {
          const alreadyAdded = allReports.some(
            (r) => r.bookingId === (b.orderId || b.bookingId),
          );
          if (!alreadyAdded) {
            allReports.push({
              id: `RPT-${b.orderId || b.bookingId || "002"}`,
              bookingId: b.orderId || b.bookingId || "BK002",
              date: b.date || new Date().toISOString().split("T")[0],
              tests:
                b.tests?.map((x: any) => x.name || x) ||
                b.selectedTests?.map((x: any) => x.name || x) ||
                [],
              branch: b.branch || "RapidCare Lab",
              status: getReportStatus(b.date || new Date().toISOString()),
              totalAmount: b.totalAmount || 0,
              tokenNumber: b.tokenNumber || 1,
            });
          }
        }
      }

      // ── 3. upcomingAppointment ───────────────────────────────────────────
      const upcomingStr = await AsyncStorage.getItem("upcomingAppointment");
      if (upcomingStr) {
        const u = JSON.parse(upcomingStr);
        const uEmail = (u.userEmail || "").toLowerCase();

        if ((!uEmail || uEmail === currentEmail) && u.bookingId) {
          const alreadyAdded = allReports.some(
            (r) => r.bookingId === u.bookingId,
          );
          if (!alreadyAdded) {
            allReports.push({
              id: `RPT-${u.bookingId}`,
              bookingId: u.bookingId,
              date: u.date || new Date().toISOString().split("T")[0],
              tests: u.tests?.map((x: any) => x.name || x) || [],
              branch: u.branch || "RapidCare Lab",
              status: getReportStatus(u.date || new Date().toISOString()),
              totalAmount: u.totalAmount || 0,
              tokenNumber: u.tokenNumber || 1,
            });
          }
        }
      }

      setReports(allReports);
    } catch {
      setReports([]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReports();
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      const [y, mo, d] = dateStr.split("-").map(Number);
      return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleDownload = (report: Report) => {
    if (report.status !== "ready") {
      Alert.alert(
        "Report Not Ready",
        "Your report is still being processed.\n\nReports are ready within 24 hours after your test.",
        [{ text: "OK" }],
      );
      return;
    }
    Alert.alert(
      "Download Report",
      `Download ${report.tests.join(", ")} report?\n\nReport: ${report.id}\nDate: ${formatDate(report.date)}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Download PDF",
          onPress: () =>
            Alert.alert(
              "✅ Downloaded!",
              `${report.id}.pdf saved!\n\nIn production: PDF downloads from server.`,
              [{ text: "OK" }],
            ),
        },
      ],
    );
  };

  const handleView = (report: Report) => {
    Alert.alert(
      `📋 Report Details`,
      `ID: ${report.id}\nDate: ${formatDate(report.date)}\nTests: ${report.tests.join(", ")}\nBranch: ${report.branch}\nToken: #${String(report.tokenNumber).padStart(2, "0")}\nAmount: Rs. ${report.totalAmount.toLocaleString()}\nStatus: ${report.status.toUpperCase()}`,
      [
        { text: "Close" },
        ...(report.status === "ready"
          ? [{ text: "Download", onPress: () => handleDownload(report) }]
          : []),
      ],
    );
  };

  const filtered =
    filter === "all" ? reports : reports.filter((r) => r.status === filter);
  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  // ── No reports ────────────────────────────────────────────────────────────
  if (!loading && reports.length === 0)
    return (
      <View style={s.root}>
        <StatusBar barStyle="light-content" backgroundColor="#050510" />
        <LinearGradient colors={["#0D0D28", "#131340"]} style={s.header}>
          <View style={s.headerRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={s.headerTitle}>My Reports</Text>
            <View style={{ width: 36 }} />
          </View>
        </LinearGradient>
        <View style={s.emptyWrap}>
          <Text style={{ fontSize: 52, marginBottom: 16 }}>📋</Text>
          <Text style={s.emptyTitle}>No Reports Yet</Text>
          <Text style={s.emptySub}>
            Book a lab test — reports appear here after 24 hours
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

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050510" />
      <View style={s.bgAbs} pointerEvents="none">
        <Animated.View style={[s.blobTL, { opacity: glowOpacity }]} />
        <Animated.View style={[s.blobBR, { opacity: glowOpacity }]} />
      </View>

      {/* Header */}
      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <LinearGradient colors={["#0D0D28", "#131340"]} style={s.header}>
          <View style={s.headerRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerTitle}>My Reports</Text>
              <Text style={s.headerSub}>
                {reports.filter((r) => r.status === "ready").length} ready to
                download
              </Text>
            </View>
            <TouchableOpacity
              style={s.refreshBtn}
              onPress={() => loadReports()}
            >
              <Ionicons name="refresh-outline" size={18} color="#10B981" />
            </TouchableOpacity>
          </View>
          <View style={s.filterRow}>
            {(["all", "ready", "processing"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[s.filterPill, filter === f && s.filterPillActive]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[s.filterText, filter === f && s.filterTextActive]}
                >
                  {f === "all"
                    ? `All (${reports.length})`
                    : f === "ready"
                      ? `Ready (${reports.filter((r) => r.status === "ready").length})`
                      : `Processing (${reports.filter((r) => r.status !== "ready").length})`}
                </Text>
              </TouchableOpacity>
            ))}
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
            tintColor="#10B981"
          />
        }
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* Summary */}
          <View style={s.summaryRow}>
            {[
              {
                num: reports.filter((r) => r.status === "ready").length,
                label: "Ready",
                color: "#10B981",
                bg: "#0C1F0C",
              },
              {
                num: reports.filter((r) => r.status !== "ready").length,
                label: "Processing",
                color: "#F59E0B",
                bg: "#1A1208",
              },
              {
                num: reports.length,
                label: "Total",
                color: "#6366F1",
                bg: "#0C0C22",
              },
            ].map((item, i) => (
              <View key={i} style={s.summaryCard}>
                <LinearGradient
                  colors={[item.bg, item.bg]}
                  style={s.summaryGrad}
                >
                  <Text style={[s.summaryNum, { color: item.color }]}>
                    {item.num}
                  </Text>
                  <Text style={s.summaryLbl}>{item.label}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>

          {/* Reports */}
          {filtered.map((report) => {
            const st = STATUS[report.status];
            return (
              <View key={report.id} style={s.reportCard}>
                <LinearGradient
                  colors={["#0C0C22", "#0E0E28"]}
                  style={s.reportGrad}
                >
                  <LinearGradient
                    colors={
                      report.status === "ready"
                        ? ["#10B981", "#059669"]
                        : ["#F59E0B", "#D97706"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={s.reportTopBar}
                  />
                  <View style={s.reportBody}>
                    <View style={s.reportHeaderRow}>
                      <View style={s.reportIconWrap}>
                        <Ionicons
                          name="document-text"
                          size={20}
                          color="#10B981"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.reportId}>{report.id}</Text>
                        <Text style={s.reportDate}>
                          {formatDate(report.date)}
                        </Text>
                      </View>
                      <View style={[s.statusBadge, { backgroundColor: st.bg }]}>
                        <Ionicons name={st.icon} size={12} color={st.color} />
                        <Text style={[s.statusText, { color: st.color }]}>
                          {st.label}
                        </Text>
                      </View>
                    </View>
                    <View style={s.testsWrap}>
                      {report.tests.length > 0 ? (
                        report.tests.map((test, i) => (
                          <View key={i} style={s.testPill}>
                            <Text style={s.testPillText}>{test}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={{ fontSize: 12, color: "#555580" }}>
                          Lab Tests
                        </Text>
                      )}
                    </View>
                    <View style={s.detailsRow}>
                      <View style={s.detailItem}>
                        <Ionicons
                          name="location-outline"
                          size={12}
                          color="#555580"
                        />
                        <Text style={s.detailText} numberOfLines={1}>
                          {report.branch.includes("—")
                            ? report.branch.split("—")[1]?.trim()
                            : report.branch}
                        </Text>
                      </View>
                      {report.totalAmount > 0 && (
                        <View style={s.detailItem}>
                          <Ionicons
                            name="cash-outline"
                            size={12}
                            color="#555580"
                          />
                          <Text style={s.detailText}>
                            Rs. {report.totalAmount.toLocaleString()}
                          </Text>
                        </View>
                      )}
                      <View style={s.detailItem}>
                        <Ionicons
                          name="qr-code-outline"
                          size={12}
                          color="#555580"
                        />
                        <Text style={s.detailText}>
                          Token #{String(report.tokenNumber).padStart(2, "0")}
                        </Text>
                      </View>
                    </View>
                    <View style={s.actionRow}>
                      <TouchableOpacity
                        style={s.viewBtn}
                        onPress={() => handleView(report)}
                        activeOpacity={0.85}
                      >
                        <Ionicons
                          name="eye-outline"
                          size={15}
                          color="#3B82F6"
                        />
                        <Text style={s.viewBtnText}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          s.downloadBtn,
                          report.status !== "ready" && { opacity: 0.5 },
                        ]}
                        onPress={() => handleDownload(report)}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={
                            report.status === "ready"
                              ? ["#10B981", "#059669"]
                              : ["#1A1A2E", "#1A1A2E"]
                          }
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={s.downloadGrad}
                        >
                          <Ionicons
                            name={
                              report.status === "ready"
                                ? "download-outline"
                                : "time-outline"
                            }
                            size={15}
                            color={
                              report.status === "ready" ? "#fff" : "#333358"
                            }
                          />
                          <Text
                            style={[
                              s.downloadText,
                              report.status !== "ready" && { color: "#333358" },
                            ]}
                          >
                            {report.status === "ready"
                              ? "Download PDF"
                              : "Processing..."}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            );
          })}

          {filtered.length === 0 && (
            <View style={{ alignItems: "center", paddingVertical: 40, gap: 8 }}>
              <Ionicons name="search-outline" size={36} color="#1C1C3A" />
              <Text style={{ fontSize: 14, color: "#333358" }}>
                No {filter} reports
              </Text>
            </View>
          )}

          {/* Info */}
          <View style={s.infoCard}>
            <LinearGradient colors={["#0C0C22", "#0E0E28"]} style={s.infoGrad}>
              <Text style={s.infoTitle}>ℹ️ About Reports</Text>
              {[
                "Reports ready within 24 hours after test",
                "PDF includes full reference ranges",
                "Share directly with your doctor",
                "Stored securely for 2 years",
              ].map((item, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: "#10B981",
                      marginTop: 6,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.5)",
                      flex: 1,
                      lineHeight: 18,
                    }}
                  >
                    {item}
                  </Text>
                </View>
              ))}
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
    backgroundColor: "rgba(16,185,129,0.08)",
    top: -60,
    left: -60,
  },
  blobBR: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(99,102,241,0.07)",
    bottom: 80,
    right: -50,
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 14,
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
  headerSub: { fontSize: 11, color: "#10B981", marginTop: 2 },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(16,185,129,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  filterRow: { flexDirection: "row", gap: 8 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  filterPillActive: {
    backgroundColor: "rgba(16,185,129,0.15)",
    borderColor: "rgba(16,185,129,0.4)",
  },
  filterText: { fontSize: 12, color: "#555580", fontWeight: "600" },
  filterTextActive: { color: "#10B981" },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  summaryGrad: { padding: 14, alignItems: "center", gap: 4 },
  summaryNum: { fontSize: 22, fontWeight: "900" },
  summaryLbl: { fontSize: 10, color: "#555580", letterSpacing: 0.3 },
  reportCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: BORDER,
    marginBottom: 12,
  },
  reportGrad: {},
  reportTopBar: { height: 3 },
  reportBody: { padding: 14 },
  reportHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  reportIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(16,185,129,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  reportId: { fontSize: 13, fontWeight: "700", color: "#fff" },
  reportDate: { fontSize: 11, color: "#555580", marginTop: 2 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: { fontSize: 11, fontWeight: "600" },
  testsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  testPill: {
    backgroundColor: "rgba(59,130,246,0.1)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: "rgba(59,130,246,0.2)",
  },
  testPillText: { fontSize: 11, color: "#3B82F6", fontWeight: "600" },
  detailsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
    flexWrap: "wrap",
  },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailText: { fontSize: 11, color: "#555580" },
  actionRow: { flexDirection: "row", gap: 10 },
  viewBtn: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.3)",
    backgroundColor: "rgba(59,130,246,0.06)",
  },
  viewBtnText: { fontSize: 13, fontWeight: "700", color: "#3B82F6" },
  downloadBtn: { flex: 2, borderRadius: 12, overflow: "hidden" },
  downloadGrad: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    height: 42,
  },
  downloadText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  infoCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: BORDER,
    marginTop: 8,
  },
  infoGrad: { padding: 16 },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
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

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
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useEffect, useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const API_BASE = "https://rapidcare-backend-production.up.railway.app";

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ─── QUICK QUESTIONS ─────────────────────────────────────────────────────────
const QUICK_QUESTIONS = [
  {
    icon: "🩸",
    label: "Fasting rules",
    text: "What are the fasting rules before a blood test?",
  },
  {
    icon: "🧪",
    label: "CBC test info",
    text: "What does a CBC (Complete Blood Count) test measure?",
  },
  {
    icon: "💧",
    label: "Lipid profile prep",
    text: "How should I prepare for a lipid profile test?",
  },
  {
    icon: "📊",
    label: "Normal blood sugar",
    text: "What are the normal blood sugar levels?",
  },
  {
    icon: "📋",
    label: "Read test results",
    text: "How do I understand my lab test results?",
  },
  {
    icon: "☀️",
    label: "Vitamin D",
    text: "What are symptoms of Vitamin D deficiency?",
  },
  {
    icon: "🦋",
    label: "Thyroid test",
    text: "What is a TSH thyroid test and when do I need it?",
  },
  {
    icon: "🏥",
    label: "RapidCare branches",
    text: "What are RapidCare branch locations and opening hours?",
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function AIChatScreen() {
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showQuick, setShowQuick] = useState(true);

  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const dotAnim1 = useRef(new Animated.Value(0.3)).current;
  const dotAnim2 = useRef(new Animated.Value(0.3)).current;
  const dotAnim3 = useRef(new Animated.Value(0.3)).current;

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

    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "👋 Hello! I'm RapidCare AI — your personal health assistant.\n\nI can help you understand lab tests, fasting requirements, test preparation, and more.\n\nHow can I help you today?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  // Typing dots
  useEffect(() => {
    if (loading) {
      const anim = (dot: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(dot, {
              toValue: 1,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0.3,
              duration: 350,
              useNativeDriver: true,
            }),
          ]),
        ).start();
      anim(dotAnim1, 0);
      anim(dotAnim2, 180);
      anim(dotAnim3, 360);
    } else {
      [dotAnim1, dotAnim2, dotAnim3].forEach((d) => {
        d.stopAnimation();
        d.setValue(0.3);
      });
    }
  }, [loading]);

  const scrollToEnd = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || loading) return;

      setInput("");
      setShowQuick(false);
      setLoading(true);

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: msg,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      scrollToEnd();

      try {
        // Build history (exclude welcome message)
        const history = [
          ...messages.filter((m) => m.id !== "welcome"),
          userMsg,
        ].map((m) => ({ role: m.role, content: m.content }));

        // Call our backend proxy — API key is safe on server
        const res = await fetch(`${API_BASE}/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });

        const data = await res.json();
        const reply = res.ok
          ? data.reply
          : "I'm having trouble connecting right now. Please try again. 🔄";

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: reply,
            timestamp: new Date(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content:
              "⚠️ Cannot connect to server. Make sure your backend is running and try again.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
        scrollToEnd();
      }
    },
    [input, loading, messages],
  );

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050510" />

      {/* Background */}
      <View style={s.bgAbs} pointerEvents="none">
        <View style={s.blobTL} />
        <View style={s.blobBR} />
      </View>

      {/* ── HEADER ───────────────────────────────────────────────────────── */}
      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <LinearGradient colors={["#0D0D28", "#131340"]} style={s.header}>
          <View style={s.headerRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>

            <View style={s.headerCenter}>
              <View style={s.avatarWrap}>
                <LinearGradient
                  colors={["#EC4899", "#A855F7"]}
                  style={s.avatar}
                >
                  <Ionicons name="sparkles" size={18} color="#fff" />
                </LinearGradient>
                <View style={s.onlineDot} />
              </View>
              <View>
                <Text style={s.headerTitle}>RapidCare AI</Text>
                <Text style={s.headerSub}>Health Assistant · Online</Text>
              </View>
            </View>

            <TouchableOpacity
              style={s.clearBtn}
              onPress={() => {
                setMessages([
                  {
                    id: "welcome-reset",
                    role: "assistant",
                    content:
                      "Chat cleared! Ask me anything about lab tests. 😊",
                    timestamp: new Date(),
                  },
                ]);
                setShowQuick(true);
              }}
            >
              <Ionicons name="refresh-outline" size={18} color="#555580" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ── CHAT ─────────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollRef}
          style={s.list}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Messages */}
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <View
                key={msg.id}
                style={[s.msgRow, isUser ? s.msgRowUser : s.msgRowAI]}
              >
                {/* AI avatar */}
                {!isUser && (
                  <View style={s.aiAvatar}>
                    <LinearGradient
                      colors={["#EC4899", "#A855F7"]}
                      style={s.aiAvatarGrad}
                    >
                      <Ionicons name="sparkles" size={13} color="#fff" />
                    </LinearGradient>
                  </View>
                )}

                {/* Bubble */}
                {isUser ? (
                  <LinearGradient
                    colors={["#3B82F6", "#6366F1"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[s.bubble, s.bubbleUser]}
                  >
                    <Text style={s.textUser}>{msg.content}</Text>
                    <Text style={s.timeUser}>{formatTime(msg.timestamp)}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[s.bubble, s.bubbleAI]}>
                    <Text style={s.aiName}>RapidCare AI ✨</Text>
                    <Text style={s.textAI}>{msg.content}</Text>
                    <Text style={s.timeAI}>{formatTime(msg.timestamp)}</Text>
                  </View>
                )}

                {/* User avatar */}
                {isUser && (
                  <View style={s.userAvatar}>
                    <Ionicons name="person" size={13} color="#3B82F6" />
                  </View>
                )}
              </View>
            );
          })}

          {/* Typing indicator */}
          {loading && (
            <View style={[s.msgRow, s.msgRowAI]}>
              <View style={s.aiAvatar}>
                <LinearGradient
                  colors={["#EC4899", "#A855F7"]}
                  style={s.aiAvatarGrad}
                >
                  <Ionicons name="sparkles" size={13} color="#fff" />
                </LinearGradient>
              </View>
              <View style={[s.bubble, s.bubbleAI, s.typingBubble]}>
                <View style={s.dots}>
                  {[dotAnim1, dotAnim2, dotAnim3].map((a, i) => (
                    <Animated.View
                      key={i}
                      style={[s.dot, { opacity: a, transform: [{ scale: a }] }]}
                    />
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Quick questions */}
          {showQuick && (
            <View style={s.quickSection}>
              <Text style={s.quickTitle}>💡 Try asking...</Text>
              <View style={s.quickGrid}>
                {QUICK_QUESTIONS.map((q, i) => (
                  <TouchableOpacity
                    key={i}
                    style={s.quickBtn}
                    onPress={() => sendMessage(q.text)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.quickBtnIcon}>{q.icon}</Text>
                    <Text style={s.quickBtnText}>{q.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* ── INPUT ──────────────────────────────────────────────────────── */}
        <View style={s.inputBar}>
          <View style={s.inputRow}>
            <TextInput
              style={s.input}
              placeholder="Ask about tests, fasting, health..."
              placeholderTextColor="#2A2A4A"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => !loading && sendMessage()}
            />
            <TouchableOpacity
              style={s.sendBtn}
              onPress={() => sendMessage()}
              disabled={!input.trim() || loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={
                  input.trim() && !loading
                    ? ["#EC4899", "#A855F7"]
                    : ["#1A1A30", "#1A1A30"]
                }
                style={s.sendGrad}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#555580" />
                ) : (
                  <Ionicons
                    name="send"
                    size={16}
                    color={input.trim() ? "#fff" : "#2A2A4A"}
                  />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={s.disclaimer}>
            AI responses are for information only · Always consult your doctor
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const BORDER = "#1C1C3A";

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050510" },
  flex: { flex: 1 },
  bgAbs: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  blobTL: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: "rgba(236,72,153,0.08)",
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

  // Header
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
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#050510",
  },
  headerTitle: { fontSize: 15, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 11, color: "#555580", marginTop: 1 },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Chat list
  list: { flex: 1 },
  listContent: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 8 },

  // Message row
  msgRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
    gap: 7,
  },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowAI: { justifyContent: "flex-start" },

  // Avatars
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    flexShrink: 0,
  },
  aiAvatarGrad: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(59,130,246,0.12)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.25)",
  },

  // Bubbles
  bubble: { maxWidth: width * 0.73, borderRadius: 20, padding: 12 },
  bubbleUser: { borderTopRightRadius: 4 },
  bubbleAI: {
    backgroundColor: "#0E0E28",
    borderTopLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: BORDER,
  },

  // Text
  aiName: {
    fontSize: 10,
    color: "#EC4899",
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  textAI: { fontSize: 14, color: "rgba(255,255,255,0.88)", lineHeight: 21 },
  textUser: { fontSize: 14, color: "#fff", lineHeight: 21 },
  timeAI: { fontSize: 10, color: "#333358", marginTop: 5 },
  timeUser: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    marginTop: 5,
    textAlign: "right",
  },

  // Typing
  typingBubble: { paddingVertical: 14, paddingHorizontal: 16 },
  dots: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#A855F7" },

  // Quick questions
  quickSection: { marginTop: 10, marginBottom: 6 },
  quickTitle: {
    fontSize: 12,
    color: "#555580",
    textAlign: "center",
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(168,85,247,0.1)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 0.5,
    borderColor: "rgba(168,85,247,0.25)",
  },
  quickBtnIcon: { fontSize: 13 },
  quickBtnText: { fontSize: 12, color: "#A855F7", fontWeight: "600" },

  // Input
  inputBar: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 30 : 18,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    backgroundColor: "#080818",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    backgroundColor: "#0C0C24",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendBtn: { borderRadius: 14, overflow: "hidden", flexShrink: 0 },
  sendGrad: {
    width: 38,
    height: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  disclaimer: {
    fontSize: 10,
    color: "#1C1C30",
    textAlign: "center",
    marginTop: 7,
  },
});

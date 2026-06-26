import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";

const { width, height } = Dimensions.get("window");
const API_BASE = "https://rapidcare-backend-production.up.railway.app";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState<"email" | "pass" | null>(null);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [bioChecked, setBioChecked] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(-30)).current;
  const cardSlide = useRef(new Animated.Value(60)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const bioAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    startAnimations();
    checkBiometricAndAutoPrompt();
  }, []);

  // ✅ Check biometric — if available, auto-prompt
  const checkBiometricAndAutoPrompt = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const hasSaved = await AsyncStorage.getItem("savedEmail");
      const hasSavedPwd = await AsyncStorage.getItem("savedPassword");

      if (compatible && enrolled && hasSaved && hasSavedPwd) {
        setHasBiometric(true);
        setSavedEmail(hasSaved);
        setBioChecked(true);
        // ✅ Auto-prompt fingerprint after short delay
        setTimeout(() => {
          handleBiometricLoginAuto(hasSaved, hasSavedPwd);
        }, 800);
      } else {
        setBioChecked(true);
      }
    } catch {
      setBioChecked(true);
    }
  };

  // ✅ Auto fingerprint prompt (called on page load)
  const handleBiometricLoginAuto = async (
    savedMail: string,
    savedPwd: string,
  ) => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Sign in to RapidCare",
        fallbackLabel: "Use Password",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });
      if (result.success) {
        setLoading(true);
        await performLogin(savedMail, savedPwd);
      }
      // If cancelled or failed — just show login form normally
    } catch {}
  };

  // ✅ Manual fingerprint button press
  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Use fingerprint to sign in",
        fallbackLabel: "Use Password",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });
      if (result.success) {
        const savedPwd = await AsyncStorage.getItem("savedPassword");
        const savedMail = await AsyncStorage.getItem("savedEmail");
        if (!savedMail || !savedPwd) {
          setError("Saved credentials not found. Please login with password.");
          return;
        }
        setLoading(true);
        await performLogin(savedMail, savedPwd);
      } else if ((result as any).error !== "user_cancel") {
        setError("Fingerprint not recognized. Try password.");
        shake();
      }
    } catch {
      setError("Biometric authentication failed.");
      shake();
    }
  };

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.spring(logoSlide, {
        toValue: 0,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(cardSlide, {
        toValue: 0,
        duration: 700,
        delay: 150,
        easing: Easing.out(Easing.cubic),
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

    Animated.loop(
      Animated.sequence([
        Animated.timing(bioAnim, {
          toValue: 1.12,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bioAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 7,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -7,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const performLogin = async (loginEmail: string, loginPassword: string) => {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.trim().toLowerCase(),
          password: loginPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid email or password.");
        shake();
        setLoading(false);
        return;
      }

      // ✅ Save session
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      await AsyncStorage.setItem("authToken", data.token || "");

      // ✅ Save credentials for future biometric login
      await AsyncStorage.setItem("savedEmail", loginEmail.trim().toLowerCase());
      await AsyncStorage.setItem("savedPassword", loginPassword);

      router.replace("/(tabs)");
    } catch {
      setError("Server connection failed.");
      shake();
      setLoading(false);
    }
  };

  const validate = (): boolean => {
    if (!email.trim()) {
      setError("Email enter කරන්න.");
      shake();
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Valid email enter කරන්න.");
      shake();
      return false;
    }
    if (!password) {
      setError("Password enter කරන්න.");
      shake();
      return false;
    }
    if (password.length < 6) {
      setError("Password too short.");
      shake();
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setError("");
    await performLogin(email, password);
  };

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050510" />

      {/* Background */}
      <View style={s.bgAbs} pointerEvents="none">
        <Animated.View style={[s.blob, s.blobTL, { opacity: glowOpacity }]} />
        <Animated.View style={[s.blob, s.blobBR, { opacity: glowOpacity }]} />
        <View style={s.blobMid} />
        {[0.2, 0.35, 0.5, 0.65, 0.8].map((y, i) => (
          <View key={i} style={[s.gridH, { top: height * y }]} />
        ))}
        {[0.2, 0.4, 0.6, 0.8].map((x, i) => (
          <View key={i} style={[s.gridV, { left: width * x }]} />
        ))}
      </View>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <Animated.View
            style={[
              s.logoSection,
              { opacity: fadeAnim, transform: [{ translateY: logoSlide }] },
            ]}
          >
            <Image
              source={require("../assets/images/logo.png")}
              style={s.logoImg}
              resizeMode="contain"
            />
            <Animated.View style={[s.logoGlow, { opacity: glowOpacity }]} />
          </Animated.View>

          {/* ✅ Biometric card — only if fingerprint is set up */}
          {hasBiometric && (
            <Animated.View
              style={[
                s.bioCard,
                { opacity: fadeAnim, transform: [{ translateY: cardSlide }] },
              ]}
            >
              <LinearGradient
                colors={["#0B1A3A", "#0D2348"]}
                style={s.bioCardInner}
              >
                <View style={s.bioLeft}>
                  <Text style={s.bioWelcome}>Welcome back! 👋</Text>
                  <Text style={s.bioEmail} numberOfLines={1}>
                    {savedEmail}
                  </Text>
                  <Text style={s.bioHint}>
                    Tap fingerprint to sign in instantly
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleBiometricLogin}
                  activeOpacity={0.85}
                >
                  <Animated.View style={{ transform: [{ scale: bioAnim }] }}>
                    <LinearGradient
                      colors={["#1E40AF", "#3B82F6"]}
                      style={s.bioBtnGrad}
                    >
                      <Text style={s.bioBtnIcon}>👆</Text>
                    </LinearGradient>
                  </Animated.View>
                  <Text style={s.bioBtnLabel}>Touch ID</Text>
                </TouchableOpacity>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Login Card */}
          <Animated.View
            style={[
              s.card,
              {
                opacity: fadeAnim,
                transform: [
                  { translateY: cardSlide },
                  { translateX: shakeAnim },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={["#3B82F6", "#6366F1", "#A855F7", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.shimmerBar}
            />
            <View style={s.cardBody}>
              <Text style={s.cardTitle}>
                {hasBiometric ? "Or sign in with password" : "Welcome back"}
              </Text>
              <Text style={s.cardSub}>Sign in to your RapidCare account</Text>

              {/* Error */}
              {!!error && (
                <Animated.View style={s.errorBanner}>
                  <Text style={s.errorIcon}>⚠</Text>
                  <Text style={s.errorText}>{error}</Text>
                  <TouchableOpacity
                    onPress={() => setError("")}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={s.errorClose}>✕</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* Email */}
              <View style={s.fieldGroup}>
                <Text style={s.fieldLabel}>EMAIL ADDRESS</Text>
                <View
                  style={[
                    s.inputWrap,
                    focused === "email" && s.inputWrapFocused,
                  ]}
                >
                  <Text style={s.inputEmoji}>✉️</Text>
                  <TextInput
                    style={s.textInput}
                    placeholder="you@example.com"
                    placeholderTextColor="#2E2E50"
                    value={email}
                    onChangeText={(v) => {
                      setEmail(v);
                      setError("");
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                  />
                  {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                    <View style={s.validBadge}>
                      <Text style={s.validTick}>✓</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Password */}
              <View style={s.fieldGroup}>
                <View style={s.fieldLabelRow}>
                  <Text style={s.fieldLabel}>PASSWORD</Text>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        "Forgot Password",
                        "Reset feature coming soon.",
                      )
                    }
                  >
                    <Text style={s.forgotLink}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    s.inputWrap,
                    focused === "pass" && s.inputWrapFocused,
                  ]}
                >
                  <Text style={s.inputEmoji}>🔐</Text>
                  <TextInput
                    style={[s.textInput, { flex: 1 }]}
                    placeholder="Enter your password"
                    placeholderTextColor="#2E2E50"
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      setError("");
                    }}
                    secureTextEntry={!showPass}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    onFocus={() => setFocused("pass")}
                    onBlur={() => setFocused(null)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPass(!showPass)}
                    style={s.eyeBtn}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={{ fontSize: 16 }}>
                      {showPass ? "🙈" : "👁️"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sign In */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.87}
                style={[s.signInBtn, loading && { opacity: 0.65 }]}
              >
                <LinearGradient
                  colors={
                    loading
                      ? ["#1A1A35", "#1A1A35"]
                      : ["#3B82F6", "#6366F1", "#A855F7"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.signInGrad}
                >
                  {loading ? (
                    <View style={s.loadRow}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={s.signInText}>Signing in...</Text>
                    </View>
                  ) : (
                    <Text style={s.signInText}>Sign In →</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* ✅ Fingerprint button — always visible if biometric set up */}
              {hasBiometric && (
                <TouchableOpacity
                  style={s.bioInlineBtn}
                  onPress={handleBiometricLogin}
                  activeOpacity={0.85}
                >
                  <Text style={s.bioInlineIcon}>👆</Text>
                  <Text style={s.bioInlineText}>Sign in with Fingerprint</Text>
                </TouchableOpacity>
              )}

              {/* Register */}
              <View style={s.regRow}>
                <Text style={s.regLabel}>Don't have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.push("/signup")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={s.regLink}>Create one</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>

          <Animated.Text style={[s.footer, { opacity: fadeAnim }]}>
            Protected by RapidCare Security · Terms · Privacy
          </Animated.Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050510" },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 48, alignItems: "center" },
  bgAbs: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  blob: { position: "absolute", borderRadius: 999 },
  blobTL: {
    width: 350,
    height: 350,
    backgroundColor: "rgba(99,102,241,0.12)",
    top: -100,
    left: -80,
  },
  blobBR: {
    width: 300,
    height: 300,
    backgroundColor: "rgba(168,85,247,0.10)",
    bottom: -60,
    right: -60,
  },
  blobMid: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 999,
    backgroundColor: "rgba(59,130,246,0.06)",
    top: height * 0.4,
    left: width * 0.2,
  },
  gridH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  gridV: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 0.5,
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  logoSection: {
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 20,
    width: "100%",
    position: "relative",
  },
  logoImg: { width: width * 0.72, height: 100 },
  logoGlow: {
    position: "absolute",
    bottom: 10,
    width: width * 0.5,
    height: 40,
    backgroundColor: "rgba(99,102,241,0.25)",
    borderRadius: 999,
  },

  bioCard: {
    width: width - 32,
    marginBottom: 14,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1C3A6A",
  },
  bioCardInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
  },
  bioLeft: { flex: 1, marginRight: 16 },
  bioWelcome: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 3,
  },
  bioEmail: {
    fontSize: 13,
    color: "#3B82F6",
    marginBottom: 5,
    fontWeight: "600",
  },
  bioHint: { fontSize: 11, color: "#555580", lineHeight: 16 },
  bioBtnGrad: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  bioBtnIcon: { fontSize: 26 },
  bioBtnLabel: {
    fontSize: 10,
    color: "#3B82F6",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 4,
  },

  card: {
    width: width - 32,
    backgroundColor: "#0C0C22",
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1C1C3A",
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 40,
    elevation: 20,
  },
  shimmerBar: { height: 3, width: "100%" },
  cardBody: { padding: 28 },
  cardTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 5,
    letterSpacing: -0.5,
  },
  cardSub: { fontSize: 13, color: "#3D3D66", marginBottom: 22, lineHeight: 19 },

  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.09)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 0.5,
    borderColor: "rgba(239,68,68,0.3)",
  },
  errorIcon: { fontSize: 13, color: "#F87171" },
  errorText: { flex: 1, fontSize: 13, color: "#FCA5A5", lineHeight: 18 },
  errorClose: { fontSize: 12, color: "#F87171", fontWeight: "700" },

  fieldGroup: { marginBottom: 18 },
  fieldLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#3D3D66",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  forgotLink: { fontSize: 12, color: "#6366F1", fontWeight: "700" },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#08081C",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "#1C1C3A",
  },
  inputWrapFocused: { borderColor: "#6366F1", backgroundColor: "#0B0B22" },
  inputEmoji: { fontSize: 16 },
  textInput: { flex: 1, fontSize: 15, color: "#FFFFFF" },
  validBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(16,185,129,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  validTick: { fontSize: 12, color: "#10B981", fontWeight: "800" },
  eyeBtn: { padding: 2 },

  signInBtn: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 6,
    marginBottom: 14,
  },
  signInGrad: { height: 58, justifyContent: "center", alignItems: "center" },
  loadRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  signInText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  bioInlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(59,130,246,0.1)",
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "rgba(59,130,246,0.3)",
  },
  bioInlineIcon: { fontSize: 18 },
  bioInlineText: { fontSize: 14, color: "#3B82F6", fontWeight: "700" },

  regRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  regLabel: { fontSize: 14, color: "#3D3D66" },
  regLink: { fontSize: 14, color: "#818CF8", fontWeight: "800" },
  footer: { fontSize: 11, color: "#1C1C30", marginTop: 28, letterSpacing: 0.3 },
});

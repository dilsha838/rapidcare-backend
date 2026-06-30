import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
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
  const [hasBiometric, setHasBiometric] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(-30)).current;
  const cardSlide = useRef(new Animated.Value(60)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const bioAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    startAnimations();
    checkSavedCredentials();
  }, []);


  const checkSavedCredentials = async () => {
    try {
      const storedEmail = await AsyncStorage.getItem("savedEmail");
      const storedPassword = await AsyncStorage.getItem("savedPassword");
      const bioEnabled = await AsyncStorage.getItem("biometricEnabled");

      if (storedEmail) setEmail(storedEmail);
      if (storedPassword) setPassword(storedPassword);

     
      if (storedEmail && storedPassword && bioEnabled === "true") {
        setTimeout(() => {
          handleBiometricLogin();
        }, 500);
      }
    } catch (e) {
      console.log(e);
    }
  };

  // 🔥 FIXED BIOMETRIC LOGIN LOGIC
  const handleBiometricLogin = async () => {
    try {
      setError("");

      // 1. Hardware Check
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!compatible || !enrolled) {
        setError("Biometric authentication is not set up on this device.");
        shake();
        return;
      }

   
      const storedEmail = await AsyncStorage.getItem("savedEmail");
      const storedPassword = await AsyncStorage.getItem("savedPassword");

      let targetEmail = storedEmail || email.trim();
      let targetPassword = storedPassword || password;

     
      if (!targetEmail || !targetPassword) {
        setError(
          "Please enter your email & password first to sign in and enable Fingerprint.",
        );
        shake();
        return;
      }

      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Sign in to RapidCare",
        fallbackLabel: "Use Password",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

    
      if (result.success) {
        setLoading(true);
       
        setEmail(targetEmail);
        setPassword(targetPassword);

        await performLogin(targetEmail, targetPassword);
      }
    } catch (e) {
      setError("Biometric authentication error.");
      shake();
    }
  };


  const performLogin = async (loginEmail: string, loginPassword: string) => {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail.toLowerCase().trim(),
          password: loginPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid credentials.");
        shake();
        setLoading(false);
        return;
      }

    
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      await AsyncStorage.setItem("authToken", data.token || "");
      await AsyncStorage.setItem("savedEmail", loginEmail.toLowerCase().trim());
      await AsyncStorage.setItem("savedPassword", loginPassword);
      await AsyncStorage.setItem("biometricEnabled", "true");

      setLoading(false);
      router.replace("/(tabs)");
    } catch {
      setError("Server connection failed.");
      shake();
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      shake();
      return;
    }
    setLoading(true);
    setError("");
    await performLogin(email, password);
  };

  // Animations
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
          toValue: 1.08,
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

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050510" />

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

          {/* Top Biometric Card */}
          {hasBiometric && (
            <Animated.View
              style={[
                s.bioCard,
                { opacity: fadeAnim, transform: [{ translateY: cardSlide }] },
              ]}
            >
              <View style={s.bioCardInner}>
                <View style={s.bioLeft}>
                  <Text style={s.bioWelcome}>Welcome back! 👋</Text>
                  <Text style={s.bioHint}>
                    Tap fingerprint to sign in instantly
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleBiometricLogin}
                  activeOpacity={0.85}
                  style={s.bioBtnWrapper}
                >
                  <Animated.View
                    style={[s.bioCircle, { transform: [{ scale: bioAnim }] }]}
                  >
                    <Text style={s.bioBtnIcon}>👇</Text>
                  </Animated.View>
                  <Text style={s.bioBtnLabel}>Touch ID</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Main Card */}
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
              colors={["#3B82F6", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.shimmerBar}
            />

            <View style={s.cardBody}>
              <Text style={s.cardTitle}>Or sign in with password</Text>
              <Text style={s.cardSub}>Sign in to your RapidCare account</Text>

              {/* Dynamic Error Alert */}
              {!!error && (
                <View style={s.errorBanner}>
                  <Text style={s.errorIcon}>⚠️</Text>
                  <Text style={s.errorText}>{error}</Text>
                  <TouchableOpacity onPress={() => setError("")}>
                    <Text style={s.errorClose}>✕</Text>
                  </TouchableOpacity>
                </View>
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
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={s.fieldGroup}>
                <View style={s.fieldLabelRow}>
                  <Text style={s.fieldLabel}>PASSWORD</Text>
                </View>
                <View
                  style={[
                    s.inputWrap,
                    focused === "pass" && s.inputWrapFocused,
                  ]}
                >
                  <Text style={s.inputEmoji}>🔐</Text>
                  <TextInput
                    style={s.textInput}
                    placeholder="Enter your password"
                    placeholderTextColor="#2E2E50"
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      setError("");
                    }}
                    secureTextEntry={!showPass}
                    onFocus={() => setFocused("pass")}
                    onBlur={() => setFocused(null)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPass(!showPass)}
                    style={s.eyeBtn}
                  >
                    <Text style={{ fontSize: 16 }}>
                      {showPass ? "🙈" : "👁️"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Standard Sign In */}
              <TouchableOpacity
                onPress={handlePasswordLogin}
                disabled={loading}
                activeOpacity={0.87}
                style={s.signInBtn}
              >
                <LinearGradient
                  colors={["#3B82F6", "#6366F1", "#A855F7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={s.signInGrad}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={s.signInText}>Sign In →</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Bottom Fingerprint Button */}
              <TouchableOpacity
                style={s.bioInlineBtn}
                onPress={handleBiometricLogin}
                activeOpacity={0.85}
              >
                <Text style={s.bioInlineIcon}>👇</Text>
                <Text style={s.bioInlineText}>Sign in with Fingerprint</Text>
              </TouchableOpacity>

              <View style={s.regRow}>
                <Text style={s.regLabel}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/signup")}>
                  <Text style={s.regLink}>Create one</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050510" },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 30, alignItems: "center" },
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
    paddingTop: 40,
    paddingBottom: 15,
    width: "100%",
  },
  logoImg: { width: width * 0.6, height: 80 },
  logoGlow: {
    position: "absolute",
    bottom: 5,
    width: width * 0.4,
    height: 30,
    backgroundColor: "rgba(99,102,241,0.25)",
    borderRadius: 999,
  },
  bioCard: {
    width: width - 32,
    marginBottom: 16,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#0E1E38",
    borderWidth: 1,
    borderColor: "#1A2E54",
  },
  bioCardInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 22,
  },
  bioLeft: { flex: 1 },
  bioWelcome: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  bioHint: { fontSize: 13, color: "#6B7C96" },
  bioBtnWrapper: { alignItems: "center" },
  bioCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  bioBtnIcon: { fontSize: 24 },
  bioBtnLabel: { fontSize: 11, color: "#3B82F6", fontWeight: "600" },
  card: {
    width: width - 32,
    backgroundColor: "#0A0A1E",
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#141432",
  },
  shimmerBar: { height: 3, width: "100%" },
  cardBody: { padding: 24 },
  cardTitle: {
    fontSize: 23,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  cardSub: { fontSize: 14, color: "#3A3A5E", marginBottom: 20 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
  },
  errorIcon: { fontSize: 14, color: "#EF4444" },
  errorText: { flex: 1, fontSize: 13, color: "#FCA5A5", lineHeight: 18 },
  errorClose: { fontSize: 12, color: "#EF4444", padding: 2 },
  fieldGroup: { marginBottom: 18 },
  fieldLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#3A3A5E",
    letterSpacing: 1,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#050515",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "#141432",
  },
  inputWrapFocused: { borderColor: "#3B82F6" },
  inputEmoji: { fontSize: 16 },
  textInput: { flex: 1, fontSize: 15, color: "#FFFFFF" },
  eyeBtn: { padding: 4 },
  signInBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 16,
  },
  signInGrad: { height: 54, justifyContent: "center", alignItems: "center" },
  signInText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  bioInlineBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(59,130,246,0.05)",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.15)",
  },
  bioInlineIcon: { fontSize: 18 },
  bioInlineText: { fontSize: 14, color: "#3B82F6", fontWeight: "600" },
  regRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  regLabel: { fontSize: 14, color: "#3A3A5E" },
  regLink: { fontSize: 14, color: "#3B82F6", fontWeight: "700" },
});

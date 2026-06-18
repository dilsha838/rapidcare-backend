import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Image,
  Dimensions,
} from "react-native";

import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";

const { width, height } = Dimensions.get("window");

export default function Signup() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !phone || !password || !confirm) {
      Alert.alert("Error", "All fields are required");
      return;
    }

    if (password !== confirm) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "https://rapidcare-backend-production.up.railway.app/signup",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name,
            email,
            phone,
            password,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        Alert.alert("Signup Failed", data.message || "Something went wrong");

        return;
      }

      Alert.alert("Success", "Account created successfully!");

      // ✅ GO DIRECTLY TO LOGIN PAGE
      router.replace("/login");
    } catch (err) {
      Alert.alert("Error", "Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" />

      {/* Background */}
      <View style={s.bg}>
        <View style={s.blob1} />
        <View style={s.blob2} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={s.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={s.logoSection}>
            <Image
              source={require("../assets/images/logo.png")}
              style={s.logo}
              resizeMode="contain"
            />
          </View>

          {/* Card */}
          <View style={s.card}>
            <LinearGradient
              colors={["#3B82F6", "#6366F1", "#A855F7", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.topBorder}
            />

            <View style={s.cardBody}>
              <Text style={s.title}>Create Account</Text>
              <Text style={s.subtitle}>
                Join RapidCare and continue your journey
              </Text>
              {/* Full Name */}
              <Text style={s.label}>FULL NAME</Text>
              <View style={s.inputWrap}>
                <Text style={s.icon}>👤</Text>

                <TextInput
                  placeholder="John Doe"
                  placeholderTextColor="#444"
                  style={s.input}
                  value={name}
                  onChangeText={setName}
                />
              </View>
              {/* Email */}
              <Text style={s.label}>EMAIL ADDRESS</Text>
              <View style={s.inputWrap}>
                <Text style={s.icon}>✉️</Text>

                <TextInput
                  placeholder="john@email.com"
                  placeholderTextColor="#444"
                  style={s.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />
              </View>
              {/* Phone */}
              <Text style={s.label}>PHONE NUMBER</Text>
              <View style={s.inputWrap}>
                <Text style={s.icon}>📱</Text>

                <TextInput
                  placeholder="0771234567"
                  placeholderTextColor="#444"
                  style={s.input}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
              {/* Password */}
              <Text style={s.label}>PASSWORD</Text>
              <View style={s.inputWrap}>
                <Text style={s.icon}>🔐</Text>

                <TextInput
                  placeholder="********"
                  placeholderTextColor="#444"
                  secureTextEntry
                  style={s.input}
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
              {/* Confirm Password */}
              <Text style={s.label}>CONFIRM PASSWORD</Text>
              <View style={s.inputWrap}>
                <Text style={s.icon}>✅</Text>

                <TextInput
                  placeholder="********"
                  placeholderTextColor="#444"
                  secureTextEntry
                  style={s.input}
                  value={confirm}
                  onChangeText={setConfirm}
                />
              </View>
              {/* Button */}
              <TouchableOpacity onPress={handleSignup} activeOpacity={0.8}>
                <LinearGradient
                  colors={["#3B82F6", "#6366F1", "#A855F7"]}
                  style={s.button}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.buttonText}>Create Account →</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Login */}
              <View style={s.loginRow}>
                <Text style={s.loginText}>Already have an account?</Text>

                <TouchableOpacity onPress={() => router.replace("/login")}>
                  <Text style={s.loginLink}> Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050510",
  },

  bg: {
    ...StyleSheet.absoluteFillObject,
  },

  blob1: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 999,
    backgroundColor: "rgba(99,102,241,0.12)",
    top: -80,
    left: -80,
  },

  blob2: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: "rgba(168,85,247,0.10)",
    bottom: -60,
    right: -60,
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 40,
    alignItems: "center",
  },

  logoSection: {
    marginBottom: 20,
  },

  logo: {
    width: width * 0.55,
    height: 90,
  },

  card: {
    width: width - 30,
    backgroundColor: "#0C0C22",
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1C1C3A",
  },

  topBorder: {
    height: 3,
    width: "100%",
  },

  cardBody: {
    padding: 24,
  },

  title: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "800",
    marginBottom: 5,
  },

  subtitle: {
    color: "#4B4B70",
    marginBottom: 24,
  },

  label: {
    color: "#4B4B70",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 10,
    letterSpacing: 1,
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#08081C",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1C1C3A",
    paddingHorizontal: 16,
    height: 58,
  },

  icon: {
    fontSize: 16,
    marginRight: 10,
  },

  input: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
  },

  button: {
    height: 58,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 28,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },

  loginText: {
    color: "#555",
  },

  loginLink: {
    color: "#818CF8",
    fontWeight: "700",
  },
});

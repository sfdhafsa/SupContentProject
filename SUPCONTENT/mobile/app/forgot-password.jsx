import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  ScrollView,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, router } from "expo-router";
import { ArrowLeft, LockKeyhole } from "lucide-react-native";
import api from "../src/config/api.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setMessage("");
    setResetUrl("");

    if (!emailRegex.test(email)) {
      setError("Veuillez entrer une adresse email valide.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", {
        email,
      });

      setMessage(
        res.data.message ||
          "Si ce compte existe, un lien de réinitialisation a été généré."
      );

      setResetUrl(res.data.reset_url || "");
    } catch (err) {
      const apiError =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.[0]?.msg ||
        "Impossible d'envoyer le lien de réinitialisation.";

      setError(apiError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF",
      }}
    >
      <StatusBar barStyle="dark-content" />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingBottom: 30,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            justifyContent: "center",
            marginTop: 10,
          }}
        >
          <ArrowLeft
            size={24}
            color="#111827"
          />
        </TouchableOpacity>

        {/* HERO */}
        <View
          style={{
            alignItems: "center",
            marginTop: 25,
          }}
        >
          <View
            style={{
              width: 110,
              height: 110,
              borderRadius: 55,
              backgroundColor: "#FEE2E2",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <LockKeyhole
              size={50}
              color="#D0021B"
            />
          </View>

          <Text
            style={{
              marginTop: 24,
              fontSize: 32,
              fontWeight: "800",
              color: "#111827",
            }}
          >
            Forgot Password
          </Text>

          <Text
            style={{
              marginTop: 12,
              textAlign: "center",
              fontSize: 15,
              lineHeight: 24,
              color: "#6B7280",
              paddingHorizontal: 10,
            }}
          >
            Entrez votre adresse email et nous vous enverrons
            un lien sécurisé pour réinitialiser votre mot de passe.
          </Text>
        </View>

        {/* FORM CARD */}
        <View
          style={{
            marginTop: 40,
            backgroundColor: "#FFFFFF",
            borderRadius: 28,
            padding: 24,
            shadowColor: "#000",
            shadowOpacity: 0.06,
            shadowRadius: 20,
            shadowOffset: {
              width: 0,
              height: 10,
            },
            elevation: 5,
          }}
        >
          {/* ERROR */}
          {!!error && (
            <View
              style={{
                marginBottom: 16,
                backgroundColor: "#FEF2F2",
                borderWidth: 1,
                borderColor: "#FECACA",
                borderRadius: 16,
                padding: 14,
              }}
            >
              <Text
                style={{
                  color: "#DC2626",
                  fontSize: 14,
                }}
              >
                {error}
              </Text>
            </View>
          )}

          {/* SUCCESS */}
          {!!message && (
            <View
              style={{
                marginBottom: 16,
                backgroundColor: "#ECFDF5",
                borderWidth: 1,
                borderColor: "#A7F3D0",
                borderRadius: 16,
                padding: 14,
              }}
            >
              <Text
                style={{
                  color: "#059669",
                  fontSize: 14,
                }}
              >
                {message}
              </Text>
            </View>
          )}

          {/* RESET URL DEV */}
          {!!resetUrl && (
            <View
              style={{
                marginBottom: 16,
                backgroundColor: "#F8FAFC",
                borderRadius: 16,
                padding: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: "#64748B",
                  fontWeight: "700",
                  marginBottom: 8,
                }}
              >
                DEVELOPMENT RESET LINK
              </Text>

              <Text
                onPress={() => Linking.openURL(resetUrl)}
                style={{
                  color: "#D0021B",
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                {resetUrl}
              </Text>
            </View>
          )}

          {/* EMAIL */}
          <Text
            style={{
              marginBottom: 10,
              fontSize: 14,
              fontWeight: "600",
              color: "#374151",
            }}
          >
            Adresse email
          </Text>

          <TextInput
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError("");
            }}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#9CA3AF"
            style={{
              height: 58,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 18,
              paddingHorizontal: 18,
              fontSize: 15,
              color: "#111827",
              backgroundColor: "#FAFAFA",
            }}
          />

          {/* BUTTON */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            style={{
              marginTop: 24,
              height: 58,
              borderRadius: 18,
              backgroundColor: "#D0021B",
              justifyContent: "center",
              alignItems: "center",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                Envoyer le lien
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <View
          style={{
            alignItems: "center",
            marginTop: "auto",
            paddingTop: 40,
          }}
        >
          <Text
            style={{
              color: "#6B7280",
              fontSize: 14,
            }}
          >
            Vous vous souvenez de votre mot de passe ?
          </Text>

          <Link
            href="/login"
            asChild
          >
            <TouchableOpacity>
              <Text
                style={{
                  marginTop: 8,
                  color: "#D0021B",
                  fontSize: 15,
                  fontWeight: "700",
                }}
              >
                Se connecter
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
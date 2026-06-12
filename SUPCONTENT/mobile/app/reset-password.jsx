import { Link, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, LockKeyhole } from "lucide-react-native";
import api from "../src/config/api.js";

function validatePassword(password) {
  if (password.length < 8) {
    return "Le mot de passe doit contenir au moins 8 caractères.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Le mot de passe doit contenir au moins une majuscule.";
  }
  if (!/[0-9]/.test(password)) {
    return "Le mot de passe doit contenir au moins un chiffre.";
  }
  return "";
}

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const token = Array.isArray(params.token) ? params.token[0] : params.token || "";
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [error, setError] = useState(token ? "" : "Le token de réinitialisation est manquant.");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (error && token) setError("");
  };

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (!token) {
      setError("Le token de réinitialisation est manquant.");
      return;
    }

    const passwordError = validatePassword(form.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/reset-password", {
        token,
        password: form.password,
      });

      setMessage(response.data.message || "Mot de passe réinitialisé avec succès.");
      setForm({ password: "", confirmPassword: "" });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.errors?.[0]?.msg ||
          "Impossible de réinitialiser le mot de passe."
      );
    } finally {
      setLoading(false);
    }
  };

  const disabled = loading || !token || Boolean(message);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#111827" />
          </Pressable>

          <View style={styles.hero}>
            <View style={styles.iconCircle}>
              <LockKeyhole size={46} color="#D0021B" />
            </View>
            <Text style={styles.title}>Nouveau mot de passe</Text>
            <Text style={styles.subtitle}>
              Utilisez au moins 8 caractères, une majuscule et un chiffre.
            </Text>
          </View>

          <View style={styles.card}>
            {error ? (
              <View style={[styles.alert, styles.errorAlert]}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {message ? (
              <View style={[styles.alert, styles.successAlert]}>
                <Text style={styles.successText}>{message}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Nouveau mot de passe</Text>
            <TextInput
              editable={!disabled}
              onChangeText={(value) => updateField("password", value)}
              placeholder="Saisissez le nouveau mot de passe"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              style={[styles.input, disabled && styles.disabledInput]}
              value={form.password}
            />

            <Text style={styles.label}>Confirmer le mot de passe</Text>
            <TextInput
              editable={!disabled}
              onChangeText={(value) => updateField("confirmPassword", value)}
              placeholder="Confirmez le nouveau mot de passe"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              style={[styles.input, disabled && styles.disabledInput]}
              value={form.confirmPassword}
            />

            <Pressable
              disabled={disabled}
              onPress={handleSubmit}
              style={[styles.submitButton, disabled && styles.disabledButton]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>Réinitialiser le mot de passe</Text>
              )}
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.loginPrompt}>Prêt à vous connecter ? </Text>
              <Link href="/login" asChild>
                <Pressable>
                  <Text style={styles.loginLink}>Se connecter</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#F8FAFC",
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  backButton: {
    height: 44,
    justifyContent: "center",
    marginTop: 10,
    width: 44,
  },
  hero: {
    alignItems: "center",
    marginTop: 20,
  },
  iconCircle: {
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 50,
    height: 100,
    justifyContent: "center",
    width: 100,
  },
  title: {
    color: "#111827",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 22,
    textAlign: "center",
  },
  subtitle: {
    color: "#6B7280",
    fontSize: 15,
    lineHeight: 23,
    marginTop: 10,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    elevation: 4,
    marginTop: 32,
    padding: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  alert: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    padding: 14,
  },
  errorAlert: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  successAlert: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 14,
  },
  successText: {
    color: "#047857",
    fontSize: 14,
  },
  label: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#FAFAFA",
    borderColor: "#E5E7EB",
    borderRadius: 16,
    borderWidth: 1,
    color: "#111827",
    fontSize: 15,
    marginBottom: 18,
    minHeight: 56,
    paddingHorizontal: 16,
  },
  disabledInput: {
    backgroundColor: "#F3F4F6",
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#D0021B",
    borderRadius: 16,
    justifyContent: "center",
    marginTop: 4,
    minHeight: 56,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  loginRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginPrompt: {
    color: "#6B7280",
    fontSize: 13,
  },
  loginLink: {
    color: "#D0021B",
    fontSize: 13,
    fontWeight: "700",
  },
});

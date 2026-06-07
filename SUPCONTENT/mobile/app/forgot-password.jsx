import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function ForgotPassword() {
  return (
    <View style={styles.page}>
      <Text style={styles.title}>Forgot password</Text>
      <Text style={styles.text}>Password reset screen will be built here.</Text>
      <Link href="/login" style={styles.link}>Back to login</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    padding: 24,
  },
  title: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  text: {
    color: '#6b7280',
    marginBottom: 18,
  },
  link: {
    color: '#ef0d1a',
    fontWeight: '700',
  },
});

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import useAuthSession from '../hooks/useAuthSession';

export default function RequireAuth({ children }) {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuthSession();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return (
      <View style={styles.page}>
        <ActivityIndicator size="large" color="#ef0d1a" />
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    flex: 1,
    justifyContent: 'center',
  },
});

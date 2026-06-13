import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ChatView from '../../src/components/messages/ChatView';
import ScreenContainer from '../../src/components/ScreenContainer';
import { getAuthUser } from '../../src/services/authStorage';

function BackArrow() {
  return (
    <View style={styles.backArrow}>
      <View style={styles.arrowLeft} />
      <View style={styles.arrowLine} />
    </View>
  );
}

export default function ConversationScreen() {
  const { userId, username } = useLocalSearchParams();
  const router = useRouter();
  const receiverId = Array.isArray(userId) ? userId[0] : userId;
  const receiverName = Array.isArray(username) ? username[0] : username;

  // Resolve the authenticated user's ID from the JWT once at screen level
  const [currentUserId, setCurrentUserId] = useState(null);
  useEffect(() => {
    getAuthUser().then((user) => setCurrentUserId(user?.id || user?.userId || null));
  }, []);

  const openReceiverProfile = () => {
    if (!receiverId) return;

    router.push({
      pathname: '/publicProfile',
      params: { id: String(receiverId) },
    });
  };

  return (
    <ScreenContainer>
      <View style={styles.phone}>
        {/* Chat header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <BackArrow />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Voir le profil de ${receiverName || 'cet utilisateur'}`}
            disabled={!receiverId}
            onPress={openReceiverProfile}
            style={({ pressed }) => [styles.userInfo, pressed && styles.userInfoPressed]}
          >
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarInitial}>
                {receiverName ? receiverName.charAt(0).toUpperCase() : '?'}
              </Text>
            </View>
            <Text style={styles.username} numberOfLines={1}>
              {receiverName || 'Conversation'}
            </Text>
          </Pressable>

          <View style={styles.headerRight} />
        </View>

        {/* Chat messages + input */}
        <ChatView userId={receiverId} username={receiverName} currentUserId={currentUserId} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  phone: {
    backgroundColor: '#ffffff',
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomColor: '#eef0f3',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 60,
    paddingHorizontal: 14,
  },
  backButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  backArrow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  arrowLeft: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 4,
    borderRightColor: '#111827',
    borderRightWidth: 6,
    borderTopColor: 'transparent',
    borderTopWidth: 4,
    height: 0,
    width: 0,
  },
  arrowLine: {
    backgroundColor: '#111827',
    borderRadius: 1,
    height: 1.5,
    width: 10,
  },
  userInfo: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  userInfoPressed: {
    opacity: 0.72,
  },
  avatarSmall: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  avatarInitial: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '800',
  },
  username: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    maxWidth: 160,
  },
  headerRight: {
    width: 42,
  },
});

import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useConversation } from '../../hooks/useConversation';
import { useSocket } from '../../hooks/useSocket';
import ChatBubble from './ChatBubble';

export default function ChatView({ userId, username, currentUserId }) {
  const flatListRef = useRef(null);
  const [inputText, setInputText] = useState('');
  const { messages, loading, sending, error, send, appendMessage } = useConversation(userId, currentUserId);

  // Real-time socket
  const { sendSocketMessage } = useSocket({
    onReceiveMessage: (message) => {
      if (String(message.sender_id) === String(userId)) {
        appendMessage(message);
      }
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    await send(text);
    // Also emit through socket for real-time delivery to the other user
    sendSocketMessage(userId, text);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color="#ef0d1a" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={58}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => String(item.id || index)}
        renderItem={({ item }) => (
          <ChatBubble
            message={item}
            isMine={String(item.sender_id) === String(currentUserId)}
          />
        )}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={styles.emptyText}>Commencez la conversation !</Text>
          </View>
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Message..."
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <Pressable
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.sendIcon}>➤</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingTop: 40,
  },
  errorText: {
    color: '#ef0d1a',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 11,
    textAlign: 'center',
  },
  messageList: {
    flexGrow: 1,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 12,
  },
  inputBar: {
    alignItems: 'flex-end',
    backgroundColor: '#ffffff',
    borderTopColor: '#e5e7eb',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 22,
    color: '#111827',
    flex: 1,
    fontSize: 14,
    maxHeight: 110,
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: '#ef0d1a',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  sendButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  sendIcon: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});

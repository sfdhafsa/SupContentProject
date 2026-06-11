import { StyleSheet, Text, View } from 'react-native';

export default function ChatBubble({ message, isMine }) {
  const formatTime = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={[styles.row, isMine && styles.rowMine]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.content, isMine ? styles.contentMine : styles.contentTheirs]}>
          {message.content}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.time, isMine ? styles.timeMine : styles.timeTheirs]}>
            {formatTime(message.created_at)}
          </Text>
          {isMine && (
            <Text style={styles.readStatus}>{message.is_read ? '✓✓' : '✓'}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingHorizontal: 12,
  },
  rowMine: {
    justifyContent: 'flex-end',
  },
  bubble: {
    borderRadius: 12,
    maxWidth: '75%',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  bubbleMine: {
    backgroundColor: '#ef0d1a',
    borderBottomRightRadius: 3,
  },
  bubbleTheirs: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 3,
  },
  content: {
    fontSize: 11,
    lineHeight: 16,
  },
  contentMine: {
    color: '#ffffff',
  },
  contentTheirs: {
    color: '#111827',
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'flex-end',
    marginTop: 3,
  },
  time: {
    fontSize: 8,
  },
  timeMine: {
    color: 'rgba(255,255,255,0.7)',
  },
  timeTheirs: {
    color: '#9ca3af',
  },
  readStatus: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 8,
  },
});

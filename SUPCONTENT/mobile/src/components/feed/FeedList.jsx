import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
} from 'react-native';

import FeedCard from './FeedCard';

export default function FeedList({
  items,
  loading,
  refreshing,
  error,
  onRefresh,
  onLoadMore,
}) {
  if (loading && items.length === 0) {
    return (
      <ActivityIndicator
        size="small"
        color="#ef0d1a"
      />
    );
  }

  if (error) {
    return (
      <Text>
        Impossible de charger le fil
      </Text>
    );
  }

  return (
    <FlatList
      scrollEnabled={false}
      data={items}
      keyExtractor={(item, index) =>
        String(item.id || index)
      }
      renderItem={({ item }) => (
        <FeedCard item={item} />
      )}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.3}
      ListEmptyComponent={
        <View>
          <Text>
            Suivez des utilisateurs pour voir leur activité ici.
          </Text>
        </View>
      }
    />
  );
}
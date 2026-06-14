import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import ScreenContainer from '../../src/components/ScreenContainer';
import { getListById } from '../../src/services/listsApi';
import { useTheme } from '../../src/context/ThemeContext';

const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w300';

function getPosterUrl(movie) {
  if (!movie?.poster_url) return null;
  return movie.poster_url.startsWith('http')
    ? movie.poster_url
    : `${POSTER_BASE_URL}${movie.poster_url}`;
}

function MovieCard({ movie }) {
  const router = useRouter();
  const { colors } = useTheme();
  const posterUrl = getPosterUrl(movie);
  const movieId = movie?.external_id || movie?.tmdb_id;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir ${movie?.title || 'le film'}`}
      disabled={!movieId}
      onPress={() => router.push(`/movie/${movieId}`)}
      style={styles.movieCard}
    >
      {posterUrl ? (
        <Image source={{ uri: posterUrl }} style={styles.poster} />
      ) : (
        <View style={[styles.posterFallback, { backgroundColor: colors.cardMuted }]}>
          <Text style={[styles.posterFallbackText, { color: colors.muted }]} numberOfLines={3}>
            {movie?.title || 'Film'}
          </Text>
        </View>
      )}
      <Text style={[styles.movieTitle, { color: colors.text }]} numberOfLines={2}>
        {movie?.title || 'Untitled'}
      </Text>
    </Pressable>
  );
}

export default function ListDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadList() {
      if (!id) return;

      setLoading(true);
      setError('');

      try {
        const data = await getListById(id);
        if (active) setList(data);
      } catch (err) {
        if (active) setError(err.message || 'Impossible de charger la liste.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadList();

    return () => {
      active = false;
    };
  }, [id]);

  const movies = list?.movies || [];

  return (
    <ScreenContainer backgroundColor={colors.bg} contentStyle={styles.screen}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {list?.name || 'Liste'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color="#ef0d1a" />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={[styles.errorText, { color: colors.red }]}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(movie, index) => String(movie?.id || movie?.external_id || index)}
          numColumns={2}
          columnWrapperStyle={styles.movieRow}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.hero}>
              <View style={styles.visibilityBadge}>
                <Text style={styles.visibilityText}>
                  {list?.is_public ? 'Public' : 'Private'}
                </Text>
              </View>
               <Text style={[styles.title, { color: colors.text }]}>{list?.name}</Text>
               {list?.description ? (
                 <Text style={[styles.description, { color: colors.muted }]}>{list.description}</Text>
               ) : null}
               <Text style={[styles.meta, { color: colors.subtle }]}>
                {movies.length} film{movies.length !== 1 ? 's' : ''}
                {list?.owner_username ? ` by ${list.owner_username}` : ''}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Cette liste est vide.</Text>
            </View>
          }
          renderItem={({ item }) => <MovieCard movie={item} />}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomColor: '#e5e7eb',
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 56,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    minWidth: 56,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#ef0d1a',
    fontSize: 14,
    fontWeight: '800',
  },
  headerTitle: {
    color: '#111827',
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSpacer: {
    minWidth: 56,
  },
  centerState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    color: '#ef0d1a',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 96,
  },
  hero: {
    marginBottom: 18,
  },
  visibilityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  visibilityText: {
    color: '#4338ca',
    fontSize: 11,
    fontWeight: '800',
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
  },
  description: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  meta: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
  movieRow: {
    gap: 12,
  },
  movieCard: {
    flex: 1,
    marginBottom: 16,
    maxWidth: '50%',
  },
  poster: {
    aspectRatio: 2 / 3,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    width: '100%',
  },
  posterFallback: {
    alignItems: 'center',
    aspectRatio: 2 / 3,
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    justifyContent: 'center',
    padding: 12,
    width: '100%',
  },
  posterFallbackText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  movieTitle: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    marginTop: 7,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 160,
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '800',
  },
});

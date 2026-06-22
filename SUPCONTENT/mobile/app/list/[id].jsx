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
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Film, Globe2, LockKeyhole, Play, UserRound } from 'lucide-react-native';
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
      style={({ pressed }) => [styles.movieCard, pressed && styles.movieCardPressed]}
    >
      {posterUrl ? (
        <Image source={{ uri: posterUrl }} style={[styles.poster, { backgroundColor: colors.cardMuted }]} />
      ) : (
        <View style={[styles.posterFallback, { backgroundColor: colors.cardMuted }]}>
          <Text style={[styles.posterFallbackText, { color: colors.muted }]} numberOfLines={3}>
            {movie?.title || 'Film'}
          </Text>
        </View>
      )}
      <View style={styles.movieInfo}>
        <Text style={[styles.movieTitle, { color: colors.text }]} numberOfLines={2}>
          {movie?.title || 'Untitled'}
        </Text>
        {movie?.release_date ? (
          <Text style={[styles.movieYear, { color: colors.subtle }]}>{movie.release_date.slice(0, 4)}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ListDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, darkMode } = useTheme();
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
      <StatusBar style={darkMode ? 'light' : 'dark'} backgroundColor={colors.surface} />
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.iconButton }]}>
          <ArrowLeft color={colors.text} size={19} strokeWidth={2.4} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Détails de la liste
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
            <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.heroTopRow}>
                <View style={[styles.listIcon, { backgroundColor: colors.activeSoft }]}>
                  <Film color={colors.red} size={22} strokeWidth={2.25} />
                </View>
                <View style={[styles.visibilityBadge, { backgroundColor: colors.cardMuted }]}>
                  {list?.is_public ? <Globe2 color={colors.muted} size={13} /> : <LockKeyhole color={colors.muted} size={13} />}
                  <Text style={[styles.visibilityText, { color: colors.muted }]}>
                    {list?.is_public ? 'Publique' : 'Privée'}
                  </Text>
                </View>
              </View>
               <Text style={[styles.title, { color: colors.text }]}>{list?.name}</Text>
               {list?.description ? (
                 <Text style={[styles.description, { color: colors.muted }]}>{list.description}</Text>
               ) : null}
              <View style={styles.metaRow}>
                <View style={[styles.countPill, { backgroundColor: colors.cardMuted }]}>
                  <Play color={colors.red} size={12} fill={colors.red} />
                  <Text style={[styles.countText, { color: colors.muted }]}>{movies.length} film{movies.length !== 1 ? 's' : ''}</Text>
                </View>
                {list?.owner_username ? (
                  <View style={styles.ownerRow}>
                    <UserRound color={colors.subtle} size={13} />
                    <Text style={[styles.meta, { color: colors.subtle }]}>par {list.owner_username}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.cardMuted }]}>
                <Film color={colors.muted} size={26} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Cette liste est vide</Text>
              <Text style={[styles.emptyDescription, { color: colors.muted }]}>Les films ajoutés à cette liste apparaîtront ici.</Text>
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
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 64,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 36,
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 96,
  },
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 22,
    padding: 18,
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  listIcon: {
    alignItems: 'center',
    borderRadius: 14,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  visibilityBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  visibilityText: {
    fontSize: 11,
    fontWeight: '800',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 31,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  countPill: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  countText: {
    fontSize: 12,
    fontWeight: '800',
  },
  ownerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  meta: {
    fontSize: 12,
    fontWeight: '700',
  },
  movieRow: {
    gap: 12,
  },
  movieCard: {
    flex: 1,
    marginBottom: 16,
    maxWidth: '50%',
  },
  movieCardPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  poster: {
    aspectRatio: 2 / 3,
    borderRadius: 14,
    width: '100%',
  },
  posterFallback: {
    alignItems: 'center',
    aspectRatio: 2 / 3,
    borderRadius: 14,
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
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  movieInfo: {
    gap: 2,
    paddingHorizontal: 2,
    paddingTop: 8,
  },
  movieYear: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    minHeight: 240,
    justifyContent: 'center',
    padding: 24,
  },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: 18,
    height: 58,
    justifyContent: 'center',
    marginBottom: 14,
    width: 58,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  emptyDescription: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    maxWidth: 220,
    textAlign: 'center',
  },
});

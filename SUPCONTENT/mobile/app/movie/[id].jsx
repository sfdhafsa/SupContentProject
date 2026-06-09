import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getMovieById } from '../../src/services/moviesApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const C = {
  red:    '#ef0d1a',
  white:  '#ffffff',
  black:  '#111827',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
  yellow: '#f59e0b',
  bg950:  '#030712',
};

function Stars({ rating, size = 14 }) {
  const stars = Math.round((rating / 10) * 5);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Text key={i} style={{ fontSize: size, color: i < stars ? C.yellow : 'rgba(255,255,255,0.3)' }}>★</Text>
      ))}
    </View>
  );
}

function CastCard({ person }) {
  return (
    <View style={styles.castCard}>
      <View style={styles.castPhoto}>
        {person.photo_url ? (
          <Image source={{ uri: person.photo_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={[styles.castPhoto, { backgroundColor: C.gray800, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 20 }}>👤</Text>
          </View>
        )}
      </View>
      <Text style={styles.castName} numberOfLines={2}>{person.name}</Text>
      <Text style={styles.castCharacter} numberOfLines={1}>{person.character}</Text>
    </View>
  );
}

function CrewCard({ name, role }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={styles.crewCard}>
      <View style={styles.crewAvatar}>
        <Text style={styles.crewInitials}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.crewName} numberOfLines={1}>{name}</Text>
        {role && <Text style={styles.crewRole} numberOfLines={1}>{role}</Text>}
      </View>
    </View>
  );
}

function SimilarCard({ movie, onPress }) {
  return (
    <Pressable onPress={() => onPress(movie.tmdb_id)} style={styles.similarCard}>
      <View style={styles.similarPoster}>
        {movie.poster_url ? (
          <Image source={{ uri: movie.poster_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={[styles.similarPoster, { backgroundColor: C.gray800, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 16 }}>🎬</Text>
          </View>
        )}
      </View>
      <Text style={styles.similarTitle} numberOfLines={2}>{movie.title}</Text>
      {movie.vote_average > 0 && (
        <Text style={styles.similarRating}>★ {movie.vote_average.toFixed(1)}</Text>
      )}
    </Pressable>
  );
}

function formatMoney(n) {
  if (!n || n === 0) return null;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

export default function MovieDetail() {
  const { id }   = useLocalSearchParams();
  const router   = useRouter();
  const [movie, setMovie]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getMovieById(id)
      .then(setMovie)
      .catch(() => setError('Film introuvable'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingPage}>
        <ActivityIndicator color={C.red} size="large" />
      </View>
    );
  }

  if (error || !movie) {
    return (
      <View style={styles.loadingPage}>
        <Text style={{ color: C.white, fontSize: 16, marginBottom: 16 }}>{error || 'Film introuvable'}</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </Pressable>
      </View>
    );
  }

  const year    = movie.release_date?.slice(0, 4);
  const rating  = movie.vote_average ? parseFloat(movie.vote_average) : null;
  const budget  = formatMoney(movie.budget);
  const revenue = formatMoney(movie.revenue);

  return (
    <View style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── BACKDROP ── */}
        <View style={styles.backdrop}>
          {movie.backdrop_url ? (
            <Image source={{ uri: movie.backdrop_url }} style={styles.backdropImage} resizeMode="cover" />
          ) : movie.poster_url ? (
            <Image source={{ uri: movie.poster_url }} style={styles.backdropImage} resizeMode="cover" />
          ) : (
            <View style={[styles.backdropImage, { backgroundColor: C.gray800 }]} />
          )}
          {/* Overlay */}
          <View style={styles.backdropOverlay} />

          {/* Back button */}
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={{ color: C.white, fontSize: 16 }}>←</Text>
          </Pressable>

          {/* Glow effect autour du poster */}
          <View style={styles.posterContainer}>
            <View style={styles.posterGlow} />
            <View style={styles.posterWrapper}>
              {movie.poster_url ? (
                <Image source={{ uri: movie.poster_url }} style={styles.poster} resizeMode="cover" />
              ) : (
                <View style={[styles.poster, { backgroundColor: C.gray800, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 40 }}>🎬</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── INFOS ── */}
        <View style={styles.content}>

          {/* Genres */}
          {movie.genres?.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 10 }}>
              {movie.genres.map((g) => (
                <View key={g.id} style={styles.genreBadge}>
                  <Text style={styles.genreBadgeText}>{g.name}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Title */}
          <Text style={styles.title}>{movie.title}</Text>
          {movie.tagline && <Text style={styles.tagline}>"{movie.tagline}"</Text>}

          {/* Meta row */}
          <View style={styles.metaRow}>
            {year && <Text style={styles.metaText}>{year}</Text>}
            {year && movie.runtime_minutes && <Text style={styles.metaDot}>•</Text>}
            {movie.runtime_minutes && (
              <Text style={styles.metaText}>{Math.floor(movie.runtime_minutes / 60)}h {movie.runtime_minutes % 60}min</Text>
            )}
            {movie.original_language && (
              <>
                <Text style={styles.metaDot}>•</Text>
                <Text style={[styles.metaText, { textTransform: 'uppercase' }]}>{movie.original_language}</Text>
              </>
            )}
          </View>

          {/* Rating */}
          {rating && (
            <View style={styles.ratingBox}>
              <Stars rating={rating} size={16} />
              <Text style={styles.ratingScore}>{rating.toFixed(1)}</Text>
              <Text style={styles.ratingMax}>/ 10</Text>
              {movie.vote_count && (
                <Text style={styles.ratingVotes}>({movie.vote_count.toLocaleString()} votes)</Text>
              )}
            </View>
          )}

          {/* Overview */}
          {movie.overview && (
            <View style={styles.overviewSection}>
              <Text style={styles.sectionLabel}>Synopsis</Text>
              <Text style={styles.overviewText}>{movie.overview}</Text>
            </View>
          )}

          {/* Budget / Revenue */}
          {(budget || revenue) && (
            <View style={styles.statsRow}>
              {budget && (
                <View style={styles.statCard}>
                  <Text style={styles.statLabel}>Budget</Text>
                  <Text style={styles.statValue}>{budget}</Text>
                </View>
              )}
              {revenue && (
                <View style={[styles.statCard, { borderColor: '#10b981' }]}>
                  <Text style={styles.statLabel}>Revenus</Text>
                  <Text style={[styles.statValue, { color: '#10b981' }]}>{revenue}</Text>
                </View>
              )}
            </View>
          )}

          {/* Buttons */}
          <View style={styles.actions}>
            <Pressable
              style={styles.addButton}
              onPress={() => {/* personne 3 */}}
            >
              <Text style={styles.addButtonText}>+ Ma bibliothèque</Text>
            </Pressable>
            <Pressable onPress={() => router.back()} style={styles.backActionButton}>
              <Text style={styles.backActionText}>← Retour</Text>
            </Pressable>
          </View>

          {/* Directors */}
          {movie.directors?.length > 0 && (
            <View style={styles.crewSection}>
              <Text style={styles.sectionLabel}>
                {movie.directors.length > 1 ? 'Réalisateurs' : 'Réalisateur'}
              </Text>
              {movie.directors.map((d) => (
                <CrewCard key={d.id} name={d.name} />
              ))}
            </View>
          )}

          {/* Cast */}
          {movie.cast?.length > 0 && (
            <View style={styles.castSection}>
              <Text style={styles.sectionLabel}>Casting</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
                {movie.cast.map((person) => (
                  <CastCard key={person.id} person={person} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Writers + Producers */}
          {(movie.writers?.length > 0 || movie.producers?.length > 0) && (
            <View style={styles.crewSection}>
              {movie.writers?.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Scénariste(s)</Text>
                  {movie.writers.map((w) => <CrewCard key={w.id} name={w.name} role={w.job} />)}
                </>
              )}
              {movie.producers?.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Producteur(s)</Text>
                  {movie.producers.map((p) => <CrewCard key={p.id} name={p.name} role="Producteur" />)}
                </>
              )}
            </View>
          )}

          {/* Similar */}
          {movie.similar?.length > 0 && (
            <View style={styles.similarSection}>
              <Text style={styles.sectionLabel}>Films similaires</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
                {movie.similar.map((m) => (
                  <SimilarCard key={m.tmdb_id} movie={m} onPress={(tmdbId) => router.push(`/movie/${tmdbId}`)} />
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const BACKDROP_HEIGHT = 280;
const POSTER_WIDTH    = 110;

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: C.bg950,
  },
  loadingPage: {
    flex: 1,
    backgroundColor: C.bg950,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Backdrop
  backdrop: {
    height: BACKDROP_HEIGHT,
    position: 'relative',
  },
  backdropImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  backdropOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BACKDROP_HEIGHT,
    backgroundColor: 'rgba(3,7,18,0.6)',
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterContainer: {
    position: 'absolute',
    bottom: -50,
    left: 20,
  },
  posterGlow: {
    position: 'absolute',
    width: POSTER_WIDTH + 20,
    height: POSTER_WIDTH * 1.5 + 20,
    top: -10,
    left: -10,
    borderRadius: 16,
    backgroundColor: C.red,
    opacity: 0.2,
  },
  posterWrapper: {
    width: POSTER_WIDTH,
    height: POSTER_WIDTH * 1.5,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  poster: {
    width: '100%',
    height: '100%',
  },

  // Content
  content: {
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  genreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  genreBadgeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    color: C.white,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    marginBottom: 4,
  },
  tagline: {
    color: C.gray400,
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  metaText: {
    color: C.gray400,
    fontSize: 12,
  },
  metaDot: {
    color: C.gray500,
    fontSize: 12,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  ratingScore: {
    color: C.white,
    fontSize: 20,
    fontWeight: '800',
  },
  ratingMax: {
    color: C.gray400,
    fontSize: 13,
  },
  ratingVotes: {
    color: C.gray500,
    fontSize: 11,
    marginLeft: 4,
  },

  // Overview
  overviewSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: C.gray400,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  overviewText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    lineHeight: 22,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statLabel: {
    color: C.gray400,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    color: C.white,
    fontSize: 15,
    fontWeight: '800',
  },

  // Actions
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  addButton: {
    flex: 1,
    backgroundColor: C.red,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '800',
  },
  backActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  backActionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },

  // Crew
  crewSection: {
    marginBottom: 20,
  },
  crewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  crewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crewInitials: {
    color: C.white,
    fontSize: 12,
    fontWeight: '800',
  },
  crewName: {
    color: C.white,
    fontSize: 13,
    fontWeight: '700',
  },
  crewRole: {
    color: C.gray400,
    fontSize: 11,
    marginTop: 2,
  },

  // Cast
  castSection: {
    marginBottom: 20,
  },
  castCard: {
    width: 72,
    alignItems: 'center',
  },
  castPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: C.gray800,
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  castName: {
    color: C.white,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 13,
  },
  castCharacter: {
    color: C.gray400,
    fontSize: 9,
    textAlign: 'center',
    marginTop: 2,
  },

  // Similar
  similarSection: {
    marginBottom: 20,
  },
  similarCard: {
    width: 100,
  },
  similarPoster: {
    width: 100,
    height: 148,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: C.gray800,
    marginBottom: 6,
  },
  similarTitle: {
    color: C.white,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
  },
  similarRating: {
    color: C.yellow,
    fontSize: 10,
    marginTop: 2,
  },

  // Back button
  backButton: {
    backgroundColor: C.red,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backButtonText: {
    color: C.white,
    fontWeight: '700',
  },
});
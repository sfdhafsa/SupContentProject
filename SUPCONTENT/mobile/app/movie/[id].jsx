import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getMovieById } from '../../src/services/moviesApi';

const { width: SW, height: SH } = Dimensions.get('window');
const BACKDROP_H = Math.round(SH * 0.32);
const POSTER_W   = Math.round(SW * 0.30);
const POSTER_H   = Math.round(POSTER_W * 1.5);

const C = {
  red:    '#ef0d1a',
  white:  '#ffffff',
  black:  '#111827',
  gray200:'#e5e7eb',
  gray400:'#9ca3af',
  gray500:'#6b7280',
  gray800:'#1f2937',
  yellow: '#f59e0b',
  bg:     '#030712',
  green:  '#10b981',
};

function Stars({ rating, size = 14 }) {
  const filled = Math.round((rating / 10) * 5);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Text key={i} style={{ fontSize: size, color: i < filled ? C.yellow : 'rgba(255,255,255,0.22)' }}>★</Text>
      ))}
    </View>
  );
}

function CrewCard({ name, role }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={s.crewCard}>
      <View style={s.crewAvatar}>
        <Text style={{ color: C.white, fontSize: 13, fontWeight: '800' }}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: C.white, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{name}</Text>
        {role && <Text style={{ color: C.gray400, fontSize: 11, marginTop: 1 }} numberOfLines={1}>{role}</Text>}
      </View>
    </View>
  );
}

function formatMoney(n) {
  if (!n || n === 0) return null;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(0)}M`;
  return `$${n.toLocaleString()}`;
}

export default function MovieDetail() {
  const { id }    = useLocalSearchParams();
  const router    = useRouter();
  const [movie, setMovie]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

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
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator color={C.red} size="large" />
      </View>
    );
  }

  if (error || !movie) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="light-content" />
        <Text style={{ color: C.white, fontSize: 16, marginBottom: 20, textAlign: 'center', paddingHorizontal: 24 }}>
          {error || 'Film introuvable'}
        </Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={{ backgroundColor: C.red, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
        >
          <Text style={{ color: C.white, fontWeight: '800', fontSize: 15 }}>← Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const year    = movie.release_date?.slice(0, 4);
  const rating  = movie.vote_average ? parseFloat(movie.vote_average) : null;
  const budget  = formatMoney(movie.budget);
  const revenue = formatMoney(movie.revenue);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}
        bounces
      >
        {/* ── BACKDROP ── */}
        <View style={{ width: SW, height: BACKDROP_H }}>
          {(movie.backdrop_url || movie.poster_url)
            ? <Image
                source={{ uri: movie.backdrop_url || movie.poster_url }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            : <View style={[StyleSheet.absoluteFill, { backgroundColor: C.gray800 }]} />
          }
          {/* Overlay */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(3,7,18,0.58)' }]} />

          {/* Bouton retour en SafeAreaView */}
          <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={{
                margin: 14,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(0,0,0,0.55)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: C.white, fontSize: 20, lineHeight: 24 }}>←</Text>
            </Pressable>
          </SafeAreaView>

          {/* Poster avec glow */}
          <View style={{
            position: 'absolute',
            bottom: -(POSTER_H * 0.42),
            left: 16,
          }}>
            {/* Glow */}
            <View style={{
              position: 'absolute',
              width: POSTER_W + 18,
              height: POSTER_H + 18,
              top: -9,
              left: -9,
              borderRadius: 14,
              backgroundColor: C.red,
              opacity: 0.18,
            }} />
            <View style={{
              width: POSTER_W,
              height: POSTER_H,
              borderRadius: 12,
              overflow: 'hidden',
              elevation: 12,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
            }}>
              {movie.poster_url
                ? <Image source={{ uri: movie.poster_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                : <View style={{ flex: 1, backgroundColor: C.gray800, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 36 }}>🎬</Text>
                  </View>
              }
            </View>
          </View>
        </View>

        {/* ── CONTENU ── */}
        <View style={{ paddingTop: POSTER_H * 0.48, paddingHorizontal: 16 }}>

          {/* Genres */}
          {movie.genres?.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, marginBottom: 14 }}
            >
              {movie.genres.map((g) => (
                <View key={g.id} style={{
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 20,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.14)',
                }}>
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600' }}>{g.name}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Titre */}
          <Text style={{ color: C.white, fontSize: 22, fontWeight: '800', lineHeight: 28, marginBottom: 4 }}>
            {movie.title}
          </Text>
          {movie.tagline && (
            <Text style={{ color: C.gray400, fontSize: 13, fontStyle: 'italic', marginBottom: 10 }}>
              "{movie.tagline}"
            </Text>
          )}

          {/* Meta */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            {year && <Text style={{ color: C.gray400, fontSize: 13 }}>{year}</Text>}
            {year && movie.runtime_minutes && <Text style={{ color: C.gray500 }}>•</Text>}
            {movie.runtime_minutes && (
              <Text style={{ color: C.gray400, fontSize: 13 }}>
                {Math.floor(movie.runtime_minutes / 60)}h{movie.runtime_minutes % 60}min
              </Text>
            )}
            {movie.original_language && (
              <>
                <Text style={{ color: C.gray500 }}>•</Text>
                <Text style={{ color: C.gray400, fontSize: 13, textTransform: 'uppercase' }}>
                  {movie.original_language}
                </Text>
              </>
            )}
            {movie.status && (
              <>
                <Text style={{ color: C.gray500 }}>•</Text>
                <View style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 10,
                  backgroundColor: 'rgba(16,185,129,0.18)',
                  borderWidth: 1,
                  borderColor: 'rgba(16,185,129,0.3)',
                }}>
                  <Text style={{ color: C.green, fontSize: 11, fontWeight: '700' }}>{movie.status}</Text>
                </View>
              </>
            )}
          </View>

          {/* Rating */}
          {rating && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginBottom: 16,
              backgroundColor: 'rgba(255,255,255,0.05)',
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              flexWrap: 'wrap',
            }}>
              <Stars rating={rating} size={16} />
              <Text style={{ color: C.white, fontSize: 20, fontWeight: '800' }}>{rating.toFixed(1)}</Text>
              <Text style={{ color: C.gray400, fontSize: 13 }}>/ 10</Text>
              {movie.vote_count && (
                <Text style={{ color: C.gray500, fontSize: 12 }}>
                  ({movie.vote_count.toLocaleString()} votes)
                </Text>
              )}
            </View>
          )}

          {/* Synopsis */}
          {movie.overview && (
            <View style={{ marginBottom: 16 }}>
              <Text style={s.sectionLbl}>SYNOPSIS</Text>
              <Text style={{ color: 'rgba(255,255,255,0.78)', fontSize: 14, lineHeight: 22 }}>
                {movie.overview}
              </Text>
            </View>
          )}

          {/* Budget / Revenue */}
          {(budget || revenue) && (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {budget && (
                <View style={s.statCard}>
                  <Text style={s.statLbl}>Budget</Text>
                  <Text style={s.statVal}>{budget}</Text>
                </View>
              )}
              {revenue && (
                <View style={[s.statCard, { borderColor: 'rgba(16,185,129,0.3)' }]}>
                  <Text style={s.statLbl}>Revenus</Text>
                  <Text style={[s.statVal, { color: C.green }]}>{revenue}</Text>
                </View>
              )}
            </View>
          )}

          {/* Boutons */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
            <Pressable
              style={{ flex: 1, backgroundColor: C.red, paddingVertical: 14, borderRadius: 14, alignItems: 'center' }}
              onPress={() => {/* personne 3 */}}
            >
              <Text style={{ color: C.white, fontSize: 15, fontWeight: '800' }}>+ Ma bibliothèque</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              hitSlop={6}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: '700' }}>← Retour</Text>
            </Pressable>
          </View>

          {/* Réalisateur */}
          {movie.directors?.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={s.sectionLbl}>
                {movie.directors.length > 1 ? 'RÉALISATEURS' : 'RÉALISATEUR'}
              </Text>
              {movie.directors.map((d) => <CrewCard key={d.id} name={d.name} />)}
            </View>
          )}

          {/* Casting */}
          {movie.cast?.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={s.sectionLbl}>CASTING</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 14 }}
              >
                {movie.cast.map((person) => (
                  <View key={person.id} style={{ width: 70, alignItems: 'center' }}>
                    <View style={{
                      width: 54,
                      height: 54,
                      borderRadius: 27,
                      overflow: 'hidden',
                      backgroundColor: C.gray800,
                      marginBottom: 6,
                      borderWidth: 2,
                      borderColor: 'rgba(255,255,255,0.1)',
                    }}>
                      {person.photo_url
                        ? <Image source={{ uri: person.photo_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 20 }}>👤</Text>
                          </View>
                      }
                    </View>
                    <Text style={{ color: C.white, fontSize: 10, fontWeight: '700', textAlign: 'center', lineHeight: 13 }} numberOfLines={2}>
                      {person.name}
                    </Text>
                    <Text style={{ color: C.gray400, fontSize: 9, textAlign: 'center', marginTop: 2 }} numberOfLines={1}>
                      {person.character}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Scénaristes + Producteurs */}
          {(movie.writers?.length > 0 || movie.producers?.length > 0) && (
            <View style={{ marginBottom: 20 }}>
              {movie.writers?.length > 0 && (
                <>
                  <Text style={s.sectionLbl}>SCÉNARISTE(S)</Text>
                  {movie.writers.map((w) => <CrewCard key={w.id} name={w.name} role={w.job} />)}
                </>
              )}
              {movie.producers?.length > 0 && (
                <>
                  <Text style={[s.sectionLbl, { marginTop: 14 }]}>PRODUCTEUR(S)</Text>
                  {movie.producers.map((p) => <CrewCard key={p.id} name={p.name} role="Producteur" />)}
                </>
              )}
            </View>
          )}

          {/* Films similaires */}
          {movie.similar?.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <Text style={s.sectionLbl}>FILMS SIMILAIRES</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
              >
                {movie.similar.map((m) => (
                  <Pressable
                    key={m.tmdb_id}
                    onPress={() => router.push(`/movie/${m.tmdb_id}`)}
                    style={{ width: Math.round(SW * 0.24) }}
                  >
                    <View style={{
                      width: Math.round(SW * 0.24),
                      height: Math.round(SW * 0.24 * 1.5),
                      borderRadius: 10,
                      overflow: 'hidden',
                      backgroundColor: C.gray800,
                      marginBottom: 6,
                    }}>
                      {m.poster_url
                        ? <Image source={{ uri: m.poster_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 16 }}>🎬</Text>
                          </View>
                      }
                    </View>
                    <Text style={{ color: C.white, fontSize: 10, fontWeight: '600', lineHeight: 13 }} numberOfLines={2}>
                      {m.title}
                    </Text>
                    {m.vote_average > 0 && (
                      <Text style={{ color: C.yellow, fontSize: 9, marginTop: 2 }}>
                        ★{m.vote_average.toFixed(1)}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  sectionLbl: {
    color: C.gray400,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  crewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
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
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  statLbl: {
    color: C.gray400,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statVal: {
    color: C.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
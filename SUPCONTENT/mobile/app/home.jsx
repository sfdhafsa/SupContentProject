import { Flame, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BottomTabBar from '../src/components/BottomTabBar';
import RequireAuth from '../src/components/RequireAuth';
import ScreenContainer from '../src/components/ScreenContainer';
import TopNavbar from '../src/components/TopNavbar';
import FeedList from '../src/components/feed/FeedList';
import { useFeed } from '../src/hooks/useFeed';
import { getAuthUser } from '../src/services/authStorage';
import { getTrending } from '../src/services/moviesApi';

const { width: SW } = Dimensions.get('window');
const CARD_W = Math.round(SW * 0.36);
const CARD_H = Math.round(CARD_W * 1.5);

const C = {
  red:     '#ef0d1a',
  white:   '#ffffff',
  black:   '#111827',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  yellow:  '#f59e0b',
  bg:      '#ffffff',
};

// ── Salutation automatique selon l'heure locale de l'appareil ──
function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return 'Bonjour';
  if (h >= 12 && h < 18) return 'Bon après-midi';
  return 'Bonsoir'; // 18h00 → 04h59
}

// ── SkeletonBox ──
function SkeletonBox({ width, height, borderRadius = 8, style }) {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: C.gray200, opacity: anim }, style]} />
  );
}

function SkeletonMovieCard() {
  return (
    <View style={{ width: CARD_W, marginRight: 12 }}>
      <SkeletonBox width={CARD_W} height={CARD_H} borderRadius={12} />
      <SkeletonBox width={CARD_W * 0.75} height={10} borderRadius={4} style={{ marginTop: 8 }} />
      <SkeletonBox width={CARD_W * 0.45} height={9}  borderRadius={4} style={{ marginTop: 4 }} />
    </View>
  );
}

// ── AnimatedMovieCard ──
function AnimatedMovieCard({ movie, onPress, index }) {
  const scale    = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }).start();
  }, []);

  const pressIn  = () => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 25 }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 25 }).start();

  return (
    <Pressable onPress={() => onPress(movie.tmdb_id)} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={{
        width: CARD_W, marginRight: 12,
        opacity: fadeAnim,
        transform: [
          { scale },
          { translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
        ],
      }}>
        <View style={{
          width: CARD_W, height: CARD_H, borderRadius: 12, overflow: 'hidden',
          backgroundColor: C.gray200,
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
        }}>
          {movie.poster_url
            ? <Image source={{ uri: movie.poster_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            : <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.gray100 }}>
                <Text style={{ fontSize: 28, color: C.gray400 }}>—</Text>
              </View>
          }
          {movie.vote_average > 0 && (
            <View style={{
              position: 'absolute', top: 8, left: 8,
              backgroundColor: 'rgba(0,0,0,0.72)',
              paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8,
              flexDirection: 'row', alignItems: 'center', gap: 3,
            }}>
              <Text style={{ color: C.yellow, fontSize: 10 }}>★</Text>
              <Text style={{ color: C.white, fontSize: 10, fontWeight: '800' }}>
                {movie.vote_average.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 12, fontWeight: '700', color: C.black, marginTop: 8 }} numberOfLines={1}>
          {movie.title}
        </Text>
        {movie.release_date && (
          <Text style={{ fontSize: 11, color: C.gray400, marginTop: 2 }}>
            {movie.release_date.slice(0, 4)}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ── SectionHeader avec icône Lucide ──
function SectionHeader({ icon, title, onSeeAll }) {
  return (
    <View style={s.sectionHeader}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon}
        <Text style={s.sectionTitle}>{title}</Text>
      </View>
      {onSeeAll && (
        <Pressable onPress={onSeeAll} hitSlop={8}>
          <Text style={{ color: C.red, fontSize: 12, fontWeight: '700' }}>Tout voir</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── HomeContent ──
function HomeContent() {
  const router = useRouter();
  const [username, setUsername]               = useState('');
  const [currentUserId, setCurrentUserId]     = useState(null);
  const [trending, setTrending]               = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const { items: feedItems, loading: feedLoading, error: feedError } = useFeed();

  useEffect(() => {
    getAuthUser().then((user) => {
      setUsername(user?.username || user?.email?.split('@')[0] || 'Cinéphile');
      setCurrentUserId(user?.id ?? null);
    });

    Animated.spring(headerAnim, { toValue: 1, tension: 60, friction: 12, useNativeDriver: true }).start();

    setTrendingLoading(true);
    getTrending()
      .then((res) => setTrending((res.results || []).slice(0, 10)))
      .catch(() => setTrending([]))
      .finally(() => setTrendingLoading(false));
  }, []);

  const handleMoviePress = useCallback((tmdbId) => router.push(`/movie/${tmdbId}`), [router]);

  return (
    <ScreenContainer>
      <View style={s.page}>
        <TopNavbar username={username || 'User'} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>

          {/* ── Header personnalisé — sans badge Cinéphile ── */}
          <Animated.View style={[s.greetingSection, {
            opacity: headerAnim,
            transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
          }]}>
            <Text style={s.greetingLabel}>{getGreeting()},</Text>
            <Text style={s.greetingName}>{username || '…'}</Text>
            <Text style={s.greetingSub}>Découvrez les films du moment</Text>
          </Animated.View>

          {/* ── Tendances — icône Lucide Flame ── */}
          <View style={{ marginTop: 8 }}>
            <SectionHeader
              icon={<Flame size={16} color={C.red} strokeWidth={2.5} />}
              title="Tendances cette semaine"
              onSeeAll={() => router.push('/discover')}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 }}
            >
              {trendingLoading
                ? Array.from({ length: 5 }).map((_, i) => <SkeletonMovieCard key={i} />)
                : trending.map((movie, i) => (
                    <AnimatedMovieCard key={movie.tmdb_id} movie={movie} onPress={handleMoviePress} index={i} />
                  ))
              }
            </ScrollView>
          </View>

          {/* ── Activité des amis — icône Lucide Users ── */}
          <View style={{ marginTop: 20 }}>
            <SectionHeader
              icon={<Users size={16} color={C.red} strokeWidth={2.5} />}
              title="Activité des amis"
            />
            <View style={s.feedWrapper}>
              {feedLoading ? (
                <View style={{ gap: 12, paddingHorizontal: 16, paddingTop: 12 }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                      <SkeletonBox width={40} height={40} borderRadius={20} />
                      <View style={{ flex: 1, gap: 6 }}>
                        <SkeletonBox width="70%" height={10} borderRadius={4} />
                        <SkeletonBox width="50%" height={9}  borderRadius={4} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : feedError ? (
                <View style={s.feedEmpty}>
                  <Text style={{ color: C.gray400, fontSize: 13, textAlign: 'center' }}>
                    Impossible de charger l'activité
                  </Text>
                </View>
              ) : feedItems?.length === 0 ? (
                <View style={s.feedEmpty}>
                  <Text style={{ color: C.black, fontSize: 15, fontWeight: '700', marginBottom: 6 }}>
                    Aucune activité pour l'instant
                  </Text>
                  <Text style={{ color: C.gray400, fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                    Suivez des amis pour voir leurs films, critiques et listes ici.
                  </Text>
                  <Pressable onPress={() => router.push('/discover')} style={s.discoverBtn} hitSlop={4}>
                    <Text style={{ color: C.white, fontSize: 13, fontWeight: '800' }}>Explorer des films</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
                  <FeedList items={feedItems} loading={false} error={null} currentUserId={currentUserId} />
                </View>
              )}
            </View>
          </View>

        </ScrollView>
        <BottomTabBar />
      </View>
    </ScreenContainer>
  );
}

export default function Home() {
  return (
    <RequireAuth>
      <HomeContent />
    </RequireAuth>
  );
}

const s = StyleSheet.create({
  page:            { flex: 1, backgroundColor: C.bg },
  greetingSection: {
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.gray100,
  },
  greetingLabel: { fontSize: 13, color: C.gray400, fontWeight: '500' },
  greetingName:  { fontSize: 26, fontWeight: '800', color: C.black, marginTop: 2, marginBottom: 4 },
  greetingSub:   { fontSize: 13, color: C.gray500 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4,
  },
  sectionTitle:  { fontSize: 15, fontWeight: '800', color: C.black },
  feedWrapper:   { minHeight: 120 },
  feedEmpty:     { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 32 },
  discoverBtn:   { marginTop: 14, backgroundColor: C.red, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12 },
});
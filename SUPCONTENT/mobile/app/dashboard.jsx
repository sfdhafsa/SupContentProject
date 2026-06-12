import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabBar from '../src/components/BottomTabBar';
import TopNavbar from '../src/components/TopNavbar';
import { getAuthUser } from '../src/services/authStorage';
import { getLibraryStats } from '../src/services/libraryApi';

const { width: W } = Dimensions.get('window');
const IS_WEB = W > 500;

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { getAuthUser().then(setUser); }, []);
  useEffect(() => { if (user) fetchStats(); }, [user]);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await getLibraryStats();
      setStats(res.data || null);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const counts = stats?.counts || {};
  const moviesWatched = counts.COMPLETED || 0;
  const hoursWatched = stats?.totalHoursWatched || 0;
  const totalMovies = stats?.totalMovies || 0;

  const STAT_CARDS = [
    { label: 'Movies Watched', value: moviesWatched },
    { label: 'Hours Watched', value: hoursWatched },
    { label: 'Reviews', value: 0 },
    { label: 'Lists', value: 0 },
  ];

  const BAR_DATA = [
    { key: 'COMPLETED', label: 'Vus', color: '#10b981' },
    { key: 'IN_PROGRESS', label: 'En cours', color: '#f59e0b' },
    { key: 'TO_WATCH', label: 'A voir', color: '#6366f1' },
    { key: 'DROPPED', label: 'Abandonnes', color: '#ef4444' },
  ];

  return (
    <View style={IS_WEB ? s.pageWeb : s.pageMobile}>
      <View style={IS_WEB ? s.phoneWeb : s.phoneMobile}>
        <TopNavbar username={user?.username || 'User'} />

        <View style={s.subNav}>
          <Pressable style={s.subNavBtn} onPress={() => router.push('/library')}>
            <Text style={s.subNavText}>Biblio</Text>
          </Pressable>
          <Pressable style={s.subNavBtn} onPress={() => router.push('/lists')}>
            <Text style={s.subNavText}>Listes</Text>
          </Pressable>
          <Pressable style={[s.subNavBtn, s.subNavBtnActive]}>
            <Text style={[s.subNavText, s.subNavTextActive]}>Stats</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator color="#ef0d1a" size="large" /></View>
        ) : (
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

            <Text style={s.sectionTitle}>Your Statistics</Text>
            <View style={s.statGrid}>
              {STAT_CARDS.map(({ label, value }) => (
                <View key={label} style={s.statCard}>
                  <Text style={s.statValue}>{value}</Text>
                  <Text style={s.statLabel}>{label}</Text>
                </View>
              ))}
            </View>

            {totalMovies > 0 && (
              <>
                <Text style={s.sectionTitle}>Repartition</Text>
                <View style={s.barCard}>
                  <View style={s.barTrack}>
                    {BAR_DATA.map(({ key, color }) => {
                      const val = counts[key] || 0;
                      if (!val) return null;
                      return <View key={key} style={[s.barSegment, { flex: val, backgroundColor: color }]} />;
                    })}
                  </View>
                  <View style={s.barLegend}>
                    {BAR_DATA.map(({ key, label, color }) => {
                      const val = counts[key] || 0;
                      if (!val) return null;
                      const pct = Math.round((val / totalMovies) * 100);
                      return (
                        <View key={key} style={s.legendItem}>
                          <View style={[s.legendDot, { backgroundColor: color }]} />
                          <Text style={s.legendText}>{label} {pct}%</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </>
            )}

            {hoursWatched > 0 && (
              <>
                <Text style={s.sectionTitle}>Temps de visionnage</Text>
                <View style={s.durationCard}>
                  <Text style={s.durationValue}>{hoursWatched}h</Text>
                  <Text style={s.durationLabel}>de films regardes</Text>
                </View>
              </>
            )}

            {totalMovies === 0 && (
              <View style={s.emptyBox}>
                <Text style={s.emptyTitle}>Aucune statistique</Text>
                <Text style={s.emptySub}>Ajoutez des films a votre bibliotheque pour voir vos stats ici.</Text>
              </View>
            )}

          </ScrollView>
        )}

        <BottomTabBar />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  pageWeb: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', padding: 20 },
  pageMobile: { flex: 1, backgroundColor: '#ffffff' },
  phoneWeb: { backgroundColor: '#ffffff', borderRadius: 22, height: 592, maxWidth: 315, overflow: 'hidden', width: '100%' },
  phoneMobile: { flex: 1, backgroundColor: '#ffffff' },
  subNav: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  subNavBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  subNavBtnActive: { borderBottomWidth: 2, borderBottomColor: '#ef0d1a' },
  subNavText: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  subNavTextActive: { color: '#ef0d1a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 100, gap: 16 },
  sectionTitle: { color: '#111827', fontSize: 14, fontWeight: '800' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', backgroundColor: '#f9fafb', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', gap: 6 },
  statValue: { color: '#111827', fontSize: 26, fontWeight: '900' },
  statLabel: { color: '#9ca3af', fontSize: 10, textAlign: 'center' },
  barCard: { backgroundColor: '#f9fafb', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', gap: 10 },
  barTrack: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', gap: 1 },
  barSegment: { borderRadius: 6 },
  barLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { color: '#374151', fontSize: 11 },
  durationCard: { backgroundColor: '#f9fafb', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', gap: 6 },
  durationValue: { color: '#ef0d1a', fontSize: 36, fontWeight: '900' },
  durationLabel: { color: '#9ca3af', fontSize: 11 },
  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { color: '#111827', fontSize: 16, fontWeight: '800' },
  emptySub: { color: '#9ca3af', fontSize: 12, textAlign: 'center' },
});
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Pressable,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import BottomTabBar from '../src/components/BottomTabBar';
import TopNavbar from '../src/components/TopNavbar';
import { useTheme } from '../src/context/ThemeContext';
import { useBottomTabSpacing } from '../src/hooks/useBottomTabSpacing';
import { getAuthUser } from '../src/services/authStorage';
import { getLibraryStats } from '../src/services/libraryApi';

const BAR_DATA = [
  { key: 'COMPLETED',   label: 'Vus',        color: '#10b981' },
  { key: 'IN_PROGRESS', label: 'En cours',   color: '#f59e0b' },
  { key: 'TO_WATCH',    label: 'A voir',     color: '#6366f1' },
  { key: 'DROPPED',     label: 'Abandonnes', color: '#ef4444' },
];

export default function Dashboard() {
  const router = useRouter();
  const { colors } = useTheme();
  const { scrollPaddingBottom } = useBottomTabSpacing();
  const [user, setUser]       = useState(null);
  const [stats, setStats]     = useState(null);
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

  const counts       = stats?.counts || {};
  const totalMovies  = stats?.totalMovies || 0;
  const hoursWatched = stats?.totalHoursWatched || 0;
  const minsWatched  = stats?.totalMinutesWatched || 0;

  const STAT_CARDS = [
    { label: 'Films vus',  value: counts.COMPLETED   || 0, color: '#10b981' },
    { label: 'En cours',   value: counts.IN_PROGRESS || 0, color: '#f59e0b' },
    { label: 'A voir',     value: counts.TO_WATCH    || 0, color: '#6366f1' },
    { label: 'Abandonnes', value: counts.DROPPED     || 0, color: '#ef4444' },
  ];

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]}>
      <TopNavbar username={user?.username || 'User'} />

      <View style={[s.subNav, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable style={s.subNavBtn} onPress={() => router.push('/library')}>
          <Text style={[s.subNavText, { color: colors.subtle }]}>Biblio</Text>
        </Pressable>
        <Pressable style={s.subNavBtn} onPress={() => router.push('/lists')}>
          <Text style={[s.subNavText, { color: colors.subtle }]}>Listes</Text>
        </Pressable>
        <Pressable style={[s.subNavBtn, s.subNavBtnActive]}>
          <Text style={[s.subNavText, s.subNavTextActive]}>Stats</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color="#D0021B" size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingBottom: scrollPaddingBottom }]}
          showsVerticalScrollIndicator={false}
        >

          <View style={s.header}>
            <Text style={[s.headerTitle, { color: colors.text }]}>Mes statistiques</Text>
            <Text style={[s.headerSub, { color: colors.muted }]}>Votre activite cinema en un coup d'oeil</Text>
          </View>

          <View style={s.statGrid}>
            {STAT_CARDS.map(({ label, value, color }) => (
              <View key={label} style={[s.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[s.statIconBox, { backgroundColor: color + '18' }]} />
                <Text style={[s.statValue, { color }]}>{value}</Text>
                <Text style={[s.statLabel, { color: colors.muted }]}>{label}</Text>
              </View>
            ))}
          </View>

          {totalMovies > 0 && (
            <>
              <Text style={[s.sectionTitle, { color: colors.text }]}>Repartition</Text>
              <View style={[s.barCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                        <Text style={[s.legendText, { color: colors.muted }]}>{label}</Text>
                        <Text style={[s.legendPct, { color }]}>{pct}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          {hoursWatched > 0 && (
            <>
              <Text style={[s.sectionTitle, { color: colors.text }]}>Temps de visionnage</Text>
              <View style={[s.durationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={s.durationValue}>{hoursWatched}h {minsWatched}m</Text>
                <Text style={[s.durationLabel, { color: colors.subtle }]}>de films regardes au total</Text>
              </View>
            </>
          )}

          <View style={s.totalCard}>
            <Text style={s.totalLabel}>Total dans votre bibliotheque</Text>
            <Text style={s.totalValue}>{totalMovies} film{totalMovies !== 1 ? 's' : ''}</Text>
          </View>

          {totalMovies === 0 && (
            <View style={s.emptyBox}>
              <Text style={[s.emptyTitle, { color: colors.text }]}>Aucune statistique</Text>
              <Text style={[s.emptySub, { color: colors.subtle }]}>Ajoutez des films a votre bibliotheque pour voir vos stats ici.</Text>
              <Pressable style={s.goBtn} onPress={() => router.push('/library')}>
                <Text style={s.goBtnText}>Voir ma bibliotheque</Text>
              </Pressable>
            </View>
          )}

        </ScrollView>
      )}

      <BottomTabBar />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:             { flex: 1, backgroundColor: '#f9fafb' },
  subNav:           { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff' },
  subNavBtn:        { flex: 1, paddingVertical: 12, alignItems: 'center' },
  subNavBtnActive:  { borderBottomWidth: 2, borderBottomColor: '#D0021B' },
  subNavText:       { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  subNavTextActive: { color: '#D0021B' },
  center:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:           { padding: 16, gap: 16 },
  header:           { gap: 4 },
  headerTitle:      { color: '#111827', fontSize: 22, fontWeight: '900' },
  headerSub:        { color: '#6b7280', fontSize: 12 },
  statGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard:         { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', gap: 8 },
  statIconBox:      { width: 44, height: 44, borderRadius: 12 },
  statValue:        { fontSize: 28, fontWeight: '900' },
  statLabel:        { color: '#6b7280', fontSize: 11, textAlign: 'center', fontWeight: '600' },
  sectionTitle:     { color: '#111827', fontSize: 15, fontWeight: '800' },
  barCard:          { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', gap: 12 },
  barTrack:         { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', gap: 2 },
  barSegment:       { borderRadius: 7 },
  barLegend:        { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:        { width: 10, height: 10, borderRadius: 5 },
  legendText:       { color: '#374151', fontSize: 12, fontWeight: '600' },
  legendPct:        { fontSize: 12, fontWeight: '800' },
  durationCard:     { backgroundColor: '#fff', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', gap: 6 },
  durationValue:    { color: '#D0021B', fontSize: 40, fontWeight: '900' },
  durationLabel:    { color: '#9ca3af', fontSize: 12 },
  totalCard:        { backgroundColor: '#111827', borderRadius: 16, padding: 20, alignItems: 'center', gap: 6 },
  totalLabel:       { color: '#9ca3af', fontSize: 12 },
  totalValue:       { color: '#fff', fontSize: 24, fontWeight: '900' },
  emptyBox:         { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle:       { color: '#111827', fontSize: 18, fontWeight: '800' },
  emptySub:         { color: '#9ca3af', fontSize: 13, textAlign: 'center', lineHeight: 20 },
  goBtn:            { marginTop: 8, backgroundColor: '#D0021B', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  goBtnText:        { color: '#fff', fontSize: 14, fontWeight: '700' },
});

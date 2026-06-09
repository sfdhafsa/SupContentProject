import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import BottomTabBar from '../src/components/BottomTabBar';
import { useAuth } from '../src/services/authApi.js';
import api from '../src/config/api.js';

/* ── Utilitaires (inline, pas besoin d'import externe) ── */

function firstPresent(...values) {
  for (const v of values) {
    if (v !== null && v !== undefined && v !== '') return v;
  }
  return null;
}

function getYear(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return String(d.getFullYear());
  const match = String(dateStr).match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : null;
}

function formatShortDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMonthYear(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace('.0', '')}k`;
  return String(num);
}

/* ── Constantes ── */

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (315 - 24 - 8) / 2;
const TABS = ['Overview', 'Reviews', 'Lists', 'Stats'];
const RED = '#ef0d1a';
const BG = '#f3f4f6';
const CARD = '#ffffff';
const TEXT = '#111827';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';

/* ── Formatage review ── */

const formatReview = (review) => ({
  id: review.id,
  movieId: review.external_id,
  poster: review.poster_url,
  movie: review.title,
  year: getYear(firstPresent(review.release_date, review.release_year, review.year)),
  rating: Number(review.rating || 0),
  date: formatShortDate(firstPresent(review.created_at, review.updated_at)),
  review: review.text || 'A noté ce film.',
});

/* ── Composants UI ── */

function Banner() {
  return (
    <View style={styles.banner}>
      {Array.from({ length: 18 }).map((_, i) => (
        <View key={i} style={styles.bannerCell} />
      ))}
      <View style={styles.bannerReel} />
    </View>
  );
}

function Avatar({ uri, initials }) {
  return (
    <View style={styles.avatarRing}>
      <View style={styles.avatar}>
        {uri ? (
          <Image source={{ uri }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarInitials}>{initials}</Text>
        )}
      </View>
    </View>
  );
}

function SearchBar({ value, onChange }) {
  return (
    <View style={styles.searchBar}>
      <View style={styles.searchIconWrap}>
        <View style={styles.searchCircle} />
        <View style={styles.searchHandle} />
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="Rechercher films, personnes..."
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChange}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChange('')} style={styles.clearBtn}>
          <Text style={styles.clearText}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

function Skeleton({ style }) {
  return <View style={[styles.skeleton, style]} />;
}

function StatsTab({ stats, listsCount }) {
  // Estimation grossière: durée moyenne film ~1h50
  const hoursWatched = Math.round(stats.movies_watched * 1.83);
  const cards = [
    { label: 'Films vus', value: String(stats.movies_watched) },
    { label: 'Heures vues', value: String(hoursWatched) },
    { label: 'Critiques', value: String(stats.reviews) },
    { label: 'Listes créées', value: String(listsCount) },
  ];
  return (
    <View style={styles.statsGrid}>
      {cards.map((c) => (
        <View key={c.label} style={styles.statCard}>
          <Text style={styles.statCardLabel}>{c.label}</Text>
          <Text style={styles.statCardValue}>{c.value}</Text>
        </View>
      ))}
    </View>
  );
}

function EmptyTab({ label, sub }) {
  return (
    <View style={styles.emptyTab}>
      <View style={styles.emptyIcon}>
        <View style={styles.filmIconRect} />
      </View>
      <Text style={styles.emptyTabText}>{label}</Text>
      {sub && <Text style={styles.emptyTabSub}>{sub}</Text>}
    </View>
  );
}

function StarRating({ rating }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Text key={s} style={[styles.starText, s <= rating && styles.starTextFilled]}>★</Text>
      ))}
    </View>
  );
}

function ReviewCard({ item }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewMovieRow}>
        <View style={styles.reviewPoster}>
          {item.poster ? (
            <Image source={{ uri: item.poster }} style={styles.reviewPosterImage} />
          ) : (
            <View style={styles.reviewPosterPlaceholder} />
          )}
        </View>
        <View style={styles.reviewMovieInfo}>
          <Text style={styles.reviewMovieTitle} numberOfLines={1}>{item.movie}</Text>
          {item.year && <Text style={styles.reviewMovieYear}>{item.year}</Text>}
        </View>
      </View>
      <View style={styles.reviewRatingRow}>
        <StarRating rating={item.rating} />
        {item.date && <Text style={styles.reviewDate}>{item.date}</Text>}
      </View>
      <Text style={styles.reviewText} numberOfLines={3}>{item.review}</Text>
    </View>
  );
}

function ListCard({ list }) {
  const count = list.movie_count ?? list.movies?.length ?? 0;
  return (
    <View style={styles.listCard}>
      <View style={styles.listIconWrap}>
        <View style={styles.filmIconRect} />
      </View>
      <View style={styles.listInfo}>
        <Text style={styles.listName}>{list.name}</Text>
        <Text style={styles.listCount}>{count} film{count !== 1 ? 's' : ''}</Text>
      </View>
      <View style={[styles.listBadge, list.is_public ? styles.listBadgePublic : styles.listBadgePrivate]}>
        <Text style={[styles.listBadgeText, list.is_public && styles.listBadgeTextPublic]}>
          {list.is_public ? 'Public' : 'Privé'}
        </Text>
      </View>
    </View>
  );
}

function FollowModal({ visible, title, users, loading, emptyMessage, onClose }) {
  const [query, setQuery] = useState('');
  const filtered = users.filter((u) =>
    (u.username || '').toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>×</Text>
            </Pressable>
          </View>
          <View style={styles.modalSearchWrap}>
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Rechercher"
              placeholderTextColor="#9ca3af"
              value={query}
              onChangeText={setQuery}
            />
          </View>
          <ScrollView style={styles.modalList}>
            {loading ? (
              <>
                <Skeleton style={{ height: 50, marginBottom: 8 }} />
                <Skeleton style={{ height: 50, marginBottom: 8 }} />
                <Skeleton style={{ height: 50 }} />
              </>
            ) : filtered.length === 0 ? (
              <Text style={styles.modalEmpty}>{query ? 'Aucun résultat.' : emptyMessage}</Text>
            ) : (
              filtered.map((u) => (
                <View key={u.id} style={styles.followRow}>
                  <View style={styles.followAvatar}>
                    {u.avatar_url ? (
                      <Image source={{ uri: u.avatar_url }} style={styles.followAvatarImg} />
                    ) : (
                      <Text style={styles.followAvatarInitials}>
                        {(u.username || 'U').slice(0, 2).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View>
                    <Text style={styles.followUsername}>{u.username}</Text>
                    <Text style={styles.followHandle}>@{u.username}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ── Composant principal ── */

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Overview');
  const [profileLoading, setProfileLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [lists, setLists] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    movies_watched: 0,
    reviews: 0,
  });
  const [followModal, setFollowModal] = useState(null); // 'followers' | 'following' | null

  // Dérivées
  const username = user?.username || '';
  const bio = user?.bio || '';
  const avatar = user?.avatar_url || null;
  const websiteUrl = user?.website_url || null;
  const roles = user?.roles || [];
  const isAdmin = roles.map((r) => String(r).toLowerCase()).includes('admin');
  const initials = username.slice(0, 2).toUpperCase();
  const joinDate = formatMonthYear(
    firstPresent(user?.created_at, user?.createdAt, user?.profile?.created_at)
  );

  useEffect(() => {
    if (!user?.id) return;

    const fetchProfileData = async () => {
      setProfileLoading(true);
      try {
        const [exportRes, libraryRes, followersRes, followingRes] = await Promise.all([
          api.get('/users/me/export'),
          api.get('/library/stats'),
          api.get(`/social/follow/${user.id}/followers`),
          api.get(`/social/follow/${user.id}/following`),
        ]);

        const exportData = exportRes.data || {};
        const activeReviews = (exportData.reviews || []).filter((r) => !r.deleted_at);
        const customLists = exportData.custom_lists || [];
        const libraryStats = libraryRes.data?.data || {};

        setReviews(activeReviews.map(formatReview));
        setLists(customLists);
        setFollowersList(followersRes.data?.followers || []);
        setFollowingList(followingRes.data?.following || []);
        setStats({
          followers: followersRes.data?.count || 0,
          following: followingRes.data?.count || 0,
          movies_watched: libraryStats.counts?.COMPLETED || libraryStats.totalMovies || 0,
          reviews: activeReviews.length,
        });
      } catch (err) {
        console.error('Profile fetch error:', err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfileData();
  }, [user?.id]);

  if (authLoading || !user) {
    return (
      <View style={styles.page}>
        <View style={styles.phone}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={RED} />
          </View>
          <BottomTabBar />
        </View>
      </View>
    );
  }

  function renderTabContent() {
    if (profileLoading) {
      return (
        <View style={styles.skeletonList}>
          <Skeleton style={{ height: 80, marginBottom: 8 }} />
          <Skeleton style={{ height: 80, marginBottom: 8 }} />
          <Skeleton style={{ height: 80 }} />
        </View>
      );
    }

    switch (activeTab) {
      case 'Stats':
        return <StatsTab stats={stats} listsCount={lists.length} />;

      case 'Overview':
        return (
          <View>
            <Text style={styles.sectionTitle}>Informations du compte</Text>
            <View style={styles.infoCard}>
              {[
                { label: 'Email', value: user?.email },
                { label: 'Nom d\'utilisateur', value: `@${username}` },
                { label: 'Bio', value: bio || '—' },
                { label: 'Site web', value: websiteUrl || '—' },
                { label: 'Membre depuis', value: joinDate || '—' },
              ].map(({ label, value }) => (
                <View key={label} style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Activité récente</Text>
            {reviews.length === 0 ? (
              <EmptyTab
                label="Aucune activité récente."
                sub="Commencez à noter des films pour les voir ici."
              />
            ) : (
              reviews.slice(0, 3).map((item) => <ReviewCard key={item.id} item={item} />)
            )}
          </View>
        );

      case 'Reviews':
        return reviews.length === 0 ? (
          <EmptyTab label="Aucune critique." sub="Notez et critiquez des films pour les voir ici." />
        ) : (
          <View>
            {reviews.map((item) => (
              <ReviewCard key={item.id} item={item} />
            ))}
          </View>
        );

      case 'Lists':
        return lists.length === 0 ? (
          <EmptyTab label="Aucune liste." sub="Créez des listes pour organiser vos films." />
        ) : (
          <View>
            {lists.map((list) => (
              <ListCard key={list.id} list={list} />
            ))}
          </View>
        );

      default:
        return null;
    }
  }

  return (
    <View style={styles.page}>
      <View style={styles.phone}>
        {/* Barre de recherche */}
        <View style={styles.searchWrapper}>
          <SearchBar value={search} onChange={setSearch} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Bannière + avatar + boutons */}
          <View style={styles.bannerWrapper}>
            <Banner />
            <View style={styles.avatarContainer}>
              <Avatar uri={avatar} initials={initials} />
            </View>
            <View style={styles.actionButtons}>
              <Pressable style={styles.editBtn} onPress={() => router.push('/settings')}>
                <View style={styles.gearOuter}>
                  <View style={styles.gearInner} />
                </View>
                <Text style={styles.editBtnText}>Modifier</Text>
              </Pressable>
              <Pressable style={styles.shareBtn}>
                <View style={styles.shareIcon}>
                  <View style={styles.shareDot} />
                  <View style={[styles.shareDot, { top: 7, left: 0 }]} />
                  <View style={[styles.shareDot, { top: 14, left: 8 }]} />
                  <View style={styles.shareLine1} />
                  <View style={styles.shareLine2} />
                </View>
              </Pressable>
            </View>
          </View>

          {/* Infos utilisateur */}
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{username}</Text>
              {isAdmin && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
            </View>
            <Text style={styles.userHandle}>@{username}</Text>
            {bio ? <Text style={styles.userBio}>{bio}</Text> : null}
            {websiteUrl ? (
              <Text style={styles.userWebsite} numberOfLines={1}>
                🌐 {websiteUrl.replace(/^https?:\/\//, '')}
              </Text>
            ) : null}
            {joinDate ? <Text style={styles.joinDate}>Membre depuis {joinDate}</Text> : null}
          </View>

          {/* Compteurs */}
          <View style={styles.countersRow}>
            {[
              { value: stats.movies_watched, label: 'Vus', onPress: null },
              { value: stats.reviews, label: 'Critiques', onPress: null },
              { value: formatCount(stats.followers), label: 'Abonnés', onPress: () => setFollowModal('followers') },
              { value: formatCount(stats.following), label: 'Abonnements', onPress: () => setFollowModal('following') },
            ].map((item, i) => (
              <Pressable
                key={item.label}
                style={[styles.counterItem, i > 0 && styles.counterBorder]}
                onPress={item.onPress}
                disabled={!item.onPress}
              >
                <Text style={styles.counterValue}>{item.value}</Text>
                <Text style={[styles.counterLabel, item.onPress && styles.counterLabelClickable]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Onglets */}
          <View style={styles.tabBar}>
            {TABS.map((tab) => {
              const active = tab === activeTab;
              return (
                <Pressable
                  key={tab}
                  style={[styles.tabItem, active && styles.tabItemActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Contenu onglet */}
          <View style={styles.tabContent}>{renderTabContent()}</View>
        </ScrollView>

        <BottomTabBar />

        {/* Modal abonnés / abonnements */}
        <FollowModal
          visible={followModal !== null}
          title={followModal === 'followers' ? 'Abonnés' : 'Abonnements'}
          users={followModal === 'followers' ? followersList : followingList}
          loading={profileLoading}
          emptyMessage={
            followModal === 'followers'
              ? 'Aucun abonné pour le moment.'
              : 'Vous ne suivez personne pour le moment.'
          }
          onClose={() => setFollowModal(null)}
        />
      </View>
    </View>
  );
}

/* ── Styles ── */

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    backgroundColor: BG,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  phone: {
    backgroundColor: CARD,
    borderRadius: 22,
    height: 592,
    maxWidth: 315,
    overflow: 'hidden',
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },

  // Recherche
  searchWrapper: {
    borderBottomColor: BORDER,
    borderBottomWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 8,
    flexDirection: 'row',
    height: 28,
    paddingHorizontal: 8,
  },
  searchIconWrap: { height: 14, marginRight: 5, position: 'relative', width: 14 },
  searchCircle: {
    borderColor: MUTED,
    borderRadius: 4,
    borderWidth: 1.2,
    height: 8,
    left: 2,
    position: 'absolute',
    top: 2,
    width: 8,
  },
  searchHandle: {
    backgroundColor: MUTED,
    borderRadius: 1,
    height: 5,
    left: 9,
    position: 'absolute',
    top: 9,
    transform: [{ rotate: '-45deg' }],
    width: 1.2,
  },
  searchInput: { color: TEXT, flex: 1, fontSize: 11, padding: 0 },
  clearBtn: { padding: 2 },
  clearText: { color: MUTED, fontSize: 10 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 8 },

  // Bannière
  bannerWrapper: { height: 100, position: 'relative' },
  banner: {
    backgroundColor: '#1a1a2e',
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 100,
    overflow: 'hidden',
  },
  bannerCell: {
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    height: 50,
    width: 315 / 6,
  },
  bannerReel: {
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 50,
    borderWidth: 10,
    height: 80,
    left: '50%',
    marginLeft: -40,
    position: 'absolute',
    top: 10,
    width: 80,
  },

  // Avatar
  avatarContainer: { bottom: -22, left: 12, position: 'absolute' },
  avatarRing: {
    borderColor: CARD,
    borderRadius: 30,
    borderWidth: 2.5,
    height: 52,
    width: 52,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#9ca3af',
    borderRadius: 27,
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { height: '100%', width: '100%' },
  avatarInitials: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Boutons d'action
  actionButtons: {
    bottom: -14,
    flexDirection: 'row',
    gap: 6,
    position: 'absolute',
    right: 10,
  },
  editBtn: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gearOuter: {
    alignItems: 'center',
    borderColor: TEXT,
    borderRadius: 5,
    borderWidth: 1.2,
    height: 10,
    justifyContent: 'center',
    width: 10,
  },
  gearInner: { backgroundColor: TEXT, borderRadius: 2, height: 4, width: 4 },
  editBtnText: { color: TEXT, fontSize: 10, fontWeight: '600' },
  shareBtn: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 7,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  shareIcon: { height: 18, position: 'relative', width: 14 },
  shareDot: {
    backgroundColor: TEXT,
    borderRadius: 3,
    height: 5,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 5,
  },
  shareLine1: {
    backgroundColor: TEXT,
    borderRadius: 1,
    bottom: 10,
    height: 1.2,
    left: 0,
    position: 'absolute',
    transform: [{ rotate: '-30deg' }],
    width: 12,
  },
  shareLine2: {
    backgroundColor: TEXT,
    borderRadius: 1,
    bottom: 4,
    height: 1.2,
    left: 0,
    position: 'absolute',
    transform: [{ rotate: '30deg' }],
    width: 12,
  },

  // Infos utilisateur
  userInfo: { marginTop: 28, paddingBottom: 10, paddingHorizontal: 12 },
  nameRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  userName: { color: TEXT, fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  adminBadge: {
    backgroundColor: 'rgba(208, 2, 27, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adminBadgeText: { color: RED, fontSize: 9, fontWeight: '600' },
  userHandle: { color: MUTED, fontSize: 11, marginTop: 1 },
  userBio: { color: MUTED, fontSize: 10, lineHeight: 15, marginTop: 4 },
  userWebsite: { color: RED, fontSize: 10, marginTop: 4 },
  joinDate: { color: MUTED, fontSize: 9, marginTop: 4 },

  // Compteurs
  countersRow: {
    borderBottomColor: BORDER,
    borderBottomWidth: 1,
    borderTopColor: BORDER,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingVertical: 8,
  },
  counterItem: { alignItems: 'center', flex: 1 },
  counterBorder: { borderLeftColor: BORDER, borderLeftWidth: 1 },
  counterValue: { color: TEXT, fontSize: 13, fontWeight: '700' },
  counterLabel: { color: MUTED, fontSize: 9, marginTop: 1 },
  counterLabelClickable: { color: '#374151' },

  // Onglets
  tabBar: { borderBottomColor: BORDER, borderBottomWidth: 1, flexDirection: 'row' },
  tabItem: {
    alignItems: 'center',
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    flex: 1,
    paddingVertical: 9,
  },
  tabItemActive: { borderBottomColor: RED },
  tabText: { color: MUTED, fontSize: 10, fontWeight: '500' },
  tabTextActive: { color: TEXT, fontWeight: '700' },

  // Contenu onglet
  tabContent: { padding: 10 },
  sectionTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
  },

  // État vide
  emptyTab: { alignItems: 'center', paddingVertical: 24 },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    marginBottom: 8,
    width: 36,
  },
  filmIconRect: { backgroundColor: MUTED, borderRadius: 3, height: 14, width: 18 },
  emptyTabText: { color: MUTED, fontSize: 11, fontWeight: '500' },
  emptyTabSub: { color: '#d1d5db', fontSize: 9, marginTop: 2 },

  // Grille stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: { backgroundColor: BG, borderRadius: 10, padding: 12, width: CARD_WIDTH },
  statCardLabel: { color: MUTED, fontSize: 9, letterSpacing: 0.2, marginBottom: 4 },
  statCardValue: { color: TEXT, fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },

  // Skeleton
  skeleton: { backgroundColor: '#e5e7eb', borderRadius: 10 },
  skeletonList: { gap: 8 },

  // Carte info
  infoCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 10,
  },
  infoRow: { marginBottom: 6 },
  infoLabel: { color: MUTED, fontSize: 9 },
  infoValue: { color: TEXT, fontSize: 11, fontWeight: '500' },

  // Carte critique
  reviewCard: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    padding: 10,
  },
  reviewMovieRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  reviewPoster: {
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
    height: 48,
    overflow: 'hidden',
    width: 36,
  },
  reviewPosterImage: { height: '100%', width: '100%' },
  reviewPosterPlaceholder: { backgroundColor: '#d1d5db', flex: 1 },
  reviewMovieInfo: { flex: 1, justifyContent: 'center' },
  reviewMovieTitle: { color: TEXT, fontSize: 11, fontWeight: '600' },
  reviewMovieYear: { color: MUTED, fontSize: 9, marginTop: 2 },
  reviewRatingRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 4 },
  starsRow: { flexDirection: 'row', gap: 2 },
  starText: { color: '#d1d5db', fontSize: 12 },
  starTextFilled: { color: '#F59E0B' },
  reviewDate: { color: MUTED, fontSize: 9 },
  reviewText: { color: MUTED, fontSize: 10, lineHeight: 14 },

  // Carte liste
  listCard: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    padding: 10,
  },
  listIconWrap: {
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  listInfo: { flex: 1 },
  listName: { color: TEXT, fontSize: 11, fontWeight: '600' },
  listCount: { color: MUTED, fontSize: 9, marginTop: 2 },
  listBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 },
  listBadgePublic: { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
  listBadgePrivate: { backgroundColor: BG },
  listBadgeText: { color: MUTED, fontSize: 9, fontWeight: '500' },
  listBadgeTextPublic: { color: '#16a34a' },

  // Modal
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: CARD,
    borderRadius: 16,
    maxHeight: '70%',
    width: '100%',
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: BORDER,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
    position: 'relative',
  },
  modalTitle: { color: TEXT, fontSize: 14, fontWeight: '700' },
  modalClose: { position: 'absolute', right: 12 },
  modalCloseText: { color: TEXT, fontSize: 22 },
  modalSearchWrap: { borderBottomColor: BORDER, borderBottomWidth: 1, padding: 10 },
  modalSearchInput: {
    backgroundColor: BG,
    borderRadius: 8,
    color: TEXT,
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  modalList: { padding: 10 },
  modalEmpty: { color: MUTED, fontSize: 11, paddingVertical: 20, textAlign: 'center' },
  followRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
  },
  followAvatar: {
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 36,
  },
  followAvatarImg: { height: '100%', width: '100%' },
  followAvatarInitials: { color: MUTED, fontSize: 10, fontWeight: '600' },
  followUsername: { color: TEXT, fontSize: 11, fontWeight: '600' },
  followHandle: { color: MUTED, fontSize: 9 },
});

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import RequireAuth from '../src/components/RequireAuth';
import ScreenContainer from '../src/components/ScreenContainer';
import TopNavbar from '../src/components/TopNavbar';
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

const formatActivity = (activity) => ({
  ...activity,
  date: formatShortDate(activity.created_at),
  review: activity.review ? formatReview(activity.review) : null,
});

/* ── Composants UI ── */

function Banner() {
  return (
    <View style={styles.banner}>
      {Array.from({ length: 18 }).map((_, i) => (
        <View key={i} style={styles.bannerCell} />
      ))}
      <View style={styles.bannerGlow} />
      <View style={styles.bannerReel} />
      <View style={styles.bannerReelCenter} />
      <Text style={styles.bannerLabel}>MY CINEMA</Text>
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

function ActivityCard({ item }) {
  if (item.type === 'REVIEW_CREATED') return <ReviewCard item={item.review} />;
  if (item.type === 'LIST_CREATED') {
    return (
      <View style={styles.activityCard}>
        <Text style={styles.activityTitle}>Nouvelle liste créée</Text>
        <Text style={styles.activityMovie}>{item.list?.name}</Text>
        {!!item.list?.description && <Text style={styles.activityBody}>{item.list.description}</Text>}
        <Text style={styles.reviewDate}>{item.list?.movie_count || 0} films · {item.date}</Text>
      </View>
    );
  }
  const label = item.type === 'REVIEW_LIKED'
    ? 'A aimé une critique de'
    : 'A commenté une critique de';
  return (
    <View style={styles.activityCard}>
      <Text style={styles.activityTitle}>{label}</Text>
      <Text style={styles.activityMovie}>{item.review?.movie}</Text>
      {!!item.comment?.text && <Text style={styles.activityBody}>“{item.comment.text}”</Text>}
      <Text style={styles.reviewDate}>{item.date}</Text>
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

function ProfileContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState('Overview');
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [reviews, setReviews] = useState([]);
  const [lists, setLists] = useState([]);
  const [activities, setActivities] = useState([]);
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
      setProfileError('');

      const [exportResult, activityResult, libraryResult, followersResult, followingResult] =
        await Promise.allSettled([
          api.get('/users/me/export'),
          api.get(`/users/${user.id}/activity`),
          api.get('/library/stats'),
          api.get(`/social/follow/${user.id}/followers`),
          api.get(`/social/follow/${user.id}/following`),
        ]);

      try {
        const exportData =
          exportResult.status === 'fulfilled' ? exportResult.value.data || {} : {};
        const activeReviews = (exportData.reviews || []).filter((r) => !r.deleted_at);
        const customLists = exportData.custom_lists || [];
        const libraryStats =
          libraryResult.status === 'fulfilled' ? libraryResult.value.data?.data || {} : {};
        const followersData =
          followersResult.status === 'fulfilled' ? followersResult.value.data || {} : {};
        const followingData =
          followingResult.status === 'fulfilled' ? followingResult.value.data || {} : {};

        setReviews(activeReviews.map(formatReview));
        setLists(customLists);
        const activityData =
          activityResult.status === 'fulfilled' ? activityResult.value.data || {} : {};
        setActivities((activityData.activities || []).map(formatActivity));
        setFollowersList(followersData.followers || []);
        setFollowingList(followingData.following || []);
        setStats({
          followers: followersData.count || 0,
          following: followingData.count || 0,
          movies_watched: libraryStats.counts?.COMPLETED || libraryStats.totalMovies || 0,
          reviews: activeReviews.length,
        });

        if ([exportResult, activityResult, libraryResult, followersResult, followingResult]
          .some((result) => result.status === 'rejected')) {
          setProfileError('Certaines statistiques ne sont pas disponibles.');
        }
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfileData();
  }, [user?.id]);

  if (authLoading || !user) {
    return (
      <ScreenContainer>
        <View style={styles.phone}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={RED} />
          </View>
          <BottomTabBar />
        </View>
      </ScreenContainer>
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
            {activities.length === 0 ? (
              <EmptyTab
                label="Aucune activité récente."
                sub="Vos critiques, likes, commentaires et listes apparaîtront ici."
              />
            ) : (
              activities.slice(0, 5).map((item) => <ActivityCard key={item.id} item={item} />)
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
    <ScreenContainer>
      <View style={styles.phone}>
        <TopNavbar username={username || 'User'} />

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
          {profileError ? <Text style={styles.profileError}>{profileError}</Text> : null}
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
    </ScreenContainer>
  );
}

export default function ProfileScreen() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

/* ── Styles ── */

const styles = StyleSheet.create({
  phone: {
    backgroundColor: '#f8fafc',
    flex: 1,
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
    backgroundColor: CARD,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    height: 42,
    paddingHorizontal: 12,
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
  searchInput: { color: TEXT, flex: 1, fontSize: 13, padding: 0 },
  clearBtn: { padding: 2 },
  clearText: { color: MUTED, fontSize: 10 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 82 },

  // Bannière
  bannerWrapper: { height: 154, position: 'relative' },
  banner: {
    backgroundColor: '#111827',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 132,
    overflow: 'hidden',
  },
  bannerCell: {
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    height: 66,
    width: '16.6667%',
  },
  bannerGlow: {
    backgroundColor: 'rgba(239,13,26,0.42)',
    borderRadius: 90,
    height: 180,
    position: 'absolute',
    right: -45,
    top: -70,
    width: 180,
  },
  bannerReel: {
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 50,
    borderWidth: 9,
    height: 76,
    position: 'absolute',
    right: 24,
    top: 26,
    width: 76,
  },
  bannerReelCenter: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    height: 16,
    position: 'absolute',
    right: 54,
    top: 56,
    width: 16,
  },
  bannerLabel: {
    bottom: 42,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 11,
    fontWeight: '800',
    left: 18,
    letterSpacing: 2.4,
    position: 'absolute',
  },

  // Avatar
  avatarContainer: { bottom: -2, left: 16, position: 'absolute' },
  avatarRing: {
    borderColor: CARD,
    borderRadius: 40,
    borderWidth: 4,
    height: 76,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    width: 76,
    elevation: 5,
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
  avatarInitials: { color: '#fff', fontSize: 22, fontWeight: '800' },

  // Boutons d'action
  actionButtons: {
    bottom: 4,
    flexDirection: 'row',
    gap: 6,
    position: 'absolute',
    right: 16,
  },
  editBtn: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  editBtnText: { color: TEXT, fontSize: 12, fontWeight: '700' },
  shareBtn: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 12,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
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
  userInfo: { paddingBottom: 14, paddingHorizontal: 16, paddingTop: 8 },
  nameRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  userName: { color: TEXT, fontSize: 22, fontWeight: '900', letterSpacing: -0.6 },
  adminBadge: {
    backgroundColor: 'rgba(208, 2, 27, 0.1)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  adminBadgeText: { color: RED, fontSize: 9, fontWeight: '600' },
  userHandle: { color: '#64748b', fontSize: 13, marginTop: 2 },
  userBio: { color: '#475569', fontSize: 13, lineHeight: 19, marginTop: 10 },
  userWebsite: { color: RED, fontSize: 12, fontWeight: '600', marginTop: 8 },
  joinDate: { color: '#94a3b8', fontSize: 11, marginTop: 6 },

  // Compteurs
  countersRow: {
    backgroundColor: CARD,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: 14,
    paddingVertical: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  counterItem: { alignItems: 'center', flex: 1 },
  counterBorder: { borderLeftColor: BORDER, borderLeftWidth: 1 },
  counterValue: { color: TEXT, fontSize: 16, fontWeight: '800' },
  counterLabel: { color: MUTED, fontSize: 10, marginTop: 3 },
  counterLabelClickable: { color: '#374151' },
  profileError: {
    color: '#b45309',
    fontSize: 10,
    paddingHorizontal: 10,
    paddingTop: 8,
    textAlign: 'center',
  },

  // Onglets
  tabBar: {
    backgroundColor: '#e9eef5',
    borderRadius: 14,
    flexDirection: 'row',
    marginHorizontal: 14,
    marginTop: 14,
    padding: 4,
  },
  tabItem: {
    alignItems: 'center',
    borderRadius: 11,
    flex: 1,
    paddingVertical: 9,
  },
  tabItemActive: {
    backgroundColor: CARD,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  tabText: { color: MUTED, fontSize: 10, fontWeight: '500' },
  tabTextActive: { color: TEXT, fontWeight: '700' },

  // Contenu onglet
  tabContent: { paddingHorizontal: 14, paddingTop: 16 },
  sectionTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
  },

  // État vide
  emptyTab: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: '#e2e8f0',
    borderRadius: 18,
    borderStyle: 'dashed',
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 34,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    marginBottom: 8,
    width: 52,
  },
  filmIconRect: { backgroundColor: MUTED, borderRadius: 3, height: 14, width: 18 },
  emptyTabText: { color: TEXT, fontSize: 13, fontWeight: '700' },
  emptyTabSub: { color: '#94a3b8', fontSize: 11, lineHeight: 16, marginTop: 5, textAlign: 'center' },

  // Grille stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: {
    backgroundColor: CARD,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: '47%',
    flexGrow: 1,
    padding: 16,
  },
  statCardLabel: { color: MUTED, fontSize: 11, letterSpacing: 0.2, marginBottom: 7 },
  statCardValue: { color: TEXT, fontSize: 24, fontWeight: '900', letterSpacing: -0.7 },

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
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
    padding: 14,
  },
  reviewMovieRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  reviewPoster: {
    backgroundColor: '#e5e7eb',
    borderRadius: 9,
    height: 62,
    overflow: 'hidden',
    width: 46,
  },
  reviewPosterImage: { height: '100%', width: '100%' },
  reviewPosterPlaceholder: { backgroundColor: '#d1d5db', flex: 1 },
  reviewMovieInfo: { flex: 1, justifyContent: 'center' },
  reviewMovieTitle: { color: TEXT, fontSize: 13, fontWeight: '700' },
  reviewMovieYear: { color: MUTED, fontSize: 11, marginTop: 3 },
  reviewRatingRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 4 },
  starsRow: { flexDirection: 'row', gap: 2 },
  starText: { color: '#d1d5db', fontSize: 12 },
  starTextFilled: { color: '#F59E0B' },
  reviewDate: { color: MUTED, fontSize: 9 },
  reviewText: { color: '#475569', fontSize: 12, lineHeight: 18 },
  activityCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 8,
  },
  activityTitle: { color: TEXT, fontSize: 13, fontWeight: '700' },
  activityMovie: { color: RED, fontSize: 14, fontWeight: '800', marginTop: 5 },
  activityBody: { color: MUTED, fontSize: 12, lineHeight: 18, marginVertical: 8 },

  // Carte liste
  listCard: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
    padding: 13,
  },
  listIconWrap: {
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  listInfo: { flex: 1 },
  listName: { color: TEXT, fontSize: 13, fontWeight: '700' },
  listCount: { color: MUTED, fontSize: 11, marginTop: 3 },
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

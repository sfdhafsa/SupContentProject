import { useLocalSearchParams, useRouter } from 'expo-router';
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
import ScreenContainer from '../src/components/ScreenContainer';
import { getAuthToken } from '../src/services/authStorage';
import api, { API_BASE_URL } from '../src/config/api';

/* ── Utilitaires ── */

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

function authHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const responseText = await response.text();
  let data = {};

  if (responseText.trim()) {
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { message: responseText };
    }
  }

  if (!response.ok) {
    const error = new Error(data?.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function formatReview(review) {
  return {
    id: review.id,
    poster: review.poster_url,
    movie: review.title,
    year: getYear(firstPresent(review.release_date, review.release_year, review.year)),
    rating: Number(review.rating || 0),
    date: formatShortDate(firstPresent(review.created_at, review.updated_at)),
    review: review.text || 'A noté ce film.',
  };
}

function formatActivity(activity) {
  return {
    ...activity,
    date: formatShortDate(activity.created_at),
    review: activity.review ? formatReview(activity.review) : null,
  };
}

/* ── Constantes ── */

const TABS = ['Overview', 'Reviews', 'Lists', 'Stats'];
const RED = '#ef0d1a';
const BG = '#f3f4f6';
const CARD = '#ffffff';
const TEXT = '#111827';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';

/* ── Composants UI partagés ── */

function Banner() {
  return (
    <View style={styles.banner}>
      {Array.from({ length: 18 }).map((_, i) => (
        <View key={i} style={styles.bannerCell} />
      ))}
      <View style={styles.bannerGlow} />
      <View style={styles.bannerReel} />
      <View style={styles.bannerReelCenter} />
      <Text style={styles.bannerLabel}>FILM PROFILE</Text>
    </View>
  );
}

function Avatar({ uri, initials, size = 52 }) {
  return (
    <View style={[styles.avatarRing, { width: size, height: size, borderRadius: size / 2 }]}>
      <View style={[styles.avatar, { borderRadius: size / 2 }]}>
        {uri ? (
          <Image source={{ uri }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarInitials}>{initials}</Text>
        )}
      </View>
    </View>
  );
}

function Skeleton({ style }) {
  return <View style={[styles.skeleton, style]} />;
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
        <Text style={styles.activityTitle}>A créé une liste publique</Text>
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

function StatsTab({ stats, listsCount }) {
  const hoursWatched = Math.round((stats.movies_watched || 0) * 1.83);
  const cards = [
    { label: 'Films vus',     value: String(stats.movies_watched || 0) },
    { label: 'Heures vues',   value: String(hoursWatched) },
    { label: 'Critiques',     value: String(stats.reviews || 0) },
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

export default function PublicProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // /public-profile?id=123

  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [lists, setLists] = useState([]);
  const [activities, setActivities] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, movies_watched: 0, reviews: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Overview');
  const [followModal, setFollowModal] = useState(null);

  // Dérivées
  const username  = profileUser?.username || '';
  const bio       = profileUser?.bio || '';
  const avatar    = profileUser?.avatar_url || null;
  const websiteUrl = profileUser?.website_url || null;
  const roles     = profileUser?.roles || [];
  const isAdmin   = roles.map((r) => String(r).toLowerCase()).includes('admin');
  const initials  = username.slice(0, 2).toUpperCase();
  const joinDate  = formatMonthYear(
    firstPresent(profileUser?.created_at, profileUser?.createdAt)
  );

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const token = await getAuthToken();
        const headers = authHeaders(token);

        const [userRes, activityRes, followersRes, followingRes] = await Promise.all([
          fetchJson(`${API_BASE_URL}/users/${id}`, { headers }),
          fetchJson(`${API_BASE_URL}/users/${id}/activity`, { headers }),
          fetchJson(`${API_BASE_URL}/social/follow/${id}/followers`, { headers }),
          fetchJson(`${API_BASE_URL}/social/follow/${id}/following`, { headers }),
        ]);

        const userData = userRes.user ?? userRes.data ?? userRes;
        setProfileUser(userData);

        const followers = followersRes.followers || [];
        const following = followingRes.following || [];
        setFollowersList(followers);
        setFollowingList(following);

        // Vérifie si on suit déjà cet utilisateur
        if (token) {
          try {
            const statusRes = await fetchJson(`${API_BASE_URL}/social/follow/${id}/follow-status`, { headers });
            setIsFollowing(!!statusRes.isFollowing);
          } catch {
            setIsFollowing(false);
          }
        } else {
          setIsFollowing(false);
        }

        // Reviews publiques
        try {
          const reviewsRes = activityRes;
          const rawReviews = reviewsRes.reviews ?? reviewsRes.data ?? reviewsRes ?? [];
          const activeReviews = Array.isArray(rawReviews)
            ? rawReviews.filter((r) => !r.deleted_at)
            : [];
          setReviews(activeReviews.map(formatReview));
          setActivities((reviewsRes.activities || []).map(formatActivity));

          setStats({
            followers: followersRes.count || followers.length,
            following: followingRes.count || following.length,
            movies_watched: reviewsRes.stats?.movies_watched || activeReviews.length,
            reviews: reviewsRes.stats?.reviews || activeReviews.length,
          });
        } catch {
          setStats({
            followers: followersRes.count || followers.length,
            following: followingRes.count || following.length,
            movies_watched: 0,
            reviews: 0,
          });
        }

        // Listes publiques
        try {
          const listsRes = activityRes;
          const rawLists = listsRes.lists ?? listsRes.data ?? listsRes ?? [];
          setLists(Array.isArray(rawLists) ? rawLists.filter((l) => l.is_public) : []);
        } catch {
          setLists([]);
        }
      } catch (err) {
        console.error('Public profile error:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleFollowToggle() {
    if (followLoading) return;

    const previousFollowing = isFollowing;
    const nextFollowing = !previousFollowing;

    setFollowLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        router.push('/login');
        return;
      }

      setIsFollowing(nextFollowing);
      setStats((current) => ({
        ...current,
        followers: Math.max(0, current.followers + (nextFollowing ? 1 : -1)),
      }));

      const { data: res, status } = await api.post(`/social/follow/${id}`);
      const confirmedFollowing = res?.status
        ? res.status === 'followed'
        : status === 201;
      setIsFollowing(confirmedFollowing);
      setStats((s) => ({
        ...s,
        followers: Number.isFinite(Number(res?.count))
          ? Number(res.count)
          : s.followers,
      }));
    } catch (err) {
      setIsFollowing(previousFollowing);
      setStats((current) => ({
        ...current,
        followers: Math.max(0, current.followers + (previousFollowing ? 1 : -1)),
      }));
      console.error('Follow error:', err);
    } finally {
      setFollowLoading(false);
    }
  }

  function handleMessagePress() {
    if (!id) return;

    router.push({
      pathname: '/conversation/[userId]',
      params: {
        userId: id,
        username: username || 'Conversation',
      },
    });
  }

  function renderTabContent() {
    if (loading) {
      return (
        <View style={{ gap: 8 }}>
          <Skeleton style={{ height: 80, marginBottom: 8 }} />
          <Skeleton style={{ height: 80, marginBottom: 8 }} />
          <Skeleton style={{ height: 80 }} />
        </View>
      );
    }

    switch (activeTab) {
      case 'Overview':
        return (
          <View>
            {/* Activités récentes */}
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIcon}>
                  <View style={[styles.starSmall, { borderColor: '#F59E0B' }]} />
                </View>
                <Text style={styles.sectionTitle}>Activité récente</Text>
              </View>
            </View>

            {activities.length === 0 ? (
              <EmptyTab label="Aucune activité." />
            ) : (
              activities.slice(0, 5).map((item) => (
                <ActivityCard key={item.id} item={item} />
              ))
            )}
          </View>
        );

      case 'Reviews':
        return reviews.length === 0 ? (
          <EmptyTab label="Aucune critique." sub="Cet utilisateur n'a pas encore noté de films." />
        ) : (
          <View>{reviews.map((item) => <ReviewCard key={item.id} item={item} />)}</View>
        );

      case 'Lists':
        return lists.length === 0 ? (
          <EmptyTab label="Aucune liste publique." sub="Cet utilisateur n'a pas de listes publiques." />
        ) : (
          <View>{lists.map((list) => <ListCard key={list.id} list={list} />)}</View>
        );

      case 'Stats':
        return <StatsTab stats={stats} listsCount={lists.length} />;

      default:
        return null;
    }
  }

  if (loading) {
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

  return (
    <ScreenContainer>
      <View style={styles.phone}>
        {/* Header navigation */}
        {false && <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <View style={styles.backArrow} />
          </Pressable>
          <View style={styles.navActions}>
            {/* Icône recherche */}
            <Pressable style={styles.navIconBtn}>
              <View style={styles.navSearchWrap}>
                <View style={styles.navSearchCircle} />
                <View style={styles.navSearchHandle} />
              </View>
            </Pressable>
            {/* Icône message */}
            <Pressable style={styles.navIconBtn}>
              <View style={styles.msgIcon} />
            </Pressable>
            {/* Avatar mini */}
            <View style={styles.navAvatar}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.navAvatarImg} />
              ) : (
                <Text style={styles.navAvatarText}>{initials.slice(0, 1)}</Text>
              )}
            </View>
          </View>
        </View>}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Bannière + avatar + boutons */}
          <View style={styles.bannerWrapper}>
            <Banner />
            <View style={styles.avatarContainer}>
              <Avatar uri={avatar} initials={initials} size={76} />
            </View>
            {/* Boutons Follow / Message / Share */}
            <View style={styles.actionButtons}>
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: isFollowing, busy: followLoading }}
                style={[
                  styles.followBtn,
                  isFollowing && styles.followingBtn,
                  followLoading && styles.followBtnLoading,
                ]}
                onPress={handleFollowToggle}
                disabled={followLoading}
              >
                {/* icône personne + plus */}
                <View style={styles.followIcon}>
                  <View style={[styles.followHead, { borderColor: isFollowing ? MUTED : CARD }]} />
                  <View style={[styles.followBody, { borderColor: isFollowing ? MUTED : CARD }]} />
                  {!isFollowing && (
                    <>
                      <View style={styles.followPlus1} />
                      <View style={styles.followPlus2} />
                    </>
                  )}
                </View>
                <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                  {isFollowing ? 'Abonné' : 'Suivre'}
                </Text>
              </Pressable>

              <Pressable style={styles.messageBtn} onPress={handleMessagePress}>
                <Text style={styles.messageBtnText}>Message</Text>
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
              { value: stats.movies_watched,          label: 'Vus',          onPress: null },
              { value: stats.reviews,                  label: 'Critiques',    onPress: null },
              { value: formatCount(stats.followers),   label: 'Abonnés',      onPress: () => setFollowModal('followers') },
              { value: formatCount(stats.following),   label: 'Abonnements',  onPress: () => setFollowModal('following') },
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
          loading={loading}
          emptyMessage={
            followModal === 'followers'
              ? 'Aucun abonné pour le moment.'
              : 'Cet utilisateur ne suit personne.'
          }
          onClose={() => setFollowModal(null)}
        />
      </View>
    </ScreenContainer>
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
  loadingContainer: { alignItems: 'center', flex: 1, justifyContent: 'center' },

  // Nav bar
  navBar: {
    alignItems: 'center',
    borderBottomColor: BORDER,
    borderBottomWidth: 1,
    flexDirection: 'row',
    backgroundColor: CARD,
    height: 54,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  backArrow: {
    borderBottomColor: TEXT,
    borderBottomWidth: 1.5,
    borderLeftColor: TEXT,
    borderLeftWidth: 1.5,
    height: 10,
    transform: [{ rotate: '45deg' }],
    width: 10,
  },
  navActions: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  navIconBtn: { alignItems: 'center', height: 24, justifyContent: 'center', width: 24 },
  navSearchWrap: { height: 16, position: 'relative', width: 16 },
  navSearchCircle: {
    borderColor: TEXT,
    borderRadius: 5,
    borderWidth: 1.3,
    height: 9,
    left: 2,
    position: 'absolute',
    top: 2,
    width: 9,
  },
  navSearchHandle: {
    backgroundColor: TEXT,
    borderRadius: 1,
    height: 6,
    left: 10,
    position: 'absolute',
    top: 10,
    transform: [{ rotate: '-45deg' }],
    width: 1.3,
  },
  msgIcon: {
    borderColor: TEXT,
    borderRadius: 4,
    borderWidth: 1.3,
    height: 12,
    width: 16,
  },
  navAvatar: {
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    borderColor: '#e2e8f0',
    borderRadius: 16,
    borderWidth: 2,
    height: 32,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 32,
  },
  navAvatarImg: { height: '100%', width: '100%' },
  navAvatarText: { color: TEXT, fontSize: 9, fontWeight: '700' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 82 },

  // Bannière
  bannerWrapper: { height: 158, position: 'relative' },
  banner: {
    backgroundColor: '#111827',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 136,
    overflow: 'hidden',
  },
  bannerCell: {
    borderColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    height: 68,
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
    borderWidth: 10,
    height: 76,
    position: 'absolute',
    right: 24,
    top: 28,
    width: 76,
  },
  bannerReelCenter: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    height: 16,
    position: 'absolute',
    right: 54,
    top: 58,
    width: 16,
  },
  bannerLabel: {
    bottom: 44,
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
    borderWidth: 4,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#9ca3af',
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { height: '100%', width: '100%' },
  avatarInitials: { color: '#fff', fontSize: 22, fontWeight: '800' },

  // Boutons d'action
  actionButtons: {
    alignItems: 'center',
    bottom: 4,
    flexDirection: 'row',
    gap: 5,
    position: 'absolute',
    right: 16,
  },
  followBtn: {
    alignItems: 'center',
    backgroundColor: RED,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 4,
    minHeight: 36,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  followingBtn: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderWidth: 1,
  },
  followBtnLoading: { opacity: 0.65 },
  followIcon: { height: 14, position: 'relative', width: 14 },
  followHead: {
    borderRadius: 4,
    borderWidth: 1.2,
    height: 6,
    left: 3,
    position: 'absolute',
    top: 0,
    width: 6,
  },
  followBody: {
    borderRadius: 5,
    borderWidth: 1.2,
    bottom: 0,
    height: 6,
    left: 0,
    position: 'absolute',
    width: 12,
  },
  followPlus1: {
    backgroundColor: CARD,
    borderRadius: 1,
    height: 1.5,
    position: 'absolute',
    right: -5,
    top: 2,
    width: 7,
  },
  followPlus2: {
    backgroundColor: CARD,
    borderRadius: 1,
    height: 7,
    position: 'absolute',
    right: -2,
    top: -1,
    width: 1.5,
  },
  followBtnText: { color: CARD, fontSize: 12, fontWeight: '800' },
  followingBtnText: { color: MUTED },

  messageBtn: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 36,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  messageBtnText: { color: TEXT, fontSize: 12, fontWeight: '700' },

  shareBtn: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 12,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
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

  // Section header
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  sectionIcon: {
    alignItems: 'center',
    backgroundColor: BG,
    borderRadius: 5,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  sectionTitle: { color: TEXT, fontSize: 12, fontWeight: '700' },
  starSmall: { borderRadius: 3, borderWidth: 1, height: 10, width: 10 },

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
  modalContent: { backgroundColor: CARD, borderRadius: 16, maxHeight: '70%', width: '100%' },
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
  followRow: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingVertical: 8 },
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

import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Search, ShieldCheck, Star, UserRound } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import BottomTabBar from '../src/components/BottomTabBar';
import RequireAuth from '../src/components/RequireAuth';
import ScreenContainer from '../src/components/ScreenContainer';
import TopNavbar from '../src/components/TopNavbar';
import api from '../src/config/api';
import { useAuth } from '../src/services/authApi';

const RED = '#d0021b';
const BG = '#f6f7f9';
const CARD = '#ffffff';
const TEXT = '#0f172a';
const MUTED = '#64748b';
const SOFT = '#f1f5f9';
const BORDER = '#e5e7eb';
const GREEN = '#16a34a';
const YELLOW = '#ca8a04';

const TABS = [
  { id: 'users', label: 'Users' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'reports', label: 'Reports' },
];
const USER_FILTERS = ['ALL', 'ACTIVE', 'BANNED'];
const REVIEW_FILTERS = ['ALL', 'FEATURED', 'UNFEATURED'];
const REPORT_FILTERS = ['ALL', 'PENDING', 'REVIEWED', 'RESOLVED'];

const REPORT_REASON_LABELS = {
  SPAM: 'Spam',
  HARASSMENT: 'Harassment',
  HATE_SPEECH: 'Hate speech',
  SPOILER: 'Spoiler',
  INAPPROPRIATE: 'Inappropriate',
  OTHER: 'Other',
};

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en', { month: 'short', day: '2-digit', year: 'numeric' });
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function initialsFor(value) {
  return String(value || 'U').slice(0, 2).toUpperCase();
}

function Pill({ label, tone = 'neutral' }) {
  return (
    <View style={[styles.pill, styles[`${tone}Pill`]]}>
      <Text style={[styles.pillText, styles[`${tone}PillText`]]}>{label}</Text>
    </View>
  );
}

function Segmented({ items, value, onChange }) {
  return (
    <View style={styles.segmented}>
      {items.map((item) => {
        const active = item === value;
        return (
          <Pressable
            key={item}
            onPress={() => onChange(item)}
            style={[styles.segmentItem, active && styles.segmentItemActive]}
          >
            <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{item}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <View style={styles.searchBox}>
      <Search size={16} color="#94a3b8" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        style={styles.searchInput}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value ? (
        <Pressable onPress={() => onChange('')} hitSlop={8}>
          <Text style={styles.clearText}>x</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function StatStrip({ items }) {
  return (
    <View style={styles.statStrip}>
      {items.map((item, index) => (
        <View key={item.label} style={[styles.statCell, index > 0 && styles.statDivider]}>
          <Text style={styles.statValue}>{item.value}</Text>
          <Text style={styles.statLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function EmptyState({ icon, message }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>{icon}</View>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

function LoadingState() {
  return (
    <View style={styles.loadingState}>
      <ActivityIndicator color={RED} size="large" />
    </View>
  );
}

function UserAvatar({ user }) {
  return (
    <View style={styles.avatar}>
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={styles.avatarImage} />
      ) : (
        <Text style={styles.avatarText}>{initialsFor(user.username)}</Text>
      )}
    </View>
  );
}

function StarRating({ rating }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          color={star <= Number(rating || 0) ? '#f59e0b' : '#d1d5db'}
          fill={star <= Number(rating || 0) ? '#f59e0b' : 'transparent'}
        />
      ))}
    </View>
  );
}

function UsersPanel({ busyId, currentUser, filteredUsers, loading, onUpdateBan, onUpdatePromotion, users }) {
  const stats = [
    { label: 'Total users', value: users.length },
    { label: 'Active', value: users.filter((item) => !item.is_banned).length },
    { label: 'Banned', value: users.filter((item) => item.is_banned).length },
  ];

  return (
    <View style={styles.panel}>
      <StatStrip items={stats} />
      {loading ? (
        <LoadingState />
      ) : filteredUsers.length === 0 ? (
        <EmptyState icon={<UserRound size={20} color="#94a3b8" />} message="No users found." />
      ) : (
        filteredUsers.map((user) => {
          const isAdmin = (user.roles || []).map((role) => String(role).toLowerCase()).includes('admin');
          const isCurrentUser = user.id === currentUser?.id;
          const isBanBusy = busyId === `user-${user.id}`;
          const isPromoteBusy = busyId === `promote-${user.id}`;
          const shouldBan = !user.is_banned;

          return (
            <View key={user.id} style={styles.userRow}>
              <View style={styles.userTop}>
                <UserAvatar user={user} />
                <View style={styles.userIdentity}>
                  <View style={styles.nameLine}>
                    <Text style={styles.primaryName} numberOfLines={1}>{user.username}</Text>
                    {isAdmin ? <Pill label="Admin" tone="admin" /> : null}
                    <Pill label={user.is_banned ? 'Banned' : 'Active'} tone={user.is_banned ? 'danger' : 'success'} />
                  </View>
                  <Text style={styles.emailText} numberOfLines={1}>{user.email}</Text>
                </View>
              </View>

              <View style={styles.metaGrid}>
                <Meta label="Joined" value={formatDate(user.created_at)} />
                <Meta label="Banned by" value={user.is_banned ? user.banned_by_username || 'Unknown admin' : '-'} />
                <Meta label="Banned at" value={user.is_banned ? formatDate(user.banned_at) : '-'} />
                <Meta label="Promoted by" value={isAdmin ? user.promoted_by_username || (user.promoted_at ? 'Unknown admin' : '-') : '-'} />
                <Meta label="Promoted at" value={isAdmin ? formatDate(user.promoted_at) : '-'} />
              </View>

              <View style={styles.userActions}>
                <Pressable
                  disabled={Boolean(busyId) || isCurrentUser}
                  onPress={() => onUpdatePromotion(user, !isAdmin)}
                  style={[
                    styles.actionBtn,
                    styles.darkBtn,
                    styles.userActionBtn,
                    (Boolean(busyId) || isCurrentUser) && styles.disabledBtn,
                  ]}
                >
                  <Text style={styles.actionBtnText}>{isPromoteBusy ? 'Updating...' : isAdmin ? 'Unpromote' : 'Promote'}</Text>
                </Pressable>
                <Pressable
                  disabled={Boolean(busyId) || isCurrentUser}
                  onPress={() => onUpdateBan(user, shouldBan)}
                  style={[
                    styles.actionBtn,
                    styles.userActionBtn,
                    user.is_banned ? styles.unbanBtn : styles.banBtn,
                    (Boolean(busyId) || isCurrentUser) && styles.disabledBtn,
                  ]}
                >
                  <Text style={styles.actionBtnText}>
                    {isBanBusy ? 'Updating...' : user.is_banned ? 'Unban' : 'Ban'}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

function ReviewsPanel({ busyId, filteredReviews, loading, onUpdateFeatured, reviews }) {
  const stats = [
    { label: 'Total reviews', value: reviews.length },
    { label: 'Featured', value: reviews.filter((item) => item.is_featured).length },
    { label: 'Unfeatured', value: reviews.filter((item) => !item.is_featured).length },
  ];

  return (
    <View style={styles.panel}>
      <StatStrip items={stats} />
      {loading ? (
        <LoadingState />
      ) : filteredReviews.length === 0 ? (
        <EmptyState icon={<Star size={20} color="#94a3b8" />} message="No reviews found." />
      ) : (
        filteredReviews.map((review) => {
          const isBusy = busyId === `review-${review.id}`;
          return (
            <View key={review.id} style={styles.reviewRow}>
              <View style={styles.reviewBody}>
                <View style={styles.poster}>
                  {review.poster_url ? (
                    <Image source={{ uri: review.poster_url }} style={styles.posterImage} />
                  ) : (
                    <Star size={20} color="#94a3b8" />
                  )}
                </View>

                <View style={styles.reviewContent}>
                  <View style={styles.nameLine}>
                    <Text style={styles.primaryName} numberOfLines={1}>{review.movie_title || 'Untitled movie'}</Text>
                    {review.is_featured ? <Pill label="Featured" tone="warning" /> : null}
                    {review.contains_spoiler ? <Pill label="Spoiler" tone="neutral" /> : null}
                  </View>
                  <Text style={styles.emailText} numberOfLines={1}>
                    {review.username || 'Unknown user'} - {formatDate(review.created_at)} - {review.likes_count || 0} likes
                  </Text>
                  <StarRating rating={review.rating} />
                  <Text style={styles.reviewText} numberOfLines={3}>{review.text || 'Rated this movie.'}</Text>
                </View>
              </View>

              <Text style={styles.statusNote}>
                {review.is_featured
                  ? `Featured ${formatDate(review.featured_at)}${review.featured_by_username ? ` by ${review.featured_by_username}` : ''}`
                  : 'Not featured'}
              </Text>
              <Pressable
                disabled={Boolean(busyId)}
                onPress={() => onUpdateFeatured(review, !review.is_featured)}
                style={[styles.actionBtn, review.is_featured ? styles.darkBtn : styles.banBtn, Boolean(busyId) && styles.disabledBtn]}
              >
                <Text style={styles.actionBtnText}>
                  {isBusy ? 'Updating...' : review.is_featured ? 'Unfeature' : 'Feature'}
                </Text>
              </Pressable>
            </View>
          );
        })
      )}
    </View>
  );
}

function ReportsPanel({ busyId, filteredReports, loading, onDeleteTarget, onDismiss, reports }) {
  const stats = [
    { label: 'Total reports', value: reports.length },
    { label: 'Pending', value: reports.filter((item) => item.status === 'PENDING').length },
    { label: 'Reviewed', value: reports.filter((item) => item.status === 'REVIEWED').length },
    { label: 'Resolved', value: reports.filter((item) => item.status === 'RESOLVED').length },
  ];

  return (
    <View style={styles.panel}>
      <StatStrip items={stats} />
      {loading ? (
        <LoadingState />
      ) : filteredReports.length === 0 ? (
        <EmptyState icon={<ShieldCheck size={20} color="#94a3b8" />} message="No reports found." />
      ) : (
        filteredReports.map((report) => {
          const isPending = report.status === 'PENDING';
          const isBusy = busyId === `report-${report.id}`;
          return (
            <View key={report.id} style={styles.reportRow}>
              <View style={styles.nameLine}>
                <Text style={styles.primaryName}>{report.target_type === 'REVIEW' ? 'Review' : 'Comment'} report</Text>
                <Pill label={report.status} tone={report.status === 'PENDING' ? 'warning' : report.status === 'RESOLVED' ? 'success' : 'neutral'} />
                <Pill label={REPORT_REASON_LABELS[report.reason] || report.reason || 'Other'} tone="admin" />
              </View>
              <Text style={styles.reportText} numberOfLines={4}>
                {report.target_text || 'Reported content is unavailable or has no text.'}
              </Text>

              <View style={styles.metaGrid}>
                <Meta label="Reporter" value={report.reporter_username || 'Unknown user'} />
                <Meta label="Target author" value={report.target_author_username || 'Unknown user'} />
                <Meta label="Reported at" value={formatDate(report.created_at)} />
              </View>
              <Text style={styles.statusNote}>
                {report.handled_at
                  ? `Handled ${formatDate(report.handled_at)}${report.handler_username ? ` by ${report.handler_username}` : ''}`
                  : 'Not handled'}
              </Text>

              <View style={styles.reportActions}>
                <Pressable
                  disabled={Boolean(busyId) || !isPending}
                  onPress={() => onDismiss(report)}
                  style={[styles.actionBtn, styles.darkBtn, styles.reportActionBtn, (Boolean(busyId) || !isPending) && styles.disabledBtn]}
                >
                  <Text style={styles.actionBtnText}>{isBusy ? 'Updating...' : 'Dismiss'}</Text>
                </Pressable>
                <Pressable
                  disabled={Boolean(busyId) || !isPending}
                  onPress={() => onDeleteTarget(report)}
                  style={[styles.actionBtn, styles.banBtn, styles.reportActionBtn, (Boolean(busyId) || !isPending) && styles.disabledBtn]}
                >
                  <Text style={styles.actionBtnText}>Delete content</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

function Meta({ label, value }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function AdminViewContent() {
  const router = useRouter();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reports, setReports] = useState([]);
  const [query, setQuery] = useState('');
  const [userFilter, setUserFilter] = useState('ALL');
  const [reviewFilter, setReviewFilter] = useState('ALL');
  const [reportFilter, setReportFilter] = useState('PENDING');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const isAdmin = (currentUser?.roles || []).map((role) => String(role).toLowerCase()).includes('admin');

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesFilter =
        userFilter === 'ALL' ||
        (userFilter === 'BANNED' && user.is_banned) ||
        (userFilter === 'ACTIVE' && !user.is_banned);
      const matchesQuery =
        activeTab !== 'users' ||
        !normalized ||
        user.username?.toLowerCase().includes(normalized) ||
        user.email?.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [activeTab, query, userFilter, users]);

  const filteredReviews = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return reviews.filter((review) => {
      const matchesFilter =
        reviewFilter === 'ALL' ||
        (reviewFilter === 'FEATURED' && review.is_featured) ||
        (reviewFilter === 'UNFEATURED' && !review.is_featured);
      const matchesQuery =
        activeTab !== 'reviews' ||
        !normalized ||
        review.username?.toLowerCase().includes(normalized) ||
        review.movie_title?.toLowerCase().includes(normalized) ||
        review.text?.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [activeTab, query, reviewFilter, reviews]);

  const filteredReports = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return reports.filter((report) => {
      const matchesFilter = reportFilter === 'ALL' || report.status === reportFilter;
      const matchesQuery =
        activeTab !== 'reports' ||
        !normalized ||
        report.reporter_username?.toLowerCase().includes(normalized) ||
        report.target_author_username?.toLowerCase().includes(normalized) ||
        report.target_text?.toLowerCase().includes(normalized) ||
        report.target_type?.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [activeTab, query, reportFilter, reports]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    setError('');
    try {
      const res = await api.get('/moderation/users');
      setUsers(res.data.users || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load users.'));
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadReviews = async () => {
    setLoadingReviews(true);
    setError('');
    try {
      const res = await api.get('/moderation/reviews');
      setReviews(res.data.reviews || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load reviews.'));
    } finally {
      setLoadingReviews(false);
    }
  };

  const loadReports = async () => {
    setLoadingReports(true);
    setError('');
    try {
      const res = await api.get('/moderation/reports');
      setReports(res.data.reports || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load reports.'));
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (!authLoading && currentUser && !isAdmin) {
      router.replace('/profile');
    }
  }, [authLoading, currentUser, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin]);

  useEffect(() => {
    if (activeTab === 'reviews' && reviews.length === 0 && isAdmin) loadReviews();
  }, [activeTab, isAdmin, reviews.length]);

  useEffect(() => {
    if (activeTab === 'reports' && reports.length === 0 && isAdmin) loadReports();
  }, [activeTab, isAdmin, reports.length]);

  const updateBan = async (targetUser, shouldBan) => {
    const verb = shouldBan ? 'ban' : 'unban';
    setBusyId(`user-${targetUser.id}`);
    setError('');
    try {
      const res = await api.patch(`/moderation/users/${targetUser.id}/${verb}`);
      const updatedUser = res.data.user;
      setUsers((current) => current.map((item) => (item.id === targetUser.id ? updatedUser : item)));
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update user status.'));
    } finally {
      setBusyId('');
    }
  };

  const updatePromotion = async (targetUser, shouldPromote) => {
    setBusyId(`promote-${targetUser.id}`);
    setError('');
    try {
      const res = await api.patch(`/admin/users/${targetUser.id}/${shouldPromote ? 'promote' : 'unpromote'}`);
      const updatedUser = res.data.user;
      setUsers((current) => current.map((item) => (item.id === targetUser.id ? updatedUser : item)));
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update admin role.'));
    } finally {
      setBusyId('');
    }
  };

  const updateFeatured = async (review, shouldFeature) => {
    const verb = shouldFeature ? 'feature' : 'unfeature';
    setBusyId(`review-${review.id}`);
    setError('');
    try {
      const res = await api.patch(`/moderation/reviews/${review.id}/${verb}`);
      const updatedReview = res.data.review;
      setReviews((current) =>
        current.map((item) =>
          item.id === review.id
            ? {
                ...item,
                is_featured: updatedReview.is_featured,
                featured_by: updatedReview.featured_by,
                featured_at: updatedReview.featured_at,
                featured_by_username: shouldFeature ? currentUser?.username : null,
              }
            : item
        )
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update review feature status.'));
    } finally {
      setBusyId('');
    }
  };

  const dismissReport = async (report) => {
    setBusyId(`report-${report.id}`);
    setError('');
    try {
      const res = await api.patch(`/moderation/reports/${report.id}/dismiss`);
      setReports((current) => current.map((item) => (item.id === report.id ? { ...item, ...res.data.report } : item)));
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to dismiss report.'));
    } finally {
      setBusyId('');
    }
  };

  const deleteReportedTarget = (report) => {
    Alert.alert('Delete reported content?', 'This action removes the reported review or comment.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusyId(`report-${report.id}`);
          setError('');
          try {
            const res = await api.delete(`/moderation/reports/${report.id}/target`);
            setReports((current) => current.map((item) => (item.id === report.id ? { ...item, ...res.data.report } : item)));
          } catch (err) {
            setError(getErrorMessage(err, 'Unable to delete reported content.'));
          } finally {
            setBusyId('');
          }
        },
      },
    ]);
  };

  if (authLoading || !currentUser || !isAdmin) {
    return (
      <ScreenContainer backgroundColor={BG}>
        <View style={styles.phone}>
          <LoadingState />
          <BottomTabBar />
        </View>
      </ScreenContainer>
    );
  }

  const isUsersTab = activeTab === 'users';
  const isReviewsTab = activeTab === 'reviews';
  const isLoading = isUsersTab ? loadingUsers : isReviewsTab ? loadingReviews : loadingReports;
  const placeholder = isUsersTab ? 'Search users...' : isReviewsTab ? 'Search reviews...' : 'Search reports...';
  const currentFilters = isUsersTab ? USER_FILTERS : isReviewsTab ? REVIEW_FILTERS : REPORT_FILTERS;
  const currentFilter = isUsersTab ? userFilter : isReviewsTab ? reviewFilter : reportFilter;
  const setCurrentFilter = isUsersTab ? setUserFilter : isReviewsTab ? setReviewFilter : setReportFilter;

  return (
    <ScreenContainer backgroundColor={BG}>
      <View style={styles.phone}>
        <TopNavbar username={currentUser?.username || 'Admin'} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.shieldBox}>
                <ShieldCheck size={18} color={RED} />
              </View>
              <View>
                <Text style={styles.title}>Admin view</Text>
                <Text style={styles.subtitle}>Manage users, bans, featured reviews, and ban history.</Text>
              </View>
            </View>
          </View>

          <SearchBox value={query} onChange={setQuery} placeholder={placeholder} />
          <Segmented items={currentFilters} value={currentFilter} onChange={setCurrentFilter} />

          <View style={styles.tabBar}>
            {TABS.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <Pressable
                  key={tab.id}
                  onPress={() => {
                    setActiveTab(tab.id);
                    setQuery('');
                    setError('');
                  }}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {isUsersTab ? (
            <UsersPanel
              busyId={busyId}
              currentUser={currentUser}
              filteredUsers={filteredUsers}
              loading={isLoading}
              onUpdateBan={updateBan}
              onUpdatePromotion={updatePromotion}
              users={users}
            />
          ) : isReviewsTab ? (
            <ReviewsPanel
              busyId={busyId}
              filteredReviews={filteredReviews}
              loading={isLoading}
              onUpdateFeatured={updateFeatured}
              reviews={reviews}
            />
          ) : (
            <ReportsPanel
              busyId={busyId}
              filteredReports={filteredReports}
              loading={isLoading}
              onDeleteTarget={deleteReportedTarget}
              onDismiss={dismissReport}
              reports={reports}
            />
          )}
        </ScrollView>
        <BottomTabBar />
      </View>
    </ScreenContainer>
  );
}

export default function AdminViewScreen() {
  return (
    <RequireAuth>
      <AdminViewContent />
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  phone: {
    backgroundColor: BG,
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingBottom: 86,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  header: {
    marginBottom: 14,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  shieldBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(208, 2, 27, 0.08)',
    borderRadius: 12,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  title: {
    color: TEXT,
    fontSize: 23,
    fontWeight: '900',
  },
  subtitle: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
    maxWidth: 285,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 42,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: TEXT,
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  clearText: {
    color: MUTED,
    fontSize: 14,
    fontWeight: '700',
  },
  segmented: {
    alignSelf: 'stretch',
    backgroundColor: '#eef0f4',
    borderRadius: 12,
    flexDirection: 'row',
    marginTop: 10,
    padding: 4,
  },
  segmentItem: {
    alignItems: 'center',
    borderRadius: 9,
    flex: 1,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: 4,
  },
  segmentItemActive: {
    backgroundColor: CARD,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: TEXT,
  },
  tabBar: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef0f4',
    borderRadius: 12,
    flexDirection: 'row',
    marginTop: 14,
    padding: 4,
  },
  tabButton: {
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  tabButtonActive: {
    backgroundColor: CARD,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextActive: {
    color: TEXT,
  },
  errorText: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: 12,
    borderWidth: 1,
    color: '#b91c1c',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 12,
    padding: 12,
  },
  panel: {
    backgroundColor: CARD,
    borderColor: BORDER,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    overflow: 'hidden',
  },
  statStrip: {
    borderBottomColor: BORDER,
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  statCell: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  statDivider: {
    borderLeftColor: BORDER,
    borderLeftWidth: 1,
  },
  statValue: {
    color: TEXT,
    fontSize: 19,
    fontWeight: '900',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  loadingState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 220,
  },
  emptyState: {
    alignItems: 'center',
    minHeight: 220,
    justifyContent: 'center',
    padding: 28,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: SOFT,
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    marginBottom: 8,
    width: 42,
  },
  emptyText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: '600',
  },
  userRow: {
    borderBottomColor: BORDER,
    borderBottomWidth: 1,
    padding: 14,
  },
  userTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: SOFT,
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 42,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
  },
  avatarText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '900',
  },
  userIdentity: {
    flex: 1,
    minWidth: 0,
  },
  nameLine: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  primaryName: {
    color: TEXT,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
  },
  emailText: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 3,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  adminPill: {
    backgroundColor: 'rgba(208, 2, 27, 0.08)',
  },
  adminPillText: {
    color: RED,
  },
  successPill: {
    backgroundColor: '#ecfdf5',
  },
  successPillText: {
    color: GREEN,
  },
  dangerPill: {
    backgroundColor: '#fef2f2',
  },
  dangerPillText: {
    color: RED,
  },
  warningPill: {
    backgroundColor: '#fefce8',
  },
  warningPillText: {
    color: YELLOW,
  },
  neutralPill: {
    backgroundColor: SOFT,
  },
  neutralPillText: {
    color: MUTED,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  metaItem: {
    flexBasis: '31%',
    flexGrow: 1,
    minWidth: 0,
  },
  metaLabel: {
    color: '#94a3b8',
    fontSize: 10,
  },
  metaValue: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  actionBtn: {
    alignItems: 'center',
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 14,
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  banBtn: {
    backgroundColor: RED,
  },
  unbanBtn: {
    backgroundColor: GREEN,
  },
  darkBtn: {
    backgroundColor: TEXT,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  actionBtnText: {
    color: CARD,
    fontSize: 13,
    fontWeight: '900',
  },
  userActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  userActionBtn: {
    flex: 1,
    marginTop: 0,
  },
  reviewRow: {
    borderBottomColor: BORDER,
    borderBottomWidth: 1,
    padding: 14,
  },
  reviewBody: {
    flexDirection: 'row',
    gap: 12,
  },
  poster: {
    alignItems: 'center',
    backgroundColor: SOFT,
    borderRadius: 10,
    height: 82,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 58,
  },
  posterImage: {
    height: '100%',
    width: '100%',
  },
  reviewContent: {
    flex: 1,
    minWidth: 0,
  },
  starRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 8,
  },
  reviewText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },
  statusNote: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
  },
  reportRow: {
    borderBottomColor: BORDER,
    borderBottomWidth: 1,
    padding: 14,
  },
  reportText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  reportActions: {
    flexDirection: 'row',
    gap: 10,
  },
  reportActionBtn: {
    flex: 1,
  },
});

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Pressable, SafeAreaView,
  RefreshControl, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import BottomTabBar from '../src/components/BottomTabBar';
import TopNavbar from '../src/components/TopNavbar';
import { useTheme } from '../src/context/ThemeContext';
import useAuthSession from '../src/hooks/useAuthSession';
import { getMyLists, getPublicLists, createList, updateList, deleteList } from '../src/services/libraryApi';

export default function Lists() {
  const router = useRouter();
  const { colors } = useTheme();
  const { loading: authLoading, isAuthenticated, user } = useAuthSession();
  const [lists, setLists]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [loadError, setLoadError]         = useState('');
  const [name, setName]                   = useState('');
  const [desc, setDesc]                   = useState('');
  const [isPublic, setIsPublic]           = useState(false);
  const [editingList, setEditingList]     = useState(null);
  const [creating, setCreating]           = useState(false);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [deleting, setDeleting]           = useState(false);
  const [nameFocused, setNameFocused]     = useState(false);
  const [descFocused, setDescFocused]     = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      if (!authLoading) fetchLists();
    }, [authLoading, isAuthenticated, user?.id, user?.userId])
  );

  useEffect(() => {
    if (deleteTarget) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(300);
      fadeAnim.setValue(0);
    }
  }, [deleteTarget]);

  async function fetchAllPublicLists() {
    const firstPage = await getPublicLists({ page: 1, limit: 50 });
    const allLists = [...(firstPage.lists || firstPage.data || [])];
    const totalPages = Number(firstPage.totalPages) || 1;

    for (let page = 2; page <= totalPages; page += 1) {
      const nextPage = await getPublicLists({ page, limit: 50 });
      allLists.push(...(nextPage.lists || nextPage.data || []));
    }

    return allLists;
  }

  async function fetchLists({ refresh = false } = {}) {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setLoadError('');

    try {
      if (isAuthenticated) {
        const res = await getMyLists(user.id || user.userId);
        setLists(res.data || []);
      } else {
        setLists(await fetchAllPublicLists());
      }
    } catch (e) {
      console.error(e);
      setLoadError(e.message || 'Impossible de charger les listes.');
      setLists([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      if (editingList) {
        await updateList(editingList.id, { name, description: desc, isPublic });
        setEditingList(null);
      } else {
        await createList({ name, description: desc, isPublic });
      }
      setName(''); setDesc(''); setIsPublic(false);
      fetchLists();
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  }

  function startEdit(list) {
    setEditingList(list);
    setName(list.name);
    setDesc(list.description || '');
    setIsPublic(list.is_public);
  }

  function handleEditPress(event, list) {
    event.stopPropagation();
    startEdit(list);
  }

  function handleDeletePress(event, list) {
    event.stopPropagation();
    setDeleteTarget(list);
  }

  function cancelEdit() {
    setEditingList(null);
    setName(''); setDesc(''); setIsPublic(false);
  }

  function closeSheet() {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 0,   duration: 200, useNativeDriver: true }),
    ]).start(() => setDeleteTarget(null));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteList(deleteTarget.id);
      closeSheet();
      setTimeout(() => fetchLists(), 250);
    } catch (e) { console.error(e); }
    finally { setDeleting(false); }
  }

  const movieCount = parseInt(deleteTarget?.movie_count) || 0;

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]}>
      <TopNavbar username={user?.username || 'User'} />

      {isAuthenticated ? (
        <View style={[s.subNav, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Pressable style={s.subNavBtn} onPress={() => router.push('/library')}>
            <Text style={[s.subNavText, { color: colors.subtle }]}>Biblio</Text>
          </Pressable>
          <Pressable style={[s.subNavBtn, s.subNavBtnActive]}>
            <Text style={[s.subNavText, s.subNavTextActive]}>Listes</Text>
          </Pressable>
          <Pressable style={s.subNavBtn} onPress={() => router.push('/dashboard')}>
            <Text style={[s.subNavText, { color: colors.subtle }]}>Stats</Text>
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchLists({ refresh: true })}
            tintColor="#D0021B"
            colors={['#D0021B']}
          />
        }
      >
        <View style={s.header}>
          <Text style={[s.headerTitle, { color: colors.text }]}>
            {isAuthenticated ? 'Mes listes' : 'Listes publiques'}
          </Text>
          <Text style={[s.headerSub, { color: colors.muted }]}>
            {isAuthenticated
              ? 'Organisez vos films par themes et coups de coeur.'
              : 'Decouvrez les collections partagees par la communaute.'}
          </Text>
        </View>

        {isAuthenticated ? (
        <View style={[s.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.formCardAccent} />
          <View style={s.formCardHeader}>
            <View style={s.formCardIcon}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>+</Text>
            </View>
            <Text style={[s.formCardTitle, { color: colors.text }]}>{editingList ? 'Modifier la liste' : 'Nouvelle liste'}</Text>
          </View>
          <Text style={[s.formLabel, { color: colors.subtle }]}>NOM</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }, nameFocused && s.inputFocused]}
            placeholder="Ex: Films a voir ce mois-ci"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
          />
          <Text style={[s.formLabel, { color: colors.subtle }]}>DESCRIPTION</Text>
          <TextInput
            style={[s.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }, descFocused && s.inputFocused]}
            placeholder="Optionnel"
            placeholderTextColor="#9ca3af"
            value={desc}
            onChangeText={setDesc}
            onFocus={() => setDescFocused(true)}
            onBlur={() => setDescFocused(false)}
          />
          <View style={s.formBottom}>
            <Pressable style={s.publicRow} onPress={() => setIsPublic(!isPublic)}>
              <View style={[s.checkbox, isPublic && s.checkboxOn]}>
                {isPublic && <Text style={s.checkmark}>v</Text>}
              </View>
              <Text style={[s.publicLabel, { color: colors.muted }]}>Publique</Text>
            </Pressable>
            <View style={s.formBtns}>
              {editingList && (
                <Pressable style={s.cancelBtn} onPress={cancelEdit}>
                  <Text style={[s.cancelBtnText, { color: colors.muted }]}>Annuler</Text>
                </Pressable>
              )}
              <Pressable style={[s.createBtn, creating && { opacity: 0.7 }]} onPress={handleCreate} disabled={creating}>
                <Text style={s.createBtnText}>{editingList ? 'Modifier' : '+ Creer'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
        ) : null}

        <View style={s.sectionHeader}>
          <View style={s.sectionTitleRow}>
            <Text style={[s.sectionTitle, { color: colors.subtle }]}>
              {isAuthenticated ? 'MES LISTES' : 'LISTES PUBLIQUES'}
            </Text>
            <View style={s.sectionBadge}>
              <Text style={s.sectionBadgeText}>{lists.length}</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator color="#D0021B" /></View>
        ) : loadError ? (
          <View style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.emptyTitle, { color: colors.text }]}>Chargement impossible</Text>
            <Text style={[s.emptySub, { color: colors.subtle }]}>{loadError}</Text>
            <Pressable style={s.retryBtn} onPress={() => fetchLists()}>
              <Text style={s.retryBtnText}>Reessayer</Text>
            </Pressable>
          </View>
        ) : lists.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[s.emptyTitle, { color: colors.text }]}>
              {isAuthenticated ? 'Aucune liste pour le moment' : 'Aucune liste publique'}
            </Text>
            <Text style={[s.emptySub, { color: colors.subtle }]}>
              {isAuthenticated
                ? 'Creez une liste pour organiser vos films.'
                : 'Les listes publiques apparaitront ici quand elles seront partagees.'}
            </Text>
          </View>
        ) : (
          <View style={s.listsContainer}>
            {lists.map((list) => {
              const count = parseInt(list.movie_count) || 0;
              return (
                <Pressable
                  key={list.id}
                  style={[s.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push({ pathname: '/list/[id]', params: { id: String(list.id) } })}
                >
                  <View style={[s.listIconBox, { backgroundColor: colors.cardMuted }]}>
                    <Text style={[s.listIconText, { color: colors.muted }]}>{list.is_public ? 'G' : 'P'}</Text>
                  </View>
                  <View style={s.listInfo}>
                    <Text style={[s.listName, { color: colors.text }]} numberOfLines={1}>{list.name}</Text>
                    <View style={s.listMetaRow}>
                      <Text style={s.listMeta}>{count} film{count !== 1 ? 's' : ''}</Text>
                      <Text style={s.listMetaDot}> • </Text>
                      <View style={[s.statusBadge, list.is_public ? s.statusBadgePublic : s.statusBadgePrivate]}>
                        <Text style={[s.statusBadgeText, list.is_public ? s.statusPublicText : s.statusPrivateText]}>
                          {list.is_public ? 'Publique' : 'Privee'}
                        </Text>
                      </View>
                    </View>
                    {list.description ? <Text style={[s.listDesc, { color: colors.subtle }]} numberOfLines={1}>{list.description}</Text> : null}
                  </View>
                  {isAuthenticated ? (
                    <View style={s.listActions}>
                      <Pressable style={[s.iconBtnEdit, { backgroundColor: colors.iconButton }]} onPress={(event) => handleEditPress(event, list)}>
                        <Text style={[s.iconBtnEditText, { color: colors.muted }]}>Ed</Text>
                      </Pressable>
                      <Pressable style={s.iconBtnDel} onPress={(event) => handleDeletePress(event, list)}>
                        <Text style={s.iconBtnDelText}>Sup</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <BottomTabBar />

      {deleteTarget && (
        <>
          <Animated.View style={[s.backdrop, { opacity: fadeAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet} />
          </Animated.View>
          <Animated.View style={[s.sheet, { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] }]}>
            <View style={[s.sheetHandle, { backgroundColor: colors.border }]} />
            <View style={s.sheetIconWrap} />
            <Text style={[s.sheetTitle, { color: colors.text }]}>Supprimer la liste</Text>
            <Text style={[s.sheetSub, { color: colors.muted }]}>
              Supprimer <Text style={[s.sheetListName, { color: colors.text }]}>"{deleteTarget?.name}"</Text> ?
            </Text>
            {movieCount > 0 && (
              <View style={s.sheetWarningBox}>
                <Text style={s.sheetWarning}>{movieCount} film{movieCount > 1 ? 's' : ''} retire{movieCount > 1 ? 's' : ''}</Text>
              </View>
            )}
            <Text style={s.sheetIrreversible}>Cette action est irreversible.</Text>
            <View style={s.sheetBtns}>
              <Pressable style={[s.sheetCancel, { borderColor: colors.border }]} onPress={closeSheet}>
                <Text style={[s.sheetCancelText, { color: colors.muted }]}>Annuler</Text>
              </Pressable>
              <Pressable style={[s.sheetConfirm, deleting && { opacity: 0.6 }]} onPress={confirmDelete} disabled={deleting}>
                <Text style={s.sheetConfirmText}>{deleting ? '...' : 'Oui, supprimer'}</Text>
              </Pressable>
            </View>
          </Animated.View>
        </>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:               { flex: 1, backgroundColor: '#f9fafb' },
  subNav:             { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff' },
  subNavBtn:          { flex: 1, paddingVertical: 12, alignItems: 'center' },
  subNavBtnActive:    { borderBottomWidth: 2, borderBottomColor: '#D0021B' },
  subNavText:         { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  subNavTextActive:   { color: '#D0021B' },
  scroll:             { padding: 16, paddingBottom: 100, gap: 14 },
  header:             { gap: 4 },
  headerTitle:        { color: '#111827', fontSize: 22, fontWeight: '900' },
  headerSub:          { color: '#6b7280', fontSize: 12 },
  formCard:           { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', gap: 10, overflow: 'hidden' },
  formCardAccent:     { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#D0021B' },
  formCardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  formCardIcon:       { width: 32, height: 32, borderRadius: 10, backgroundColor: '#D0021B', alignItems: 'center', justifyContent: 'center' },
  formCardTitle:      { color: '#111827', fontSize: 14, fontWeight: '800' },
  formLabel:          { color: '#9ca3af', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  input:              { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#111827', fontSize: 14 },
  inputFocused:       { borderColor: '#D0021B' },
  formBottom:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  publicRow:          { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox:           { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  checkboxOn:         { backgroundColor: '#D0021B', borderColor: '#D0021B' },
  checkmark:          { color: '#fff', fontSize: 12, fontWeight: '900' },
  publicLabel:        { color: '#374151', fontSize: 13, fontWeight: '600' },
  formBtns:           { flexDirection: 'row', gap: 8 },
  cancelBtn:          { backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  cancelBtnText:      { color: '#374151', fontSize: 12, fontWeight: '600' },
  createBtn:          { backgroundColor: '#D0021B', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 },
  createBtnText:      { color: '#fff', fontSize: 13, fontWeight: '700' },
  sectionHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle:       { color: '#9ca3af', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  sectionBadge:       { backgroundColor: '#D0021B', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  sectionBadgeText:   { color: '#fff', fontSize: 11, fontWeight: '800' },
  center:             { paddingVertical: 40, alignItems: 'center' },
  emptyCard:          { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb', gap: 8 },
  emptyTitle:         { color: '#111827', fontSize: 14, fontWeight: '700' },
  emptySub:           { color: '#9ca3af', fontSize: 12, textAlign: 'center' },
  retryBtn:           { marginTop: 8, backgroundColor: '#D0021B', borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10 },
  retryBtnText:       { color: '#fff', fontSize: 12, fontWeight: '800' },
  listsContainer:     { gap: 10 },
  listCard:           { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  listIconBox:        { width: 48, height: 48, borderRadius: 14, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  listIconText:       { color: '#6b7280', fontSize: 13, fontWeight: '800' },
  listInfo:           { flex: 1, gap: 5 },
  listName:           { color: '#111827', fontSize: 14, fontWeight: '800' },
  listMetaRow:        { flexDirection: 'row', alignItems: 'center' },
  listMeta:           { color: '#9ca3af', fontSize: 11 },
  listMetaDot:        { color: '#9ca3af', fontSize: 11 },
  statusBadge:        { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  statusBadgePublic:  { backgroundColor: '#d1fae5' },
  statusBadgePrivate: { backgroundColor: '#fef3c7' },
  statusBadgeText:    { fontSize: 10, fontWeight: '700' },
  statusPublicText:   { color: '#065f46' },
  statusPrivateText:  { color: '#92400e' },
  listDesc:           { color: '#9ca3af', fontSize: 11 },
  listActions:        { gap: 8 },
  iconBtnEdit:        { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', borderRadius: 10 },
  iconBtnDel:         { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', borderRadius: 10 },
  iconBtnEditText:    { color: '#374151', fontSize: 11, fontWeight: '700' },
  iconBtnDelText:     { color: '#ef4444', fontSize: 11, fontWeight: '700' },
  backdrop:           { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10 },
  sheet:              { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48, alignItems: 'center', gap: 12, zIndex: 11, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 20 },
  sheetHandle:        { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, marginBottom: 8 },
  sheetIconWrap:      { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fee2e2' },
  sheetTitle:         { color: '#111827', fontSize: 18, fontWeight: '900' },
  sheetSub:           { color: '#6b7280', fontSize: 14, textAlign: 'center' },
  sheetListName:      { color: '#111827', fontWeight: '800' },
  sheetWarningBox:    { backgroundColor: '#fef3c7', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderColor: '#fde68a', width: '100%' },
  sheetWarning:       { color: '#92400e', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  sheetIrreversible:  { color: '#ef4444', fontSize: 11, fontWeight: '600' },
  sheetBtns:          { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  sheetCancel:        { flex: 1, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  sheetCancelText:    { color: '#6b7280', fontSize: 14, fontWeight: '700' },
  sheetConfirm:       { flex: 1, backgroundColor: '#D0021B', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  sheetConfirmText:   { color: '#fff', fontSize: 14, fontWeight: '700' },
});

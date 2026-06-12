import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Dimensions, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import BottomTabBar from '../src/components/BottomTabBar';
import TopNavbar from '../src/components/TopNavbar';
import { getAuthUser, getAuthToken } from '../src/services/authStorage';
import { getMyLists, createList, updateList, deleteList } from '../src/services/libraryApi';

const { width: W } = Dimensions.get('window');
const IS_WEB = W > 500;

export default function Lists() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getAuthUser().then(setUser);
    getAuthToken().then(t => console.log('TOKEN:', t));
  }, []);

  useEffect(() => { if (user) fetchLists(); }, [user]);

  useEffect(() => {
    if (deleteTarget) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(300);
      fadeAnim.setValue(0);
    }
  }, [deleteTarget]);

  async function fetchLists() {
    setLoading(true);
    try {
      const res = await getMyLists(user.id || user.userId);
      setLists(res.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
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

  function cancelEdit() {
    setEditingList(null);
    setName(''); setDesc(''); setIsPublic(false);
  }

  function closeSheet() {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
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
    <View style={IS_WEB ? s.pageWeb : s.pageMobile}>
      <View style={IS_WEB ? s.phoneWeb : s.phoneMobile}>
        <TopNavbar username={user?.username || 'User'} />

        <View style={s.subNav}>
          <Pressable style={s.subNavBtn} onPress={() => router.push('/library')}>
            <Text style={s.subNavText}>📚 Biblio</Text>
          </Pressable>
          <Pressable style={[s.subNavBtn, s.subNavBtnActive]}>
            <Text style={[s.subNavText, s.subNavTextActive]}>📋 Listes</Text>
          </Pressable>
          <Pressable style={s.subNavBtn} onPress={() => router.push('/dashboard')}>
            <Text style={s.subNavText}>📊 Stats</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <View style={s.header}>
            <Text style={s.headerTitle}>Mes listes ✨</Text>
            <Text style={s.headerSub}>Organisez vos films par thèmes, envies ou coups de cœur.</Text>
          </View>

          <View style={s.formCard}>
            <View style={s.formCardAccent} />
            <View style={s.formCardHeader}>
              <View style={s.formCardIcon}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900' }}>+</Text>
              </View>
              <Text style={s.formCardTitle}>{editingList ? 'Modifier la liste' : 'Nouvelle liste'}</Text>
            </View>
            <Text style={s.formLabel}>NOM</Text>
            <TextInput
              style={[s.input, nameFocused && s.inputFocused]}
              placeholder="Ex: Films à voir ce mois-ci"
              placeholderTextColor="#3d3d5c"
              value={name}
              onChangeText={setName}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
            />
            <Text style={s.formLabel}>DESCRIPTION</Text>
            <TextInput
              style={[s.input, descFocused && s.inputFocused]}
              placeholder="Optionnel"
              placeholderTextColor="#3d3d5c"
              value={desc}
              onChangeText={setDesc}
              onFocus={() => setDescFocused(true)}
              onBlur={() => setDescFocused(false)}
            />
            <View style={s.formBottom}>
              <Pressable style={s.publicRow} onPress={() => setIsPublic(!isPublic)}>
                <View style={[s.checkbox, isPublic && s.checkboxOn]}>
                  {isPublic && <Text style={s.checkmark}>✓</Text>}
                </View>
                <Text style={s.lockIcon}>🔒</Text>
                <Text style={s.publicLabel}>Publique</Text>
              </Pressable>
              <View style={s.formBtns}>
                {editingList && (
                  <Pressable style={s.cancelBtn} onPress={cancelEdit}>
                    <Text style={s.cancelBtnText}>Annuler</Text>
                  </Pressable>
                )}
                <Pressable style={[s.createBtn, creating && { opacity: 0.7 }]} onPress={handleCreate} disabled={creating}>
                  <Text style={s.createBtnText}>{editingList ? 'Modifier' : '+ Créer'}</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={s.sectionHeader}>
            <View style={s.sectionTitleRow}>
              <Text style={s.sectionTitle}>MES LISTES</Text>
              <View style={s.sectionBadge}>
                <Text style={s.sectionBadgeText}>{lists.length}</Text>
              </View>
            </View>
            <Pressable><Text style={s.seeAll}>Tout voir &gt;</Text></Pressable>
          </View>

          {loading ? (
            <View style={s.center}><ActivityIndicator color="#ef0d1a" /></View>
          ) : lists.length === 0 ? (
            <View style={s.emptyCard}>
              <Text style={s.emptyIcon}>🗂️</Text>
              <Text style={s.emptyTitle}>Aucune liste pour le moment</Text>
              <Text style={s.emptySub}>Créez une liste pour organiser vos films.</Text>
            </View>
          ) : (
            <View style={s.listsContainer}>
              {lists.map((list) => {
                const count = parseInt(list.movie_count) || 0;
                return (
                  <View key={list.id} style={s.listCard}>
                    <View style={s.listIconBox}>
                      <Text style={s.listIconText}>{list.is_public ? '🌍' : '🔒'}</Text>
                    </View>
                    <View style={s.listInfo}>
                      <Text style={s.listName} numberOfLines={1}>{list.name}</Text>
                      <View style={s.listMetaRow}>
                        <Text style={s.listMeta}>{count} film{count !== 1 ? 's' : ''}</Text>
                        <Text style={s.listMetaDot}> • </Text>
                        <View style={[s.statusBadge, list.is_public ? s.statusBadgePublic : s.statusBadgePrivate]}>
                          <Text style={[s.statusBadgeText, list.is_public ? s.statusPublicText : s.statusPrivateText]}>
                            {list.is_public ? '🌍 Publique' : '🔒 Privée'}
                          </Text>
                        </View>
                      </View>
                      {list.description ? <Text style={s.listDesc} numberOfLines={1}>{list.description}</Text> : null}
                    </View>
                    <View style={s.listActions}>
                      <Pressable style={s.iconBtnEdit} onPress={() => startEdit(list)}>
                        <Text style={{ fontSize: 14 }}>✏️</Text>
                      </Pressable>
                      <Pressable style={s.iconBtnDel} onPress={() => setDeleteTarget(list)}>
                        <Text style={{ fontSize: 14 }}>🗑️</Text>
                      </Pressable>
                    </View>
                  </View>
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
            <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
              <View style={s.sheetHandle} />
              <View style={s.sheetIconWrap}>
                <Text style={{ fontSize: 22 }}>🗑️</Text>
              </View>
              <Text style={s.sheetTitle}>Supprimer la liste</Text>
              <Text style={s.sheetSub}>
                Supprimer <Text style={s.sheetListName}>"{deleteTarget?.name}"</Text> ?
              </Text>
              {movieCount > 0 && (
                <View style={s.sheetWarningBox}>
                  <Text style={s.sheetWarning}>⚠️ {movieCount} film{movieCount > 1 ? 's' : ''} retiré{movieCount > 1 ? 's' : ''}</Text>
                </View>
              )}
              <Text style={s.sheetIrreversible}>Cette action est irréversible.</Text>
              <View style={s.sheetBtns}>
                <Pressable style={s.sheetCancel} onPress={closeSheet}>
                  <Text style={s.sheetCancelText}>Annuler</Text>
                </Pressable>
                <Pressable style={[s.sheetConfirm, deleting && { opacity: 0.6 }]} onPress={confirmDelete} disabled={deleting}>
                  <Text style={s.sheetConfirmText}>{deleting ? '...' : 'Oui, supprimer'}</Text>
                </Pressable>
              </View>
            </Animated.View>
          </>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  pageWeb: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', padding: 20 },
  pageMobile: { flex: 1, backgroundColor: '#0a0a12' },
  phoneWeb: { backgroundColor: '#0a0a12', borderRadius: 22, height: 592, maxWidth: 315, overflow: 'hidden', width: '100%', position: 'relative' },
  phoneMobile: { flex: 1, backgroundColor: '#0a0a12', position: 'relative' },
  subNav: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  subNavBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  subNavBtnActive: { borderBottomWidth: 2, borderBottomColor: '#ef0d1a' },
  subNavText: { color: '#6b7280', fontSize: 12, fontWeight: '600' },
  subNavTextActive: { color: '#ef0d1a' },
  scroll: { padding: 16, paddingBottom: 100, gap: 14 },
  header: { gap: 4 },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
  headerSub: { color: '#6b7280', fontSize: 11 },
  formCard: { backgroundColor: '#0f0f1e', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e1e3a', gap: 10, overflow: 'hidden' },
  formCardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#ef0d1a' },
  formCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  formCardIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#ef0d1a', alignItems: 'center', justifyContent: 'center' },
  formCardTitle: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  formLabel: { color: '#4b5563', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  input: { backgroundColor: '#080814', borderWidth: 1, borderColor: '#1e1e3a', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, color: '#ffffff', fontSize: 13 },
  inputFocused: { borderColor: '#ef0d1a' },
  formBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  publicRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: '#4b5563', alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: '#ef0d1a', borderColor: '#ef0d1a' },
  checkmark: { color: '#fff', fontSize: 11, fontWeight: '900' },
  lockIcon: { fontSize: 12 },
  publicLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  formBtns: { flexDirection: 'row', gap: 8 },
  cancelBtn: { backgroundColor: '#1a1a2e', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  cancelBtnText: { color: '#9ca3af', fontSize: 11, fontWeight: '600' },
  createBtn: { backgroundColor: '#ef0d1a', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, shadowColor: '#ef0d1a', shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },
  createBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: '#6b7280', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  sectionBadge: { backgroundColor: '#ef0d1a', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  sectionBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  seeAll: { color: '#6b7280', fontSize: 10, fontWeight: '600' },
  center: { paddingVertical: 40, alignItems: 'center' },
  emptyCard: { backgroundColor: '#0f0f1e', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#1e1e3a', gap: 8 },
  emptyIcon: { fontSize: 32, marginBottom: 4 },
  emptyTitle: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  emptySub: { color: '#6b7280', fontSize: 11, textAlign: 'center' },
  listsContainer: { gap: 10 },
  listCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0f1e', borderRadius: 16, padding: 14, gap: 12, borderWidth: 1, borderColor: '#1e1e3a' },
  listIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#1a1a2e', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2a2a4e' },
  listIconText: { fontSize: 22 },
  listInfo: { flex: 1, gap: 5 },
  listName: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
  listMetaRow: { flexDirection: 'row', alignItems: 'center' },
  listMeta: { color: '#6b7280', fontSize: 10 },
  listMetaDot: { color: '#6b7280', fontSize: 10 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  statusBadgePublic: { backgroundColor: '#052e16' },
  statusBadgePrivate: { backgroundColor: '#1c1207' },
  statusBadgeText: { fontSize: 9, fontWeight: '700' },
  statusPublicText: { color: '#4ade80' },
  statusPrivateText: { color: '#fbbf24' },
  listDesc: { color: '#4b5563', fontSize: 10 },
  listActions: { gap: 8 },
  iconBtnEdit: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e', borderRadius: 10, borderWidth: 1, borderColor: '#2a2a4e' },
  iconBtnDel: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a0808', borderRadius: 10, borderWidth: 1, borderColor: '#3d1010' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 10 },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0f0f1e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderWidth: 1, borderBottomWidth: 0, borderColor: '#1e1e3a', alignItems: 'center', gap: 10, zIndex: 11 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#2a2a4e', borderRadius: 2, marginBottom: 8 },
  sheetIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1a0808', borderWidth: 1, borderColor: '#3d1010', alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  sheetSub: { color: '#9ca3af', fontSize: 13, textAlign: 'center' },
  sheetListName: { color: '#ffffff', fontWeight: '800' },
  sheetWarningBox: { backgroundColor: '#1c1207', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#3d2007', width: '100%' },
  sheetWarning: { color: '#fbbf24', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  sheetIrreversible: { color: '#ef4444', fontSize: 10, fontWeight: '600' },
  sheetBtns: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 6 },
  sheetCancel: { flex: 1, borderWidth: 1, borderColor: '#2a2a4e', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  sheetCancelText: { color: '#9ca3af', fontSize: 13, fontWeight: '700' },
  sheetConfirm: { flex: 1, backgroundColor: '#ef0d1a', borderRadius: 14, paddingVertical: 14, alignItems: 'center', shadowColor: '#ef0d1a', shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  sheetConfirmText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
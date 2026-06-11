import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import RequireAuth from '../src/components/RequireAuth';
import ScreenContainer from '../src/components/ScreenContainer';
import api, { API_BASE_URL } from '../src/config/api';
import { clearAuthSession, getAuthToken, saveAuthSession } from '../src/services/authStorage';
import { useAuth } from '../src/services/authApi';

const RED = '#ef0d1a';
const TEXT = '#111827';
const MUTED = '#6b7280';
const BORDER = '#e5e7eb';
const BG = '#f3f4f6';
const TABS = ['Profil', 'Compte', 'Notifications'];

const getUser = (data) => data?.user ?? data?.data ?? data;
const isValidUrl = (value) => {
  if (!value.trim()) return true;
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};
const isStrongPassword = (value) =>
  value.length >= 8 && /[A-Z]/.test(value) && /[0-9]/.test(value);

function Card({ title, danger = false, children }) {
  return (
    <View style={styles.card}>
      {title ? <Text style={[styles.cardTitle, danger && styles.dangerText]}>{title}</Text> : null}
      {children}
    </View>
  );
}

function Field({ label, error, multiline = false, disabled = false, ...props }) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        {...props}
        editable={!disabled}
        multiline={multiline}
        placeholderTextColor="#9ca3af"
        style={[
          styles.input,
          multiline && styles.textarea,
          disabled && styles.inputDisabled,
          error && styles.inputError,
        ]}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function ActionButton({ label, onPress, loading, success, outline = false, danger = false }) {
  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      style={[
        styles.button,
        outline && styles.buttonOutline,
        danger && styles.buttonDanger,
        success && styles.buttonSuccess,
        loading && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={outline ? RED : '#fff'} />
      ) : (
        <Text style={[styles.buttonText, outline && styles.buttonOutlineText]}>
          {success ? 'Enregistré' : label}
        </Text>
      )}
    </Pressable>
  );
}

function Notice({ children }) {
  if (!children) return null;
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

function SettingToggle({ label, description, value, onChange }) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#d1d5db', true: RED }}
        thumbColor="#ffffff"
        ios_backgroundColor="#d1d5db"
      />
    </View>
  );
}

function SettingsContent() {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [tab, setTab] = useState('Profil');
  const [localUser, setLocalUser] = useState(user);
  const [profile, setProfile] = useState({ username: '', bio: '', website_url: '' });
  const [profileError, setProfileError] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [avatarAsset, setAvatarAsset] = useState(null);
  const [language, setLanguage] = useState('en');
  const [languageLoading, setLanguageLoading] = useState(false);
  const [languageSuccess, setLanguageSuccess] = useState(false);
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' });
  const [passwordError, setPasswordError] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [notifs, setNotifs] = useState({
    likes: true,
    comments: true,
    followers: true,
    push: true,
    email: false,
  });
  const [notifsLoading, setNotifsLoading] = useState(false);
  const [notifsSuccess, setNotifsSuccess] = useState(false);
  const [notifsError, setNotifsError] = useState('');
  const allActivity = notifs.likes && notifs.comments && notifs.followers;

  useEffect(() => {
    if (!user) return;
    setLocalUser(user);
    setProfile({
      username: user.username || '',
      bio: user.bio || '',
      website_url: user.website_url || '',
    });
    setLanguage(user.language_preference || 'en');
  }, [user]);

  useEffect(() => {
    let active = true;
    api.get('/users/me/notification-preferences')
      .then(({ data }) => {
        if (!active) return;
        const p = data?.preferences || {};
        setNotifs({
          likes: p.notification_likes_enabled !== false,
          comments: p.notification_comments_enabled !== false,
          followers: p.notification_followers_enabled !== false,
          push: p.notification_push_enabled !== false,
          email: p.notification_email_enabled === true,
        });
      })
      .catch((error) => {
        if (active) setNotifsError(error.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const persistUser = async (nextUser) => {
    const authToken = token || await getAuthToken();
    setLocalUser(nextUser);
    if (authToken) await saveAuthSession(authToken, nextUser);
  };

  const pickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Autorisez l’accès aux photos pour changer votre avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 2 * 1024 * 1024) {
        setProfileError({ avatar: 'La taille maximale est de 2 Mo.' });
        return;
      }
      setAvatarAsset(asset);
      setProfileError((current) => ({ ...current, avatar: '', api: '' }));
    }
  };

  const saveProfile = async () => {
    const errors = {};
    if (profile.username.trim().length < 3) errors.username = 'Minimum 3 caractères.';
    if (!isValidUrl(profile.website_url)) errors.website_url = 'Entrez une URL http(s) valide.';
    if (Object.keys(errors).length) {
      setProfileError(errors);
      return;
    }
    setProfileLoading(true);
    setProfileSuccess(false);
    try {
      let nextUser = localUser;
      if (avatarAsset) {
        const form = new FormData();
        const fileName =
          avatarAsset.fileName || `avatar.${avatarAsset.mimeType?.split('/')[1] || 'jpg'}`;
        if (Platform.OS === 'web' && avatarAsset.file) {
          form.append('avatar', avatarAsset.file, fileName);
        } else {
          form.append('avatar', {
            uri: avatarAsset.uri,
            name: fileName,
            type: avatarAsset.mimeType || 'image/jpeg',
          });
        }
        const avatarResponse = await api.patch('/users/me/avatar', form);
        nextUser = getUser(avatarResponse.data);
      }
      const response = await api.put('/users/me', {
        username: profile.username.trim(),
        bio: profile.bio,
        website_url: profile.website_url.trim() || null,
      });
      nextUser = { ...nextUser, ...getUser(response.data) };
      await persistUser(nextUser);
      setAvatarAsset(null);
      setProfileError({});
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2500);
    } catch (error) {
      setProfileError({ api: error.message || 'La mise à jour a échoué.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const saveLanguage = async () => {
    setLanguageLoading(true);
    setLanguageSuccess(false);
    try {
      const response = await api.put('/users/me', { language_preference: language });
      await persistUser({ ...localUser, ...getUser(response.data) });
      setLanguageSuccess(true);
      setTimeout(() => setLanguageSuccess(false), 2500);
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLanguageLoading(false);
    }
  };

  const savePassword = async () => {
    const errors = {};
    if (!password.current) errors.current = 'Champ requis.';
    if (!isStrongPassword(password.next)) {
      errors.next = '8 caractères minimum, une majuscule et un chiffre.';
    }
    if (password.next !== password.confirm) errors.confirm = 'Les mots de passe diffèrent.';
    if (Object.keys(errors).length) {
      setPasswordError(errors);
      return;
    }
    setPasswordLoading(true);
    setPasswordSuccess(false);
    try {
      await api.patch('/users/me/password', {
        current_password: password.current,
        new_password: password.next,
      });
      setPassword({ current: '', next: '', confirm: '' });
      setPasswordError({});
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 2500);
    } catch (error) {
      setPasswordError({ api: error.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const saveNotifications = async () => {
    setNotifsLoading(true);
    setNotifsSuccess(false);
    setNotifsError('');
    try {
      await api.patch('/users/me/notification-preferences', {
        notification_likes_enabled: notifs.likes,
        notification_comments_enabled: notifs.comments,
        notification_followers_enabled: notifs.followers,
        notification_push_enabled: notifs.push,
        notification_email_enabled: notifs.email,
      });
      setNotifsSuccess(true);
      setTimeout(() => setNotifsSuccess(false), 2500);
    } catch (error) {
      setNotifsError(error.message);
    } finally {
      setNotifsLoading(false);
    }
  };

  const exportData = async (format) => {
    try {
      const authToken = token || await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/users/me/export?format=${format}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!response.ok) throw new Error('Export impossible.');
      const content = await response.text();
      if (Platform.OS === 'web') {
        const blob = new Blob([content], {
          type: format === 'csv' ? 'text/csv' : 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `supmovies-data.${format}`;
        anchor.click();
        URL.revokeObjectURL(url);
        return;
      }
      const file = new FileSystem.File(FileSystem.Paths.cache, `supmovies-data.${format}`);
      file.write(content);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: format === 'csv' ? 'text/csv' : 'application/json',
          dialogTitle: 'Exporter mes données',
        });
      }
    } catch (error) {
      Alert.alert('Erreur', error.message);
    }
  };

  const deleteAccount = () => {
    Alert.alert(
      'Supprimer le compte',
      'Toutes vos données seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/users/me');
              await clearAuthSession();
              router.replace('/discover');
            } catch (error) {
              Alert.alert('Erreur', error.message);
            }
          },
        },
      ]
    );
  };

  if (loading || !localUser) {
    return <View style={styles.loading}><ActivityIndicator size="large" color={RED} /></View>;
  }

  const avatarUri = avatarAsset?.uri || localUser.avatar_url;

  return (
    <ScreenContainer backgroundColor={BG}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View>
          <Text style={styles.title}>Paramètres</Text>
          <Text style={styles.subtitle}>Gérez votre compte et vos préférences</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {TABS.map((item) => (
          <Pressable
            key={item}
            onPress={() => setTab(item)}
            style={[styles.tab, tab === item && styles.tabActive]}
          >
            <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'Profil' ? (
          <Card title="Informations du profil">
            <Notice>{profileError.api}</Notice>
            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitials}>
                    {(profile.username || 'U').slice(0, 2).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={styles.avatarCopy}>
                <ActionButton label="Changer l’avatar" onPress={pickAvatar} outline />
                <Text style={styles.helper}>JPG, PNG, WEBP ou GIF. Maximum 2 Mo.</Text>
                {profileError.avatar ? <Text style={styles.errorText}>{profileError.avatar}</Text> : null}
              </View>
            </View>
            <View style={styles.divider} />
            <Field
              label="Nom d’utilisateur"
              value={profile.username}
              onChangeText={(username) => {
                setProfile((current) => ({ ...current, username }));
                setProfileError((current) => ({ ...current, username: '' }));
              }}
              error={profileError.username}
              autoCapitalize="none"
            />
            <Field
              label="Bio"
              value={profile.bio}
              onChangeText={(bio) => setProfile((current) => ({ ...current, bio }))}
              multiline
              maxLength={160}
            />
            <Text style={styles.counter}>{profile.bio.length}/160</Text>
            <Field
              label="Site web"
              value={profile.website_url}
              onChangeText={(website_url) => {
                setProfile((current) => ({ ...current, website_url }));
                setProfileError((current) => ({ ...current, website_url: '' }));
              }}
              error={profileError.website_url}
              autoCapitalize="none"
              keyboardType="url"
              placeholder="https://votresite.com"
            />
            <ActionButton
              label="Enregistrer les modifications"
              onPress={saveProfile}
              loading={profileLoading}
              success={profileSuccess}
            />
          </Card>
        ) : null}

        {tab === 'Compte' ? (
          <>
            <Card title="Paramètres du compte">
              <Field label="Email" value={localUser.email || ''} disabled />
              <View style={styles.divider} />
              <Text style={styles.label}>Langue</Text>
              <View style={styles.languageRow}>
                {[
                  { value: 'en', label: 'English' },
                  { value: 'fr', label: 'Français' },
                ].map((item) => (
                  <Pressable
                    key={item.value}
                    onPress={() => setLanguage(item.value)}
                    style={[styles.languageOption, language === item.value && styles.languageOptionActive]}
                  >
                    <Text style={[
                      styles.languageText,
                      language === item.value && styles.languageTextActive,
                    ]}>
                      {item.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <ActionButton
                label="Enregistrer la langue"
                onPress={saveLanguage}
                loading={languageLoading}
                success={languageSuccess}
              />
              <View style={styles.divider} />
              <Text style={styles.sectionHeading}>Changer le mot de passe</Text>
              <Notice>{passwordError.api}</Notice>
              <Field
                placeholder="Mot de passe actuel"
                secureTextEntry
                value={password.current}
                onChangeText={(current) => {
                  setPassword((value) => ({ ...value, current }));
                  setPasswordError((value) => ({ ...value, current: '' }));
                }}
                error={passwordError.current}
              />
              <Field
                placeholder="Nouveau mot de passe"
                secureTextEntry
                value={password.next}
                onChangeText={(next) => {
                  setPassword((value) => ({ ...value, next }));
                  setPasswordError((value) => ({ ...value, next: '' }));
                }}
                error={passwordError.next}
              />
              <Field
                placeholder="Confirmer le nouveau mot de passe"
                secureTextEntry
                value={password.confirm}
                onChangeText={(confirm) => {
                  setPassword((value) => ({ ...value, confirm }));
                  setPasswordError((value) => ({ ...value, confirm: '' }));
                }}
                error={passwordError.confirm}
              />
              <ActionButton
                label="Mettre à jour le mot de passe"
                onPress={savePassword}
                loading={passwordLoading}
                success={passwordSuccess}
              />
            </Card>

            <Card title="Compte connecté">
              <View style={styles.connectedRow}>
                <View style={styles.googleBadge}><Text style={styles.googleText}>G</Text></View>
                <View style={styles.connectedCopy}>
                  <Text style={styles.connectedTitle}>Google</Text>
                  <Text style={styles.helper}>{localUser.email}</Text>
                </View>
                <Text style={styles.connectedStatus}>Connecté</Text>
              </View>
            </Card>

            <Card title="Exporter vos données">
              <Text style={styles.bodyText}>
                Téléchargez une copie de votre profil, bibliothèque, listes et critiques.
              </Text>
              <View style={styles.exportRow}>
                <ActionButton label="Exporter JSON" onPress={() => exportData('json')} outline />
                <ActionButton label="Exporter CSV" onPress={() => exportData('csv')} outline />
              </View>
            </Card>

            <Card title="Zone dangereuse" danger>
              <Text style={styles.bodyText}>
                La suppression du compte et de toutes ses données est définitive.
              </Text>
              <ActionButton label="Supprimer le compte" onPress={deleteAccount} outline danger />
            </Card>
          </>
        ) : null}

        {tab === 'Notifications' ? (
          <Card title="Préférences de notification">
            <Notice>{notifsError}</Notice>
            <Text style={styles.groupLabel}>ACTIVITÉ</Text>
            <Text style={styles.bodyText}>Choisissez les événements qui créent une notification.</Text>
            <SettingToggle
              label="Toute l’activité"
              description="Activer les likes, commentaires et nouveaux abonnés"
              value={allActivity}
              onChange={(value) => setNotifs((current) => ({
                ...current,
                likes: value,
                comments: value,
                followers: value,
              }))}
            />
            <SettingToggle
              label="Likes"
              description="Lorsqu’une personne aime votre critique"
              value={notifs.likes}
              onChange={(likes) => setNotifs((current) => ({ ...current, likes }))}
            />
            <SettingToggle
              label="Commentaires"
              description="Lorsqu’une personne commente votre critique"
              value={notifs.comments}
              onChange={(comments) => setNotifs((current) => ({ ...current, comments }))}
            />
            <SettingToggle
              label="Nouveaux abonnés"
              description="Lorsqu’une personne vous suit"
              value={notifs.followers}
              onChange={(followers) => setNotifs((current) => ({ ...current, followers }))}
            />
            <Text style={styles.groupLabel}>CANAUX</Text>
            <SettingToggle
              label="Push"
              description="Afficher les notifications dans SUPMOVIES"
              value={notifs.push}
              onChange={(push) => setNotifs((current) => ({ ...current, push }))}
            />
            <SettingToggle
              label="Email"
              description="Envoyer les notifications à votre adresse email"
              value={notifs.email}
              onChange={(email) => setNotifs((current) => ({ ...current, email }))}
            />
            <ActionButton
              label="Enregistrer les préférences"
              onPress={saveNotifications}
              loading={notifsLoading}
              success={notifsSuccess}
            />
          </Card>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

export default function SettingsScreen() {
  return (
    <RequireAuth>
      <SettingsContent />
    </RequireAuth>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  header: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  backButton: {
    alignItems: 'center',
    borderColor: BORDER,
    borderRadius: 10,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  backText: { color: TEXT, fontSize: 27, lineHeight: 28, marginTop: -2 },
  title: { color: TEXT, fontSize: 20, fontWeight: '800' },
  subtitle: { color: MUTED, fontSize: 10, marginTop: 1 },
  tabs: {
    backgroundColor: '#ffffff',
    borderBottomColor: BORDER,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  tab: {
    alignItems: 'center',
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    flex: 1,
    paddingVertical: 10,
  },
  tabActive: { borderBottomColor: TEXT },
  tabText: { color: MUTED, fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: TEXT },
  content: { gap: 12, padding: 12, paddingBottom: 32 },
  card: {
    backgroundColor: '#ffffff',
    borderColor: BORDER,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    padding: 14,
  },
  cardTitle: { color: TEXT, fontSize: 16, fontWeight: '800' },
  dangerText: { color: RED },
  field: { gap: 5 },
  label: { color: '#374151', fontSize: 11, fontWeight: '600' },
  input: {
    backgroundColor: '#f9fafb',
    borderColor: BORDER,
    borderRadius: 10,
    borderWidth: 1,
    color: TEXT,
    fontSize: 12,
    minHeight: 42,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textarea: { height: 84, textAlignVertical: 'top' },
  inputDisabled: { color: MUTED, opacity: 0.75 },
  inputError: { borderColor: RED },
  errorText: { color: RED, fontSize: 9 },
  counter: { color: MUTED, fontSize: 9, marginTop: -10, textAlign: 'right' },
  helper: { color: MUTED, fontSize: 9, lineHeight: 13 },
  divider: { backgroundColor: BORDER, height: 1 },
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: RED,
    borderColor: RED,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 16,
  },
  buttonOutline: { backgroundColor: '#ffffff', borderColor: BORDER },
  buttonDanger: { borderColor: '#fca5a5' },
  buttonSuccess: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  buttonOutlineText: { color: RED },
  notice: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  noticeText: { color: '#b91c1c', fontSize: 10 },
  avatarRow: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#d1d5db',
    borderRadius: 35,
    height: 70,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 70,
  },
  avatarImage: { height: '100%', width: '100%' },
  avatarInitials: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  avatarCopy: { alignItems: 'flex-start', flex: 1, gap: 5 },
  languageRow: { flexDirection: 'row', gap: 8 },
  languageOption: {
    borderColor: BORDER,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  languageOptionActive: { backgroundColor: TEXT, borderColor: TEXT },
  languageText: { color: MUTED, fontSize: 11, fontWeight: '600' },
  languageTextActive: { color: '#ffffff' },
  sectionHeading: { color: TEXT, fontSize: 13, fontWeight: '700' },
  connectedRow: { alignItems: 'center', flexDirection: 'row' },
  googleBadge: {
    alignItems: 'center',
    borderColor: BORDER,
    borderRadius: 9,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  googleText: { color: '#4285f4', fontSize: 15, fontWeight: '800' },
  connectedCopy: { flex: 1, marginLeft: 9 },
  connectedTitle: { color: TEXT, fontSize: 11, fontWeight: '700' },
  connectedStatus: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    color: '#16a34a',
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bodyText: { color: MUTED, fontSize: 10, lineHeight: 15 },
  exportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  groupLabel: {
    color: MUTED,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 4,
  },
  toggleRow: {
    alignItems: 'center',
    borderBottomColor: '#f3f4f6',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 5,
  },
  toggleCopy: { flex: 1 },
  toggleLabel: { color: TEXT, fontSize: 11, fontWeight: '700' },
  toggleDescription: { color: MUTED, fontSize: 9, lineHeight: 13, marginTop: 2 },
});

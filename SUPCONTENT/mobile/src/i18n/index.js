import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'supcontent.language';
const DEFAULT_LANGUAGE = 'fr';
export const SUPPORTED_LANGUAGES = ['fr', 'en'];

const dictionaries = {
  fr: {
    home: 'Accueil',
    discover: 'Découvrir',
    library: 'Bibliothèque',
    alerts: 'Alertes',
    profile: 'Profil',
    welcomeBack: 'Bon retour',
    signInSubtitle: 'Connectez-vous à votre compte pour continuer',
    email: 'E-mail',
    password: 'Mot de passe',
    forgot: 'Oublié ?',
    passwordPlaceholder: 'Saisissez votre mot de passe',
    signingIn: 'Connexion...',
    signIn: 'Se connecter',
    noAccount: "Vous n'avez pas de compte ? ",
    signUp: "S'inscrire",
    createAccount: 'Créer un compte',
    registerSubtitle: 'Inscrivez-vous pour commencer avec SUPMOVIES',
    username: "Nom d'utilisateur",
    createPasswordPlaceholder: 'Créer un mot de passe (8 caractères min.)',
    confirmPassword: 'Confirmer le mot de passe',
    confirmPasswordPlaceholder: 'Confirmez votre mot de passe',
    creating: 'Création...',
    alreadyHaveAccount: 'Vous avez déjà un compte ? ',
    forgotPassword: 'Mot de passe oublié',
    resetComing: "L'écran de réinitialisation du mot de passe sera bientôt disponible.",
    backToLogin: 'Retour à la connexion',
    connectionFailed: 'Connexion échouée',
    connectingGoogle: 'Connexion avec Google...',
    googleFailed: 'La connexion Google a échoué.',
    missingOauthToken: 'Jeton OAuth manquant.',
    googleProfileFailed: 'Impossible de charger votre profil Google.',
    mobilePageComing: 'Cette page mobile sera bientôt développée.',
    emailPasswordRequired: "L'e-mail et le mot de passe sont requis.",
    unableSignIn: 'Impossible de se connecter.',
    connectedAs: 'Connecté en tant que {{name}}.',
    usernameValidation: "Le nom d'utilisateur doit contenir au moins 3 caractères.",
    emailValidation: 'Saisissez une adresse e-mail valide.',
    passwordLengthValidation: 'Le mot de passe doit contenir au moins 8 caractères.',
    passwordUppercaseValidation: 'Le mot de passe doit contenir au moins une majuscule.',
    passwordNumberValidation: 'Le mot de passe doit contenir au moins un chiffre.',
    passwordsMatchValidation: 'Les mots de passe ne correspondent pas.',
    unableCreateAccount: 'Impossible de créer le compte.',
    or: 'OU',
    userYou: 'Vous',
    featured: 'À LA UNE',
    play: 'Lire',
    details: 'Détails',
    seeAll: 'Tout voir',
    trendingNow: 'Tendances',
    continueWatching: 'Continuer le visionnage',
    friendActivity: 'Activité des amis',
    sarahRated: 'Sarah a noté Inception 5 étoiles.',
  },
  en: {
    home: 'Home',
    discover: 'Discover',
    library: 'Library',
    alerts: 'Alerts',
    profile: 'Profile',
    welcomeBack: 'Welcome back',
    signInSubtitle: 'Sign in to your account to continue',
    email: 'Email',
    password: 'Password',
    forgot: 'Forgot?',
    passwordPlaceholder: 'Enter your password',
    signingIn: 'Signing in...',
    signIn: 'Sign in',
    noAccount: "Don't have an account? ",
    signUp: 'Sign up',
    createAccount: 'Create an account',
    registerSubtitle: 'Sign up to get started with SUPMOVIES',
    username: 'Username',
    createPasswordPlaceholder: 'Create a password (min. 8 characters)',
    confirmPassword: 'Confirm password',
    confirmPasswordPlaceholder: 'Confirm your password',
    creating: 'Creating...',
    alreadyHaveAccount: 'Already have an account? ',
    forgotPassword: 'Forgot password',
    resetComing: 'Password reset screen will be built here.',
    backToLogin: 'Back to login',
    connectionFailed: 'Connection failed',
    connectingGoogle: 'Connecting with Google...',
    googleFailed: 'Google sign in failed.',
    missingOauthToken: 'Missing OAuth token.',
    googleProfileFailed: 'Unable to load your Google profile.',
    mobilePageComing: 'This mobile page will be built next.',
    emailPasswordRequired: 'Email and password are required.',
    unableSignIn: 'Unable to sign in.',
    connectedAs: 'Connected as {{name}}.',
    usernameValidation: 'Username must contain at least 3 characters.',
    emailValidation: 'Enter a valid email.',
    passwordLengthValidation: 'Password must contain at least 8 characters.',
    passwordUppercaseValidation: 'Password must contain at least one uppercase letter.',
    passwordNumberValidation: 'Password must contain at least one number.',
    passwordsMatchValidation: 'Passwords do not match.',
    unableCreateAccount: 'Unable to create account.',
    or: 'OR',
    userYou: 'You',
    featured: 'FEATURED',
    play: 'Play',
    details: 'Details',
    seeAll: 'See all',
    trendingNow: 'Trending Now',
    continueWatching: 'Continue Watching',
    friendActivity: 'Friend Activity',
    sarahRated: 'Sarah rated Inception 5 stars.',
  },
};

const I18nContext = createContext(null);

const normalizeLanguage = (language) => SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) setLanguageState(normalizeLanguage(saved));
    });
  }, []);

  const setLanguage = async (nextLanguage) => {
    const normalized = normalizeLanguage(nextLanguage);
    setLanguageState(normalized);
    await AsyncStorage.setItem(STORAGE_KEY, normalized);
  };

  const value = useMemo(() => ({
    language,
    setLanguage,
    t(key, params = {}) {
      const template = dictionaries[language]?.[key] ?? key;
      return Object.entries(params).reduce(
        (text, [name, value]) => text.replaceAll(`{{${name}}}`, String(value)),
        template
      );
    },
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}

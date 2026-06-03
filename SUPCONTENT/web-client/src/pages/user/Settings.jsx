import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api/axios.js";

/* ── Icons ── */
const CameraIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <path d="M2 7a2 2 0 012-2h1.5l1-2h7l1 2H16a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.4"/>
    <circle cx="10" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
);
const SaveIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <rect x="4" y="2" width="12" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="7" y="2" width="6" height="5" rx="0.5" stroke="currentColor" strokeWidth="1.4"/>
    <rect x="6" y="11" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
  </svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
    <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const DownloadIcon = () => (
  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
    <path d="M10 3v10M6 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-gray-400">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

/* ── Toggle — rouge comme Figma ── */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
        checked ? "bg-[#D0021B]" : "bg-gray-200 dark:bg-gray-600"
      }`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
        checked ? "translate-x-7" : "translate-x-1"
      }`}/>
    </button>
  );
}

/* ── Card ── */
function Card({ title, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col gap-5">
      {title && <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>}
      {children}
    </div>
  );
}

/* ── Input ── */
const inputCls = (err) =>
  `w-full px-4 py-3 rounded-xl border text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
    err
      ? "border-red-400 focus:ring-2 focus:ring-red-100"
      : "border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500"
  }`;

/* ── Red save button (Figma style) ── */
function RedButton({ loading, success, successLabel = "Saved!", label, icon, onClick, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
        success
          ? "bg-green-500 text-white"
          : loading
          ? "bg-[#D0021B]/50 text-white cursor-not-allowed"
          : "bg-[#D0021B] hover:bg-[#b30218] text-white active:scale-[0.99]"
      }`}
    >
      {success ? <><CheckIcon/>{successLabel}</> : loading ? "Saving..." : <>{icon}{label}</>}
    </button>
  );
}

/* ── Tab bar — underline style comme Figma ── */
const TABS = ["Profile", "Account", "Notifications", "Privacy"];
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
];
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

const isValidWebsiteUrl = (value) => {
  if (!value.trim()) return true;

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
};

const hasStrongPassword = (password) =>
  password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);

function TabBar({ active, onChange }) {
  return (
    <div className="flex gap-0 border-b border-gray-200 dark:border-gray-800 mb-8">
      {TABS.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`px-5 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
            active === t
              ? "border-gray-900 dark:border-white text-gray-900 dark:text-white"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
export default function Settings() {
  const { user, login, token } = useAuth();
  const [tab, setTab] = useState("Profile");
  const avatarRef = useRef();

  /* ── Profile ── */
  const [profile, setProfile] = useState({
    display_name: user?.display_name || user?.username || "",
    username: user?.username || "",
    bio: user?.bio || "",
    website_url: user?.website_url || "",
  });
  const [profileErr, setProfileErr] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState(null);

  /* ── Password ── */
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwErr, setPwErr] = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  /* â”€â”€ Preferences â”€â”€ */
  const [language, setLanguage] = useState(user?.language_preference || "en");
  const [languageLoading, setLanguageLoading] = useState(false);
  const [languageSuccess, setLanguageSuccess] = useState(false);
  const [languageErr, setLanguageErr] = useState("");

  useEffect(() => {
    setLanguage(user?.language_preference || "en");
  }, [user?.language_preference]);

  /* ── Notifications ── */
  const [notifs, setNotifs] = useState({
    likes: true,
    comments: true,
    new_followers: true,
    newsletter: false,
  });
  const [notifsSuccess, setNotifsSuccess] = useState(false);

  /* ── Privacy ── */
  const [privacy, setPrivacy] = useState({
    private_profile: false,
    show_watching_history: true,
    allow_messages: true,
  });
  const [privacySuccess, setPrivacySuccess] = useState(false);

  /* ── Avatar change ── */
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setProfileErr({ avatar: "Use JPEG, PNG, WEBP or GIF." });
      e.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setProfileErr({ avatar: "Max size 2MB." });
      e.target.value = "";
      return;
    }

    setProfileErr((err) => ({ ...err, avatar: "", api: "" }));
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  /* ── Save profile ── */
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const errs = {};
    if (profile.username.trim().length < 3) errs.username = "Minimum 3 characters";
    if (!isValidWebsiteUrl(profile.website_url)) errs.website_url = "Enter a valid http(s) URL";
    if (Object.keys(errs).length) { setProfileErr(errs); return; }
    setProfileLoading(true);
    setProfileSuccess(false);
    try {
      if (avatarFile) {
        const fd = new FormData();
        fd.append("avatar", avatarFile);
        await api.patch("/users/me/avatar", fd, { headers: { "Content-Type": "multipart/form-data" } });
        setAvatarFile(null);
      }
      const res = await api.put("/users/me", {
        username: profile.username.trim(),
        bio: profile.bio,
        website_url: profile.website_url.trim() || null,
      });
      login(token, res.data.user ?? res.data.data ?? res.data);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileErr({ api: err?.response?.data?.errors?.[0]?.msg || err?.response?.data?.message || "Update failed" });
    } finally {
      setProfileLoading(false);
    }
  };

  /* ── Save password ── */
  const handleSavePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pw.current) errs.current = "Required";
    if (!hasStrongPassword(pw.next)) errs.next = "Minimum 8 characters, 1 uppercase and 1 number";
    if (pw.next !== pw.confirm) errs.confirm = "Passwords do not match";
    if (Object.keys(errs).length) { setPwErr(errs); return; }
    setPwLoading(true);
    setPwSuccess(false);
    try {
      await api.patch("/users/me/password", { current_password: pw.current, new_password: pw.next });
      setPwSuccess(true);
      setPw({ current: "", next: "", confirm: "" });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      setPwErr({ api: err?.response?.data?.errors?.[0]?.msg || err?.response?.data?.message || "Failed" });
    } finally {
      setPwLoading(false);
    }
  };

  /* â”€â”€ Save language â”€â”€ */
  const handleSaveLanguage = async () => {
    setLanguageLoading(true);
    setLanguageSuccess(false);
    setLanguageErr("");

    try {
      const res = await api.put("/users/me", {
        language_preference: language,
      });

      login(token, res.data.user ?? res.data.data ?? res.data);
      setLanguageSuccess(true);
      setTimeout(() => setLanguageSuccess(false), 3000);
    } catch (err) {
      setLanguageErr(err?.response?.data?.errors?.[0]?.msg || err?.response?.data?.message || "Failed to save language");
    } finally {
      setLanguageLoading(false);
    }
  };

  /* ── Export ── */
  const handleExport = async (format) => {
    try {
      const res = await api.get(`/users/me/export?format=${format}`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = `supmovies-data.${format}`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;
    try {
      await api.delete("/users/me");
      window.location.href = "/login";
    } catch (err) { console.error(err); }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Tab bar — underline style */}
      <TabBar active={tab} onChange={setTab} />

      {/* ══ PROFILE ══ */}
      {tab === "Profile" && (
        <form onSubmit={handleSaveProfile}>
          <Card title="Profile Information">
            {profileErr.api && (
              <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 text-sm text-red-600">
                {profileErr.api}
              </div>
            )}

            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center flex-shrink-0">
                {avatarPreview ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover"/> : <UserIcon/>}
              </div>
              <div className="flex flex-col gap-1">
                <button type="button" onClick={() => avatarRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all w-fit">
                  <CameraIcon/> Change Avatar
                </button>
                <p className="text-xs text-gray-400">JPG, PNG, WEBP or GIF. Max size 2MB</p>
                {profileErr.avatar && <p className="text-xs text-red-500">{profileErr.avatar}</p>}
                <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange}/>
              </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800"/>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Display Name</label>
              <input className={inputCls(false)} placeholder="Cinema Fan" value={profile.display_name}
                onChange={(e) => setProfile((f) => ({ ...f, display_name: e.target.value }))}/>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
              <input className={inputCls(profileErr.username)} placeholder="cinemafan" value={profile.username}
                onChange={(e) => { setProfile((f) => ({ ...f, username: e.target.value })); setProfileErr((e) => ({ ...e, username: "" })); }}/>
              {profileErr.username && <p className="text-xs text-red-500">{profileErr.username}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
              <textarea className={`${inputCls(false)} resize-none`} rows={3} maxLength={160}
                placeholder="Film enthusiast | Criterion Collection lover | Reviews every weekend"
                value={profile.bio} onChange={(e) => setProfile((f) => ({ ...f, bio: e.target.value }))}/>
              <p className="text-xs text-gray-400 text-right">{profile.bio.length}/160</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Website</label>
              <input className={inputCls(profileErr.website_url)} placeholder="https://yourwebsite.com" value={profile.website_url}
                onChange={(e) => { setProfile((f) => ({ ...f, website_url: e.target.value })); setProfileErr((err) => ({ ...err, website_url: "" })); }}/>
              {profileErr.website_url && <p className="text-xs text-red-500">{profileErr.website_url}</p>}
            </div>

            <div className="pt-1">
              <RedButton type="submit" loading={profileLoading} success={profileSuccess}
                label="Save Changes" successLabel="Saved!" icon={<SaveIcon/>}/>
            </div>
          </Card>
        </form>
      )}

      {/* ══ ACCOUNT ══ */}
      {tab === "Account" && (
        <div className="flex flex-col gap-6">
          <Card title="Account Settings">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input className={inputCls(false)} value={user?.email || ""} disabled readOnly/>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800"/>

            {/* Language */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
                <select
                  className={inputCls(false)}
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    setLanguageErr("");
                  }}
                >
                  {LANGUAGES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {languageErr && <p className="text-xs text-red-500">{languageErr}</p>}
              <div>
                <RedButton
                  loading={languageLoading}
                  success={languageSuccess}
                  label="Save Language"
                  successLabel="Saved!"
                  icon={<SaveIcon/>}
                  onClick={handleSaveLanguage}
                />
              </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-800"/>

            {/* Password */}
            <form onSubmit={handleSavePassword} className="flex flex-col gap-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Change Password</h3>
              {pwErr.api && (
                <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 text-sm text-red-600">
                  {pwErr.api}
                </div>
              )}
              <input type="password" className={inputCls(pwErr.current)} placeholder="Current password"
                value={pw.current} onChange={(e) => { setPw((p) => ({ ...p, current: e.target.value })); setPwErr((e) => ({ ...e, current: "" })); }}/>
              {pwErr.current && <p className="text-xs text-red-500 -mt-2">{pwErr.current}</p>}

              <input type="password" className={inputCls(pwErr.next)} placeholder="New password"
                value={pw.next} onChange={(e) => { setPw((p) => ({ ...p, next: e.target.value })); setPwErr((e) => ({ ...e, next: "" })); }}/>
              {pwErr.next && <p className="text-xs text-red-500 -mt-2">{pwErr.next}</p>}

              <input type="password" className={inputCls(pwErr.confirm)} placeholder="Confirm new password"
                value={pw.confirm} onChange={(e) => { setPw((p) => ({ ...p, confirm: e.target.value })); setPwErr((e) => ({ ...e, confirm: "" })); }}/>
              {pwErr.confirm && <p className="text-xs text-red-500 -mt-2">{pwErr.confirm}</p>}

              <div>
                <RedButton type="submit" loading={pwLoading} success={pwSuccess}
                  label="Update Password" successLabel="Updated!" icon={<SaveIcon/>}/>
              </div>
            </form>
          </Card>

          {/* Export */}
          <Card title="Export Your Data">
            <p className="text-sm text-gray-500 dark:text-gray-400">Download a copy of your profile, library, lists and reviews.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => handleExport("json")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                <DownloadIcon/> Export JSON
              </button>
              <button type="button" onClick={() => handleExport("csv")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                <DownloadIcon/> Export CSV
              </button>
            </div>
          </Card>

          {/* Danger zone */}
          <Card>
            <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Once you delete your account, all your data will be permanently removed.</p>
            <div>
              <button type="button" onClick={handleDelete}
                className="px-5 py-2.5 rounded-xl border border-red-300 dark:border-red-700 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                Delete Account
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ══ NOTIFICATIONS ══ */}
      {tab === "Notifications" && (
        <Card title="Notification Preferences">
          <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
            {[
              { key: "likes",          label: "Likes",          desc: "Get notified when someone likes your review" },
              { key: "comments",       label: "Comments",       desc: "Get notified when someone comments on your review" },
              { key: "new_followers",  label: "New Followers",  desc: "Get notified when someone follows you" },
              { key: "newsletter",     label: "Newsletter",     desc: "Receive weekly movie recommendations" },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-5 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
                </div>
                <Toggle checked={notifs[key]} onChange={(val) => setNotifs((n) => ({ ...n, [key]: val }))}/>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <RedButton loading={false} success={notifsSuccess} label="Save Preferences" successLabel="Saved!" icon={<SaveIcon/>}
              onClick={() => { setNotifsSuccess(true); setTimeout(() => setNotifsSuccess(false), 3000); }}/>
          </div>
        </Card>
      )}

      {/* ══ PRIVACY ══ */}
      {tab === "Privacy" && (
        <div className="flex flex-col gap-6">
          <Card title="Privacy Settings">
            <div className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
              {[
                { key: "private_profile",       label: "Private Profile",       desc: "Only followers can see your activity" },
                { key: "show_watching_history", label: "Show Watching History",  desc: "Display your watching history on your profile" },
                { key: "allow_messages",        label: "Allow Messages",         desc: "Let anyone send you messages" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-5 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
                  </div>
                  <Toggle checked={privacy[key]} onChange={(val) => setPrivacy((p) => ({ ...p, [key]: val }))}/>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <RedButton loading={false} success={privacySuccess} label="Save Settings" successLabel="Saved!" icon={<SaveIcon/>}
                onClick={() => { setPrivacySuccess(true); setTimeout(() => setPrivacySuccess(false), 3000); }}/>
            </div>
          </Card>

          {/* Connected accounts */}
          <Card title="Connected Accounts">
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                  <svg viewBox="0 0 18 18" fill="none" className="w-4 h-4">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Google</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-full">Connected</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

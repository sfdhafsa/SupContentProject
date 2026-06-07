import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { useLibrary } from '../../hooks/useLibrary';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w92';

const STATUS_CONFIG = {
  TO_WATCH:    { label: 'Watchlist',  color: '#6366f1', icon: '🎬' },
  IN_PROGRESS: { label: 'Watching',   color: '#f59e0b', icon: '▶' },
  COMPLETED:   { label: 'Completed',  color: '#10b981', icon: '✓' },
  DROPPED:     { label: 'Dropped',    color: '#ef4444', icon: '✕' },
};


export default function DashboardPage() {
  const { getStats, getLibrary } = useLibrary();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  async function fetchAll() {
    setLoading(true);
    try {
      const [statsRes, libRes] = await Promise.all([
        getStats(),
        getLibrary(),
      ]);
      setStats(statsRes.data);
      setRecent((libRes.data || []).slice(0, 6));
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  if (loading) return <LoadingSkeleton />;
  if (!stats) return null;

  const pieData = Object.entries(STATUS_CONFIG).map(([k, cfg]) => ({
    name: cfg.label,
    value: stats.counts[k] || 0,
    color: cfg.color,
  })).filter((d) => d.value > 0);

  const barData = Object.entries(STATUS_CONFIG).map(([k, cfg]) => ({
    name: cfg.label,
    count: stats.counts[k] || 0,
    color: cfg.color,
  }));

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Your film watching statistics</p>
        </div>
        <Link to="/library" style={styles.libLink}>← Library</Link>
      </div>

      <div style={styles.statsGrid}>
        <StatCard
          icon="🎞️"
          label="Total films"
          value={stats.totalMovies}
          color="#6366f1"
        />
        <StatCard
          icon="✅"
          label="Completed"
          value={stats.counts.COMPLETED}
          color="#10b981"
        />
        <StatCard
          icon="⏱️"
          label="Hours watched"
          value={`${stats.totalHoursWatched}h ${stats.totalMinutesWatched}m`}
          color="#f59e0b"
        />
        <StatCard
          icon="⭐"
          label="Avg rating"
          value={stats.averageRating ? `${stats.averageRating}/5` : '—'}
          color="#ec4899"
        />
      </div>

      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>Distribution</h2>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#111120',
                      border: '1px solid #2a2a4a',
                      borderRadius: 8,
                      color: '#e0e0f0',
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={styles.legend}>
                {pieData.map((d) => (
                  <div key={d.name} style={styles.legendItem}>
                    <span style={{ ...styles.legendDot, background: d.color }} />
                    <span style={styles.legendLabel}>{d.name}</span>
                    <span style={styles.legendValue}>{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={styles.chartEmpty}>No data yet</div>
          )}
        </div>

        <div style={styles.chartCard}>
          <h2 style={styles.chartTitle}>By status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a2e" />
              <XAxis
                dataKey="name"
                tick={{ fill: '#555', fontSize: 11 }}
                axisLine={{ stroke: '#1a1a2e' }}
              />
              <YAxis
                tick={{ fill: '#555', fontSize: 11 }}
                axisLine={{ stroke: '#1a1a2e' }}
              />
              <Tooltip
                contentStyle={{
                  background: '#111120',
                  border: '1px solid #2a2a4a',
                  borderRadius: 8,
                  color: '#e0e0f0',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {recent.length > 0 && (
        <div style={styles.recentSection}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Recently added</h2>
            <Link to="/library" style={styles.seeAll}>See all →</Link>
          </div>
          <div style={styles.recentGrid}>
            {recent.map((entry) => {
              const cfg = STATUS_CONFIG[entry.status];
              const poster = entry.poster_url ? `${TMDB_IMG}${entry.poster_url}` : null;
              return (
                <Link key={entry.id} to={`/movies/${entry.external_id}`} style={styles.recentCard}>
                  {poster ? (
                    <img src={poster} alt={entry.title} style={styles.recentPoster} loading="lazy" />
                  ) : (
                    <div style={styles.recentPosterFallback}>🎬</div>
                  )}
                  <div style={styles.recentInfo}>
                    <p style={styles.recentTitle}>{entry.title}</p>
                    <span style={{
                      ...styles.recentStatus,
                      color: cfg?.color,
                      background: cfg?.color + '22',
                    }}>
                      {cfg?.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIcon, background: color + '22', color }}>
        {icon}
      </div>
      <div>
        <p style={styles.statValue}>{value}</p>
        <p style={styles.statLabel}>{label}</p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ ...styles.page, opacity: 0.5 }}>
      <div style={{ height: 80, background: '#111120', borderRadius: 12, marginBottom: '2rem' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: '2rem' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ height: 100, background: '#111120', borderRadius: 12 }} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0f',
    color: '#e8e8f0',
    padding: '2rem',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '2rem',
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    margin: 0,
    letterSpacing: '-0.5px',
    color: '#fff',
  },
  subtitle: { color: '#555', margin: '4px 0 0', fontSize: 14 },
  libLink: {
    color: '#6666cc',
    textDecoration: 'none',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
    marginBottom: '2rem',
  },
  statCard: {
    background: '#0e0e1e',
    border: '1px solid #1a1a2e',
    borderRadius: 12,
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    flexShrink: 0,
  },
  statValue: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
    letterSpacing: '-0.5px',
  },
  statLabel: { margin: '2px 0 0', fontSize: 12, color: '#555' },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 16,
    marginBottom: '2rem',
  },
  chartCard: {
    background: '#0e0e1e',
    border: '1px solid #1a1a2e',
    borderRadius: 12,
    padding: '1.5rem',
  },
  chartTitle: {
    margin: '0 0 1rem',
    fontSize: 11,
    fontWeight: 600,
    color: '#888',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  legend: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginTop: 12,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  legendLabel: { color: '#888', flex: 1 },
  legendValue: { color: '#fff', fontWeight: 600 },
  chartEmpty: {
    height: 200,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#333',
    fontSize: 14,
  },
  recentSection: { marginTop: '1rem' },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  sectionTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 600,
    color: '#fff',
  },
  seeAll: {
    color: '#6666cc',
    textDecoration: 'none',
    fontSize: 13,
  },
  recentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: 12,
  },
  recentCard: {
    background: '#0e0e1e',
    border: '1px solid #1a1a2e',
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    textDecoration: 'none',
    transition: 'border-color 0.2s',
  },
  recentPoster: {
    width: 36,
    height: 54,
    objectFit: 'cover',
    borderRadius: 6,
    flexShrink: 0,
  },
  recentPosterFallback: {
    width: 36,
    height: 54,
    background: '#1a1a2e',
    borderRadius: 6,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    flexShrink: 0,
  },
  recentInfo: { flex: 1, overflow: 'hidden' },
  recentTitle: {
    margin: '0 0 4px',
    fontSize: 13,
    fontWeight: 500,
    color: '#d0d0e8',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  recentStatus: {
    display: 'inline-block',
    borderRadius: 4,
    padding: '2px 7px',
    fontSize: 10,
    fontWeight: 500,
  },
};
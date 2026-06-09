import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import BottomTabBar from '../src/components/BottomTabBar';
import TopNavbar from '../src/components/TopNavbar';
import { getAuthUser } from '../src/services/authStorage';
import FeedList from '../src/components/feed/FeedList';
import { useFeed } from '../src/hooks/useFeed';

const friends = [
  { name: 'You', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80' },
  { name: 'Emma', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80' },
  { name: 'Sarah', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80' },
  { name: 'John', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=120&q=80' },
  { name: 'Cinema', image: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=120&q=80' },
];

const trending = [
  { title: 'Blade Runner', rating: '8.4', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=320&q=80' },
  { title: 'Interstellar', rating: '8.6', image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=320&q=80' },
  { title: 'The Batman', rating: '8.8', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=320&q=80' },
];

const watching = [
  { title: 'Fight Club', image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=420&q=80' },
  { title: 'Forrest Gump', image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=420&q=80' },
];

function SectionHeader({ icon, title }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Pressable>
        <Text style={styles.seeAll}>Tout voir</Text>
      </Pressable>
    </View>
  );
}


export default function Home() {
  const [username, setUsername] = useState('User');
  const {
    items: feedItems,
    loading: feedLoading,
    error: feedError,
  } = useFeed();

  useEffect(() => {
    getAuthUser().then((user) => {
      setUsername(user?.username || user?.email || 'User');
    });
  }, []);


  return (
    <View style={styles.page}>
      <View style={styles.phone}>
        <TopNavbar username={username} />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ImageBackground
            imageStyle={styles.heroImage}
            source={{ uri: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=760&q=80' }}
            style={styles.hero}
          >
            <View style={styles.heroOverlay}>
              <View style={styles.heroBadgeRow}>
                <Text style={styles.featuredBadge}>A LA UNE</Text>
                <Text style={styles.ratingBadge}>8.4</Text>
              </View>
              <Text style={styles.heroTitle}>Inception</Text>
              <View style={styles.heroActions}>
                <Pressable style={styles.detailsButton}>
                  <Text style={styles.playIcon}>Lire</Text>
                  <Text style={styles.detailsText}>Details</Text>
                </Pressable>
                <Pressable style={styles.saveButton}>
                  <Text style={styles.saveText}>+</Text>
                </Pressable>
              </View>
            </View>
          </ImageBackground>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendRow}>
            {friends.map((friend) => (
              <View key={friend.name} style={styles.friendItem}>
                <Image source={{ uri: friend.image }} style={styles.friendImage} />
                <Text style={styles.friendName}>{friend.name === 'You' ? 'Vous' : friend.name}</Text>
              </View>
            ))}
          </ScrollView>

          <SectionHeader icon="T" title="Tendances" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.movieRow}>
            {trending.map((movie) => (
              <View key={movie.title} style={styles.movieCard}>
                <Image source={{ uri: movie.image }} style={styles.movieImage} />
                <View style={styles.movieRating}>
                  <Text style={styles.movieRatingText}>{movie.rating}</Text>
                </View>
                <View style={styles.bookmark}>
                  <Text style={styles.bookmarkText}>+</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <SectionHeader icon="C" title="Continuer le visionnage" />
          <View style={styles.watchGrid}>
            {watching.map((movie) => (
              <View key={movie.title} style={styles.watchCard}>
                <Image source={{ uri: movie.image }} style={styles.watchImage} />
                <View style={styles.watchOverlay}>
                  <Text style={styles.watchTitle}>{movie.title}</Text>
                  <View style={styles.progressTrack}>
                    <View style={styles.progressFill} />
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.feedSection}>
            <SectionHeader icon="A" title="Activité des amis" />
            <View style={styles.feedList}>
              <FeedList items={feedItems} loading={feedLoading} error={feedError}/>
            </View>
          </View>
        </ScrollView>

        <BottomTabBar />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  phone: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    height: 592,
    maxWidth: 315,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  content: {
    paddingBottom: 74,
  },
  hero: {
    height: 188,
    justifyContent: 'flex-end',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    backgroundColor: 'rgba(0,0,0,0.22)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  heroBadgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginBottom: 5,
  },
  featuredBadge: {
    backgroundColor: '#ef0d1a',
    borderRadius: 4,
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  ratingBadge: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 7,
  },
  detailsButton: {
    alignItems: 'center',
    backgroundColor: '#ef0d1a',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  playIcon: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  detailsText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  saveButton: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.55)',
    borderRadius: 8,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 30,
  },
  saveText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  friendRow: {
    gap: 16,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  friendItem: {
    alignItems: 'center',
    width: 38,
  },
  friendImage: {
    borderColor: '#e5e7eb',
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    width: 36,
  },
  friendName: {
    color: '#374151',
    fontSize: 8,
    marginTop: 5,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 2,
  },
  sectionTitleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  sectionIcon: {
    color: '#ef0d1a',
    fontSize: 11,
    fontWeight: '900',
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '800',
  },
  seeAll: {
    color: '#ef0d1a',
    fontSize: 9,
    fontWeight: '600',
  },
  movieRow: {
    gap: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  movieCard: {
    borderRadius: 8,
    height: 118,
    overflow: 'hidden',
    position: 'relative',
    width: 82,
  },
  movieImage: {
    height: '100%',
    width: '100%',
  },
  movieRating: {
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 8,
    left: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'absolute',
    top: 5,
  },
  movieRatingText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  bookmark: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: 8,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 5,
    top: 5,
    width: 18,
  },
  bookmarkText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  watchGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  watchCard: {
    borderRadius: 8,
    flex: 1,
    height: 70,
    overflow: 'hidden',
  },
  watchImage: {
    height: '100%',
    width: '100%',
  },
  watchOverlay: {
    backgroundColor: 'rgba(0,0,0,0.30)',
    bottom: 0,
    left: 0,
    padding: 7,
    position: 'absolute',
    right: 0,
  },
  watchTitle: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 4,
  },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
    height: 3,
  },
  progressFill: {
    backgroundColor: '#ef0d1a',
    borderRadius: 2,
    height: 3,
    width: '62%',
  },

  feedSection: {
    borderTopColor: '#eef0f3',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  feedList: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 10,
  },
});
import React from 'react';
import { View, TextInput, StyleSheet, Image, ScrollView, TouchableOpacity, Animated, Keyboard, TouchableWithoutFeedback, Platform, Modal, Pressable, Easing } from 'react-native';
import CustomText from '../CustomText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import RecentlyCookedModal from './RecentlyCookedModal';
import Favorites from './Favorites';

interface HomeScreenV2Props {
  search: string;
  setSearch: (text: string) => void;
  searchResults: any[];
  searching: boolean;
  searchTouched: boolean;
  setSearchTouched: (touched: boolean) => void;
  dropdownAnim: Animated.Value;
  pulseAnim: Animated.Value;
  favorites: any[];
  recentlyCooked: any[];
  profile: { avatar_url?: string; name?: string } | null;
  closeDropdown: () => void;
  hasResults: boolean;
  isLoading: boolean;
  resultCount: number;
  dynamicExpandStyle: any;
  onToggleUI: () => void;
}

export default function HomeScreenV2({
  search,
  setSearch,
  searchResults,
  searching,
  searchTouched,
  setSearchTouched,
  dropdownAnim,
  pulseAnim,
  favorites,
  recentlyCooked,
  profile,
  closeDropdown,
  hasResults,
  isLoading,
  resultCount,
  dynamicExpandStyle,
  onToggleUI
}: HomeScreenV2Props) {
  const router = useRouter();
  const userName = profile?.name || 'there';

  // Modal state for Recently Cooked
  const [showRecentlyCooked, setShowRecentlyCooked] = React.useState(false);
  const [showFavorites, setShowFavorites] = React.useState(false);
  // Debug: log favorites array
  console.log('Favorites array:', favorites);
  const modalAnim = React.useRef(new Animated.Value(0)).current;

  // Animate modal in/out
  React.useEffect(() => {
    if (showRecentlyCooked) {
      Animated.timing(modalAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.exp),
        useNativeDriver: true,
      }).start();
    }
  }, [showRecentlyCooked]);

  return (
    <TouchableWithoutFeedback onPress={closeDropdown} accessible={false}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F0FF' }} edges={['top']}>
        {/* Toggle button to go back to original UI */}
        <TouchableOpacity 
          style={styles.toggleButton}
          onPress={onToggleUI}
        >
          <CustomText style={styles.toggleText}>🔙 Original UI</CustomText>
        </TouchableOpacity>

        {/* Header always at the top, fills safe area */}
        <View style={styles.headerBg}>
          <View style={styles.headerRow}>
            <CustomText style={styles.logoText}>🍳</CustomText>
            <View style={{ flex: 1 }} />
            <Image
              source={profile?.avatar_url ? { uri: profile.avatar_url } : require('../../assets/images/avatar.png')}
              style={styles.avatar}
            />
          </View>
          <CustomText style={styles.greetingText}>Hello, {userName} 👋</CustomText>
          <CustomText style={styles.subGreeting}>What would you like to cook today?</CustomText>
        </View>

        {/* Main scrollable content */}
        <View style={{ flex: 1, backgroundColor: '#F7F7FA' }}>
          {/* Floating Search Bar, overlaps header */}
          <View style={styles.searchBarWrapper}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={22} color="#B0B0B0" style={{ marginRight: 10 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Ask or search for anything"
                placeholderTextColor="#B0B0B0"
                value={search}
                onChangeText={t => { setSearch(t); setSearchTouched(true); }}
                autoCorrect={false}
                autoCapitalize="none"
                onFocus={() => setSearchTouched(true)}
              />
            </View>
            {/* Results dropdown */}
            {searchTouched && search.length > 0 && (
              <View style={styles.resultsDropdown}>
                {searching ? (
                  <View style={styles.loadingBox}>
                    <Animated.Image
                      source={require('../../assets/images/fork-knife.png')}
                      style={{ width: 32, height: 32, tintColor: '#6DA98C', transform: [{ scale: pulseAnim }] }}
                    />
                    <CustomText style={{ color: '#6DA98C', marginTop: 8, fontWeight: '600', fontSize: 14 }}>Searching...</CustomText>
                  </View>
                ) : !Array.isArray(searchResults) || searchResults.length === 0 ? (
                  <CustomText style={{ textAlign: 'center', color: '#A0AEC0', marginTop: 12, marginBottom: 12, fontSize: 15 }}>
                    No results for '{search}'
                  </CustomText>
                ) : (
                  <ScrollView style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                    {searchResults.slice(0, 8).map((item, idx) => (
                      <TouchableOpacity
                        key={item.id || item.title || idx}
                        onPress={() => { router.push({ pathname: '/recipe-detail', params: { id: item.id } }); closeDropdown(); }}
                        style={styles.resultItem}
                        activeOpacity={0.8}
                      >
                        <View style={styles.resultRow}>
                          <Ionicons name="restaurant-outline" size={18} color="#6DA98C" style={{ marginRight: 10 }} />
                          <CustomText style={styles.resultText}>{item.title}</CustomText>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32, marginTop: 24 }} showsVerticalScrollIndicator={false}>
            {/* Main Action Grid */}
            <View style={styles.gridContainer}>
              <TouchableOpacity style={[styles.gridCard, styles.gridCardGreen]} onPress={() => router.push('/chat')} activeOpacity={0.92}>
                <Ionicons name="sparkles" size={32} color="#fff" style={styles.gridIcon} />
                <CustomText style={styles.gridCardTitle}>Ask AI Chef</CustomText>
                <CustomText style={styles.gridCardDesc}>Get instant meal ideas</CustomText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gridCard, styles.gridCardPurple]} activeOpacity={0.92} onPress={() => setShowRecentlyCooked(true)}>
                <Ionicons name="flame" size={32} color="#fff" style={styles.gridIcon} />
                <CustomText style={styles.gridCardTitle}>Recently Cooked</CustomText>
                <CustomText style={styles.gridCardDesc}>{recentlyCooked.length} recipes</CustomText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gridCard, styles.gridCardYellow]} activeOpacity={0.92} onPress={() => { console.log('Opening favorites'); setShowFavorites(true); setShowRecentlyCooked(false); }}>
                <Ionicons name="heart" size={32} color="#fff" style={styles.gridIcon} />
                <CustomText style={styles.gridCardTitle}>Favorites</CustomText>
                <CustomText style={styles.gridCardDesc}>{favorites.length} saved</CustomText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.gridCard, styles.gridCardBlue]} activeOpacity={0.92}>
                <Ionicons name="bulb" size={32} color="#fff" style={styles.gridIcon} />
                <CustomText style={styles.gridCardTitle}>Surprise Me</CustomText>
                <CustomText style={styles.gridCardDesc}>Random recipe idea</CustomText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Recently Cooked Modal Overlay */}
        <RecentlyCookedModal
          visible={showRecentlyCooked}
          onClose={() => setShowRecentlyCooked(false)}
          recipes={recentlyCooked}
          router={router}
        />
        // Debug: log showFavorites before rendering Favorites
        console.log('Favorites visible:', showFavorites);
        <Favorites
          visible={showFavorites}
          onClose={() => setShowFavorites(false)}
          recipes={favorites}
          router={router}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    top: 48,
    right: 20,
    backgroundColor: '#6DA98C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#fff',
    zIndex: 1000,
  },
  toggleText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  headerBg: {
    backgroundColor: '#F3F0FF',
    paddingTop: Platform.OS === 'ios' ? 48 : 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#222',
    letterSpacing: 0.5,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginLeft: 12,
    backgroundColor: '#D1E7DD',
  },
  greetingText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#222',
    marginTop: 2,
    marginLeft: 2,
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 8,
  },
  searchBarWrapper: {
    alignItems: 'center',
    marginTop: -28,
    marginBottom: 18,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 18,
    height: 54,
    width: '92%',
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '500',
    color: '#222',
    fontFamily: 'System',
    paddingVertical: 0,
  },
  resultsDropdown: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginTop: 8,
    width: '92%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingBottom: 0,
    shadowColor: 'transparent',
    elevation: 0,
  },
  resultItem: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F6F9',
    backgroundColor: 'transparent',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resultText: {
    fontSize: 17,
    color: '#222',
    fontWeight: '500',
    marginLeft: 2,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 18,
    marginTop: 8,
  },
  gridCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 28,
    marginBottom: 16,
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 2,
  },
  gridCardGreen: {
    backgroundColor: '#B6E2D3',
  },
  gridCardPurple: {
    backgroundColor: '#D6D6F7',
  },
  gridCardYellow: {
    backgroundColor: '#FFF3C4',
  },
  gridCardBlue: {
    backgroundColor: '#C7E6FB',
  },
  gridIcon: {
    marginBottom: 12,
  },
  gridCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  gridCardDesc: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
    marginHorizontal: 18,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginRight: 12,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  recipeCard: {
    width: 140,
    minHeight: 120,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  favoriteCard: {
    backgroundColor: '#FEF6E7',
  },
  recipeCardIcon: {
    marginBottom: 10,
  },
  recipeCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
  },
}); 
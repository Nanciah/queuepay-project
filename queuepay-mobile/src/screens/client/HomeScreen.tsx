import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  ticket_price: number;
  estimated_duration: number;
  is_active: boolean;
  entity_name: string;
}

// ========== CATÉGORIES ==========
const categories = [
  { id: 'all', label: 'Tous', icon: 'apps-outline' },
  { id: 'health', label: 'Santé', icon: 'medical-outline' },
  { id: 'banking', label: 'Banque', icon: 'business-outline' },
  { id: 'administration', label: 'Admin', icon: 'build-outline' },
  { id: 'commerce', label: 'Commerce', icon: 'cart-outline' },
  { id: 'transport', label: 'Transport', icon: 'car-outline' },
];

// ========== COMPOSANT PRINCIPAL ==========
export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { isConnected } = useSocket();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // États
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [greeting, setGreeting] = useState('');

  // ========== INITIALISATION ==========
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bonjour');
    else if (hour < 18) setGreeting('Bon après-midi');
    else setGreeting('Bonsoir');

    fetchServices();
  }, []);

  // ========== API ==========
  const fetchServices = async () => {
    try {
      const response = await api.get('/api/client/services');
      setServices(response.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  // ========== FILTRES ==========
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const popularServices = filteredServices.slice(0, 4);

  // ========== UTILITAIRES ==========
  const getCategoryIcon = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.icon || 'apps-outline';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      health: '#10B981',
      banking: '#3B82F6',
      administration: '#8B5CF6',
      commerce: '#F59E0B',
      transport: '#EF4444',
      education: '#EC4899',
    };
    return colors[category] || '#6B7280';
  };

  const getGreetingInLanguage = () => {
    const greetings: { [key: string]: string } = {
      fr: 'Bonjour',
      en: 'Hello',
      mg: 'Manao ahoana',
    };
    return greetings[language] || 'Bonjour';
  };

  const navigateToServiceDetail = (serviceId: string) => {
    // @ts-ignore
    navigation.navigate('ServiceDetail', { id: serviceId });
  };

  // ========== RENDU ==========
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Chargement des services...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ===== HEADER ===== */}
      <LinearGradient
        colors={['#4F46E5', '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Animated.View style={[styles.headerContent, { opacity: fadeAnim }]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greetingText}>
                {getGreetingInLanguage()} 👋
              </Text>
              <Text style={styles.userName}>
                {user?.first_name || 'Client'}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.headerRight}>
              {/* ✅ Bouton de changement de langue */}
              <TouchableOpacity
                style={styles.languageButton}
                onPress={() => {
                  const languages: ('fr' | 'en' | 'mg')[] = ['fr', 'en', 'mg'];
                  const currentIndex = languages.indexOf(language);
                  const nextIndex = (currentIndex + 1) % languages.length;
                  setLanguage(languages[nextIndex]);
                }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.languageBadge}
                >
                  <Text style={styles.languageText}>
                    {language === 'fr' ? 'FR' : language === 'en' ? 'EN' : 'MG'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => {
                  // @ts-ignore
                  navigation.navigate('Profile');
                }}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                  style={styles.profileAvatar}
                >
                  <Text style={styles.profileAvatarText}>
                    {user?.first_name?.[0] || 'U'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Barre de recherche */}
          <Animated.View
            style={[
              styles.searchContainer,
              {
                transform: [{ scale: scaleAnim }],
                opacity: fadeAnim,
              },
            ]}
          >
            <Ionicons name="search-outline" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un service..."
              placeholderTextColor="#9CA3AF"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </Animated.View>
        </Animated.View>
      </LinearGradient>

      {/* ===== CONTENU ===== */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statut de connexion */}
        <Animated.View
          style={[
            styles.statusContainer,
            { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              isConnected ? styles.statusConnected : styles.statusDisconnected,
            ]}
          />
          <Text style={styles.statusText}>
            {isConnected
              ? '🟢 Connecté en temps réel'
              : '🔴 Hors ligne - mises à jour suspendues'}
          </Text>
        </Animated.View>

        {/* Catégories */}
        <Animated.View style={[styles.categoriesContainer, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === cat.id && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={18}
                  color={
                    selectedCategory === cat.id ? '#4F46E5' : '#6B7280'
                  }
                />
                <Text
                  style={[
                    styles.categoryLabel,
                    selectedCategory === cat.id && styles.categoryLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Services populaires */}
        <Animated.View style={[styles.servicesSection, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Services populaires</Text>
            <TouchableOpacity
              onPress={() => {
                // @ts-ignore
                navigation.navigate('Services');
              }}
            >
              <Text style={styles.seeAllText}>Voir tout</Text>
            </TouchableOpacity>
          </View>

          {popularServices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Aucun service trouvé</Text>
            </View>
          ) : (
            <View style={styles.servicesGrid}>
              {popularServices.map((service, index) => {
                const iconName = getCategoryIcon(service.category);
                const color = getCategoryColor(service.category);

                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.serviceCard,
                      { marginTop: index > 1 ? 12 : 0 },
                    ]}
                    onPress={() => navigateToServiceDetail(service.id)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: `${color}15` },
                      ]}
                    >
                      <Ionicons name={iconName as any} size={28} color={color} />
                    </View>
                    <Text style={styles.serviceName} numberOfLines={1}>
                      {service.name}
                    </Text>
                    <Text style={styles.serviceEntity} numberOfLines={1}>
                      {service.entity_name || 'Service'}
                    </Text>
                    <View style={styles.serviceFooter}>
                      <Text style={styles.servicePrice}>
                        {service.ticket_price || 0} Ar
                      </Text>
                      {service.is_active ? (
                        <View style={[styles.statusBadge, styles.statusActive]}>
                          <Text style={styles.statusActiveText}>Actif</Text>
                        </View>
                      ) : (
                        <View style={[styles.statusBadge, styles.statusInactive]}>
                          <Text style={styles.statusInactiveText}>Inactif</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* Actions rapides */}
        <Animated.View style={[styles.quickActions, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // @ts-ignore
                navigation.navigate('Services');
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#EEF2FF', '#E0E7FF']}
                style={styles.actionGradient}
              >
                <Ionicons name="grid-outline" size={28} color="#4F46E5" />
                <Text style={[styles.actionLabel, { color: '#4F46E5' }]}>
                  Services
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // @ts-ignore
                navigation.navigate('Wallet');
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#D1FAE5', '#A7F3D0']}
                style={styles.actionGradient}
              >
                <Ionicons name="wallet-outline" size={28} color="#059669" />
                <Text style={[styles.actionLabel, { color: '#059669' }]}>
                  Portefeuille
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // @ts-ignore
                navigation.navigate('MyTickets');
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                style={styles.actionGradient}
              >
                <Ionicons name="ticket-outline" size={28} color="#D97706" />
                <Text style={[styles.actionLabel, { color: '#D97706' }]}>
                  Mes tickets
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // @ts-ignore
                navigation.navigate('Profile');
              }}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#FCE4EC', '#F8BBD0']}
                style={styles.actionGradient}
              >
                <Ionicons name="person-outline" size={28} color="#E91E63" />
                <Text style={[styles.actionLabel, { color: '#E91E63' }]}>
                  Profil
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // ===== LOADING =====
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 16,
    fontFamily: 'System',
  },

  // ===== HEADER =====
  header: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    width: '100%',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'System',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
    fontFamily: 'System',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // ===== LANGUE =====
  languageButton: {
    padding: 2,
  },
  languageBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  languageText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'System',
  },

  // ===== PROFIL =====
  profileButton: {
    padding: 2,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  profileAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'System',
  },

  // ===== RECHERCHE =====
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: '#1F2937',
    fontFamily: 'System',
  },

  // ===== CONTENU =====
  content: {
    flex: 1,
    paddingTop: 16,
  },

  // ===== STATUT =====
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  statusConnected: {
    backgroundColor: '#10B981',
  },
  statusDisconnected: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'System',
  },

  // ===== CATÉGORIES =====
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'System',
  },
  categoriesScroll: {
    marginTop: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginRight: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  categoryButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  categoryLabel: {
    marginLeft: 6,
    fontSize: 13,
    color: '#6B7280',
    fontFamily: 'System',
  },
  categoryLabelActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },

  // ===== SERVICES =====
  servicesSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  seeAllText: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
    fontFamily: 'System',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: (width - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    fontFamily: 'System',
  },
  serviceEntity: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 2,
    fontFamily: 'System',
  },
  serviceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
    fontFamily: 'System',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusActiveText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#10B981',
    fontFamily: 'System',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusInactiveText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#EF4444',
    fontFamily: 'System',
  },

  // ===== EMPTY =====
  emptyContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    fontFamily: 'System',
  },

  // ===== ACTIONS RAPIDES =====
  quickActions: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  actionButton: {
    width: (width - 44) / 2,
    marginBottom: 12,
  },
  actionGradient: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    fontFamily: 'System',
  },

  // ===== SPACING =====
  bottomSpacing: {
    height: 24,
  },
});
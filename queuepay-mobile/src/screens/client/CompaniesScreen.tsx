import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

interface Company {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  logo?: string;
  status: string;
  serviceCount?: number;
}

export default function CompaniesScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { socket, isConnected } = useSocket();  // ✅ AJOUTER

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Animation d'entrée
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    fetchCompanies();
  }, []);

  // ✅ ÉCOUTER LES ÉVÉNEMENTS WEBSOCKET POUR LES ENTREPRISES
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('⚠️ Socket non connecté');
      return;
    }

    console.log('📡 Écoute des événements entreprises (mobile)...');

    // 📢 Nouvelle entreprise créée
    const onCompanyCreated = (data) => {
      console.log('📢 Nouvelle entreprise reçue (mobile):', data.company);
      setCompanies(prev => [data.company, ...prev]);
      Toast.show({
        type: 'success',
        text1: '🏢 Nouvelle entreprise',
        text2: `${data.company.name} a été créée`,
        position: 'bottom',
        visibilityTime: 3000,
      });
    };

    // 📢 Entreprise mise à jour
    const onCompanyUpdated = (data) => {
      console.log('📢 Entreprise mise à jour (mobile):', data.company);
      setCompanies(prev => prev.map(c => 
        c.id === data.company.id ? data.company : c
      ));
      Toast.show({
        type: 'info',
        text1: '🏢 Entreprise mise à jour',
        text2: `${data.company.name} a été modifiée`,
        position: 'bottom',
        visibilityTime: 3000,
      });
    };

    // 📢 Entreprise supprimée
    const onCompanyDeleted = (data) => {
      console.log('📢 Entreprise supprimée (mobile):', data.companyName);
      setCompanies(prev => prev.filter(c => c.id !== data.companyId));
      Toast.show({
        type: 'error',
        text1: '🏢 Entreprise supprimée',
        text2: `${data.companyName} a été supprimée`,
        position: 'bottom',
        visibilityTime: 3000,
      });
    };

    socket.on('company-created', onCompanyCreated);
    socket.on('company-updated', onCompanyUpdated);
    socket.on('company-deleted', onCompanyDeleted);

    return () => {
      socket.off('company-created', onCompanyCreated);
      socket.off('company-updated', onCompanyUpdated);
      socket.off('company-deleted', onCompanyDeleted);
    };
  }, [socket, isConnected]);

  const fetchCompanies = async () => {
    try {
      console.log('📡 Appel API: /api/client/companies');
      const response = await api.get('/api/client/companies');
      console.log('📦 Réponse:', response.data);
      
      const companiesData = response.data || [];
      
      const companiesWithCount = await Promise.all(
        companiesData.map(async (company: Company) => {
          try {
            const servicesRes = await api.get(`/api/client/companies/${company.id}/services`);
            return {
              ...company,
              serviceCount: servicesRes.data?.length || 0,
            };
          } catch {
            return { ...company, serviceCount: 0 };
          }
        })
      );
      
      setCompanies(companiesWithCount);
    } catch (error) {
      console.error('❌ Erreur fetching companies:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCompanies();
  };

  const handleCompanyPress = (companyId: string, companyName: string) => {
    // @ts-ignore
    navigation.navigate('CompanyServices', { 
      companyId, 
      companyName 
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRandomColor = (id: string) => {
    const colors = ['#4F46E5', '#7C3AED', '#2563EB', '#0891B2', '#059669', '#D97706', '#DC2626', '#7C3AED'];
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  // ✅ Composant CompanyCard avec animation
  const CompanyCard = ({ company, index }: { company: Company; index: number }) => {
    const cardAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.companyCard,
          {
            opacity: cardAnim,
            transform: [{ translateY: cardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }) }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleCompanyPress(company.id, company.name)}
        >
          <LinearGradient
            colors={['#ffffff', '#f8fafc']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.companyAvatar, { backgroundColor: getRandomColor(company.id) }]}>
                {company.logo ? (
                  <Image source={{ uri: company.logo }} style={styles.companyLogo} />
                ) : (
                  <Text style={styles.companyInitials}>
                    {getInitials(company.name)}
                  </Text>
                )}
              </View>
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>{company.name}</Text>
                <View style={styles.companyMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="location-outline" size={14} color="#6B7280" />
                    <Text style={styles.metaText}>{company.city || 'Madagascar'}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="grid-outline" size={14} color="#6B7280" />
                    <Text style={styles.metaText}>
                      {company.serviceCount || 0} services
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>

            {company.description && (
              <Text style={styles.companyDescription} numberOfLines={2}>
                {company.description}
              </Text>
            )}

            <View style={styles.cardFooter}>
              <View style={styles.statusBadge}>
                <View style={[
                  styles.statusDot,
                  company.status === 'active' ? styles.statusActive : styles.statusInactive
                ]} />
                <Text style={[
                  styles.statusText,
                  company.status === 'active' ? styles.statusActiveText : styles.statusInactiveText
                ]}>
                  {company.status === 'active' ? 'Active' : 'Inactive'}
                </Text>
              </View>
              <View style={styles.viewButton}>
                <Text style={styles.viewButtonText}>Voir les services</Text>
                <Ionicons name="arrow-forward" size={16} color="#4F46E5" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Chargement des entreprises...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4F46E5', '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Animated.View style={[styles.headerContent, { opacity: fadeAnim }]}>
          <Text style={styles.headerTitle}>🏢 Entreprises</Text>
          <Text style={styles.headerSubtitle}>
            Découvrez les entreprises disponibles
          </Text>
          {/* ✅ Indicateur de connexion */}
          <View style={styles.connectionBadge}>
            <View style={[styles.connectionDot, isConnected ? styles.connected : styles.disconnected]} />
            <Text style={styles.connectionText}>
              {isConnected ? '🟢 En direct' : '🔴 Hors ligne'}
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {companies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Aucune entreprise</Text>
            <Text style={styles.emptySubtitle}>
              Aucune entreprise n'est disponible pour le moment
            </Text>
          </View>
        ) : (
          companies.map((company, index) => (
            <CompanyCard key={company.id} company={company} index={index} />
          ))
        )}
      </ScrollView>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 16,
  },
  header: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    width: '100%',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  connectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  connected: {
    backgroundColor: '#10B981',
  },
  disconnected: {
    backgroundColor: '#EF4444',
  },
  connectionText: {
    fontSize: 10,
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  companyCard: {
    marginBottom: 12,
  },
  cardGradient: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyAvatar: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyLogo: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  companyInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  companyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  companyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  companyMeta: {
    flexDirection: 'row',
    marginTop: 2,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  companyDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusActive: {
    backgroundColor: '#10B981',
  },
  statusInactive: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusActiveText: {
    color: '#10B981',
  },
  statusInactiveText: {
    color: '#EF4444',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
    fontSize: 13,
    color: '#4F46E5',
    fontWeight: '500',
  },
});
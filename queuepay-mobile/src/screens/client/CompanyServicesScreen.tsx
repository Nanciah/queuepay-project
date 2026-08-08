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
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useLanguage } from '../../context/LanguageContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ServiceCard from '../../components/client/ServiceCard';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  ticket_price: number;
  estimated_duration: number;
  is_active: boolean;
}

export default function CompanyServicesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { companyId, companyName } = route.params as { 
    companyId: string; 
    companyName: string; 
  };
  const { t } = useLanguage();
  const { socket, isConnected, joinCompany, leaveCompany } = useSocket();

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Charger les services
  const fetchServices = async () => {
    try {
      console.log('📡 Chargement des services pour l\'entreprise:', companyId);
      const response = await api.get(`/api/client/companies/${companyId}/services`);
      setServices(response.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ Rafraîchir quand l'écran est affiché (solution de secours)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Rafraîchissement des services');
      fetchServices();
    }, [companyId])
  );

  // ✅ WebSocket - Écouter les événements de services
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('⚠️ Socket non connecté');
      return;
    }

    console.log('📡 Connexion WebSocket pour l\'entreprise:', companyId);
    joinCompany(companyId);

    // ✅ Service créé
    const onServiceCreated = (data: any) => {
      console.log('📢 Nouveau service reçu:', data.service.name);
      setServices(prev => [...prev, data.service]);
      Toast.show({
        type: 'success',
        text1: 'Nouveau service',
        text2: `${data.service.name} a été ajouté`,
        position: 'bottom',
        visibilityTime: 3000,
      });
    };

    // ✅ Service mis à jour
    const onServiceUpdated = (data: any) => {
      console.log('📢 Service mis à jour:', data.service.name);
      setServices(prev => prev.map(s => 
        s.id === data.service.id ? data.service : s
      ));
      Toast.show({
        type: 'info',
        text1: 'Service mis à jour',
        text2: `${data.service.name} a été modifié`,
        position: 'bottom',
        visibilityTime: 3000,
      });
    };

    // ✅ Service supprimé
    const onServiceDeleted = (data: any) => {
      console.log('📢 Service supprimé:', data.serviceName);
      setServices(prev => prev.filter(s => s.id !== data.serviceId));
      Toast.show({
        type: 'error',
        text1: 'Service supprimé',
        text2: `${data.serviceName} a été supprimé`,
        position: 'bottom',
        visibilityTime: 3000,
      });
    };

    socket.on('service-created', onServiceCreated);
    socket.on('service-updated', onServiceUpdated);
    socket.on('service-deleted', onServiceDeleted);

    return () => {
      console.log('📡 Déconnexion WebSocket pour l\'entreprise:', companyId);
      socket.off('service-created', onServiceCreated);
      socket.off('service-updated', onServiceUpdated);
      socket.off('service-deleted', onServiceDeleted);
      leaveCompany(companyId);
    };
  }, [socket, isConnected, companyId]);

  // ✅ Animation et chargement initial
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    fetchServices();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  const handleServicePress = (serviceId: string) => {
    // @ts-ignore
    navigation.navigate('ServiceDetail', { id: serviceId });
  };

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
      <LinearGradient
        colors={['#4F46E5', '#6366F1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Animated.View style={[styles.headerContent, { opacity: fadeAnim }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {companyName}
            </Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.headerBottom}>
            <Text style={styles.headerSubtitle}>
              {services.length} service{services.length > 1 ? 's' : ''} disponible{services.length > 1 ? 's' : ''}
            </Text>
            {isConnected && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Live</Text>
              </View>
            )}
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
        {services.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="grid-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Aucun service</Text>
            <Text style={styles.emptySubtitle}>
              Cette entreprise n'a pas encore de services disponibles
            </Text>
          </View>
        ) : (
          services.map((service, index) => (
            <ServiceCard
              key={service.id}
              service={service}
              index={index}
              onPress={handleServicePress}
            />
          ))
        )}
      </ScrollView>

      {/* ✅ Indicateur de connexion */}
      <View style={styles.connectionStatus}>
        <View style={[styles.connectionDot, isConnected ? styles.connected : styles.disconnected]} />
        <Text style={styles.connectionText}>
          {isConnected ? '🟢 Mises à jour en temps réel' : '🔴 Hors ligne - Actualisez manuellement'}
        </Text>
      </View>

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
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    width: '100%',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 12,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
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
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connected: {
    backgroundColor: '#10B981',
  },
  disconnected: {
    backgroundColor: '#EF4444',
  },
  connectionText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';

interface Ticket {
  id: string;
  ticket_number: string;
  status: string;
  position: number;
  estimated_wait_time: number;
  service_id: string;
  created_at: string;
  service?: {
    id: string;
    name: string;
  };
}

export default function MyTicketsScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      console.log('📡 Récupération des tickets...');
      const response = await api.get('/api/client/tickets');
      setTickets(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de charger vos tickets',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const getStatusInfo = (status: string) => {
    const statuses: { [key: string]: { label: string; color: string; icon: string } } = {
      pending: { label: 'En file', color: '#3B82F6', icon: 'time-outline' },
      waiting: { label: 'En attente', color: '#F59E0B', icon: 'hourglass-outline' },
      called: { label: 'Appelé !', color: '#10B981', icon: 'call-outline' },
      completed: { label: 'Terminé', color: '#6B7280', icon: 'checkmark-circle-outline' },
      cancelled: { label: 'Annulé', color: '#EF4444', icon: 'close-circle-outline' },
    };
    return statuses[status] || statuses.pending;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleTicketPress = (ticketId: string) => {
    // @ts-ignore
    navigation.navigate('Tracking', { ticketId });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Chargement de vos tickets...</Text>
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
        <Text style={styles.headerTitle}>🎫 Mes tickets</Text>
        <Text style={styles.headerSubtitle}>
          {tickets.length} ticket{tickets.length > 1 ? 's' : ''} au total
        </Text>
      </LinearGradient>

      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Aucun ticket</Text>
            <Text style={styles.emptySubtitle}>
              Vous n'avez pas encore de tickets.
              {'\n'}Réservez un service pour commencer !
            </Text>
            <TouchableOpacity
              style={styles.reserveButton}
              onPress={() => {
                // @ts-ignore
                navigation.navigate('Services');
              }}
            >
              <Text style={styles.reserveButtonText}>Voir les services</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const statusInfo = getStatusInfo(item.status);
          const isActive = item.status === 'pending' || item.status === 'waiting' || item.status === 'called';
          
          return (
            <TouchableOpacity
              style={[styles.ticketCard, isActive && styles.activeTicket]}
              onPress={() => handleTicketPress(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.ticketHeader}>
                <View>
                  <Text style={styles.ticketNumber}>{item.ticket_number}</Text>
                  <Text style={styles.ticketService}>
                    {item.service?.name || 'Service'}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
                  <Ionicons name={statusInfo.icon as any} size={14} color={statusInfo.color} />
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>
                    {statusInfo.label}
                  </Text>
                </View>
              </View>

              <View style={styles.ticketDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="people-outline" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>
                    Position: {item.position || '-'}
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>
                    {item.estimated_wait_time || 0} min
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={16} color="#6B7280" />
                  <Text style={styles.detailText}>
                    {formatDate(item.created_at)}
                  </Text>
                </View>
              </View>

              {isActive && (
                <View style={styles.ticketFooter}>
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>En direct</Text>
                  </View>
                  <View style={styles.arrowIcon}>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
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
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
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
  reserveButton: {
    marginTop: 20,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  reserveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activeTicket: {
    borderColor: '#4F46E5',
    borderWidth: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  ticketNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  ticketService: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  ticketDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '500',
  },
  arrowIcon: {
    padding: 4,
  },
});
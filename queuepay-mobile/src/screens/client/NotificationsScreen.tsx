// screens/client/NotificationsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Notification {
  id: string;
  type: 'ticket_called' | 'ticket_completed' | 'deposit_confirmed' | 'ticket_cancelled' | 'reminder' | 'youre_next';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ===== DONNÉES MOCK =====
  useEffect(() => {
    setTimeout(() => {
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'ticket_called',
          title: t('notifications.ticket_called_notif') || '🔔 Votre ticket est appelé !',
          message: 'Ticket #20260729-0030 - ' + (t('notifications.go_to_counter') || 'Veuillez vous présenter au guichet 2'),
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        },
        {
          id: '2',
          type: 'deposit_confirmed',
          title: t('notifications.deposit_confirmed_notif') || '💰 Dépôt confirmé',
          message: '10 000 Ar ' + (t('notifications.added_to_wallet') || 'ont été ajoutés à votre portefeuille'),
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        },
        {
          id: '3',
          type: 'ticket_completed',
          title: t('notifications.ticket_completed_notif') || '✅ Service rendu',
          message: 'Ticket #20260729-0025 - ' + (t('notifications.service_completed') || 'Service "Acte de mariage" complété'),
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
        {
          id: '4',
          type: 'reminder',
          title: t('notifications.reminder') || '⏰ Rappel',
          message: t('notifications.ticket_in_30min') || 'Vous avez un ticket dans 30 minutes - Service "Carte d\'identité"',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
        {
          id: '5',
          type: 'youre_next',
          title: t('notifications.youre_next') || '🟢 Vous êtes le prochain !',
          message: 'Ticket #20260729-0020 - ' + (t('notifications.position_1') || 'Vous êtes en position 1'),
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        },
        {
          id: '6',
          type: 'ticket_cancelled',
          title: t('notifications.ticket_cancelled_notif') || '❌ Ticket annulé',
          message: 'Ticket #20260728-0015 - ' + (t('notifications.cancelled_by_agent') || 'Annulé par l\'agent'),
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        },
      ];
      setNotifications(mockNotifications);
      setLoading(false);
      setRefreshing(false);
    }, 800);
  }, [language]);

  // ===== ACTIONS =====
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // ===== ✅ GESTION DU RETOUR =====
  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // @ts-ignore
      navigation.navigate('MainTabs', { screen: 'Home' });
    }
  };

  // ===== UTILITAIRES =====
  const getIcon = (type: string) => {
    switch (type) {
      case 'ticket_called':
        return 'call-outline';
      case 'ticket_completed':
        return 'checkmark-circle-outline';
      case 'deposit_confirmed':
        return 'wallet-outline';
      case 'ticket_cancelled':
        return 'close-circle-outline';
      case 'reminder':
        return 'time-outline';
      case 'youre_next':
        return 'star-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'ticket_called':
        return '#10B981';
      case 'ticket_completed':
        return '#3B82F6';
      case 'deposit_confirmed':
        return '#8B5CF6';
      case 'ticket_cancelled':
        return '#EF4444';
      case 'reminder':
        return '#F59E0B';
      case 'youre_next':
        return '#EC4899';
      default:
        return '#6B7280';
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'ticket_called':
        return '#D1FAE5';
      case 'ticket_completed':
        return '#DBEAFE';
      case 'deposit_confirmed':
        return '#EDE9FE';
      case 'ticket_cancelled':
        return '#FEE2E2';
      case 'reminder':
        return '#FEF3C7';
      case 'youre_next':
        return '#FCE4EC';
      default:
        return '#F3F4F6';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    const localeMap: { [key: string]: string } = {
      fr: 'fr-FR',
      en: 'en-US',
      mg: 'fr-FR',
    };
    const locale = localeMap[language] || 'fr-FR';

    if (diff < 60) return t('common.now') || 'À l\'instant';
    if (diff < 3600) return `${Math.floor(diff / 60)} ${t('common.minutes') || 'min'}`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ${t('common.hours') || 'h'}`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ${t('common.days') || 'j'}`;
    
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // ===== RENDU =====
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>
          {t('common.loading') || 'Chargement des notifications...'}
        </Text>
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
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack} // ✅ Utiliser goBack au lieu de navigation.goBack()
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {t('notifications_title') || 'Notifications'}
          </Text>
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
            disabled={unreadCount === 0}
          >
            <Text
              style={[
                styles.markAllText,
                unreadCount === 0 && styles.markAllTextDisabled,
              ]}
            >
              {t('notifications.mark_all_read') || 'Tout lire'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ===== COMPTEUR ===== */}
      {unreadCount > 0 && (
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {unreadCount} {t('notifications.notification') || 'notification'}
            {unreadCount > 1 ? 's' : ''} {t('notifications.unread') || 'non lue'}
            {unreadCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* ===== LISTE ===== */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {t('notifications.no_notifications') || 'Aucune notification'}
            </Text>
            <Text style={styles.emptyText}>
              {t('notifications.no_notifications_desc') || 'Vous serez notifié ici lorsque des événements importants surviendront.'}
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationCard,
                !notification.read && styles.notificationCardUnread,
              ]}
              onPress={() => markAsRead(notification.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.notificationIcon,
                  { backgroundColor: getIconBg(notification.type) },
                ]}
              >
                <Ionicons
                  name={getIcon(notification.type) as any}
                  size={24}
                  color={getIconColor(notification.type)}
                />
              </View>

              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <Text
                    style={[
                      styles.notificationTitle,
                      !notification.read && styles.notificationTitleUnread,
                    ]}
                    numberOfLines={1}
                  >
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {formatDate(notification.created_at)}
                  </Text>
                </View>
                <Text style={styles.notificationMessage} numberOfLines={2}>
                  {notification.message}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteNotification(notification.id)}
              >
                <Ionicons name="close" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

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

  // ===== HEADER =====
  header: {
    paddingTop: 48,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  markAllButton: {
    padding: 4,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  markAllTextDisabled: {
    opacity: 0.4,
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
  },

  // ===== COUNTER =====
  counterContainer: {
    backgroundColor: '#EEF2FF',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  counterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4F46E5',
  },

  // ===== LISTE =====
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // ===== CARTE NOTIFICATION =====
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  notificationCardUnread: {
    backgroundColor: '#F8FAFF',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  notificationTitleUnread: {
    color: '#1F2937',
  },
  notificationTime: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },

  // ===== EMPTY =====
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },

  bottomSpacing: {
    height: 24,
  },
});
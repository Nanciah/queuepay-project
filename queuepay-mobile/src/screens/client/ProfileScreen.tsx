import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  // ✅ État pour le modal de langue
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  // ===== GESTIONNAIRES =====
  const handleLogout = () => {
    Alert.alert(
      t('logout') || 'Déconnexion',
      t('confirm_logout') || 'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: t('cancel') || 'Annuler', style: 'cancel' },
        { text: t('logout') || 'Déconnexion', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleLanguageChange = (lang: 'fr' | 'en' | 'mg') => {
    setLanguage(lang);
    setShowLanguageModal(false);
  };

  // ===== RENDU =====
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
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile') || 'Profil'}</Text>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      {/* ===== INFO UTILISATEUR ===== */}
      <View style={styles.profileCard}>
        <LinearGradient
          colors={['#EEF2FF', '#E0E7FF']}
          style={styles.avatarContainer}
        >
          <Text style={styles.avatarText}>
            {user?.first_name?.[0] || 'U'}{user?.last_name?.[0] || ''}
          </Text>
        </LinearGradient>
        <Text style={styles.userName}>
          {user?.first_name || ''} {user?.last_name || ''}
        </Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        <View style={styles.userRoleBadge}>
          <Text style={styles.userRoleText}>
            {user?.role === 'client' ? 'Client' : 'Utilisateur'}
          </Text>
        </View>
      </View>

      {/* ===== MENU ===== */}
      <View style={styles.section}>
        {/* Modifier le profil */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            // @ts-ignore
            navigation.navigate('EditProfile');
          }}
        >
          <View style={[styles.menuIcon, styles.menuIconPurple]}>
            <Ionicons name="person-outline" size={22} color="#4F46E5" />
          </View>
          <Text style={styles.menuText}>{t('edit_profile') || 'Modifier le profil'}</Text>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" style={styles.menuArrow} />
        </TouchableOpacity>

        {/* ✅ Changer la langue */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => setShowLanguageModal(true)}
        >
          <View style={[styles.menuIcon, styles.menuIconBlue]}>
            <Ionicons name="language-outline" size={22} color="#3B82F6" />
          </View>
          <Text style={styles.menuText}>{t('language') || 'Langue'}</Text>
          <View style={styles.languageBadge}>
            <Text style={styles.languageBadgeText}>
              {language === 'fr' ? 'FR' : language === 'en' ? 'EN' : 'MG'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" style={styles.menuArrow} />
        </TouchableOpacity>

        {/* Notifications */}
        <TouchableOpacity
          style={[styles.menuItem, styles.menuItemLast]}
          onPress={() => {
            // @ts-ignore
            navigation.navigate('Notifications');
          }}
        >
          <View style={[styles.menuIcon, styles.menuIconOrange]}>
            <Ionicons name="notifications-outline" size={22} color="#F59E0B" />
          </View>
          <Text style={styles.menuText}>{t('notifications') || 'Notifications'}</Text>
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>3</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#D1D5DB" style={styles.menuArrow} />
        </TouchableOpacity>
      </View>

      {/* ===== STATISTIQUES ===== */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Tickets</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>8</Text>
          <Text style={styles.statLabel}>Services</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.statLabel}>Jours</Text>
        </View>
      </View>

      {/* ===== DÉCONNEXION ===== */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Ionicons name="log-out-outline" size={22} color="#EF4444" />
        <Text style={styles.logoutText}>{t('logout') || 'Déconnexion'}</Text>
      </TouchableOpacity>

      {/* ===== MODAL DE LANGUE ===== */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir la langue</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'fr' && styles.languageOptionActive,
              ]}
              onPress={() => handleLanguageChange('fr')}
            >
              <View style={styles.languageOptionLeft}>
                <Text style={styles.languageFlag}>🇫🇷</Text>
                <Text style={styles.languageOptionText}>Français</Text>
              </View>
              {language === 'fr' && (
                <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'en' && styles.languageOptionActive,
              ]}
              onPress={() => handleLanguageChange('en')}
            >
              <View style={styles.languageOptionLeft}>
                <Text style={styles.languageFlag}>🇬🇧</Text>
                <Text style={styles.languageOptionText}>English</Text>
              </View>
              {language === 'en' && (
                <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'mg' && styles.languageOptionActive,
              ]}
              onPress={() => handleLanguageChange('mg')}
            >
              <View style={styles.languageOptionLeft}>
                <Text style={styles.languageFlag}>🇲🇬</Text>
                <Text style={styles.languageOptionText}>Malagasy</Text>
              </View>
              {language === 'mg' && (
                <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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

  // ===== PROFIL CARD =====
  profileCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#4F46E5',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  userRoleBadge: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
  },
  userRoleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
  },

  // ===== MENU =====
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconPurple: {
    backgroundColor: '#EEF2FF',
  },
  menuIconBlue: {
    backgroundColor: '#DBEAFE',
  },
  menuIconOrange: {
    backgroundColor: '#FEF3C7',
  },
  menuText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
  },
  menuArrow: {
    marginLeft: 8,
  },

  // ===== BADGES =====
  languageBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  languageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  notificationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    marginRight: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },

  // ===== STATISTIQUES =====
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },

  // ===== DÉCONNEXION =====
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },

  // ===== MODAL =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  languageOptionActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1.5,
    borderColor: '#4F46E5',
  },
  languageOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
});
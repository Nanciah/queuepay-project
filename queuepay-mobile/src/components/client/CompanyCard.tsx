import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

interface CompanyCardProps {
  company: Company;
  onPress: (companyId: string, companyName: string) => void;
  index: number;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company, onPress, index }) => {
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

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
        onPress={() => onPress(company.id, company.name)}
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

const styles = StyleSheet.create({
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

export default CompanyCard;
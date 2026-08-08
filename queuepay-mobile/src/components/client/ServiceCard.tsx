import React, { useEffect, useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  ticket_price: number;
  estimated_duration: number;
  is_active: boolean;
}

interface ServiceCardProps {
  service: Service;
  onPress: (serviceId: string) => void;
  index: number;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onPress, index }) => {
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, []);

  // ✅ Fonctions internes au composant
  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      health: 'medical-outline',
      banking: 'business-outline',
      administration: 'build-outline',
      commerce: 'cart-outline',
      transport: 'car-outline',
      education: 'school-outline',
      other: 'grid-outline',
    };
    return icons[category] || 'grid-outline';
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      health: '#10B981',
      banking: '#3B82F6',
      administration: '#8B5CF6',
      commerce: '#F59E0B',
      transport: '#EF4444',
      education: '#EC4899',
      other: '#6B7280',
    };
    return colors[category] || '#6B7280';
  };

  return (
    <Animated.View
      style={[
        styles.serviceCard,
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
        onPress={() => onPress(service.id)}
      >
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${getCategoryColor(service.category)}20` }]}>
              <Ionicons
                name={getCategoryIcon(service.category) as any}
                size={24}
                color={getCategoryColor(service.category)}
              />
            </View>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>{service.ticket_price || 0} Ar</Text>
            </View>
          </View>

          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {service.description || 'Service disponible'}
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.footerItem}>
              <Ionicons name="time-outline" size={14} color="#6B7280" />
              <Text style={styles.footerText}>{service.estimated_duration || 15} min</Text>
            </View>
            <View style={[
              styles.statusBadge,
              service.is_active ? styles.activeBadge : styles.inactiveBadge
            ]}>
              <Text style={[
                styles.statusText,
                service.is_active ? styles.activeText : styles.inactiveText
              ]}>
                {service.is_active ? 'Actif' : 'Inactif'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  serviceCard: {
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priceBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4F46E5',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 10,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: '#D1FAE5',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  activeText: {
    color: '#10B981',
  },
  inactiveText: {
    color: '#EF4444',
  },
});

export default ServiceCard;
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/axios';
import { Order } from '@food-delivery/types';
import { Brand, Radius, Spacing } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const { data: ratingData } = useQuery<{ averageRating: number | null }>({
    queryKey: ['driver-rating', user?.id],
    queryFn: () =>
      api
        .get<{ averageRating: number | null }>(`/reviews/driver/${user?.id}/average`)
        .then((r) => r.data),
    enabled: !!user?.id,
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['driver-orders'],
    queryFn: () => api.get<Order[]>('/orders/mine').then((r) => r.data),
  });

  const totalDeliveries = orders.filter((o) => o.status === 'DELIVERED').length;
  const totalEarnings = orders.filter((o) => o.status === 'DELIVERED').length * 2.99;
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  const menuSections: { title: string; items: { icon: keyof typeof Ionicons.glyphMap; label: string; color?: string }[] }[] = [
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline', label: 'Help Center' },
        { icon: 'document-text-outline', label: 'Terms & Privacy' },
        { icon: 'star-outline', label: 'Rate the App' },
      ],
    },
  ];

  return (
    <View style={styles.bgContainer}>
      {/* Background Image */}
      <Image
        source={require('../../../assets/images/driver.jpeg')}
        style={styles.bgImage}
      />
      <View style={styles.bgOverlay} />

      <SafeAreaView style={styles.contentContainer} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.avatarBadge}>
                <Ionicons name="checkmark" size={12} color="#FFF" />
              </View>
            </View>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.firstName} {user?.lastName}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.roleBadge}>
              <Ionicons name="bicycle" size={12} color={Brand.orange} />
              <Text style={styles.roleText}>Driver</Text>
            </View>
          </View>

          {/* Rating */}
          {ratingData?.averageRating ? (
            <View style={styles.ratingCard}>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.round(ratingData.averageRating!) ? 'star' : 'star-outline'}
                    size={24}
                    color="#F59E0B"
                  />
                ))}
              </View>
              <Text style={styles.ratingValue}>
                {ratingData.averageRating!.toFixed(1)}
              </Text>
              <Text style={styles.ratingLabel}>Driver Rating</Text>
            </View>
          ) : (
            <View style={styles.ratingCard}>
              <Ionicons name="star-outline" size={32} color="rgba(255,255,255,0.4)" />
              <Text style={styles.ratingEmpty}>No ratings yet</Text>
              <Text style={styles.ratingSubtext}>Complete deliveries to earn ratings</Text>
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalDeliveries}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${totalEarnings.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {ratingData?.averageRating ? ratingData.averageRating.toFixed(1) : '—'}
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          {/* Menu Sections */}
          {menuSections.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.menuCard}>
                {section.items.map((item, index) => (
                  <Pressable
                    key={item.label}
                    style={({ pressed }) => [
                      styles.menuItem,
                      index < section.items.length - 1 && styles.menuItemBorder,
                      pressed && styles.menuItemPressed,
                    ]}
                  >
                    <View style={styles.menuItemLeft}>
                      <View style={styles.menuIconContainer}>
                        <Ionicons name={item.icon} size={20} color={item.color ?? '#6B7280'} />
                      </View>
                      <Text style={styles.menuItemLabel}>{item.label}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          {/* Logout Button */}
          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
            ]}
            onPress={() => {
              void logout();
            }}
          >
            <Ionicons name="log-out-outline" size={20} color={Brand.red} />
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>

          <Text style={styles.version}>Version 1.0.0</Text>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── Background ──────────────────────────────────────────────
  bgContainer: {
    flex: 1,
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // ─── Header ────────────────────────────────────────────────────
  header: {
    alignItems: 'center',
    paddingTop: Spacing.five,
    paddingBottom: Spacing.six,
    paddingHorizontal: Spacing.six,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.four,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Brand.orange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Brand.orange,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Brand.green,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: Spacing.three,
    textAlign: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    gap: 6,
  },
  roleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.orange,
  },

  // ─── Rating Card ───────────────────────────────────────────────
  ratingCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: Spacing.six,
    marginBottom: Spacing.five,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  ratingValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 4,
  },
  ratingEmpty: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
  },
  ratingSubtext: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },

  // ─── Stats ─────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: Spacing.six,
    marginBottom: Spacing.six,
    paddingVertical: Spacing.five,
    borderRadius: Radius.xl,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#F0F0F0',
  },

  // ─── Sections ──────────────────────────────────────────────────
  section: {
    paddingHorizontal: Spacing.six,
    marginBottom: Spacing.five,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.two,
    marginLeft: 4,
  },

  // ─── Menu ──────────────────────────────────────────────────────
  menuCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: Radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemPressed: {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },

  // ─── Logout ────────────────────────────────────────────────────
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.six,
    marginTop: Spacing.four,
    paddingVertical: 16,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(254,242,242,0.95)',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  logoutButtonPressed: {
    opacity: 0.7,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: Brand.red,
  },

  // ─── Version ───────────────────────────────────────────────────
  version: {
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: Spacing.five,
    fontWeight: '500',
  },
});

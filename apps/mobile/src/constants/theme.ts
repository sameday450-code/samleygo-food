/**
 * Premium SaaS Design System
 * Colors, typography, spacing, and shared styles
 */

import '@/global.css';

import { Platform, StyleSheet } from 'react-native';

// ─── Colors ──────────────────────────────────────────────────────────
export const Colors = {
  light: {
    text: '#1A1A2E',
    background: '#FFFFFF',
    backgroundElement: '#F7F7F8',
    backgroundSelected: '#F0F0F3',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    card: '#FFFFFF',
    cardBorder: '#F0F0F0',
    inputBg: '#F9FAFB',
    overlay: 'rgba(0,0,0,0.4)',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    textMuted: '#6B7280',
    border: '#374151',
    borderLight: '#1F2937',
    card: '#111827',
    cardBorder: '#1F2937',
    inputBg: '#1F2937',
    overlay: 'rgba(0,0,0,0.6)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

// ─── Brand Colors ────────────────────────────────────────────────────
export const Brand = {
  orange: '#FF6B35',
  orangeLight: '#FFF3ED',
  orangeMedium: '#FED7AA',
  orangeDark: '#E85D2C',
  green: '#22C55E',
  greenLight: '#DCFCE7',
  greenDark: '#16A34A',
  red: '#EF4444',
  redLight: '#FEE2E2',
  blue: '#3B82F6',
  blueLight: '#DBEAFE',
  purple: '#8B5CF6',
  purpleLight: '#EDE9FE',
  yellow: '#F59E0B',
  yellowLight: '#FEF3C7',
  cyan: '#06B6D4',
  cyanLight: '#CFFAFE',
} as const;

// ─── Typography ──────────────────────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

// ─── Spacing Scale ───────────────────────────────────────────────────
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 32,
  eight: 40,
  nine: 48,
  ten: 64,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────
export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 9999,
} as const;

// ─── Platform Layout ─────────────────────────────────────────────────
export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

// ─── Shared Styles ───────────────────────────────────────────────────
export const shared = StyleSheet.create({
  // Container
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },

  // Typography
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A2E',
    letterSpacing: -0.2,
  },
  bodyText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#374151',
    lineHeight: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#EF4444',
  },
  mutedText: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 16,
  },
  cardElevated: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  cardGray: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 20,
  },

  // Form Inputs
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputRequired: {
    color: '#EF4444',
    marginLeft: 2,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A2E',
    lineHeight: 20,
  },
  textAreaInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A2E',
    minHeight: 100,
    textAlignVertical: 'top',
    lineHeight: 20,
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: '#FF6B35',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  outlineButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },

  // Status Badges
  badgeGreen: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeGreenText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  badgeRed: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeRedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },

  // Empty States
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});

// ─── Helper: Status Color Map ────────────────────────────────────────
export const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  CONFIRMED: '#3B82F6',
  PREPARING: '#8B5CF6',
  READY: '#06B6D4',
  PICKED_UP: '#FF6B35',
  DELIVERED: '#22C55E',
  CANCELLED: '#EF4444',
};

export const STATUS_BG_COLORS: Record<string, string> = {
  PENDING: '#FEF3C7',
  CONFIRMED: '#DBEAFE',
  PREPARING: '#EDE9FE',
  READY: '#CFFAFE',
  PICKED_UP: '#FFF3ED',
  DELIVERED: '#DCFCE7',
  CANCELLED: '#FEE2E2',
};

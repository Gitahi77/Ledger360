'use client';

import {
  ShoppingCart, Car, Zap, Film, Heart, ShoppingBag, BookOpen, Home,
  Briefcase, Repeat, Coffee, Dumbbell, Wifi, Phone, Plane, Gift,
  TrendingUp, TrendingDown, Building2, CreditCard, Utensils, Bus,
  Droplets, Music, Gamepad2, Baby, Scissors, Wrench, Package, DollarSign
} from 'lucide-react';

// Maps every transaction category/keyword → icon + color
const CATEGORY_MAP: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  // Income
  income:       { icon: TrendingUp,   color: '#10B981', bg: '#D1FAE5' },
  salary:       { icon: Briefcase,    color: '#10B981', bg: '#D1FAE5' },
  freelance:    { icon: DollarSign,   color: '#10B981', bg: '#D1FAE5' },
  business:     { icon: Building2,    color: '#10B981', bg: '#D1FAE5' },
  investment:   { icon: TrendingUp,   color: '#4361EE', bg: '#EEF2FF' },
  refund:       { icon: Repeat,       color: '#10B981', bg: '#D1FAE5' },

  // Food & Dining
  food:         { icon: Utensils,     color: '#F59E0B', bg: '#FEF3C7' },
  groceries:    { icon: ShoppingCart, color: '#F59E0B', bg: '#FEF3C7' },
  restaurant:   { icon: Utensils,     color: '#F59E0B', bg: '#FEF3C7' },
  cafe:         { icon: Coffee,       color: '#92400E', bg: '#FDE68A' },
  coffee:       { icon: Coffee,       color: '#92400E', bg: '#FDE68A' },
  dining:       { icon: Utensils,     color: '#F59E0B', bg: '#FEF3C7' },

  // Transport
  transport:    { icon: Car,          color: '#3B82F6', bg: '#DBEAFE' },
  uber:         { icon: Car,          color: '#3B82F6', bg: '#DBEAFE' },
  bolt:         { icon: Car,          color: '#3B82F6', bg: '#DBEAFE' },
  taxi:         { icon: Car,          color: '#3B82F6', bg: '#DBEAFE' },
  bus:          { icon: Bus,          color: '#3B82F6', bg: '#DBEAFE' },
  matatu:       { icon: Bus,          color: '#3B82F6', bg: '#DBEAFE' },
  fuel:         { icon: Car,          color: '#3B82F6', bg: '#DBEAFE' },
  flight:       { icon: Plane,        color: '#0EA5E9', bg: '#E0F2FE' },

  // Utilities
  utilities:    { icon: Zap,          color: '#F59E0B', bg: '#FEF3C7' },
  electricity:  { icon: Zap,          color: '#EAB308', bg: '#FEF9C3' },
  water:        { icon: Droplets,     color: '#0EA5E9', bg: '#E0F2FE' },
  internet:     { icon: Wifi,         color: '#8B5CF6', bg: '#EDE9FE' },
  phone:        { icon: Phone,        color: '#8B5CF6', bg: '#EDE9FE' },

  // Entertainment
  entertainment:{ icon: Film,         color: '#8B5CF6', bg: '#EDE9FE' },
  netflix:      { icon: Film,         color: '#EF4444', bg: '#FEE2E2' },
  spotify:      { icon: Music,        color: '#10B981', bg: '#D1FAE5' },
  gaming:       { icon: Gamepad2,     color: '#8B5CF6', bg: '#EDE9FE' },

  // Health
  health:       { icon: Heart,        color: '#EF4444', bg: '#FEE2E2' },
  medical:      { icon: Heart,        color: '#EF4444', bg: '#FEE2E2' },
  gym:          { icon: Dumbbell,     color: '#EF4444', bg: '#FEE2E2' },
  pharmacy:     { icon: Heart,        color: '#EF4444', bg: '#FEE2E2' },

  // Shopping
  shopping:     { icon: ShoppingBag,  color: '#EC4899', bg: '#FCE7F3' },
  clothing:     { icon: Scissors,     color: '#EC4899', bg: '#FCE7F3' },
  fashion:      { icon: ShoppingBag,  color: '#EC4899', bg: '#FCE7F3' },

  // Home
  rent:         { icon: Home,         color: '#6366F1', bg: '#EEF2FF' },
  housing:      { icon: Home,         color: '#6366F1', bg: '#EEF2FF' },
  repairs:      { icon: Wrench,       color: '#6366F1', bg: '#EEF2FF' },

  // Education
  education:    { icon: BookOpen,     color: '#0EA5E9', bg: '#E0F2FE' },
  school:       { icon: BookOpen,     color: '#0EA5E9', bg: '#E0F2FE' },
  helb:         { icon: BookOpen,     color: '#0EA5E9', bg: '#E0F2FE' },

  // Loans & Finance
  loan:         { icon: CreditCard,   color: '#EF4444', bg: '#FEE2E2' },
  credit:       { icon: CreditCard,   color: '#4361EE', bg: '#EEF2FF' },
  transfer:     { icon: Repeat,       color: '#64748B', bg: '#F1F5F9' },

  // Kids & Family
  baby:         { icon: Baby,         color: '#F472B6', bg: '#FCE7F3' },
  kids:         { icon: Baby,         color: '#F472B6', bg: '#FCE7F3' },

  // Gifts
  gift:         { icon: Gift,         color: '#A855F7', bg: '#F3E8FF' },

  // Default
  other:        { icon: Package,      color: '#64748B', bg: '#F1F5F9' },
};

export function getCategoryMeta(category: string, name?: string): { icon: React.ElementType; color: string; bg: string } {
  const key = (name || category || '').toLowerCase();
  // Try exact match first, then partial match
  for (const [k, v] of Object.entries(CATEGORY_MAP)) {
    if (key.includes(k)) return v;
  }
  return CATEGORY_MAP.other;
}

interface CategoryIconProps {
  category: string;
  name?: string;
  size?: number;
}

export function CategoryIcon({ category, name, size = 16 }: CategoryIconProps) {
  const meta = getCategoryMeta(category, name);
  const Icon = meta.icon;
  return (
    <div style={{
      width: size * 2.2,
      height: size * 2.2,
      borderRadius: 8,
      background: meta.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon size={size} color={meta.color} strokeWidth={2} />
    </div>
  );
}

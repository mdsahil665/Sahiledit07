export interface DashboardUserRecord {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  isPremium?: boolean;
  plan?: 'free' | 'premium' | 'ultra' | 'ultra_premium' | string;
  isBanned?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  lastActiveAt?: string;
  updatedAt?: string;
  subscriptionExpiresAt?: string;
}

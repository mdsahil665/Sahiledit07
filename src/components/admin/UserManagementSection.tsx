import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  Shield,
  Crown,
  Ban,
  Mail,
  Calendar,
  UserX,
  Sparkles,
  Activity,
  Clock,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  Info,
  Radio,
  History,
  BarChart3,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, auth, ADMIN_EMAIL } from '../../lib/firebase';
import { useToast } from '../Toast';

export interface UserActivityEvent {
  id?: string;
  type: 'login' | 'view_post' | 'like_post' | 'copy_prompt' | 'comment' | 'profile_update' | 'other' | string;
  label: string;
  timestamp: string;
}

export interface UserRecord {
  id: string; // Firebase UID
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
  lastActivityAt?: string;
  lastSeenAt?: string;
  lastHeartbeatAt?: string;
  isOnline?: boolean;
  presence?: {
    isOnline?: boolean;
    lastHeartbeat?: string;
  };
  activityHistory?: UserActivityEvent[];
  updatedAt?: string;
  subscriptionExpiresAt?: string;
}

export type StatusFilterType = 'all' | 'online' | 'premium' | 'active' | 'inactive' | 'banned';
export type ActivityPeriodFilterType = 'all' | 'today' | '7d' | '30d' | '12m';

interface UserManagementSectionProps {
  currentAdminEmail?: string;
}

/**
 * Extracts ONLY real activity timestamps.
 * Per strict rules:
 * - If only a real creation/signup timestamp exists: do NOT treat signup as activity.
 * - Return null if no reliable activity history exists.
 */
export function getUserRealActivityTimestamp(user: UserRecord): {
  timestamp: string | null;
  source: 'activity' | 'login' | 'presence' | null;
} {
  if (user.lastActivityAt) return { timestamp: user.lastActivityAt, source: 'activity' };
  if (user.lastActiveAt) return { timestamp: user.lastActiveAt, source: 'activity' };
  if (user.lastSeenAt) return { timestamp: user.lastSeenAt, source: 'presence' };
  if (user.lastLoginAt) return { timestamp: user.lastLoginAt, source: 'login' };

  // Check activity history if available
  if (user.activityHistory && user.activityHistory.length > 0) {
    const latestEvent = [...user.activityHistory].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
    if (latestEvent?.timestamp) {
      return { timestamp: latestEvent.timestamp, source: 'activity' };
    }
  }

  // Strictly do NOT treat createdAt as activity
  return { timestamp: null, source: null };
}

/**
 * Checks if a user is verified as "Online Now".
 * Per strict mandate:
 * - "Online Now" MUST NOT simply mean that the user logged in sometime recently.
 * - Requires active session/presence heartbeat confirmation.
 * - When heartbeat is lost, expired (>150s), or marked false: mark them offline.
 */
export function isUserVerifiedOnline(user: UserRecord): boolean {
  // Explicit offline flag takes precedence
  if (user.isOnline === false || user.presence?.isOnline === false) {
    return false;
  }

  const heartbeat = user.lastHeartbeatAt || user.presence?.lastHeartbeat;
  if (!heartbeat) {
    return false;
  }

  const hbTime = new Date(heartbeat).getTime();
  if (isNaN(hbTime) || hbTime <= 0) return false;

  const diffMs = Date.now() - hbTime;
  // Heartbeat must be within 150 seconds (2.5 mins)
  return diffMs >= 0 && diffMs <= 150 * 1000;
}

export interface DynamicActivityInfo {
  isOnline: boolean;
  status: 'active' | 'inactive';
  statusBadge: {
    type: 'online' | 'today' | 'recent' | 'boundary' | 'inactive' | 'unavailable';
    label: string;
    dotColor: string;
    textColor: string;
    borderColor: string;
    bgColor: string;
  };
  relativeText: string;
  exactTimestamp: string | null;
  hasReliableData: boolean;
  daysAgo: number | null;
  activeInToday: boolean;
  activeIn7Days: boolean;
  activeIn30Days: boolean;
  activeIn12Months: boolean;
}

/**
 * Dynamically computes comprehensive user activity status.
 */
export function getComprehensiveUserActivity(user: UserRecord): DynamicActivityInfo {
  const isOnline = isUserVerifiedOnline(user);
  const { timestamp } = getUserRealActivityTimestamp(user);

  if (!timestamp) {
    return {
      isOnline: false,
      status: 'inactive',
      statusBadge: {
        type: 'unavailable',
        label: 'Activity data unavailable',
        dotColor: 'bg-zinc-500',
        textColor: 'text-zinc-400',
        borderColor: 'border-zinc-700/60',
        bgColor: 'bg-zinc-800/60',
      },
      relativeText: 'Activity data unavailable',
      exactTimestamp: null,
      hasReliableData: false,
      daysAgo: null,
      activeInToday: false,
      activeIn7Days: false,
      activeIn30Days: false,
      activeIn12Months: false,
    };
  }

  const timeMs = new Date(timestamp).getTime();
  if (isNaN(timeMs) || timeMs <= 0) {
    return {
      isOnline: false,
      status: 'inactive',
      statusBadge: {
        type: 'unavailable',
        label: 'Activity data unavailable',
        dotColor: 'bg-zinc-500',
        textColor: 'text-zinc-400',
        borderColor: 'border-zinc-700/60',
        bgColor: 'bg-zinc-800/60',
      },
      relativeText: 'Activity data unavailable',
      exactTimestamp: null,
      hasReliableData: false,
      daysAgo: null,
      activeInToday: false,
      activeIn7Days: false,
      activeIn30Days: false,
      activeIn12Months: false,
    };
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - timeMs);
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  // Check today (same calendar day or <24h)
  const nowDate = new Date(now);
  const actDate = new Date(timeMs);
  const isSameCalendarDay =
    nowDate.getFullYear() === actDate.getFullYear() &&
    nowDate.getMonth() === actDate.getMonth() &&
    nowDate.getDate() === actDate.getDate();

  const activeInToday = isSameCalendarDay || diffMs < 24 * 60 * 60 * 1000;
  const activeIn7Days = diffDays <= 7;
  const activeIn30Days = diffDays <= 30;
  const activeIn12Months = diffDays <= 365;

  // Active if meaningful activity within the last 30 days
  const status: 'active' | 'inactive' = diffDays <= 30 ? 'active' : 'inactive';

  let type: 'online' | 'today' | 'recent' | 'boundary' | 'inactive' | 'unavailable';
  let label: string;
  let dotColor: string;
  let textColor: string;
  let borderColor: string;
  let bgColor: string;

  if (isOnline) {
    type = 'online';
    label = 'Online now';
    dotColor = 'bg-emerald-400 animate-pulse';
    textColor = 'text-emerald-300 font-bold';
    borderColor = 'border-emerald-500/40';
    bgColor = 'bg-emerald-500/15';
  } else if (activeInToday) {
    type = 'today';
    label = 'Active today';
    dotColor = 'bg-emerald-400';
    textColor = 'text-emerald-400';
    borderColor = 'border-emerald-500/30';
    bgColor = 'bg-emerald-500/10';
  } else if (diffDays < 30) {
    type = 'recent';
    label = diffDays === 1 ? 'Active 1 day ago' : `Active ${diffDays} days ago`;
    dotColor = 'bg-emerald-400';
    textColor = 'text-emerald-400';
    borderColor = 'border-emerald-500/30';
    bgColor = 'bg-emerald-500/10';
  } else if (diffDays === 30) {
    type = 'boundary';
    label = 'Active 30 days ago';
    dotColor = 'bg-amber-400';
    textColor = 'text-amber-400';
    borderColor = 'border-amber-500/30';
    bgColor = 'bg-amber-500/10';
  } else {
    type = 'inactive';
    label = `Inactive ${diffDays} days ago`;
    dotColor = 'bg-zinc-500';
    textColor = 'text-zinc-400';
    borderColor = 'border-zinc-700/50';
    bgColor = 'bg-zinc-800/60';
  }

  return {
    isOnline,
    status,
    statusBadge: {
      type,
      label,
      dotColor,
      textColor,
      borderColor,
      bgColor,
    },
    relativeText: label,
    exactTimestamp: timestamp,
    hasReliableData: true,
    daysAgo: diffDays,
    activeInToday,
    activeIn7Days,
    activeIn30Days,
    activeIn12Months,
  };
}

export const UserManagementSection: React.FC<UserManagementSectionProps> = ({
  currentAdminEmail = ADMIN_EMAIL || 'mdsahil012002@gmail.com',
}) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('all');
  const [activityPeriodFilter, setActivityPeriodFilter] = useState<ActivityPeriodFilterType>('all');

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  // Activity History / Detail modal state
  const [inspectUser, setInspectUser] = useState<UserRecord | null>(null);

  // 12-Month Activity View Drawer/Section toggle
  const [showMonthlyAnalytics, setShowMonthlyAnalytics] = useState(false);

  const { showToast } = useToast();

  // 1. PRESENCE HEARTBEAT FOR CURRENT SESSION
  useEffect(() => {
    const currentAuthUser = auth.currentUser;
    if (!currentAuthUser) return;

    const userDocRef = doc(db, 'users', currentAuthUser.uid);

    const emitHeartbeat = async (onlineState: boolean = true) => {
      try {
        const now = new Date().toISOString();
        await updateDoc(userDocRef, {
          lastHeartbeatAt: now,
          lastSeenAt: now,
          lastActivityAt: now,
          isOnline: onlineState,
          updatedAt: now,
        });
      } catch (err) {
        // Silent error handling for background presence ping
      }
    };

    // Emit initial presence
    emitHeartbeat(true);

    // Ping every 40 seconds while document is active
    const heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        emitHeartbeat(true);
      }
    }, 40000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        emitHeartbeat(true);
      } else {
        emitHeartbeat(false);
      }
    };

    const onBeforeUnload = () => {
      emitHeartbeat(false);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('beforeunload', onBeforeUnload);
      emitHeartbeat(false);
    };
  }, []);

  // 2. REAL-TIME FIRESTORE SUBSCRIPTION
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsub = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: UserRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const email = (data.email || '').trim();
          const isAdminRole =
            (data.role || '').toLowerCase() === 'admin' ||
            (email.length > 0 && email.toLowerCase() === currentAdminEmail.toLowerCase());

          list.push({
            id: docSnap.id,
            email: email || 'No email',
            displayName: data.displayName || data.name || (email ? email.split('@')[0] : 'User'),
            photoURL: data.photoURL || data.avatar,
            role: isAdminRole ? 'admin' : 'user',
            isPremium: Boolean(data.isPremium || data.plan === 'premium' || data.plan === 'ultra' || data.plan === 'ultra_premium'),
            plan: data.plan || (data.isPremium ? 'premium' : 'free'),
            isBanned: Boolean(data.isBanned),
            createdAt: data.createdAt,
            lastLoginAt: data.lastLoginAt,
            lastActiveAt: data.lastActiveAt,
            lastActivityAt: data.lastActivityAt,
            lastSeenAt: data.lastSeenAt,
            lastHeartbeatAt: data.lastHeartbeatAt,
            isOnline: data.isOnline,
            presence: data.presence,
            activityHistory: Array.isArray(data.activityHistory) ? data.activityHistory : [],
            updatedAt: data.updatedAt,
            subscriptionExpiresAt: data.subscriptionExpiresAt,
          });
        });

        // Ensure default fallback if directory is newly initialized
        if (list.length === 0) {
          list.push({
            id: 'admin-sahil',
            email: currentAdminEmail,
            displayName: 'Admin Sahil',
            role: 'admin',
            isPremium: true,
            plan: 'ultra',
            isBanned: false,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
            lastHeartbeatAt: new Date().toISOString(),
            isOnline: true,
          });
        }

        setUsers(list);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('UserManagement realtime sync note:', err);
        setError(err.message || 'Failed to sync with real-time users collection.');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentAdminEmail, retryTrigger]);

  // Copy UID helper
  const handleCopyUid = (uid: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    showToast('UID Copied', 'Firebase UID copied to clipboard.', 'success');
    setTimeout(() => {
      setCopiedUid((prev) => (prev === uid ? null : prev));
    }, 2000);
  };

  // Toggle Premium Status
  const handleTogglePremium = async (user: UserRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setUpdatingId(user.id);
    const newIsPremium = !user.isPremium;
    const newPlan = newIsPremium ? 'premium' : 'free';

    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        isPremium: newIsPremium,
        plan: newPlan,
        updatedAt: new Date().toISOString(),
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isPremium: newIsPremium, plan: newPlan } : u))
      );

      if (inspectUser?.id === user.id) {
        setInspectUser((prev) => (prev ? { ...prev, isPremium: newIsPremium, plan: newPlan } : null));
      }

      showToast(
        newIsPremium ? '✓ Premium Granted' : 'Premium Revoked',
        `${user.displayName || user.email} is now ${newIsPremium ? 'a Premium member' : 'a Free member'}.`,
        'success'
      );
    } catch (err: any) {
      console.error('Failed to update premium status:', err);
      showToast('Action Failed', err.message || 'Could not update user record.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle Ban Status
  const handleToggleBan = async (user: UserRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (user.role === 'admin' || user.email.toLowerCase() === currentAdminEmail.toLowerCase()) {
      showToast('Action Forbidden', 'Super Admin accounts cannot be banned.', 'error');
      return;
    }

    setUpdatingId(user.id);
    const newIsBanned = !user.isBanned;

    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        isBanned: newIsBanned,
        updatedAt: new Date().toISOString(),
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isBanned: newIsBanned } : u))
      );

      if (inspectUser?.id === user.id) {
        setInspectUser((prev) => (prev ? { ...prev, isBanned: newIsBanned } : null));
      }

      showToast(
        newIsBanned ? 'User Banned' : '✓ User Unbanned',
        `${user.displayName || user.email} account has been ${newIsBanned ? 'banned' : 'unbanned'}.`,
        newIsBanned ? 'error' : 'success'
      );
    } catch (err: any) {
      console.error('Failed to toggle ban status:', err);
      showToast('Action Failed', err.message || 'Could not update user record.', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // 3. REAL SUMMARY METRICS
  const metrics = useMemo(() => {
    let onlineCount = 0;
    let activeTodayCount = 0;
    let active7dCount = 0;
    let active30dCount = 0;
    let active12mCount = 0;
    let inactiveCount = 0;
    let premiumCount = 0;
    let bannedCount = 0;

    users.forEach((u) => {
      const act = getComprehensiveUserActivity(u);

      if (act.isOnline) onlineCount++;
      if (act.activeInToday) activeTodayCount++;
      if (act.activeIn7Days) active7dCount++;
      if (act.activeIn30Days) active30dCount++;
      if (act.activeIn12Months) active12mCount++;

      if (u.isBanned) {
        bannedCount++;
      } else if (act.status === 'inactive') {
        inactiveCount++;
      }

      if (u.isPremium || u.plan === 'premium' || u.plan === 'ultra' || u.plan === 'ultra_premium') {
        premiumCount++;
      }
    });

    return {
      total: users.length,
      online: onlineCount,
      activeToday: activeTodayCount,
      active7d: active7dCount,
      active30d: active30dCount,
      active12m: active12mCount,
      inactive: inactiveCount,
      premium: premiumCount,
      banned: bannedCount,
    };
  }, [users]);

  // 4. FILTERED USERS (Search + Status Filter + Activity Period Filter)
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return users.filter((u) => {
      // A. Text Search (Name, Email, Firebase UID)
      const matchesSearch =
        q.length === 0 ||
        (u.displayName && u.displayName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        u.id.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const act = getComprehensiveUserActivity(u);

      // B. Status Filter
      if (statusFilter === 'online' && !act.isOnline) return false;
      if (statusFilter === 'premium' && !(u.isPremium || u.plan === 'premium' || u.plan === 'ultra' || u.plan === 'ultra_premium')) return false;
      if (statusFilter === 'banned' && !u.isBanned) return false;
      if (statusFilter === 'active' && (u.isBanned || act.status !== 'active')) return false;
      if (statusFilter === 'inactive' && (u.isBanned || act.status !== 'inactive')) return false;

      // C. Activity Period Filter
      if (activityPeriodFilter === 'today' && !act.activeInToday) return false;
      if (activityPeriodFilter === '7d' && !act.activeIn7Days) return false;
      if (activityPeriodFilter === '30d' && !act.activeIn30Days) return false;
      if (activityPeriodFilter === '12m' && !act.activeIn12Months) return false;

      return true;
    });
  }, [users, searchQuery, statusFilter, activityPeriodFilter]);

  // 5. 12-MONTH CALENDAR ACTIVITY BREAKDOWN (REAL DATA ONLY)
  const monthlyBreakdown = useMemo(() => {
    const now = new Date();
    const months: Array<{
      key: string;
      label: string;
      year: number;
      monthIndex: number;
      activeCount: number;
      percentage: number;
    }> = [];

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIndex = d.getMonth();
      const monthLabel = d.toLocaleString('default', { month: 'long', year: 'numeric' });

      // Start & end of this month
      const startMs = new Date(year, monthIndex, 1).getTime();
      const endMs = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999).getTime();

      // Count distinct users who had real activity in this month
      const activeInMonth = users.filter((u) => {
        const { timestamp } = getUserRealActivityTimestamp(u);
        if (!timestamp) return false;
        const tMs = new Date(timestamp).getTime();
        return tMs >= startMs && tMs <= endMs;
      }).length;

      months.push({
        key: `${year}-${monthIndex}`,
        label: monthLabel,
        year,
        monthIndex,
        activeCount: activeInMonth,
        percentage: users.length > 0 ? Math.round((activeInMonth / users.length) * 100) : 0,
      });
    }

    return months;
  }, [users]);

  // Extract structured chronological activity history for a specific user
  const getUserChronologicalEvents = useCallback((user: UserRecord) => {
    const events: Array<{
      id: string;
      label: string;
      type: string;
      timestamp: string;
      timeMs: number;
    }> = [];

    // Include lastLoginAt if present
    if (user.lastLoginAt) {
      events.push({
        id: `login-${user.lastLoginAt}`,
        label: 'Account Login',
        type: 'login',
        timestamp: user.lastLoginAt,
        timeMs: new Date(user.lastLoginAt).getTime(),
      });
    }

    // Include lastActivityAt if different from login
    if (user.lastActivityAt && user.lastActivityAt !== user.lastLoginAt) {
      events.push({
        id: `activity-${user.lastActivityAt}`,
        label: 'User Interaction',
        type: 'activity',
        timestamp: user.lastActivityAt,
        timeMs: new Date(user.lastActivityAt).getTime(),
      });
    }

    // Include explicit activityHistory events from Firestore
    if (user.activityHistory && Array.isArray(user.activityHistory)) {
      user.activityHistory.forEach((ev, idx) => {
        if (ev.timestamp) {
          events.push({
            id: ev.id || `ev-${idx}-${ev.timestamp}`,
            label: ev.label || 'Action performed',
            type: ev.type || 'action',
            timestamp: ev.timestamp,
            timeMs: new Date(ev.timestamp).getTime(),
          });
        }
      });
    }

    // Sort descending by timestamp
    events.sort((a, b) => b.timeMs - a.timeMs);

    // Group into Today, 7 Days, 30 Days, 12 Months
    const now = Date.now();
    const todayEvents: typeof events = [];
    const sevenDaysEvents: typeof events = [];
    const thirtyDaysEvents: typeof events = [];
    const twelveMonthsEvents: typeof events = [];

    events.forEach((ev) => {
      const diffMs = now - ev.timeMs;
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

      if (diffDays <= 0 || diffMs < 24 * 60 * 60 * 1000) {
        todayEvents.push(ev);
      } else if (diffDays <= 7) {
        sevenDaysEvents.push(ev);
      } else if (diffDays <= 30) {
        thirtyDaysEvents.push(ev);
      } else if (diffDays <= 365) {
        twelveMonthsEvents.push(ev);
      }
    });

    return {
      totalEventsCount: events.length,
      today: todayEvents,
      sevenDays: sevenDaysEvents,
      thirtyDays: thirtyDaysEvents,
      twelveMonths: twelveMonthsEvents,
    };
  }, []);

  // Render Plan Badge
  const renderPlanBadge = (u: UserRecord) => {
    const planNormalized = (u.plan || (u.isPremium ? 'premium' : 'free')).toLowerCase();

    if (planNormalized === 'ultra' || planNormalized === 'ultra_premium') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/30">
          <Sparkles className="w-3 h-3 text-purple-400" />
          ULTRA PREMIUM
        </span>
      );
    }

    if (u.isPremium || planNormalized === 'premium') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <Crown className="w-3 h-3 text-amber-400" />
          PREMIUM
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 border border-zinc-700/60">
        FREE
      </span>
    );
  };

  // Render Role Badge
  const renderRoleBadge = (u: UserRecord) => {
    if (u.role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-sm shadow-indigo-500/10">
          <ShieldCheck className="w-3 h-3 text-indigo-400" />
          ADMIN
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-zinc-800/80 text-zinc-400 border border-zinc-700/40">
        <Shield className="w-3 h-3 text-zinc-500" />
        USER
      </span>
    );
  };

  // Render Activity Status Badge
  const renderActivityStatusBadge = (u: UserRecord) => {
    if (u.isBanned) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <Ban className="w-3 h-3" />
          Banned
        </span>
      );
    }

    const act = getComprehensiveUserActivity(u);

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${act.statusBadge.bgColor} ${act.statusBadge.textColor} ${act.statusBadge.borderColor}`}
        title={act.exactTimestamp ? `Timestamp: ${new Date(act.exactTimestamp).toLocaleString()}` : 'No timestamp'}
      >
        <span className={`w-2 h-2 rounded-full ${act.statusBadge.dotColor}`} />
        <span>{act.statusBadge.label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 font-sans">
      {/* 1. HEADER TITLE BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>User Management & Activity History</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time Firebase user directory with verified presence heartbeat, activity timelines, and 12-month analytics.
              </p>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMonthlyAnalytics((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showMonthlyAnalytics
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20'
                : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
            }`}
            title="Toggle 12-Month Activity Breakdown"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">12-Month Analytics</span>
          </button>

          <button
            onClick={() => setRetryTrigger((prev) => prev + 1)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Real-time User Directory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. TOP SUMMARY CARDS (Real Firebase Data Only) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Users */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('all');
            setActivityPeriodFilter('all');
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer group relative overflow-hidden ${
            statusFilter === 'all' && activityPeriodFilter === 'all'
              ? 'bg-zinc-900 border-indigo-500/50 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30'
              : 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Total Users</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {loading ? <div className="h-7 w-12 bg-zinc-800 rounded animate-pulse" /> : metrics.total.toLocaleString()}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 truncate">All accounts</p>
        </button>

        {/* Online Now */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('online');
            setActivityPeriodFilter('all');
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer group relative overflow-hidden ${
            statusFilter === 'online'
              ? 'bg-zinc-900 border-emerald-500/60 shadow-lg shadow-emerald-500/15 ring-1 ring-emerald-500/40'
              : 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Online Now</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight flex items-center gap-1.5">
            {loading ? <div className="h-7 w-12 bg-zinc-800 rounded animate-pulse" /> : metrics.online.toLocaleString()}
          </div>
          <p className="text-[10px] text-emerald-500/80 mt-1 truncate">Verified heartbeat</p>
        </button>

        {/* Active Users (30 Days) */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('active');
            setActivityPeriodFilter('30d');
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer group relative overflow-hidden ${
            statusFilter === 'active' && activityPeriodFilter === '30d'
              ? 'bg-zinc-900 border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
              : 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Active (30d)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {loading ? <div className="h-7 w-12 bg-zinc-800 rounded animate-pulse" /> : metrics.active30d.toLocaleString()}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 truncate">Active &le;30 days</p>
        </button>

        {/* Inactive Users (30+ Days) */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('inactive');
            setActivityPeriodFilter('all');
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer group relative overflow-hidden ${
            statusFilter === 'inactive'
              ? 'bg-zinc-900 border-zinc-500/50 shadow-lg shadow-zinc-500/10 ring-1 ring-zinc-500/30'
              : 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Inactive</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700/50 flex items-center justify-center shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-zinc-300 tracking-tight">
            {loading ? <div className="h-7 w-12 bg-zinc-800 rounded animate-pulse" /> : metrics.inactive.toLocaleString()}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 truncate">&gt;30 days or no activity</p>
        </button>

        {/* Premium Users */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('premium');
            setActivityPeriodFilter('all');
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer group relative overflow-hidden ${
            statusFilter === 'premium'
              ? 'bg-zinc-900 border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
              : 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Premium</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Crown className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
            {loading ? <div className="h-7 w-12 bg-zinc-800 rounded animate-pulse" /> : metrics.premium.toLocaleString()}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 truncate">Subscribed tiers</p>
        </button>

        {/* Banned Users */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('banned');
            setActivityPeriodFilter('all');
          }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer group relative overflow-hidden ${
            statusFilter === 'banned'
              ? 'bg-zinc-900 border-rose-500/50 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/30'
              : 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">Banned</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
              <Ban className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
            {loading ? <div className="h-7 w-12 bg-zinc-800 rounded animate-pulse" /> : metrics.banned.toLocaleString()}
          </div>
          <p className="text-[10px] text-zinc-500 mt-1 truncate">Restricted</p>
        </button>
      </div>

      {/* 3. 12-MONTH ACTIVITY VIEW SECTION (Real Data Only) */}
      {showMonthlyAnalytics && (
        <div className="p-5 rounded-3xl bg-zinc-900/90 border border-indigo-500/30 shadow-2xl space-y-4 animate-scale-up">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">12-Month Real Activity History</h3>
                <p className="text-[11px] text-zinc-400">
                  Calculated purely from real recorded activity and login timestamps across registered accounts.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowMonthlyAnalytics(false)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {monthlyBreakdown.map((m) => (
              <div
                key={m.key}
                className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between gap-3 hover:border-indigo-500/30 transition-all"
              >
                <div>
                  <h4 className="font-bold text-white text-xs">{m.label}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span className="text-[11px] font-semibold text-zinc-300">
                      • {m.activeCount} active {m.activeCount === 1 ? 'user' : 'users'}
                    </span>
                  </div>
                </div>

                <div className="w-16 text-right">
                  <div className="text-[10px] text-zinc-500 font-mono mb-1">{m.percentage}%</div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(m.percentage, m.activeCount > 0 ? 8 : 0))}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SEARCH + DUAL FILTER TOOLBAR (Status Filters + Activity Period Filters) */}
      <div className="bg-zinc-900/80 p-4 rounded-3xl border border-zinc-800 shadow-sm space-y-3.5">
        {/* Top Row: Search Input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Name, Email, or Firebase UID..."
            className="w-full bg-zinc-950/90 border border-zinc-800 focus:border-indigo-500/80 rounded-2xl pl-10 pr-9 py-2.5 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 rounded-md cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Middle Row: Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mr-1 hidden sm:inline">
              Status:
            </span>
            {(
              [
                { key: 'all', label: 'All', count: metrics.total },
                { key: 'online', label: '🟢 Online Now', count: metrics.online },
                { key: 'active', label: 'Active', count: metrics.active30d },
                { key: 'inactive', label: 'Inactive', count: metrics.inactive },
                { key: 'premium', label: 'Premium', count: metrics.premium },
                { key: 'banned', label: 'Banned', count: metrics.banned },
              ] as const
            ).map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-zinc-950/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/80'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Activity Period Filters: [ Today ] [ 7 Days ] [ 30 Days ] [ 12 Months ] [ All Activity ] */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mr-1 hidden md:inline">
              Period:
            </span>
            {(
              [
                { key: 'today', label: 'Today', count: metrics.activeToday },
                { key: '7d', label: '7 Days', count: metrics.active7d },
                { key: '30d', label: '30 Days', count: metrics.active30d },
                { key: '12m', label: '12 Months', count: metrics.active12m },
                { key: 'all', label: 'All Activity', count: metrics.total },
              ] as const
            ).map((p) => {
              const isActive = activityPeriodFilter === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setActivityPeriodFilter(p.key)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-zinc-950/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/80'
                  }`}
                  title={`Filter users active in ${p.label}`}
                >
                  <span>{p.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {p.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. FILTER & RESULT INFO BAR */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <span>
          Showing <strong className="text-white">{filteredUsers.length}</strong> of{' '}
          <strong className="text-white">{users.length}</strong> total registered accounts
        </span>
        {(searchQuery || statusFilter !== 'all' || activityPeriodFilter !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setActivityPeriodFilter('all');
            }}
            className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>Reset all filters</span>
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 6. CONTENT STATES: LOADING / ERROR / EMPTY / USER DIRECTORY */}
      {loading ? (
        /* PREMIUM SKELETON LOADERS */
        <div className="space-y-3">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-4 animate-pulse"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-zinc-800 shrink-0" />
                <div className="space-y-2 flex-1 max-w-xs">
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-850 rounded w-1/2" />
                </div>
              </div>
              <div className="hidden sm:block w-24 h-5 bg-zinc-800 rounded-full" />
              <div className="hidden md:block w-28 h-5 bg-zinc-800 rounded-full" />
              <div className="w-20 h-8 bg-zinc-800 rounded-xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        /* ERROR STATE WITH RETRY */
        <div className="p-8 rounded-3xl bg-rose-500/5 border border-rose-500/20 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto shadow-md">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Firestore Directory Sync Error</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">{error}</p>
          </div>
          <button
            onClick={() => setRetryTrigger((prev) => prev + 1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>
        </div>
      ) : filteredUsers.length === 0 ? (
        /* EMPTY STATE */
        <div className="py-16 text-center space-y-4 bg-zinc-900/40 rounded-3xl border border-zinc-800/80 p-8">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 text-zinc-500 flex items-center justify-center mx-auto">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {searchQuery || statusFilter !== 'all' || activityPeriodFilter !== 'all'
                ? 'No users found for this filter'
                : 'No users registered yet'}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all' || activityPeriodFilter !== 'all'
                ? 'No registered user accounts match your search query or selected activity criteria.'
                : 'As visitors register via Firebase Authentication, they will appear here in real-time.'}
            </p>
          </div>
          {(searchQuery || statusFilter !== 'all' || activityPeriodFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setActivityPeriodFilter('all');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <span>Reset all filters</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ============================================================ */}
          {/* DESKTOP TABLE VIEW (Shown on md: and larger screens)        */}
          {/* ============================================================ */}
          <div className="hidden md:block bg-zinc-900/80 rounded-3xl border border-zinc-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950/90 border-b border-zinc-800 text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                    <th className="p-4 pl-6">User Profile</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Plan</th>
                    <th className="p-4">Activity Status</th>
                    <th className="p-4">Last Active</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 text-xs font-medium">
                  {filteredUsers.map((user) => {
                    const isAdminUser = user.role === 'admin';
                    const isUpdating = updatingId === user.id;
                    const act = getComprehensiveUserActivity(user);

                    return (
                      <tr
                        key={user.id}
                        onClick={() => setInspectUser(user)}
                        className="hover:bg-zinc-850/60 transition-colors cursor-pointer group"
                      >
                        {/* 1. Avatar + Name + UID */}
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              {user.photoURL ? (
                                <img
                                  src={user.photoURL}
                                  alt={user.displayName || 'User'}
                                  className="w-10 h-10 rounded-full object-cover ring-2 ring-zinc-800"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold text-xs ring-2 ring-zinc-800">
                                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                                </div>
                              )}
                              {act.isOnline && (
                                <span
                                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-zinc-900 animate-pulse"
                                  title="Verified Online Now"
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white flex items-center gap-1.5 truncate">
                                <span>{user.displayName || 'User'}</span>
                                {isAdminUser && (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-black border border-indigo-500/30">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <div
                                onClick={(e) => handleCopyUid(user.id, e)}
                                className="inline-flex items-center gap-1 text-[10px] text-zinc-500 font-mono hover:text-indigo-400 mt-0.5 cursor-pointer group/uid"
                                title="Click to copy Firebase UID"
                              >
                                <span>UID: {user.id.slice(0, 10)}...</span>
                                {copiedUid === user.id ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3 opacity-0 group-hover/uid:opacity-100 transition-opacity" />
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Email */}
                        <td className="p-4 text-zinc-300 font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="truncate max-w-[180px]">{user.email}</span>
                          </div>
                        </td>

                        {/* 3. Role */}
                        <td className="p-4">{renderRoleBadge(user)}</td>

                        {/* 4. Plan */}
                        <td className="p-4">{renderPlanBadge(user)}</td>

                        {/* 5. Current Activity Status */}
                        <td className="p-4">{renderActivityStatusBadge(user)}</td>

                        {/* 6. Last Active Relative & Exact */}
                        <td className="p-4 text-zinc-400 text-xs">
                          <div
                            className="flex items-center gap-1.5"
                            title={act.exactTimestamp ? new Date(act.exactTimestamp).toLocaleString() : 'No timestamp'}
                          >
                            <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span
                              className={
                                act.isOnline
                                  ? 'text-emerald-300 font-bold'
                                  : act.activeInToday
                                  ? 'text-emerald-400 font-medium'
                                  : 'text-zinc-400'
                              }
                            >
                              {act.relativeText}
                            </span>
                          </div>
                        </td>

                        {/* 7. Actions */}
                        <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            {/* Toggle Premium */}
                            <button
                              onClick={(e) => handleTogglePremium(user, e)}
                              disabled={isUpdating}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                user.isPremium
                                  ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/30'
                                  : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border-zinc-700/60'
                              }`}
                              title={user.isPremium ? 'Revoke Premium membership' : 'Grant Premium membership'}
                            >
                              {user.isPremium ? 'Revoke' : 'Premium'}
                            </button>

                            {/* Ban / Unban Button */}
                            {!isAdminUser && (
                              <button
                                onClick={(e) => handleToggleBan(user, e)}
                                disabled={isUpdating}
                                className={`p-1.5 rounded-xl transition-all cursor-pointer border ${
                                  user.isBanned
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/25 hover:bg-rose-500/20'
                                }`}
                                title={user.isBanned ? 'Unban User' : 'Ban User'}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}

                            {/* View Activity Details */}
                            <button
                              onClick={() => setInspectUser(user)}
                              className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 transition-all cursor-pointer inline-flex items-center gap-1"
                              title="Inspect Activity Timeline & Account Metadata"
                            >
                              <History className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="hidden lg:inline">Activity</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ============================================================ */}
          {/* MOBILE CARDS VIEW (Shown on small screens < md)              */}
          {/* ============================================================ */}
          <div className="block md:hidden space-y-3">
            {filteredUsers.map((user) => {
              const isAdminUser = user.role === 'admin';
              const isUpdating = updatingId === user.id;
              const act = getComprehensiveUserActivity(user);

              return (
                <div
                  key={user.id}
                  className="bg-zinc-900/85 p-4 rounded-2xl border border-zinc-800 shadow-sm space-y-3"
                >
                  {/* Top Row: Avatar + Name + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName || 'User'}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-zinc-800"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold text-xs ring-2 ring-zinc-800">
                            {(user.displayName || user.email || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        {act.isOnline && (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-zinc-900 animate-pulse"
                            title="Verified Online Now"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-sm truncate flex items-center gap-1.5">
                          <span>{user.displayName || 'User'}</span>
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {renderRoleBadge(user)}
                          {renderPlanBadge(user)}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">{renderActivityStatusBadge(user)}</div>
                  </div>

                  {/* Middle: Details Card */}
                  <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-850 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-[11px] text-zinc-500 font-medium">Email:</span>
                      <span className="font-mono text-[11px] truncate max-w-[200px]">{user.email}</span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-[11px] text-zinc-500 font-medium">Last Active:</span>
                      <span
                        className={`text-[11px] font-semibold ${
                          act.isOnline
                            ? 'text-emerald-300'
                            : act.activeInToday
                            ? 'text-emerald-400'
                            : 'text-zinc-400'
                        }`}
                      >
                        {act.relativeText}
                      </span>
                    </div>

                    {user.lastLoginAt && (
                      <div className="flex items-center justify-between text-zinc-300">
                        <span className="text-[11px] text-zinc-500 font-medium">Last Login:</span>
                        <span className="text-[11px] text-zinc-400">
                          {new Date(user.lastLoginAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-zinc-300 pt-1 border-t border-zinc-850">
                      <span className="text-[11px] text-zinc-500 font-medium">Firebase UID:</span>
                      <button
                        onClick={() => handleCopyUid(user.id)}
                        className="inline-flex items-center gap-1 font-mono text-[10px] text-indigo-400 hover:underline cursor-pointer"
                      >
                        <span>{user.id.slice(0, 12)}...</span>
                        {copiedUid === user.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* Bottom Action Bar with >= 44px touch targets */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleTogglePremium(user)}
                      disabled={isUpdating}
                      className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                        user.isPremium
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-zinc-800 text-zinc-200 hover:text-white border-zinc-700'
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>{user.isPremium ? 'Revoke Premium' : 'Grant Premium'}</span>
                    </button>

                    <button
                      onClick={() => setInspectUser(user)}
                      className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Activity Details</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 7. USER ACTIVITY DETAILS & TIMELINE MODAL */}
      {inspectUser && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setInspectUser(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {inspectUser.photoURL ? (
                    <img
                      src={inspectUser.photoURL}
                      alt={inspectUser.displayName || 'User'}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold text-sm ring-2 ring-indigo-500/30">
                      {(inspectUser.displayName || inspectUser.email || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  {isUserVerifiedOnline(inspectUser) && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-zinc-900 animate-pulse"
                      title="Verified Online Now"
                    />
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                    <span>{inspectUser.displayName || 'User'}</span>
                    {renderRoleBadge(inspectUser)}
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">{inspectUser.email}</p>
                </div>
              </div>

              <button
                onClick={() => setInspectUser(null)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Activity Status Banner */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-zinc-300">Live Activity Status:</span>
              </div>
              <div>{renderActivityStatusBadge(inspectUser)}</div>
            </div>

            {/* Metadata Info Cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">
                  Subscription Tier
                </span>
                <div>{renderPlanBadge(inspectUser)}</div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">
                  Firebase UID
                </span>
                <button
                  onClick={() => handleCopyUid(inspectUser.id)}
                  className="font-mono text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 cursor-pointer truncate max-w-full"
                >
                  <span className="truncate">{inspectUser.id.slice(0, 14)}...</span>
                  {copiedUid === inspectUser.id ? (
                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <Copy className="w-3 h-3 shrink-0" />
                  )}
                </button>
              </div>
            </div>

            {/* Exact Timestamps */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Account Registered:</span>
                </span>
                <span className="text-white font-medium">
                  {inspectUser.createdAt
                    ? new Date(inspectUser.createdAt).toLocaleString()
                    : 'Not recorded'}
                </span>
              </div>

              <div className="flex items-center justify-between text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Last Login:</span>
                </span>
                <span className="text-white font-medium">
                  {inspectUser.lastLoginAt
                    ? new Date(inspectUser.lastLoginAt).toLocaleString()
                    : 'No login recorded'}
                </span>
              </div>

              <div className="flex items-center justify-between text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Latest Activity Timestamp:</span>
                </span>
                <span className="text-white font-medium">
                  {getUserRealActivityTimestamp(inspectUser).timestamp
                    ? new Date(getUserRealActivityTimestamp(inspectUser).timestamp!).toLocaleString()
                    : 'Activity data unavailable'}
                </span>
              </div>
            </div>

            {/* Activity History Timeline (Today, 7 Days, 30 Days, 12 Months) */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Chronological Activity Timeline</span>
                </h4>
                <span className="text-[10px] text-zinc-500 font-medium">Real records only</span>
              </div>

              {(() => {
                const chronological = getUserChronologicalEvents(inspectUser);

                return (
                  <div className="space-y-3">
                    {/* Today */}
                    <div className="p-3 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
                        <span className="text-emerald-400">Today</span>
                        <span className="text-zinc-500 text-[10px]">{chronological.today.length} recorded</span>
                      </div>
                      {chronological.today.length > 0 ? (
                        <div className="space-y-1 pt-1">
                          {chronological.today.map((ev) => (
                            <div key={ev.id} className="flex items-center justify-between text-xs text-zinc-300">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>{ev.label}</span>
                              </span>
                              <span className="text-zinc-500 font-mono text-[10px]">
                                {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-500 italic">Historical activity data unavailable</p>
                      )}
                    </div>

                    {/* 7 Days */}
                    <div className="p-3 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
                        <span>Last 7 Days</span>
                        <span className="text-zinc-500 text-[10px]">{chronological.sevenDays.length} recorded</span>
                      </div>
                      {chronological.sevenDays.length > 0 ? (
                        <div className="space-y-1 pt-1">
                          {chronological.sevenDays.map((ev) => (
                            <div key={ev.id} className="flex items-center justify-between text-xs text-zinc-300">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                                <span>{ev.label}</span>
                              </span>
                              <span className="text-zinc-500 font-mono text-[10px]">
                                {new Date(ev.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-500 italic">Historical activity data unavailable</p>
                      )}
                    </div>

                    {/* 30 Days */}
                    <div className="p-3 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
                        <span>Last 30 Days</span>
                        <span className="text-zinc-500 text-[10px]">{chronological.thirtyDays.length} recorded</span>
                      </div>
                      {chronological.thirtyDays.length > 0 ? (
                        <div className="space-y-1 pt-1">
                          {chronological.thirtyDays.map((ev) => (
                            <div key={ev.id} className="flex items-center justify-between text-xs text-zinc-300">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                                <span>{ev.label}</span>
                              </span>
                              <span className="text-zinc-500 font-mono text-[10px]">
                                {new Date(ev.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-500 italic">Historical activity data unavailable</p>
                      )}
                    </div>

                    {/* 12 Months */}
                    <div className="p-3 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400">
                        <span>Last 12 Months</span>
                        <span className="text-zinc-500 text-[10px]">{chronological.twelveMonths.length} recorded</span>
                      </div>
                      {chronological.twelveMonths.length > 0 ? (
                        <div className="space-y-1 pt-1">
                          {chronological.twelveMonths.map((ev) => (
                            <div key={ev.id} className="flex items-center justify-between text-xs text-zinc-300">
                              <span className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                <span>{ev.label}</span>
                              </span>
                              <span className="text-zinc-500 font-mono text-[10px]">
                                {new Date(ev.timestamp).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-500 italic">Historical activity data unavailable</p>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => handleTogglePremium(inspectUser)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  inspectUser.isPremium
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                {inspectUser.isPremium ? 'Revoke Premium' : 'Grant Premium'}
              </button>

              {inspectUser.role !== 'admin' && (
                <button
                  onClick={() => handleToggleBan(inspectUser)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    inspectUser.isBanned
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {inspectUser.isBanned ? 'Unban Account' : 'Ban Account'}
                </button>
              )}

              <button
                onClick={() => setInspectUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

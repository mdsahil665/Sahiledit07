import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { promptStore } from '../../services/promptStore';
import { PromptPost, Category, AdminStats, RecentActivity, CommentItem } from '../../types';
import { AdminTab } from './AdminSidebar';
import { DashboardUserRecord } from './dashboard/types';

// Modular Dashboard Subcomponents
import { DashboardHeader } from './dashboard/DashboardHeader';
import { UserOverviewCards } from './dashboard/UserOverviewCards';
import { MembershipCards } from './dashboard/MembershipCards';
import { WebsiteOverviewGrid } from './dashboard/WebsiteOverviewGrid';
import { WebsiteAnalyticsChart } from './dashboard/WebsiteAnalyticsChart';
import { UserDistributionDonut } from './dashboard/UserDistributionDonut';
import { PremiumPerformanceSummary } from './dashboard/PremiumPerformanceSummary';
import { RecentUsersList } from './dashboard/RecentUsersList';
import { RecentPostsList } from './dashboard/RecentPostsList';
import { QuickActionsBar } from './dashboard/QuickActionsBar';
import { SystemHealthWidget } from './dashboard/SystemHealthWidget';

interface DashboardOverviewProps {
  posts: PromptPost[];
  categories: Category[];
  stats: AdminStats;
  activities: RecentActivity[];
  onSelectTab: (tab: AdminTab) => void;
  onOpenAddPost: () => void;
  onAddVideoPrompt?: () => void;
  registeredUsersCount?: number;
  premiumUsersCount?: number;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  posts,
  categories,
  stats,
  activities,
  onSelectTab,
  onOpenAddPost,
  onAddVideoPrompt,
  registeredUsersCount = 1,
  premiumUsersCount = 1,
}) => {
  const [users, setUsers] = useState<DashboardUserRecord[]>([]);
  const [comments, setComments] = useState<CommentItem[]>(promptStore.getComments());

  // Real-time Firestore sync for Registered Users
  useEffect(() => {
    let unsubscribeUsers: (() => void) | undefined;
    let unsubscribeComments: (() => void) | undefined;

    try {
      // Listen to users collection in real-time
      const usersRef = collection(db, 'users');
      unsubscribeUsers = onSnapshot(
        usersRef,
        (snapshot) => {
          const loadedUsers: DashboardUserRecord[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<DashboardUserRecord, 'id'>),
          }));

          if (loadedUsers.length > 0) {
            setUsers(loadedUsers);
          } else {
            // If empty in fresh DB, initialize with primary admin profile
            setUsers([
              {
                id: 'admin_sahil',
                email: 'mdsahil012002@gmail.com',
                displayName: 'Sahil',
                role: 'admin',
                isPremium: true,
                plan: 'ultra',
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
              },
            ]);
          }
        },
        (err) => {
          console.warn('Dashboard users sync error or permission check:', err);
          // Fallback with primary account so UI never breaks
          setUsers([
            {
              id: 'admin_sahil',
              email: 'mdsahil012002@gmail.com',
              displayName: 'Sahil',
              role: 'admin',
              isPremium: true,
              plan: 'ultra',
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      );
    } catch (e) {
      console.warn('Firestore initialization fallback:', e);
    }

    try {
      // Listen to comments collection in real-time
      const commentsRef = collection(db, 'comments');
      unsubscribeComments = onSnapshot(
        commentsRef,
        (snapshot) => {
          const loadedComments = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<CommentItem, 'id'>),
          }));
          setComments(loadedComments);
        },
        () => {
          // Fallback to cache from promptStore
          setComments(promptStore.getComments());
        }
      );
    } catch {
      setComments(promptStore.getComments());
    }

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeComments) unsubscribeComments();
    };
  }, []);

  // Compute total views from actual posts
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* 1. TOP HEADER */}
      <DashboardHeader />

      {/* 2. MAIN USER OVERVIEW */}
      <UserOverviewCards
        users={users}
        totalViews={totalViews}
        onSelectTab={onSelectTab}
      />

      {/* 3. MEMBERSHIP OVERVIEW */}
      <MembershipCards
        users={users}
        onSelectTab={onSelectTab}
      />

      {/* 4. WEBSITE OVERVIEW */}
      <WebsiteOverviewGrid
        posts={posts}
        comments={comments}
        onSelectTab={onSelectTab}
      />

      {/* 5. WEBSITE ANALYTICS (Performance Chart) */}
      <WebsiteAnalyticsChart
        users={users}
        posts={posts}
        totalViews={totalViews}
      />

      {/* 6. USER DISTRIBUTION & 7. PREMIUM PERFORMANCE SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserDistributionDonut users={users} />
        <PremiumPerformanceSummary users={users} onSelectTab={onSelectTab} />
      </div>

      {/* 8. RECENT USERS & 9. RECENT POSTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentUsersList users={users} onSelectTab={onSelectTab} />
        <RecentPostsList posts={posts} onSelectTab={onSelectTab} />
      </div>

      {/* 10. QUICK ACTIONS */}
      <QuickActionsBar
        onOpenAddPost={onOpenAddPost}
        onAddVideoPrompt={onAddVideoPrompt}
        onSelectTab={onSelectTab}
      />

      {/* 11. SYSTEM / WEBSITE HEALTH */}
      <SystemHealthWidget />
    </div>
  );
};

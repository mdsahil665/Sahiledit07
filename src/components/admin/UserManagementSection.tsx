import React, { useState, useEffect } from 'react';
import { Users, Search, ShieldCheck, Crown, Ban, CheckCircle2, MoreVertical, Mail, Calendar, UserX, Loader2 } from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useToast } from '../Toast';

export interface UserRecord {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  isPremium?: boolean;
  isBanned?: boolean;
  createdAt?: string;
}

interface UserManagementSectionProps {
  currentAdminEmail?: string;
}

export const UserManagementSection: React.FC<UserManagementSectionProps> = ({ currentAdminEmail = 'mdsahil012002@gmail.com' }) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'premium' | 'active' | 'banned'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    // Realtime Firestore subscription for users collection
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: UserRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            email: data.email || 'No email',
            displayName: data.displayName || data.name || 'User',
            photoURL: data.photoURL || data.avatar,
            role: data.role || (data.email?.toLowerCase() === currentAdminEmail.toLowerCase() ? 'admin' : 'user'),
            isPremium: Boolean(data.isPremium),
            isBanned: Boolean(data.isBanned),
            createdAt: data.createdAt || new Date().toISOString(),
          });
        });

        // If collection is empty, ensure admin user is displayed cleanly
        if (list.length === 0) {
          list.push({
            id: 'admin-sahil',
            email: currentAdminEmail,
            displayName: 'Sahil',
            role: 'admin',
            isPremium: false,
            isBanned: false,
            createdAt: new Date().toISOString(),
          });
        }

        setUsers(list);
        setLoading(false);
      },
      (err) => {
        console.warn('UserManagement realtime sync note:', err);
        // Fallback default admin user record
        setUsers([
          {
            id: 'admin-sahil',
            email: currentAdminEmail,
            displayName: 'Sahil',
            role: 'admin',
            isPremium: false,
            isBanned: false,
            createdAt: new Date().toISOString(),
          },
        ]);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [currentAdminEmail]);

  const handleTogglePremium = async (user: UserRecord) => {
    setUpdatingId(user.id);
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        isPremium: !user.isPremium,
        updatedAt: new Date().toISOString(),
      });
      showToast(
        user.isPremium ? 'Premium Removed' : '✓ Premium Granted',
        `${user.displayName || user.email} is now ${!user.isPremium ? 'a Premium member' : 'a Free member'}.`
      );
    } catch (e: any) {
      showToast('Status Update Failed', e.message || 'Could not update user record', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleBan = async (user: UserRecord) => {
    if (user.role === 'admin') {
      showToast('Action Forbidden', 'Super Admin accounts cannot be banned.', 'error');
      return;
    }

    setUpdatingId(user.id);
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        isBanned: !user.isBanned,
        updatedAt: new Date().toISOString(),
      });
      showToast(
        user.isBanned ? 'User Unbanned' : 'User Banned',
        `${user.displayName || user.email} account has been ${!user.isBanned ? 'banned' : 'unbanned'}.`
      );
    } catch (e: any) {
      showToast('Ban Action Failed', e.message || 'Could not update user record', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      u.id.toLowerCase().includes(q);

    if (statusFilter === 'premium') return matchesSearch && u.isPremium;
    if (statusFilter === 'active') return matchesSearch && !u.isBanned;
    if (statusFilter === 'banned') return matchesSearch && u.isBanned;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Workspace Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <span>User Management & Tiers</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            View registered user accounts, manage Premium memberships, and handle user permissions in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
            {users.length} Total Registered Accounts
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/80 p-4 rounded-3xl border border-zinc-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name, email, or user ID..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2 text-xs font-semibold text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'premium', 'active', 'banned'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* User Table Desktop / Card List Mobile */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-xs font-bold text-zinc-400">Loading registered user profiles...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-zinc-900/50 rounded-3xl border border-zinc-800 p-8">
          <UserX className="w-10 h-10 text-zinc-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No users match your criteria</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Try adjusting your search query or status filter.
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                  <th className="p-4 pl-6">User Profile</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Subscription Status</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-xs font-medium">
                {filteredUsers.map((user) => {
                  const isAdminUser = user.role === 'admin';
                  const isUpdating = updatingId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-zinc-800/40 transition-colors">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.displayName || 'User'}
                              className="w-9 h-9 rounded-full object-cover ring-2 ring-zinc-800"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-extrabold text-xs ring-2 ring-zinc-800">
                              {(user.displayName || user.email || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{user.displayName || 'Sahil User'}</span>
                              {isAdminUser && (
                                <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 text-[9px] font-extrabold border border-blue-500/30">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">UID: {user.id.slice(0, 10)}...</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-zinc-300 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{user.email}</span>
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isAdminUser
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-zinc-800 text-zinc-400 border-zinc-700/50'
                          }`}
                        >
                          {user.role || 'Member'}
                        </span>
                      </td>

                      <td className="p-4">
                        {user.isBanned ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold flex items-center gap-1 w-max">
                            <Ban className="w-3 h-3" />
                            <span>BANNED</span>
                          </span>
                        ) : user.isPremium ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold flex items-center gap-1 w-max">
                            <Crown className="w-3 h-3" />
                            <span>PREMIUM MEMBER</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>FREE ACCOUNT</span>
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-zinc-400 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                      </td>

                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleTogglePremium(user)}
                            disabled={isUpdating}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              user.isPremium
                                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border-amber-500/30'
                                : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border-zinc-700/60'
                            }`}
                            title="Toggle Premium Membership"
                          >
                            {user.isPremium ? 'Revoke Premium' : 'Grant Premium'}
                          </button>

                          {!isAdminUser && (
                            <button
                              onClick={() => handleToggleBan(user)}
                              disabled={isUpdating}
                              className={`p-1.5 rounded-xl transition-all cursor-pointer border ${
                                user.isBanned
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'
                              }`}
                              title={user.isBanned ? 'Unban User' : 'Ban User'}
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

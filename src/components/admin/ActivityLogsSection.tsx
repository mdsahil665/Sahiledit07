import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Filter,
  Trash2,
  Download,
  Clock,
  Shield,
  Layers,
  Sparkles,
  Database,
  Key,
  FileText,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { RecentActivity } from '../../types';
import { promptStore } from '../../services/promptStore';
import { useToast } from '../Toast';

export const ActivityLogsSection: React.FC = () => {
  const [activities, setActivities] = useState<RecentActivity[]>(() => promptStore.getActivities());
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = promptStore.subscribe(() => {
      setActivities(promptStore.getActivities());
    });
    return unsub;
  }, []);

  const filteredActivities = activities.filter((act) => {
    const matchType = typeFilter === 'all' || act.type === typeFilter;
    const matchQuery =
      !searchQuery ||
      act.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchQuery;
  });

  const handleExportLogs = () => {
    const dataStr = JSON.stringify(activities, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sahil-edits-activity-logs-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Logs Exported', 'Activity logs downloaded as JSON.');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'create_post':
      case 'update_post':
      case 'delete_post':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'update_settings':
        return <Sliders className="w-4 h-4 text-emerald-400" />;
      case 'backup_restore':
        return <Database className="w-4 h-4 text-purple-400" />;
      case 'auth_login':
      case 'auth_logout':
        return <Key className="w-4 h-4 text-amber-400" />;
      default:
        return <Activity className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <span>Activity & Audit Trail Logs</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time chronological timeline of all admin modifications, prompt updates, backups, and security events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportLogs}
            className="px-4 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Logs (JSON)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity records..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'update_settings', 'create_post', 'update_post', 'backup_restore'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                typeFilter === t
                  ? 'bg-purple-600 text-white'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {t.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-zinc-900/90 rounded-3xl border border-zinc-800 overflow-hidden">
        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto">
              <Activity className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white">No Activity Logs Found</h4>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Actions will automatically record here as you manage prompts, adjust settings, or create backups.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                className="p-4 sm:p-5 hover:bg-zinc-800/30 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                    {getActivityIcon(act.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{act.message}</p>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                      {act.type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-mono text-zinc-400">
                    {new Date(act.timestamp).toLocaleDateString()}
                  </span>
                  <div className="text-[10px] font-mono text-zinc-500">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { Share2, Check, X, Shield, Sparkles, Power } from 'lucide-react';
import { FeatureControls } from '../../types';
import { promptStore } from '../../services/promptStore';
import { useToast } from '../Toast';

interface ShareSettingsControlProps {
  featureControls: FeatureControls;
}

export const ShareSettingsControl: React.FC<ShareSettingsControlProps> = ({ featureControls }) => {
  const { showToast } = useToast();

  const isMasterOn = featureControls.postShareEnabled !== false && featureControls.socialShareButtons !== false;

  const shareItems: { key: keyof FeatureControls; aliasKey?: keyof FeatureControls; label: string; iconBg: string; description: string }[] = [
    { key: 'shareFacebookToggle', aliasKey: 'facebookToggle', label: 'Facebook Share', iconBg: 'bg-[#1877F2]', description: 'Enable or disable Facebook sharing button in post details.' },
    { key: 'shareTwitterToggle', aliasKey: 'twitterToggle', label: 'Twitter / X Share', iconBg: 'bg-[#1DA1F2]', description: 'Enable or disable X (Twitter) sharing button in post details.' },
    { key: 'shareThreadsToggle', aliasKey: 'threadsToggle', label: 'Threads Share', iconBg: 'bg-black', description: 'Enable or disable Threads sharing button in post details.' },
    { key: 'sharePinterestToggle', aliasKey: 'pinterestToggle', label: 'Pinterest Share', iconBg: 'bg-[#E60023]', description: 'Enable or disable Pinterest sharing button in post details.' },
    { key: 'shareWhatsappToggle', aliasKey: 'whatsappToggle', label: 'WhatsApp Share', iconBg: 'bg-[#25D366]', description: 'Enable or disable WhatsApp sharing button in post details.' },
    { key: 'shareTelegramToggle', aliasKey: 'telegramToggle', label: 'Telegram Share', iconBg: 'bg-[#229ED9]', description: 'Enable or disable Telegram sharing button in post details.' },
    { key: 'shareCopyLinkToggle', aliasKey: 'copyLinkToggle', label: 'Copy Link Share', iconBg: 'bg-[#8E99A8]', description: 'Enable or disable Copy Link button in post details.' },
  ];

  const handleMasterToggle = async () => {
    const newValue = !isMasterOn;
    try {
      await promptStore.updateFeatureControls({
        postShareEnabled: newValue,
        socialShareButtons: newValue,
      });
      showToast(
        newValue ? 'Post Share Enabled' : 'Post Share Disabled',
        newValue ? 'Post Share section is now visible in post details.' : 'Post Share section is now hidden in post details.',
        newValue ? 'success' : 'info'
      );
    } catch (e) {
      showToast('Update Failed', 'Failed to save master post share setting.', 'error');
    }
  };

  const handleToggle = async (key: keyof FeatureControls, aliasKey?: keyof FeatureControls) => {
    const currentValue = featureControls[key] !== false;
    const newValue = !currentValue;
    const updateObj: Partial<FeatureControls> = { [key]: newValue };
    if (aliasKey) {
      updateObj[aliasKey] = newValue;
    }
    try {
      await promptStore.updateFeatureControls(updateObj);
      showToast(
        `Share Option Updated`,
        `${shareItems.find((i) => i.key === key)?.label || key} is now ${newValue ? 'ON' : 'OFF'}`,
        newValue ? 'success' : 'info'
      );
    } catch (e) {
      showToast('Update Failed', 'Failed to save share setting to Firestore', 'error');
    }
  };

  const handleEnableAll = async () => {
    try {
      await promptStore.updateFeatureControls({
        postShareEnabled: true,
        socialShareButtons: true,
        shareFacebookToggle: true,
        shareTwitterToggle: true,
        shareThreadsToggle: true,
        sharePinterestToggle: true,
        shareWhatsappToggle: true,
        shareTelegramToggle: true,
        shareCopyLinkToggle: true,
        facebookToggle: true,
        twitterToggle: true,
        threadsToggle: true,
        pinterestToggle: true,
        whatsappToggle: true,
        telegramToggle: true,
        copyLinkToggle: true,
      });
      showToast('All Post Share Options ON', 'All post share buttons are now enabled.', 'success');
    } catch (e) {
      showToast('Error', 'Failed to update share settings.', 'error');
    }
  };

  const handleDisableAll = async () => {
    try {
      await promptStore.updateFeatureControls({
        shareFacebookToggle: false,
        shareTwitterToggle: false,
        shareThreadsToggle: false,
        sharePinterestToggle: false,
        shareWhatsappToggle: false,
        shareTelegramToggle: false,
        shareCopyLinkToggle: false,
      });
      showToast('All Post Share Buttons OFF', 'All individual post share buttons are now hidden.', 'info');
    } catch (e) {
      showToast('Error', 'Failed to update share settings.', 'error');
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-zinc-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <span>POST SHARE CONTROLS</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
                Post Detail Only
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Control social sharing options inside opened Post Detail pages. Does NOT affect footer profile links.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleEnableAll}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            Turn All ON
          </button>
          <button
            type="button"
            onClick={handleDisableAll}
            className="px-3.5 py-2 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            Turn All OFF
          </button>
        </div>
      </div>

      {/* Master Section Toggle */}
      <div className="p-4 sm:p-5 rounded-2xl bg-blue-950/30 border border-blue-500/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Power className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white">Enable / Disable Post Share Section</h4>
            <p className="text-xs text-zinc-400">Master switch to show or hide the Share block in Post Detail modal.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleMasterToggle}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 border cursor-pointer shrink-0 ${
            isMasterOn
              ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30'
              : 'bg-zinc-800 text-zinc-400 border-zinc-700'
          }`}
        >
          {isMasterOn ? 'SECTION ON' : 'SECTION OFF'}
        </button>
      </div>

      {/* Individual Share Buttons list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shareItems.map((item) => {
          const isEnabled = featureControls[item.key] !== false && (item.aliasKey ? featureControls[item.aliasKey] !== false : true);
          return (
            <div
              key={item.key}
              className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between gap-4 transition-all hover:border-zinc-700"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${item.iconBg} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}>
                  {item.label.substring(0, 1)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{item.label}</h4>
                  <p className="text-[11px] text-zinc-400">{item.description}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle(item.key, item.aliasKey)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 border cursor-pointer shrink-0 ${
                  isEnabled
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 hover:bg-blue-600/30'
                    : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:bg-zinc-800'
                }`}
              >
                {isEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

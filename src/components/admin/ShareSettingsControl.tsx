import React from 'react';
import { Share2, Check, X, Shield, Sparkles } from 'lucide-react';
import { FeatureControls } from '../../types';
import { promptStore } from '../../services/promptStore';
import { useToast } from '../Toast';

interface ShareSettingsControlProps {
  featureControls: FeatureControls;
}

export const ShareSettingsControl: React.FC<ShareSettingsControlProps> = ({ featureControls }) => {
  const { showToast } = useToast();

  const shareItems: { key: keyof FeatureControls; label: string; iconBg: string; description: string }[] = [
    { key: 'facebookToggle', label: 'Facebook', iconBg: 'bg-[#1877F2]', description: 'Enable or disable Facebook sharing button in the prompt modal.' },
    { key: 'twitterToggle', label: 'Twitter / X', iconBg: 'bg-[#1DA1F2]', description: 'Enable or disable X (Twitter) sharing button in the prompt modal.' },
    { key: 'threadsToggle', label: 'Threads', iconBg: 'bg-black', description: 'Enable or disable Threads sharing button in the prompt modal.' },
    { key: 'pinterestToggle', label: 'Pinterest', iconBg: 'bg-[#E60023]', description: 'Enable or disable Pinterest sharing button in the prompt modal.' },
    { key: 'whatsappToggle', label: 'WhatsApp', iconBg: 'bg-[#25D366]', description: 'Enable or disable WhatsApp sharing button in the prompt modal.' },
    { key: 'telegramToggle', label: 'Telegram', iconBg: 'bg-[#229ED9]', description: 'Enable or disable Telegram sharing button in the prompt modal.' },
    { key: 'copyLinkToggle', label: 'Copy Link', iconBg: 'bg-[#8E99A8]', description: 'Enable or disable Copy Link button in the prompt modal.' },
  ];

  const handleToggle = async (key: keyof FeatureControls) => {
    const currentValue = featureControls[key] !== false;
    const newValue = !currentValue;
    try {
      await promptStore.updateFeatureControls({ [key]: newValue });
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
        facebookToggle: true,
        twitterToggle: true,
        threadsToggle: true,
        pinterestToggle: true,
        whatsappToggle: true,
        telegramToggle: true,
        copyLinkToggle: true,
      });
      showToast('All Share Options ON', 'All share buttons are now enabled.', 'success');
    } catch (e) {
      showToast('Error', 'Failed to update share settings.', 'error');
    }
  };

  const handleDisableAll = async () => {
    try {
      await promptStore.updateFeatureControls({
        facebookToggle: false,
        twitterToggle: false,
        threadsToggle: false,
        pinterestToggle: false,
        whatsappToggle: false,
        telegramToggle: false,
        copyLinkToggle: false,
      });
      showToast('All Share Options OFF', 'All share buttons are now hidden.', 'info');
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
              <span>SHARE SETTINGS</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
                Admin Control Panel
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Toggle individual social sharing options ON or OFF for the prompt modal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleEnableAll}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all"
          >
            Turn All ON
          </button>
          <button
            type="button"
            onClick={handleDisableAll}
            className="px-3.5 py-2 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all"
          >
            Turn All OFF
          </button>
        </div>
      </div>

      {/* Toggles list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shareItems.map((item) => {
          const isEnabled = featureControls[item.key] !== false;
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
                onClick={() => handleToggle(item.key)}
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

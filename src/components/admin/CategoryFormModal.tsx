import React, { useState, useEffect } from 'react';
import { Category } from '../../types';
import { CategoryIcon } from '../CategoryIcon';
import { X, Layers, Save, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../Toast';

interface CategoryFormModalProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
  onSave: (catData: Omit<Category, 'id' | 'slug'>) => void;
}

const AVAILABLE_ICONS = [
  'Bot',
  'Sparkles',
  'Brain',
  'Image',
  'Video',
  'PenTool',
  'Tv',
  'Code2',
  'Layout',
  'Briefcase',
  'Megaphone',
  'Search',
  'Share2',
  'Terminal',
  'Wand2',
  'Cpu',
  'Layers',
  'Flame',
  'Rocket',
  'Zap',
];

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  category,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Sparkles');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('blue');
  const { showToast } = useToast();

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setIcon(category.icon || 'Sparkles');
      setDescription(category.description || '');
      setColor(category.color || 'blue');
    } else {
      setName('');
      setIcon('Sparkles');
      setDescription('');
      setColor('blue');
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Name Required', 'Please enter a category name', 'error');
      return;
    }

    onSave({
      name,
      icon,
      color,
      bgLight: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      description,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl z-10 space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-bold transition-all cursor-pointer border border-zinc-200 dark:border-zinc-700 shrink-0"
                title="Back to Categories"
              >
                <ArrowLeft className="w-4 h-4 text-blue-500" />
                <span className="hidden sm:inline">Back</span>
              </button>

              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 hidden sm:flex items-center justify-center border border-blue-500/20">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                {category ? 'Edit Category' : 'Create New Category'}
              </h3>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Autonomous Agents"
                className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                Category Icon
              </label>
              <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto p-1 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                {AVAILABLE_ICONS.map((iconName) => (
                  <button
                    type="button"
                    key={iconName}
                    onClick={() => setIcon(iconName)}
                    className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${
                      icon === iconName
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    <CategoryIcon name={iconName} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short summary of prompts in this category..."
                className="w-full px-4 py-2.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Submit */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Category</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

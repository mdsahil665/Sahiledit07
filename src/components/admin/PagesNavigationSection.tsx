import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
  Save,
  CheckCircle2,
  XCircle,
  Globe,
  Sliders,
  Shield,
  Layers,
  Sparkles,
  HelpCircle,
  X,
  Search,
} from 'lucide-react';
import { CustomPage } from '../../types';
import { promptStore } from '../../services/promptStore';
import { useToast } from '../Toast';

interface PagesNavigationSectionProps {
  onOpenPagePreview?: (page: CustomPage) => void;
}

export const PagesNavigationSection: React.FC<PagesNavigationSectionProps> = ({ onOpenPagePreview }) => {
  const [pages, setPages] = useState<CustomPage[]>(() => promptStore.getPages());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPage, setEditingPage] = useState<CustomPage | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomPage | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const unsub = promptStore.subscribe(() => {
      setPages(promptStore.getPages());
    });
    return unsub;
  }, []);

  const filteredPages = pages.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSavePage = async (pageData: Partial<CustomPage>) => {
    try {
      if (isCreating) {
        await promptStore.addPage({
          title: pageData.title || 'Untitled Page',
          slug: pageData.slug || 'untitled',
          content: pageData.content || '',
          seoTitle: pageData.seoTitle || pageData.title || '',
          metaDescription: pageData.metaDescription || '',
          status: pageData.status || 'published',
          isSystem: false,
        });
        showToast('Page Created', `Page "${pageData.title}" created successfully.`);
      } else if (editingPage) {
        await promptStore.updatePage(editingPage.id, pageData);
        showToast('Page Updated', `Page "${pageData.title || editingPage.title}" updated.`);
      }
      setEditingPage(null);
      setIsCreating(false);
    } catch (e) {
      showToast('Error', 'Failed to save page.', 'error');
    }
  };

  const handleDeletePage = async (id: string) => {
    try {
      await promptStore.deletePage(id);
      setDeleteTarget(null);
      showToast('Page Deleted', 'Page removed successfully.');
    } catch (e) {
      showToast('Error', 'Failed to delete page.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>Pages & Navigation Manager</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Create custom content pages, manage policy documents, and configure public menu links.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreating(true);
            setEditingPage({
              id: '',
              title: '',
              slug: '',
              content: '',
              seoTitle: '',
              metaDescription: '',
              status: 'published',
              isSystem: false,
              createdAt: '',
              updatedAt: '',
            });
          }}
          className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Page</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search pages by title or slug..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPages.map((page) => {
          const isPublished = page.status === 'published';
          return (
            <div
              key={page.id}
              className="p-5 rounded-3xl bg-zinc-900 border border-zinc-800 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                      isPublished
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {page.status || 'published'}
                  </span>

                  {page.isSystem && (
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold">
                      System Page
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">
                  {page.title}
                </h4>

                <p className="text-xs font-mono text-zinc-500">/{page.slug}</p>

                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {page.content ? page.content.replace(/<[^>]*>?/gm, '').slice(0, 120) : 'No content body added yet.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                <span className="text-[11px] text-zinc-500">
                  Updated: {new Date(page.updatedAt || page.createdAt || Date.now()).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-1.5">
                  {onOpenPagePreview && (
                    <button
                      type="button"
                      onClick={() => onOpenPagePreview(page)}
                      className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
                      title="Preview Live Page"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setEditingPage(page);
                    }}
                    className="p-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 transition-colors cursor-pointer"
                    title="Edit Page"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {!page.isSystem && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(page)}
                      className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                      title="Delete Page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Create Modal */}
      {editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>{isCreating ? 'Create New Page' : `Edit: ${editingPage.title}`}</span>
              </h3>
              <button
                onClick={() => setEditingPage(null)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Page Title</label>
                  <input
                    type="text"
                    value={editingPage.title}
                    onChange={(e) => setEditingPage({ ...editingPage, title: e.target.value })}
                    placeholder="e.g. Terms of Service"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">URL Slug</label>
                  <input
                    type="text"
                    value={editingPage.slug}
                    onChange={(e) => setEditingPage({ ...editingPage, slug: e.target.value })}
                    placeholder="e.g. terms"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Publication Status</label>
                  <select
                    value={editingPage.status}
                    onChange={(e) => setEditingPage({ ...editingPage, status: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="published">Published (Visible to Visitors)</option>
                    <option value="draft">Draft (Hidden)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">SEO Meta Title</label>
                  <input
                    type="text"
                    value={editingPage.seoTitle || ''}
                    onChange={(e) => setEditingPage({ ...editingPage, seoTitle: e.target.value })}
                    placeholder="Optional meta title"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300">Page Content (Markdown / HTML)</label>
                <textarea
                  rows={10}
                  value={editingPage.content}
                  onChange={(e) => setEditingPage({ ...editingPage, content: e.target.value })}
                  placeholder="# Enter page content here..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800 flex items-center justify-end gap-3 bg-zinc-950/50">
              <button
                type="button"
                onClick={() => setEditingPage(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSavePage(editingPage)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20"
              >
                Save Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete "{deleteTarget.title}"?</h3>
              <p className="text-xs text-zinc-400 mt-1">This page will be permanently erased from your database.</p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeletePage(deleteTarget.id)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

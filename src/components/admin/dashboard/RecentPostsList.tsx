import React from 'react';
import { Sparkles, Film, Image as ImageIcon, Eye, ArrowUpRight } from 'lucide-react';
import { PromptPost } from '../../../types';
import { AdminTab } from '../AdminSidebar';

interface RecentPostsListProps {
  posts: PromptPost[];
  onSelectTab: (tab: AdminTab) => void;
}

export const RecentPostsList: React.FC<RecentPostsListProps> = ({ posts, onSelectTab }) => {
  // Sort posts by createdAt descending and take latest 5
  const latestPosts = posts
    .slice()
    .sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    })
    .slice(0, 5);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Recently';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-4">
          <div>
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>RECENT POSTS</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Latest 5 prompt posts in your library
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('posts')}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All Posts</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {latestPosts.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            No prompt posts created yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pl-2">Thumbnail &amp; Title</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Views</th>
                  <th className="pb-3 pr-2 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {latestPosts.map((post) => {
                  const isVideo = post.postType === 'video_prompt';

                  return (
                    <tr
                      key={post.id}
                      onClick={() => onSelectTab('posts')}
                      className="hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Thumbnail & Title */}
                      <td className="py-3 pl-2">
                        <div className="flex items-center gap-3">
                          {post.imageUrl ? (
                            <img
                              src={post.imageUrl}
                              alt={post.title}
                              className="w-9 h-9 rounded-xl object-cover border border-zinc-800 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-400 shrink-0">
                              {isVideo ? (
                                <Film className="w-4 h-4 text-rose-400" />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-zinc-400" />
                              )}
                            </div>
                          )}

                          <div className="truncate max-w-[140px] sm:max-w-[200px]">
                            <div className="font-bold text-white group-hover:text-blue-400 transition-colors truncate">
                              {post.title}
                            </div>
                            <div className="text-[10px] text-zinc-500 truncate">
                              {post.categoryName || post.categoryId}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3">
                        {isVideo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                            <Film className="w-3 h-3" />
                            <span>Video Prompt</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                            <ImageIcon className="w-3 h-3" />
                            <span>Photo Prompt</span>
                          </span>
                        )}
                      </td>

                      {/* Views */}
                      <td className="py-3 text-zinc-300 font-mono">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{(post.views || 0).toLocaleString()}</span>
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 pr-2 text-right text-zinc-400 text-[11px] font-mono">
                        {formatDate(post.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-zinc-800/80">
        <button
          type="button"
          onClick={() => onSelectTab('posts')}
          className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>View All Posts CMS ({posts.length})</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './components/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LogoProvider } from './context/LogoContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryHeader } from './components/CategoryHeader';
import { PromptCard } from './components/PromptCard';
import { PromptModal } from './components/PromptModal';
import { Footer } from './components/Footer';
import { PageModal } from './components/PageModal';
import { AdBanner } from './components/AdBanner';
import { LoginModal } from './components/LoginModal';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PremiumPage } from './components/PremiumPage';
import { PostFormModal } from './components/admin/PostFormModal';
import { CategoryFormModal } from './components/admin/CategoryFormModal';
import { AdminErrorBoundary } from './components/admin/AdminErrorBoundary';
import { SEOHelper } from './components/SEOHelper';
import { NotFoundPage } from './components/NotFoundPage';
import { promptStore, sortPostsByCreatedAtDesc } from './services/promptStore';
import { getPromptSlug, extractPromptIdFromParam, createSlugFromTitle } from './utils/promptUrl';
import {
  isPostStrictlyInCategory,
  normalizeCategoryKey,
  getCategoryDisplayName,
} from './utils/categoryUtils';
import { PromptPost, Category, CustomPage } from './types';
import {
  SearchX,
  X,
  ChevronDown,
  ArrowUp,
  Wrench,
  Sparkles,
  Copy,
  Check,
  Zap,
  Flame,
  Compass,
  ArrowRight,
  ShieldCheck,
  Eye,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function AppContent() {
  const { currentUser, loading: authLoading, isAdmin } = useAuth();
  const [posts, setPosts] = useState<PromptPost[]>(() => promptStore.getPosts());
  const [categories, setCategories] = useState<Category[]>(() => promptStore.getCategories());
  const [featureControls, setFeatureControls] = useState(() => promptStore.getFeatureControls());
  const [websiteSections, setWebsiteSections] = useState(() => promptStore.getWebsiteSections());

  // Check if browser was currently restoring or loaded on an admin route
  const isInitialAdminRoute = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();
    return search.includes('admin') || hash.includes('admin') || path.includes('/admin');
  }, []);

  const [showAdminDashboard, setShowAdminDashboard] = useState<boolean>(() => isInitialAdminRoute);
  const [showPremiumPage, setShowPremiumPage] = useState(false);

  // Search, Category, and Active Tab Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'latest' | 'trending' | 'popular'>('latest');

  // Infinite Scroll limit state
  const [visibleCount, setVisibleCount] = useState(16);
  const observerRef = useRef<HTMLDivElement | null>(null);

  // Back to Top button state
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Modals
  const [activePromptModal, setActivePromptModal] = useState<PromptPost | null>(null);
  const [activePageModal, setActivePageModal] = useState<CustomPage | null>(null);
  const [isRouteNotFound, setIsRouteNotFound] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<'login' | 'register' | 'reset'>('login');
  const [loginModalEmail, setLoginModalEmail] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetOobCode, setResetOobCode] = useState<string | null>(null);
  const [editingPostModal, setEditingPostModal] = useState<PromptPost | null | 'new'>(null);
  const [editingCategoryModal, setEditingCategoryModal] = useState<Category | null | 'new'>(null);

  const { showToast } = useToast();

  const monetizationSettings = promptStore.getMonetization();

  // Sync state with promptStore events (Firestore real-time)
  useEffect(() => {
    const unsubscribe = promptStore.subscribe(() => {
      const newPosts = promptStore.getPosts();
      setPosts(newPosts);
      setCategories(promptStore.getCategories());
      setFeatureControls(promptStore.getFeatureControls());
      setWebsiteSections(promptStore.getWebsiteSections());
    });
    return unsubscribe;
  }, []);

  // Ensure active modal post object reference reflects updated store state
  useEffect(() => {
    if (activePromptModal) {
      const updated = promptStore.getPostById(activePromptModal.id);
      if (updated && (updated.likes !== activePromptModal.likes || updated !== activePromptModal)) {
        setActivePromptModal(updated);
      }
    }
  }, [posts]);

  // Back to Top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Protected Admin & Premium Route Check
  useEffect(() => {
    const checkUrlRoutes = () => {
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const path = window.location.pathname.toLowerCase();
      const isAdminRoute = search.includes('admin') || hash.includes('admin') || path.includes('/admin');

      if (isAdminRoute) {
        // While Firebase Auth is restoring the session, preserve the admin route and do not redirect!
        if (authLoading) {
          setShowAdminDashboard(true);
          return;
        }

        if (isAdmin) {
          setShowAdminDashboard(true);
          // If login modal was open, close it cleanly
          setShowLoginModal(false);
        } else {
          // Firebase Auth initialization finished and user is not admin
          setShowAdminDashboard(false);
          setShowLoginModal(true);
          showToast('Admin Authentication Required', 'Please log in with an Admin account.', 'error');
        }
      } else {
        setShowAdminDashboard(false);
      }

      if (search.includes('premium') || hash.includes('premium') || path.includes('/premium')) {
        setShowPremiumPage(true);
      }
    };

    const handlePopState = (event: PopStateEvent) => {
      // If a modal was open and back was triggered, dismiss modal without exiting admin
      if (event.state?.type !== 'admin-modal') {
        setEditingPostModal(null);
        setEditingCategoryModal(null);
      }
      checkUrlRoutes();
    };

    checkUrlRoutes();
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', checkUrlRoutes);

    // Keyboard shortcut (Ctrl+Shift+A / Cmd+Shift+A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        if (authLoading) return;
        if (isAdmin) {
          if (!window.location.pathname.startsWith('/admin')) {
            window.history.pushState({ type: 'admin', tab: 'dashboard' }, '', '/admin/dashboard');
          }
          setShowAdminDashboard(true);
        } else {
          setShowLoginModal(true);
          showToast('Admin Authentication Required', 'Please log in with an Admin account.', 'error');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', checkUrlRoutes);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [authLoading, isAdmin]);

  const refreshData = () => {
    setPosts(promptStore.getPosts());
    setCategories(promptStore.getCategories());
  };

  // Reset infinite scroll count when search or category filter changes
  useEffect(() => {
    setVisibleCount(16);
  }, [searchQuery, selectedCategory]);

  // Scroll to top only when selecting a category
  useEffect(() => {
    if (selectedCategory) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedCategory]);

  // Published posts sorted newest first by createdAt timestamp
  const publishedPosts = useMemo(() => {
    return sortPostsByCreatedAtDesc(posts.filter((p) => !p.status || p.status === 'published'));
  }, [posts]);

  // Permanently fixed Featured Post and Trending Post
  const featuredPost = useMemo(() => {
    return publishedPosts.find((p) => p.featured === true) || null;
  }, [publishedPosts]);

  const trendingPost = useMemo(() => {
    return publishedPosts.find((p) => p.trending === true) || null;
  }, [publishedPosts]);

  // Strict helper to match post to selected category
  const isPostInCategory = useCallback((post: PromptPost, catSelection: string | null) => {
    return isPostStrictlyInCategory(post, catSelection);
  }, []);

  // Display name for selected category
  const selectedCategoryDisplayName = useMemo(() => {
    if (!selectedCategory) return null;
    const targetNorm = normalizeCategoryKey(selectedCategory);
    const found = categories.find(
      (c) =>
        normalizeCategoryKey(c.id) === targetNorm ||
        normalizeCategoryKey(c.slug) === targetNorm ||
        normalizeCategoryKey(c.name) === targetNorm
    );
    if (found) return found.name;
    return getCategoryDisplayName(selectedCategory);
  }, [selectedCategory, categories]);

  // Real post count strictly for selected category
  const categoryPostCount = useMemo(() => {
    if (!selectedCategory) return 0;
    return publishedPosts.filter((p) => isPostStrictlyInCategory(p, selectedCategory)).length;
  }, [publishedPosts, selectedCategory]);

  // Filtered & Sorted Posts based on Search, Category, and Active Tab
  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = publishedPosts.filter((post) => {
      const matchesCategory = isPostStrictlyInCategory(post, selectedCategory);
      const matchesSearch =
        query === '' ||
        post.title.toLowerCase().includes(query) ||
        post.fullPrompt.toLowerCase().includes(query) ||
        post.shortDescription.toLowerCase().includes(query) ||
        (post.tags && post.tags.some((t) => t.toLowerCase().includes(query)));

      return matchesCategory && matchesSearch;
    });

    if (activeTab === 'trending') {
      return [...result].sort((a, b) => {
        if (a.trending && !b.trending) return -1;
        if (!a.trending && b.trending) return 1;
        return (b.copies || 0) - (a.copies || 0);
      });
    }

    if (activeTab === 'popular') {
      return [...result].sort((a, b) => {
        const scoreA = (a.views || 0) * 2 + (a.copies || 0) * 5;
        const scoreB = (b.views || 0) * 2 + (b.copies || 0) * 5;
        return scoreB - scoreA;
      });
    }

    // Default 'latest': sorted by createdAt desc
    return sortPostsByCreatedAtDesc(result);
  }, [publishedPosts, selectedCategory, searchQuery, activeTab]);

  const visiblePosts = useMemo(() => filteredPosts.slice(0, visibleCount), [filteredPosts, visibleCount]);
  const hasMore = visibleCount < filteredPosts.length;

  const stats = promptStore.getAdminStats();

  const savedScrollPosition = useRef<number>(0);

  const handleOpenPromptModal = useCallback((post: PromptPost) => {
    promptStore.incrementViews(post.id);
    setActivePromptModal((prev) => {
      if (!prev) {
        savedScrollPosition.current = window.scrollY;
      }
      return post;
    });

    const newUrl = `/prompt/${encodeURIComponent(getPromptSlug(post))}`;
    window.history.pushState({ modalOpen: true, postId: post.id }, '', newUrl);
  }, []);

  const handleClosePromptModal = useCallback(() => {
    setActivePromptModal(null);
    window.history.replaceState(null, '', '/');

    setTimeout(() => {
      window.scrollTo({ top: savedScrollPosition.current, behavior: 'auto' });
    }, 30);
  }, []);

  // Helper to find post by ID, slug, or title match
  const findPostBySlugOrId = useCallback((slugOrId: string) => {
    if (!slugOrId) return null;
    const cleanId = extractPromptIdFromParam(slugOrId);
    const decodedRaw = decodeURIComponent(slugOrId).trim().toLowerCase();
    const targetSlug = createSlugFromTitle(decodedRaw);

    const all = promptStore.getPosts();

    // 1. Direct ID match
    let found = promptStore.getPostById(cleanId);
    if (found) return found;

    // 2. Slug or exact ID match
    found = all.find((p) => (p.slug && p.slug.toLowerCase() === decodedRaw) || p.id.toLowerCase() === decodedRaw);
    if (found) return found;

    // 3. Match calculated slug or title slug
    found = all.find((p) => {
      const pSlug = getPromptSlug(p).toLowerCase();
      const tSlug = createSlugFromTitle(p.title || '').toLowerCase();
      return pSlug === decodedRaw || tSlug === decodedRaw || (targetSlug && (pSlug === targetSlug || tSlug === targetSlug));
    });
    if (found) return found;

    // 4. Substring or prefix matching
    found = all.find((p) => {
      const tSlug = createSlugFromTitle(p.title || '').toLowerCase();
      return tSlug && targetSlug && (targetSlug.startsWith(tSlug) || tSlug.startsWith(targetSlug));
    });

    return found || null;
  }, []);

  // Parse URL search parameters and path on initial load and when posts load
  // Unified URL route handler for deep links, sitelinks, clean paths, and 404s
  useEffect(() => {
    const handleRoute = () => {
      const pathname = window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;

      // 1. Password reset
      const mode = urlParams.get('mode') || (hash.includes('mode=resetPassword') ? 'resetPassword' : null);
      const oobCode =
        urlParams.get('oobCode') ||
        urlParams.get('actionCode') ||
        (hash.includes('oobCode=') ? new URLSearchParams(hash.substring(1)).get('oobCode') : null);

      if (mode === 'resetPassword' || (pathname === '/reset-password' && oobCode) || oobCode) {
        setResetOobCode(oobCode);
        setShowResetPasswordModal(true);
      }

      // 2. Admin routes (supports /admin, /admin/*, as well as /adm, /adn aliases)
      if (
        pathname.startsWith('/admin') ||
        pathname === '/adm' ||
        pathname === '/adn' ||
        pathname.startsWith('/adm/') ||
        pathname.startsWith('/adn/') ||
        urlParams.has('admin') ||
        hash.includes('admin')
      ) {
        setIsRouteNotFound(false);
        setShowAdminDashboard(true);
        return;
      }

      // 3. Prompt deep links: /prompt/:slugOrId or /post/:slugOrId or ?prompt=... or ?post=...
      let targetPromptSlugOrId: string | null = null;
      if (pathname.startsWith('/prompt/')) {
        const parts = pathname.split('/prompt/');
        if (parts[1]) targetPromptSlugOrId = parts[1].replace(/\/$/, '');
      } else if (pathname.startsWith('/post/')) {
        const parts = pathname.split('/post/');
        if (parts[1]) targetPromptSlugOrId = parts[1].replace(/\/$/, '');
      } else if (urlParams.has('prompt') || urlParams.has('post') || urlParams.has('p')) {
        targetPromptSlugOrId = urlParams.get('prompt') || urlParams.get('post') || urlParams.get('p');
      }

      if (targetPromptSlugOrId) {
        const targetPost = findPostBySlugOrId(targetPromptSlugOrId);
        if (targetPost && (!targetPost.status || targetPost.status === 'published')) {
          setActivePromptModal(targetPost);
          setIsRouteNotFound(false);
          return;
        } else if (posts.length > 0) {
          // If posts finished loading and prompt is missing
          setActivePromptModal(null);
          setIsRouteNotFound(true);
          return;
        }
      } else {
        setActivePromptModal(null);
      }

      // 4. Category routes: /category/:slug or /c/:slug or ?category=...
      let targetCategorySlug: string | null = null;
      if (pathname.startsWith('/category/')) {
        const parts = pathname.split('/category/');
        if (parts[1]) targetCategorySlug = parts[1].replace(/\/$/, '');
      } else if (pathname.startsWith('/c/')) {
        const parts = pathname.split('/c/');
        if (parts[1]) targetCategorySlug = parts[1].replace(/\/$/, '');
      } else if (urlParams.has('category') || urlParams.has('c')) {
        targetCategorySlug = urlParams.get('category') || urlParams.get('c');
      }

      if (targetCategorySlug) {
        const norm = targetCategorySlug.toLowerCase().trim();
        const foundCat = categories.find(
          (c) =>
            c.id.toLowerCase() === norm ||
            c.slug.toLowerCase() === norm ||
            c.name.toLowerCase() === norm
        );
        if (foundCat) {
          setSelectedCategory(foundCat.id);
          setIsRouteNotFound(false);
          return;
        } else if (categories.length > 0) {
          setSelectedCategory(targetCategorySlug);
          setIsRouteNotFound(false);
          return;
        }
      }

      // 5. Clean Sitelinks & Policy/Custom Pages
      const cleanPath = pathname.toLowerCase().replace(/^\/|\/$/g, '');
      const pageQuery = urlParams.get('page');

      const knownPageMappings: Record<string, string[]> = {
        'about-us': ['about', 'about-us'],
        'contact-us': ['contact', 'contact-us'],
        'privacy-policy': ['privacy', 'privacy-policy'],
        'terms-and-conditions': ['terms', 'terms-and-conditions', 'terms-of-service'],
        'disclaimer': ['disclaimer'],
        'dmca': ['dmca'],
        'refund-policy': ['refund', 'refund-policy'],
        'cookie-policy': ['cookie-policy', 'cookies'],
      };

      let matchedPageSlug: string | null = pageQuery || null;
      if (!matchedPageSlug && cleanPath) {
        for (const [canonicalSlug, aliases] of Object.entries(knownPageMappings)) {
          if (aliases.includes(cleanPath)) {
            matchedPageSlug = canonicalSlug;
            break;
          }
        }
      }

      if (matchedPageSlug) {
        const allPages = promptStore.getPages();
        const foundPage = allPages.find(
          (p) =>
            p.slug.toLowerCase() === matchedPageSlug!.toLowerCase() ||
            p.id.toLowerCase() === matchedPageSlug!.toLowerCase() ||
            p.title.toLowerCase().replace(/\s+/g, '-') === matchedPageSlug!.toLowerCase()
        );
        if (foundPage && foundPage.status === 'published') {
          setActivePageModal(foundPage);
          setIsRouteNotFound(false);
          return;
        }
      } else {
        setActivePageModal(null);
      }

      // 6. Section shortcuts: /prompts and /categories
      if (cleanPath === 'prompts') {
        setSelectedCategory(null);
        setSearchQuery('');
        setIsRouteNotFound(false);
        setTimeout(() => {
          document.getElementById('latest-posts-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
        return;
      }
      if (cleanPath === 'categories') {
        setIsRouteNotFound(false);
        setTimeout(() => {
          document.getElementById('categories-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 80);
        return;
      }

      // 7. Homepage
      if (!cleanPath || cleanPath === '') {
        setIsRouteNotFound(false);
        return;
      }

      // 8. If unrecognized route and not special path
      if (cleanPath && !['admin', 'adm', 'adn', 'reset-password', 'premium'].includes(cleanPath)) {
        setIsRouteNotFound(true);
      }
    };

    handleRoute();
    window.addEventListener('popstate', handleRoute);
    return () => {
      window.removeEventListener('popstate', handleRoute);
    };
  }, [posts, categories, findPostBySlugOrId]);

  const handleCopyPrompt = useCallback((post: PromptPost) => {
    promptStore.incrementCopies(post.id);
  }, []);

  const handleSavePost = async (
    postData: Omit<PromptPost, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'copies'>,
    existingId?: string
  ) => {
    const targetId = existingId || (typeof editingPostModal === 'object' && editingPostModal ? editingPostModal.id : null);
    if (targetId) {
      await promptStore.updatePost(targetId, postData);
      showToast('✓ Prompt Updated', 'Changes saved successfully');
    } else {
      await promptStore.addPost(postData);
      showToast('✓ Prompt Published', 'New AI prompt is live at the top of your feed');
    }
    setEditingPostModal(null);
    refreshData();
  };

  const handleSaveCategory = (catData: Omit<Category, 'id' | 'slug'>) => {
    if (editingCategoryModal === 'new') {
      promptStore.addCategory(catData);
      showToast('✓ Category Created', 'New category added');
    } else if (editingCategoryModal && typeof editingCategoryModal === 'object') {
      promptStore.updateCategory(editingCategoryModal.id, catData);
      showToast('✓ Category Updated', 'Category updated');
    }
    setEditingCategoryModal(null);
    refreshData();
  };

  const selectedCategoryObj = useMemo(() => {
    if (!selectedCategory) return undefined;
    const targetNorm = normalizeCategoryKey(selectedCategory);
    return categories.find(
      (c) =>
        normalizeCategoryKey(c.id) === targetNorm ||
        normalizeCategoryKey(c.slug) === targetNorm ||
        normalizeCategoryKey(c.name) === targetNorm
    );
  }, [selectedCategory, categories]);

  // Protected Admin Dashboard Route
  if (showAdminDashboard) {
    if (authLoading) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white select-none p-6">
          <div className="flex flex-col items-center max-w-sm text-center">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
                <ShieldCheck className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div className="absolute -inset-2 rounded-3xl border border-blue-500/30 animate-ping opacity-25 pointer-events-none" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white mb-2">Restoring Admin Session</h2>
            <p className="text-sm text-slate-400">Verifying secure credentials with Firebase...</p>
            <div className="w-48 h-1 bg-slate-800 rounded-full mt-6 overflow-hidden">
              <div className="w-full h-full bg-blue-500 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      );
    }

    if (!isAdmin) {
      // Direct access protection redirect (only after Firebase Auth has resolved)
      setShowAdminDashboard(false);
      setShowLoginModal(true);
      showToast('Access Denied', 'Admin authentication required to access Dashboard.', 'error');
      return null;
    }

    return (
      <>
        <SEOHelper
          activePrompt={null}
          selectedCategory={null}
          categories={categories}
          activePage={null}
          isAdminView={true}
        />
        <AdminDashboard
          posts={posts}
          categories={categories}
          stats={stats}
          activities={promptStore.getActivities()}
          onAddPost={() => {
            window.history.pushState({ type: 'admin-modal', modal: 'add-post' }, '', window.location.href);
            setEditingPostModal('new');
          }}
          onEditPost={(p) => {
            window.history.pushState({ type: 'admin-modal', modal: 'edit-post', postId: p.id }, '', window.location.href);
            setEditingPostModal(p);
          }}
          onAddCategory={() => {
            window.history.pushState({ type: 'admin-modal', modal: 'add-category' }, '', window.location.href);
            setEditingCategoryModal('new');
          }}
          onEditCategory={(c) => {
            window.history.pushState({ type: 'admin-modal', modal: 'edit-category', catId: c.id }, '', window.location.href);
            setEditingCategoryModal(c);
          }}
          onClose={() => {
            setShowAdminDashboard(false);
            if (window.location.pathname.startsWith('/admin') || window.location.search.includes('admin') || window.location.hash.includes('admin')) {
              window.history.pushState({}, '', '/');
            }
          }}
          onRefreshData={refreshData}
          onOpenPreviewModal={(p) => setActivePromptModal(p)}
          onOpenPageModal={(page) => setActivePageModal(page)}
        />

        {/* Modals triggerable from Admin Dashboard */}
        <AdminErrorBoundary fallbackTitle="AI Prompt Creator">
          <PostFormModal
            isOpen={editingPostModal !== null}
            post={typeof editingPostModal === 'object' ? editingPostModal : null}
            categories={categories}
            onClose={() => {
              setEditingPostModal(null);
              if (window.history.state?.type === 'admin-modal') {
                window.history.back();
              }
            }}
            onSave={(postData, existingId) => {
              handleSavePost(postData, existingId);
              if (window.history.state?.type === 'admin-modal') {
                window.history.back();
              }
            }}
          />
        </AdminErrorBoundary>

        <CategoryFormModal
          isOpen={editingCategoryModal !== null}
          category={typeof editingCategoryModal === 'object' ? editingCategoryModal : null}
          onClose={() => {
            setEditingCategoryModal(null);
            if (window.history.state?.type === 'admin-modal') {
              window.history.back();
            }
          }}
          onSave={(catData) => {
            handleSaveCategory(catData);
            if (window.history.state?.type === 'admin-modal') {
              window.history.back();
            }
          }}
        />

        <PromptModal
          post={activePromptModal}
          categories={categories}
          allPosts={publishedPosts}
          onClose={() => setActivePromptModal(null)}
          onSelectPost={(p) => setActivePromptModal(p)}
          onCopyPrompt={handleCopyPrompt}
          onOpenPage={(page) => setActivePageModal(page)}
        />

        <PageModal page={activePageModal} onClose={() => setActivePageModal(null)} />
      </>
    );
  }

  // Full-Page Dedicated Premium Screen
  if (showPremiumPage) {
    return (
      <>
        <PremiumPage
          onClose={() => {
            setShowPremiumPage(false);
            if (window.location.hash === '#premium' || window.location.search.includes('premium') || window.location.pathname.includes('/premium')) {
              window.history.pushState({}, '', window.location.pathname);
            }
          }}
          onOpenPageModal={(page) => {
            setActivePageModal(page);
          }}
        />
        <PageModal
          page={activePageModal}
          onClose={() => setActivePageModal(null)}
          onOpenPage={(p) => setActivePageModal(p)}
          onOpenPremium={() => {
            setActivePageModal(null);
            setShowPremiumPage(true);
          }}
        />
      </>
    );
  }

  // Maintenance Mode Check
  if (featureControls.maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-6 shadow-xl animate-pulse">
          <Wrench className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black mb-2">Website Maintenance Mode</h1>
        <p className="text-zinc-400 max-w-md text-sm mb-6">
          We are currently performing scheduled maintenance and upgrades. Please check back shortly!
        </p>
        <button
          onClick={() => setShowLoginModal(true)}
          className="px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-bold text-zinc-300 transition-colors"
        >
          Admin Sign In
        </button>
        {showLoginModal && (
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onLoginSuccess={(isAdminUser) => {
              setShowLoginModal(false);
              if (isAdminUser) {
                setShowAdminDashboard(true);
              }
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#F8FAFC] dark:bg-[#090d16] bg-gradient-to-b from-[#EEF2FF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#090d16] dark:via-[#0f172a] dark:to-[#090d16] text-slate-800 dark:text-slate-100 font-sans selection:bg-purple-500/20 selection:text-purple-600 overflow-x-hidden">
      {/* SEO Dynamic Metadata & JSON-LD Manager */}
      <SEOHelper
        activePrompt={activePromptModal}
        selectedCategory={selectedCategory}
        categories={categories}
        activePage={activePageModal}
        isAdminView={showAdminDashboard}
        isRouteNotFound={isRouteNotFound}
      />

      {/* Layered Background Glow Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-blue-300/15 dark:bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-purple-300/15 dark:bg-purple-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-indigo-300/15 dark:bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 flex flex-col justify-between min-h-screen w-full">
        {/* Top Banner Ad Position */}
        <div className="max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 pt-3 w-full">
          <AdBanner position="topBanner" settings={monetizationSettings} />
        </div>

        {/* 1. Header (Logo, Search, Nav links, Dark Mode, Hamburger Menu) */}
        {websiteSections.header !== false && (
          <Header
            categories={categories}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            onNavigateHome={() => {
              setSelectedCategory(null);
              setSearchQuery('');
            }}
            onOpenLogin={() => setShowLoginModal(true)}
            onOpenProfile={() => setShowProfileModal(true)}
            onOpenAdminDashboard={() => {
              if (isAdmin) {
                if (!window.location.pathname.startsWith('/admin')) {
                  window.history.pushState({ type: 'admin', tab: 'dashboard' }, '', '/admin/dashboard');
                }
                setShowAdminDashboard(true);
              } else {
                setShowLoginModal(true);
                showToast('Admin Authentication Required', 'Please log in with an Admin account.', 'error');
              }
            }}
            onOpenPremiumPage={() => setShowPremiumPage(true)}
          />
        )}

        {/* 2. Main Feed Container */}
        <main className="w-full flex-1 relative">
          {isRouteNotFound ? (
            <NotFoundPage
              onNavigateHome={() => {
                setIsRouteNotFound(false);
                setSelectedCategory(null);
                setSearchQuery('');
                setActivePromptModal(null);
                setActivePageModal(null);
                window.history.pushState(null, '', '/');
              }}
              onSelectCategory={(catId) => {
                setIsRouteNotFound(false);
                setSelectedCategory(catId);
                window.history.pushState({ category: catId }, '', `/?category=${encodeURIComponent(catId)}`);
              }}
              categories={categories}
            />
          ) : (
            <>
              {/* Welcome Desktop Hero Section OR Dedicated Category Header */}
              {selectedCategory ? (
                websiteSections.hero !== false && (
                  <CategoryHeader
                    categoryName={selectedCategoryDisplayName || selectedCategory}
                    postCount={categoryPostCount}
                    activeTab={activeTab}
                    onSelectTab={setActiveTab}
                    onNavigateHome={() => {
                      setSelectedCategory(null);
                      setSearchQuery('');
                    }}
                    websiteSections={websiteSections}
                  />
                )
              ) : (
                featureControls.homepageBanner && websiteSections.hero !== false && (
                  <Hero
                    categories={categories}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    activeTab={activeTab}
                    onSelectTab={setActiveTab}
                    websiteSections={websiteSections}
                  />
                )
              )}

          {/* Homepage Banner Ad Position */}
          {monetizationSettings?.enabled && monetizationSettings?.positions?.homepageBanner && (
            <div className="max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 py-2 w-full">
              <AdBanner position="homepageBanner" settings={monetizationSettings} />
            </div>
          )}

          {/* LATEST POSTS SECTION */}
          {websiteSections.postGallery !== false && (
            <section
              id="latest-posts-section"
              className="w-full pt-2 sm:pt-4 pb-8 sm:pb-12 relative z-20 bg-transparent text-slate-900"
            >
              <div className="max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">

              {/* Permanent Trending Post Section (Home Page only) */}
              {featureControls.trendingPosts && websiteSections.trendingPosts !== false && trendingPost && !selectedCategory && !searchQuery && (
                <div className="mb-8 p-6 sm:p-8 rounded-[2rem] bg-white/80 backdrop-blur-md bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-500/30 relative overflow-hidden shadow-xl">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-full md:w-60 rounded-2xl overflow-hidden bg-slate-100 border border-amber-500/20 shrink-0 relative group">
                      <img
                        src={trendingPost.imageUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-xl opacity-35 select-none pointer-events-none"
                      />
                      <img
                        src={trendingPost.imageUrl}
                        alt={trendingPost.title}
                        className="relative z-10 w-full h-auto block object-contain rounded-xl max-h-[280px] shadow-md group-hover:scale-[1.02] transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-extrabold tracking-wider uppercase shadow-md flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-white" />
                        Trending Post
                      </span>
                    </div>

                    <div className="flex-1 space-y-3 text-left">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 border border-amber-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                          🔥 Trending Now
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          👁 {trendingPost.views || 0} views • 📋 {trendingPost.copies || 0} copies
                        </span>
                      </div>

                      <h3 className="text-xl sm:text-2xl font-black text-slate-900 line-clamp-1">
                        {trendingPost.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                        {trendingPost.shortDescription}
                      </p>

                      <div className="pt-1">
                        <button
                          onClick={() => handleOpenPromptModal(trendingPost)}
                          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
                        >
                          <span>View Trending Prompt</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Active Filter Bar (Search only, when not on category page) */}
            {!selectedCategory && searchQuery && (
              <div className="mb-8 p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                <div className="text-sm font-medium text-purple-700">
                  Search: <span className="font-bold text-slate-900">"{searchQuery}"</span>
                </div>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1"
                >
                  <span>Reset Search</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Grid Layout: 2 Mobile, 3 Tablet, 4 Desktop */}
            {filteredPosts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8 items-start">
                {visiblePosts.map((post) => (
                  <PromptCard
                    key={post.id}
                    post={post}
                    onOpenModal={handleOpenPromptModal}
                  />
                ))}
              </div>
            ) : (
              /* Empty Search State */
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto text-zinc-400 shadow-lg">
                  <SearchX className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-200">
                  No matching prompts found
                </h3>
                <p className="text-sm text-zinc-500 max-w-sm mx-auto">
                  Try adjusting your search term or select a different category to discover available AI prompts.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md hover:bg-blue-500 transition-colors"
                >
                  Show All Prompts
                </button>
              </div>
            )}

            {/* Load More Posts Button */}
            {featureControls.loadMoreButton !== false && hasMore && (
              <div className="pt-10 pb-4 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 16, filteredPosts.length))}
                  className="px-8 py-3.5 rounded-full bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-sm shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2 group cursor-pointer"
                >
                  <span>Load More Prompts</span>
                  <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform duration-200" />
                </button>
              </div>
            )}
            {!hasMore && filteredPosts.length > 0 && (
              <div className="pt-8 pb-4 text-center">
                <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
                  ✨ You've viewed all {filteredPosts.length} prompts
                </p>
              </div>
            )}
            </div>
          </section>
        )}

          {/* Informational About Section ("What is Sahil Edits?") directly above footer */}
          <div className="max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 mb-8 w-full">
            <div className="w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-[2rem] p-6 sm:p-8 md:p-10 lg:p-12 border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none text-left transition-all">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0f172a] dark:text-white mb-4 tracking-tight">
                What is Sahil Edits?
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal mb-6">
                Sahil Edits is a premium AI prompt library created for creators, photographers, editors, designers, and AI enthusiasts. Discover carefully crafted and practical AI photo editing prompts for Gemini, ChatGPT, and other top AI tools. Our goal is to make high-quality prompts easy to discover, copy, and use, so anyone can create stunning visual results with just a few clicks.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-left">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Prompt Library</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Curated, tested prompt templates across trending styles and tools.</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Creative AI Prompts</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Optimized for Google Gemini, ChatGPT, Midjourney, and more.</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">1-Click Fast Copy</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Instant prompt copying without logins or complex steps.</p>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Free &amp; Regularly Updated</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Fresh creative prompts added and verified continuously.</p>
                </div>
              </div>
            </div>
          </div>
          </>
        )}

          {/* Bottom Banner Ad Position */}
          <div className="max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 py-2 w-full">
            <AdBanner position="bottomBanner" settings={monetizationSettings} />
          </div>
        </main>

        {/* 6. Footer with Page Modal Trigger */}
        {featureControls.footer && websiteSections.footer !== false && (
          <Footer
            onOpenPage={(page) => setActivePageModal(page)}
            onOpenPremium={() => setShowPremiumPage(true)}
          />
        )}
      </div>

      {/* Sticky Bottom Banner */}
      {monetizationSettings.enabled && monetizationSettings.positions.stickyBottomBanner && (
        <div className="fixed bottom-0 inset-x-0 z-30 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 py-2">
          <AdBanner position="stickyBottomBanner" settings={monetizationSettings} />
        </div>
      )}

      {/* 7. Floating Back to Top Button */}
      {featureControls.backToTopButton && (
        <AnimatePresence>
          {showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              onClick={scrollToTop}
              aria-label="Back to Top"
              className={`fixed ${
                monetizationSettings.enabled && monetizationSettings.positions.stickyBottomBanner
                  ? 'bottom-20 sm:bottom-20'
                  : 'bottom-6 sm:bottom-8'
              } right-5 sm:right-8 z-40 p-3.5 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer border border-white/20 backdrop-blur-md`}
            >
              <ArrowUp className="w-5 h-5" />
            </motion.button>
          )}
        </AnimatePresence>
      )}

      {/* MODALS */}
      {/* Detail Post View Modal */}
      <PromptModal
        post={activePromptModal}
        categories={categories}
        allPosts={publishedPosts}
        onClose={handleClosePromptModal}
        onSelectPost={(p) => handleOpenPromptModal(p)}
        onCopyPrompt={handleCopyPrompt}
        onOpenPage={(page) => setActivePageModal(page)}
      />

      {/* Policy & Custom Page View Modal */}
      <PageModal
        page={activePageModal}
        onClose={() => setActivePageModal(null)}
        onOpenPage={(p) => setActivePageModal(p)}
        onOpenPremium={() => {
          setActivePageModal(null);
          setShowPremiumPage(true);
        }}
      />

      {/* Firebase Login / Register Modal */}
      <LoginModal
        isOpen={showLoginModal}
        initialMode={loginModalMode}
        initialEmail={loginModalEmail}
        onClose={() => {
          setShowLoginModal(false);
          setLoginModalMode('login');
          setLoginModalEmail('');
        }}
        onLoginSuccess={(isAdminUser) => {
          setShowLoginModal(false);
          setLoginModalMode('login');
          setLoginModalEmail('');
          if (isAdminUser || isAdmin) {
            if (!window.location.pathname.startsWith('/admin')) {
              window.history.pushState({ type: 'admin', tab: 'dashboard' }, '', '/admin/dashboard');
            }
            setShowAdminDashboard(true);
          }
        }}
      />

      {/* Firebase Password Reset Modal (Triggered by email reset links) */}
      <ResetPasswordModal
        isOpen={showResetPasswordModal}
        oobCode={resetOobCode}
        onClose={() => {
          setShowResetPasswordModal(false);
          setResetOobCode(null);
          // Clear query params to clean URL
          if (window.location.search.includes('mode=') || window.location.search.includes('oobCode=') || window.location.pathname === '/reset-password') {
            window.history.replaceState(null, '', '/');
          }
        }}
        onSuccessLogin={(email) => {
          setShowResetPasswordModal(false);
          setResetOobCode(null);
          if (window.location.search.includes('mode=') || window.location.search.includes('oobCode=') || window.location.pathname === '/reset-password') {
            window.history.replaceState(null, '', '/');
          }
          setLoginModalMode('login');
          if (email) {
            setLoginModalEmail(email);
          }
          setShowLoginModal(true);
        }}
        onRequestNewLink={() => {
          setShowResetPasswordModal(false);
          setResetOobCode(null);
          if (window.location.search.includes('mode=') || window.location.search.includes('oobCode=') || window.location.pathname === '/reset-password') {
            window.history.replaceState(null, '', '/');
          }
          setLoginModalMode('reset');
          setShowLoginModal(true);
        }}
      />

      {/* User Profile & My Favorites Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onOpenPrompt={handleOpenPromptModal}
        onOpenAdminDashboard={() => {
          if (authLoading) return;
          if (isAdmin) {
            if (!window.location.pathname.startsWith('/admin')) {
              window.history.pushState({ type: 'admin', tab: 'dashboard' }, '', '/admin/dashboard');
            }
            setShowAdminDashboard(true);
          } else {
            setShowLoginModal(true);
            showToast('Admin Authentication Required', 'Please log in with an Admin account.', 'error');
          }
        }}
      />

      {/* Add / Edit Post Form Modal */}
      <PostFormModal
        isOpen={editingPostModal !== null}
        post={typeof editingPostModal === 'object' ? editingPostModal : null}
        categories={categories}
        onClose={() => setEditingPostModal(null)}
        onSave={handleSavePost}
      />

      {/* Add / Edit Category Form Modal */}
      <CategoryFormModal
        isOpen={editingCategoryModal !== null}
        category={typeof editingCategoryModal === 'object' ? editingCategoryModal : null}
        onClose={() => setEditingCategoryModal(null)}
        onSave={handleSaveCategory}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <LogoProvider>
            <AppContent />
          </LogoProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

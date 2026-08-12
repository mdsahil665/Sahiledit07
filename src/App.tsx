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
import { UserProfileModal } from './components/UserProfileModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { PremiumPage } from './components/PremiumPage';
import { PostFormModal } from './components/admin/PostFormModal';
import { CategoryFormModal } from './components/admin/CategoryFormModal';
import { SEOHelper } from './components/SEOHelper';
import { promptStore, sortPostsByCreatedAtDesc } from './services/promptStore';
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
  const { currentUser, isAdmin } = useAuth();
  const [posts, setPosts] = useState<PromptPost[]>(() => promptStore.getPosts());
  const [categories, setCategories] = useState<Category[]>(() => promptStore.getCategories());
  const [featureControls, setFeatureControls] = useState(() => promptStore.getFeatureControls());
  const [websiteSections, setWebsiteSections] = useState(() => promptStore.getWebsiteSections());
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
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

      if (search.includes('admin') || hash.includes('admin') || path.includes('/admin')) {
        if (isAdmin) {
          setShowAdminDashboard(true);
        } else {
          setShowLoginModal(true);
          showToast('Admin Authentication Required', 'Please log in with an Admin account.', 'error');
        }
      }

      if (search.includes('premium') || hash.includes('premium') || path.includes('/premium')) {
        setShowPremiumPage(true);
      }
    };

    checkUrlRoutes();
    window.addEventListener('popstate', checkUrlRoutes);
    window.addEventListener('hashchange', checkUrlRoutes);

    // Keyboard shortcut (Ctrl+Shift+A / Cmd+Shift+A)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        if (isAdmin) {
          setShowAdminDashboard(true);
        } else {
          setShowLoginModal(true);
          showToast('Admin Authentication Required', 'Please log in with an Admin account.', 'error');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', checkUrlRoutes);
      window.removeEventListener('hashchange', checkUrlRoutes);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdmin]);

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

  // Helper to match post to selected category
  const isPostInCategory = useCallback((post: PromptPost, catSelection: string | null) => {
    if (!catSelection) return true;
    const target = catSelection.trim().toLowerCase();

    // 1. Direct categoryId or categoryName
    if (post.categoryId && post.categoryId.toLowerCase() === target) return true;
    if (post.categoryName && post.categoryName.toLowerCase() === target) return true;

    // 2. Handle category aliases like man/men, woman/women, couple, family, birthday
    const aliasMap: Record<string, string[]> = {
      man: ['man', 'men', 'male', 'boy'],
      men: ['man', 'men', 'male', 'boy'],
      woman: ['woman', 'women', 'female', 'girl'],
      women: ['woman', 'women', 'female', 'girl'],
      couple: ['couple', 'couples', 'pair', 'romantic', 'love'],
      family: ['family', 'families', 'parents', 'kids'],
      birthday: ['birthday', 'bday', 'celebration', 'party'],
    };

    const aliases = aliasMap[target] || [target];

    // 3. Check tags
    if (post.tags && Array.isArray(post.tags)) {
      if (post.tags.some((tag) => aliases.some((a) => tag.toLowerCase().includes(a)))) {
        return true;
      }
    }

    // 4. Check title, description, prompt text
    const title = (post.title || '').toLowerCase();
    const desc = (post.shortDescription || '').toLowerCase();
    const prompt = (post.fullPrompt || '').toLowerCase();

    return aliases.some((a) => title.includes(a) || desc.includes(a) || prompt.includes(a));
  }, []);

  // Display name for selected category
  const selectedCategoryDisplayName = useMemo(() => {
    if (!selectedCategory) return null;
    const found = categories.find(
      (c) =>
        c.id.toLowerCase() === selectedCategory.toLowerCase() ||
        c.name.toLowerCase() === selectedCategory.toLowerCase() ||
        c.slug.toLowerCase() === selectedCategory.toLowerCase()
    );
    if (found) return found.name;
    return selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
  }, [selectedCategory, categories]);

  // Real post count for selected category
  const categoryPostCount = useMemo(() => {
    if (!selectedCategory) return 0;
    return publishedPosts.filter((p) => isPostInCategory(p, selectedCategory)).length;
  }, [publishedPosts, selectedCategory, isPostInCategory]);

  // Filtered & Sorted Posts based on Search, Category, and Active Tab
  const filteredPosts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = publishedPosts.filter((post) => {
      const matchesCategory = isPostInCategory(post, selectedCategory);
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
  }, [publishedPosts, selectedCategory, searchQuery, activeTab, isPostInCategory]);

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

    const newUrl = `?prompt=${encodeURIComponent(post.id)}`;
    window.history.pushState({ modalOpen: true, postId: post.id }, '', newUrl);
  }, []);

  const handleClosePromptModal = useCallback(() => {
    setActivePromptModal(null);
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.delete('prompt');
    searchParams.delete('p');
    searchParams.delete('post');
    const remainingSearch = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const cleanUrl = `${window.location.pathname}${remainingSearch}`;
    window.history.replaceState(null, '', cleanUrl || '/');

    setTimeout(() => {
      window.scrollTo({ top: savedScrollPosition.current, behavior: 'auto' });
    }, 30);
  }, []);

  // Parse URL search parameters on initial page load for deep-linking
  useEffect(() => {
    const pathname = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    let targetPromptId: string | null = null;

    if (pathname.startsWith('/post/')) {
      const parts = pathname.split('/post/');
      if (parts[1]) {
        targetPromptId = parts[1].replace(/\/$/, '');
      }
    } else if (urlParams.has('prompt') || urlParams.has('post') || urlParams.has('p')) {
      targetPromptId = urlParams.get('prompt') || urlParams.get('post') || urlParams.get('p');
    }

    if (targetPromptId) {
      const targetPost = promptStore.getPostById(targetPromptId);
      if (targetPost && targetPost.status === 'published') {
        setActivePromptModal(targetPost);
      } else {
        setActivePromptModal(null);
        window.history.replaceState(null, '', '/');
      }
    } else {
      // Direct visit or refresh at "/" ALWAYS renders the Home Page
      setActivePromptModal(null);
      if (hash && hash.startsWith('#post-')) {
        const cleanSearch = window.location.search;
        window.history.replaceState(null, '', `${pathname}${cleanSearch}` || '/');
      }
    }

    const catFromQuery = urlParams.get('category') || urlParams.get('c');
    if (catFromQuery) {
      setSelectedCategory(catFromQuery);
    }

    const pageFromQuery = urlParams.get('page');
    if (pageFromQuery) {
      const allPages = promptStore.getPages();
      const foundPage = allPages.find(
        (p) => p.slug === pageFromQuery || p.id === pageFromQuery || p.title.toLowerCase() === pageFromQuery.toLowerCase()
      );
      if (foundPage && foundPage.status === 'published') {
        setActivePageModal(foundPage);
      }
    }
  }, []);

  // Handle popstate for browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      const urlParams = new URLSearchParams(window.location.search);

      let targetPromptId: string | null = null;

      if (pathname.startsWith('/post/')) {
        const parts = pathname.split('/post/');
        if (parts[1]) {
          targetPromptId = parts[1].replace(/\/$/, '');
        }
      } else if (urlParams.has('prompt') || urlParams.has('post') || urlParams.has('p')) {
        targetPromptId = urlParams.get('prompt') || urlParams.get('post') || urlParams.get('p');
      }

      if (targetPromptId) {
        const targetPost = promptStore.getPostById(targetPromptId);
        if (targetPost && targetPost.status === 'published') {
          setActivePromptModal(targetPost);
          return;
        }
      }
      setActivePromptModal(null);

      const catFromQuery = urlParams.get('category') || urlParams.get('c');
      setSelectedCategory(catFromQuery || null);

      const pageFromQuery = urlParams.get('page');
      if (pageFromQuery) {
        const foundPage = promptStore.getPages().find((p) => p.slug === pageFromQuery || p.id === pageFromQuery);
        if (foundPage && foundPage.status === 'published') {
          setActivePageModal(foundPage);
        }
      } else {
        setActivePageModal(null);
      }

      setTimeout(() => {
        window.scrollTo({ top: savedScrollPosition.current, behavior: 'instant' });
      }, 30);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleCopyPrompt = useCallback((post: PromptPost) => {
    promptStore.incrementCopies(post.id);
  }, []);

  const handleSavePost = (
    postData: Omit<PromptPost, 'id' | 'createdAt' | 'updatedAt' | 'views' | 'copies'>,
    existingId?: string
  ) => {
    const targetId = existingId || (typeof editingPostModal === 'object' && editingPostModal ? editingPostModal.id : null);
    if (targetId) {
      promptStore.updatePost(targetId, postData);
      showToast('✓ Prompt Updated', 'Changes saved successfully');
    } else {
      promptStore.addPost(postData);
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

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory);

  // Protected Admin Dashboard Route
  if (showAdminDashboard) {
    if (!isAdmin) {
      // Direct access protection redirect
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
          onAddPost={() => setEditingPostModal('new')}
          onEditPost={(p) => setEditingPostModal(p)}
          onAddCategory={() => setEditingCategoryModal('new')}
          onEditCategory={(c) => setEditingCategoryModal(c)}
          onClose={() => setShowAdminDashboard(false)}
          onRefreshData={refreshData}
          onOpenPreviewModal={(p) => setActivePromptModal(p)}
          onOpenPageModal={(page) => setActivePageModal(page)}
        />

        {/* Modals triggerable from Admin Dashboard */}
        <PostFormModal
          isOpen={editingPostModal !== null}
          post={typeof editingPostModal === 'object' ? editingPostModal : null}
          categories={categories}
          onClose={() => setEditingPostModal(null)}
          onSave={handleSavePost}
        />

        <CategoryFormModal
          isOpen={editingCategoryModal !== null}
          category={typeof editingCategoryModal === 'object' ? editingCategoryModal : null}
          onClose={() => setEditingCategoryModal(null)}
          onSave={handleSaveCategory}
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
    <div className="relative min-h-screen flex flex-col justify-between bg-[#F8FAFC] dark:bg-[#090d16] bg-gradient-to-b from-[#EEF2FF] via-[#F8FAFC] to-[#F1F5F9] dark:from-[#090d16] dark:via-[#0f172a] dark:to-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans selection:bg-purple-500/20 selection:text-purple-600 overflow-x-hidden">
      {/* SEO Dynamic Metadata & JSON-LD Manager */}
      <SEOHelper
        activePrompt={activePromptModal}
        selectedCategory={selectedCategory}
        categories={categories}
        activePage={activePageModal}
        isAdminView={showAdminDashboard}
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
              <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                Sahil Edits is a premium AI prompt library created for creators, photographers, editors, designers, and AI enthusiasts. Discover carefully crafted and practical AI photo editing prompts for Gemini, ChatGPT, and other AI tools. Our goal is to make high-quality prompts easy to discover, copy, and use, so anyone can create stunning results with just a few clicks.
              </p>
            </div>
          </div>

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
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={(isAdminUser) => {
          setShowLoginModal(false);
          if (isAdminUser) {
            setShowAdminDashboard(true);
          }
        }}
      />

      {/* User Profile & My Favorites Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onOpenPrompt={handleOpenPromptModal}
        onOpenAdminDashboard={() => setShowAdminDashboard(true)}
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

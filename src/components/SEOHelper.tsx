import React, { useEffect } from 'react';
import { PromptPost, Category, CustomPage } from '../types';
import { getPostMainCoverImage } from '../lib/imageUtils';
import { getPromptShareUrl } from '../utils/promptUrl';

interface SEOHelperProps {
  activePrompt: PromptPost | null;
  selectedCategory: string | null;
  categories: Category[];
  activePage: CustomPage | null;
  isAdminView: boolean;
}

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://sahiledit.vercel.app';
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

export const SEOHelper: React.FC<SEOHelperProps> = ({
  activePrompt,
  selectedCategory,
  categories,
  activePage,
  isAdminView,
}) => {
  useEffect(() => {
    // 1. Determine Title, Description, Canonical URL, Image, and Robots policy
    let title = 'Sahil Edits – Premium AI Prompt Library';
    let description =
      'Discover, copy, and optimize high-precision AI prompts for ChatGPT, Gemini, Claude, Midjourney, and Flux updated daily by Sahil.';
    let canonical = `${BASE_URL}/`;
    let ogImage = DEFAULT_IMAGE;
    let robots = 'index, follow';
    let jsonLdData: any = null;

    if (isAdminView) {
      title = 'Admin Control Panel – Sahil Edits';
      description = 'System Administration & Content Management Panel';
      canonical = `${BASE_URL}/admin`;
      robots = 'noindex, nofollow';
    } else if (activePrompt) {
      const promptTitle = activePrompt.seoTitle || `${activePrompt.title} – Sahil Edits AI Prompt`;
      title = promptTitle;
      description =
        activePrompt.metaDescription ||
        activePrompt.shortDescription ||
        `Copy this high-precision AI prompt for ${activePrompt.categoryName || 'ChatGPT & Midjourney'}. 1-click copy on Sahil Edits.`;
      canonical = getPromptShareUrl(activePrompt);
      ogImage = getPostMainCoverImage(activePrompt);

      jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': canonical,
        url: canonical,
        name: activePrompt.title,
        description: activePrompt.shortDescription || activePrompt.fullPrompt,
        text: activePrompt.fullPrompt,
        image: ogImage,
        datePublished: activePrompt.createdAt,
        dateModified: activePrompt.updatedAt || activePrompt.createdAt,
        author: {
          '@type': 'Person',
          name: 'Sahil',
          url: BASE_URL,
        },
        publisher: {
          '@type': 'Organization',
          name: 'Sahil Edits',
          url: BASE_URL,
        },
        keywords: activePrompt.tags ? activePrompt.tags.join(', ') : 'AI prompts, ChatGPT, Midjourney',
        interactionStatistic: [
          {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/WatchAction',
            userInteractionCount: activePrompt.views || 0,
          },
          {
            '@type': 'InteractionCounter',
            interactionType: 'https://schema.org/LikeAction',
            userInteractionCount: activePrompt.likes || 0,
          },
        ],
      };
    } else if (activePage) {
      title = activePage.seoTitle || `${activePage.title} – Sahil Edits`;
      description = activePage.metaDescription || `Read ${activePage.title} on Sahil Edits AI Prompt Library.`;
      canonical = `${BASE_URL}/?page=${encodeURIComponent(activePage.slug)}`;

      jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': canonical,
        url: canonical,
        name: activePage.title,
        description: description,
        publisher: {
          '@type': 'Organization',
          name: 'Sahil Edits',
          url: BASE_URL,
        },
      };
    } else if (selectedCategory) {
      const foundCat = categories.find(
        (c) =>
          c.id.toLowerCase() === selectedCategory.toLowerCase() ||
          c.slug.toLowerCase() === selectedCategory.toLowerCase() ||
          c.name.toLowerCase() === selectedCategory.toLowerCase()
      );
      const catName = foundCat ? foundCat.name : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
      const catDesc = foundCat ? foundCat.description : `Browse top AI prompts for ${catName}.`;

      title = `${catName} AI Prompts – Sahil Edits Library`;
      description = `Explore, copy, and refine high-converting ${catName} AI prompts for ChatGPT, Gemini, Claude, Midjourney & Flux. ${catDesc}`;
      canonical = `${BASE_URL}/?category=${encodeURIComponent(foundCat ? foundCat.id : selectedCategory)}`;

      jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': canonical,
        url: canonical,
        name: `${catName} AI Prompts`,
        description: description,
        publisher: {
          '@type': 'Organization',
          name: 'Sahil Edits',
          url: BASE_URL,
        },
      };
    }

    // 2. Update Document Title
    document.title = title;

    // 3. Helper to update or create meta element
    const setMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let elem = document.querySelector(selector) as HTMLMetaElement;
      if (!elem) {
        elem = document.createElement('meta');
        elem.setAttribute(attrName, attrVal);
        document.head.appendChild(elem);
      }
      elem.setAttribute('content', content);
    };

    // Meta description & robots
    setMetaTag('meta[name="description"]', 'name', 'description', description);
    setMetaTag('meta[name="robots"]', 'name', 'robots', robots);

    // Open Graph
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);

    // Twitter Card
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    setMetaTag('meta[name="twitter:url"]', 'name', 'twitter:url', canonical);
    setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', ogImage);

    // Canonical link
    let canonicalElem = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalElem) {
      canonicalElem = document.createElement('link');
      canonicalElem.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalElem);
    }
    canonicalElem.setAttribute('href', canonical);

    // 4. Update JSON-LD structured data script
    let scriptElem = document.getElementById('seo-dynamic-jsonld') as HTMLScriptElement;
    if (jsonLdData) {
      if (!scriptElem) {
        scriptElem = document.createElement('script');
        scriptElem.id = 'seo-dynamic-jsonld';
        scriptElem.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptElem);
      }
      scriptElem.textContent = JSON.stringify(jsonLdData, null, 2);
    } else if (scriptElem) {
      scriptElem.remove();
    }
  }, [activePrompt, selectedCategory, categories, activePage, isAdminView]);

  return null;
};

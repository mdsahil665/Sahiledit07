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
  isRouteNotFound?: boolean;
}

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://sahiledit.vercel.app';
const DEFAULT_IMAGE = 'https://res.cloudinary.com/i4v4x4eg/image/upload/v1788598067/l1t2aclxe7u0pjepokvu.png';

export const SEOHelper: React.FC<SEOHelperProps> = ({
  activePrompt,
  selectedCategory,
  categories,
  activePage,
  isAdminView,
  isRouteNotFound = false,
}) => {
  useEffect(() => {
    // 1. Determine Title, Description, Canonical URL, Image, and Robots policy
    let title = 'Sahil Edit Vercel – Sahil Edits AI Prompt Library';
    let description =
      'Sahil Edit Vercel – Official Sahil Edits AI Prompt Library featuring creative AI image prompts, cinematic prompts, photography prompts and more.';
    let ogTitle = 'Sahil Edit Vercel – Sahil Edits AI Prompt Library';
    let ogDescription = 'Sahil Edit Vercel – Official Sahil Edits AI Prompt Library.';
    let canonical = `${BASE_URL}/`;
    let ogImage = DEFAULT_IMAGE;
    let robots = 'index, follow';
    let jsonLdData: any = null;

    if (isRouteNotFound) {
      title = 'Page Not Found – Sahil Edits';
      description = 'The requested AI prompt or page could not be found on Sahil Edits – Premium AI Prompt Library.';
      ogTitle = title;
      ogDescription = description;
      robots = 'noindex, follow';
    } else if (isAdminView) {
      title = 'Admin Control Panel – Sahil Edits';
      description = 'System Administration & Content Management Panel';
      ogTitle = title;
      ogDescription = description;
      canonical = `${BASE_URL}/admin`;
      robots = 'noindex, nofollow';
    } else if (activePrompt) {
      const promptTitle = activePrompt.seoTitle || `${activePrompt.title} – Sahil Edits`;
      title = promptTitle;
      description =
        activePrompt.metaDescription ||
        activePrompt.shortDescription ||
        `Explore and copy this AI prompt from Sahil Edits: ${activePrompt.title}. Instant 1-click copy for AI image and text generation.`;
      ogTitle = promptTitle;
      ogDescription = description;
      canonical = getPromptShareUrl(activePrompt);
      ogImage = getPostMainCoverImage(activePrompt);

      jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        '@id': canonical,
        url: canonical,
        name: activePrompt.title,
        headline: activePrompt.title,
        description: description,
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
          logo: {
            '@type': 'ImageObject',
            url: DEFAULT_IMAGE,
          },
        },
        keywords: (activePrompt.keywords && activePrompt.keywords.length > 0)
          ? activePrompt.keywords.join(', ')
          : (activePrompt.tags ? activePrompt.tags.join(', ') : 'Sahil Edits, AI prompts, ChatGPT, Midjourney, Flux'),
      };

      if (ogImage) {
        jsonLdData.image = {
          '@type': 'ImageObject',
          url: ogImage,
          caption: activePrompt.altText || activePrompt.title,
        };
      }
    } else if (activePage) {
      title = activePage.seoTitle || `${activePage.title} – Sahil Edits`;
      description = activePage.metaDescription || `Read ${activePage.title} on Sahil Edits – Premium AI Prompt Library.`;
      ogTitle = title;
      ogDescription = description;
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
          logo: {
            '@type': 'ImageObject',
            url: DEFAULT_IMAGE,
          },
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
      const catDesc = foundCat ? foundCat.description : `Browse top creative AI prompts for ${catName} on Sahil Edits.`;

      title = `${catName} Prompts – Sahil Edits`;
      description = `${catDesc} Explore curated ${catName} prompts with 1-click copy on Sahil Edits AI Prompt Library.`;
      ogTitle = title;
      ogDescription = description;
      canonical = `${BASE_URL}/?category=${encodeURIComponent(foundCat ? foundCat.id : selectedCategory)}`;

      jsonLdData = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': canonical,
        url: canonical,
        name: `${catName} AI Prompts – Sahil Edits`,
        description: description,
        publisher: {
          '@type': 'Organization',
          name: 'Sahil Edits',
          url: BASE_URL,
          logo: {
            '@type': 'ImageObject',
            url: DEFAULT_IMAGE,
          },
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
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', ogTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', ogDescription);
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonical);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);
    if (activePrompt && (activePrompt.altText || activePrompt.title)) {
      setMetaTag('meta[property="og:image:alt"]', 'property', 'og:image:alt', activePrompt.altText || activePrompt.title);
      setMetaTag('meta[name="twitter:image:alt"]', 'name', 'twitter:image:alt', activePrompt.altText || activePrompt.title);
    }

    // Twitter Card
    setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', ogTitle);
    setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', ogDescription);
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

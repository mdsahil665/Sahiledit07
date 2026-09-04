import { Category, PromptPost, CustomPage } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    slug: 'chatgpt',
    icon: 'Bot',
    color: 'emerald',
    bgLight: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    description: 'Expert prompts for ChatGPT 4o, custom GPTs, reasoning & writing.'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    slug: 'gemini',
    icon: 'Sparkles',
    color: 'blue',
    bgLight: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    description: 'Multimodal, search grounded and long-context prompts for Google Gemini.'
  },
  {
    id: 'image-prompt',
    name: 'Image Prompt',
    slug: 'image-prompt',
    icon: 'Image',
    color: 'purple',
    bgLight: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    description: 'Photorealistic, 3D render & artistic prompts for Midjourney, Flux & DALL-E 3.'
  },
  {
    id: 'video',
    name: 'Video',
    slug: 'video',
    icon: 'Video',
    color: 'rose',
    bgLight: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    description: 'Cinematic AI video generation prompts for Runway Gen-3, Luma Dream Machine, Sora, Kling & Pika.'
  }
];

export const INITIAL_PROMPTS: PromptPost[] = [
  {
    id: 'prompt-1',
    title: 'Cyberpunk Neon Street Samurai Portrait (Midjourney v6)',
    shortDescription: 'Ultra-detailed cinematic portrait with volumetric lighting and rain reflections.',
    fullPrompt: 'Cinematic film still, a close-up portrait of a cyberpunk samurai wearing a glowing translucent obsidian helmet with iridescent visor reflection, neon-lit rainy Tokyo alleyway in background, volumetric fog, dynamic rim lighting in deep cyan and magenta, shot on 85mm f/1.2 lens, photorealistic 8k render, hyper detailed textures, octane render, vivid detail --ar 16:9 --style raw --v 6.0',
    categoryId: 'image-prompt',
    tags: ['Midjourney', 'Cyberpunk', 'Photorealistic', '3D', 'Cinematic'],
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=1200&q=80',
    views: 4820,
    copies: 1340,
    likes: 312,
    featured: true,
    trending: false,
    status: 'published',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
    seoTitle: 'Cyberpunk Samurai Midjourney v6 Prompt - Sahil Edits',
    metaDescription: 'Copy the best Midjourney v6 prompt for cyberpunk portraits with glowing neon effects.'
  },
  {
    id: 'prompt-2',
    title: 'Senior Software Architect Code Refactoring System (ChatGPT / Claude)',
    shortDescription: 'Transforms messy legacy code into clean, scalable TypeScript/React design patterns.',
    fullPrompt: `Act as a Principal Software Architect with 15+ years of experience in distributed systems and clean code architecture. I will provide you with a code snippet.

Your task is to review and refactor it according to the following standards:
1. Identify code smells, security vulnerabilities, and performance bottlenecks.
2. Apply Clean Code principles (SOLID, DRY, KISS).
3. Provide a fully rewritten, production-grade version in TypeScript with strict type definitions and detailed JSDoc comments.
4. Explain your refactoring decisions step-by-step with before/after complexity comparison (Time & Space complexity).
5. Include unit test cases using Vitest/Jest to cover edge cases.

Here is the code to refactor:
[PASTE YOUR CODE HERE]`,
    categoryId: 'chatgpt',
    tags: ['Coding', 'Architecture', 'TypeScript', 'Refactoring', 'ChatGPT-4o'],
    imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    views: 3950,
    copies: 1120,
    likes: 248,
    featured: false,
    trending: true,
    status: 'published',
    createdAt: '2026-08-02T14:30:00.000Z',
    updatedAt: '2026-08-02T14:30:00.000Z',
    seoTitle: 'Expert Code Refactoring AI Prompt - Sahil Edits',
    metaDescription: 'Use this principal engineer prompt to rewrite legacy code into clean TypeScript.'
  },
  {
    id: 'prompt-3',
    title: 'High-Converting SaaS Landing Page Hero Copy Framework',
    shortDescription: 'Generates headline, subheadline, value points, and CTAs designed for 10%+ conversion rates.',
    fullPrompt: `You are a world-class SaaS Conversion Rate Optimization (CRO) Copywriter. Write a high-converting Hero Section for a new AI software product described below:

Product Name: [INSERT PRODUCT NAME]
Target Audience: [INSERT TARGET AUDIENCE]
Core Problem Solved: [INSERT PROBLEM]
Primary Benefit: [INSERT BENEFIT]

Please generate 3 distinct variations of the Hero Section containing:
1. Punchy Headline (max 8 words, focus on outcome over features).
2. Supporting Subheadline (2 sentences detailing how it works and time-to-value).
3. 3 Key Bullet Points with benefit-driven micro-copy.
4. Primary CTA button text & Secondary risk-reversal micro-copy (e.g., "No credit card required • 14-day free trial").
5. Social proof headline concept (e.g., "Trusted by 5,000+ developers").`,
    categoryId: 'chatgpt',
    tags: ['Marketing', 'Copywriting', 'SaaS', 'Conversion', 'ChatGPT'],
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    views: 3120,
    copies: 890,
    likes: 175,
    featured: false,
    trending: false,
    status: 'published',
    createdAt: '2026-08-03T09:15:00.000Z',
    updatedAt: '2026-08-03T09:15:00.000Z',
    seoTitle: 'SaaS Hero Copywriter Prompt - Sahil Edits',
    metaDescription: 'Generate magnetic high-converting SaaS landing page hero sections with AI.'
  },
  {
    id: 'prompt-4',
    title: '3D Hyper-Minimalist App Icon Design Concept (Flux.1 / DALL-E 3)',
    shortDescription: 'Modern glassmorphism floating icon with soft pastel lighting and studio shadows.',
    fullPrompt: 'A smooth 3D minimalist app icon depicting a translucent glass sphere interwoven with a floating glowing iridescent ribbon logo, soft pastel gradient color palette of royal blue, electric violet and frosty cyan, matte dark clay pedestal background, soft studio lighting, subtle shadow drop, 4k resolution, clean vector finish, isometric angle --ar 1:1',
    categoryId: 'image-prompt',
    tags: ['Logo', '3D', 'App Icon', 'Glassmorphism', 'DALL-E 3', 'Flux'],
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    views: 2840,
    copies: 760,
    likes: 142,
    featured: false,
    trending: false,
    status: 'published',
    createdAt: '2026-08-03T11:45:00.000Z',
    updatedAt: '2026-08-03T11:45:00.000Z',
    seoTitle: '3D Minimalist App Icon AI Prompt - Sahil Edits',
    metaDescription: 'Create glassmorphism 3D app icons and logos using DALL-E 3 and Flux prompts.'
  },
  {
    id: 'prompt-5',
    title: 'Viral YouTube Thumbnail Generator with Expressive Portrait',
    shortDescription: 'High contrast thumbnail layout prompt with glowing outlines and bold typography.',
    fullPrompt: 'High impact YouTube thumbnail image prompt: Split composition, left side features a hyper-expressive close-up portrait of a young male creator looking shocked with glowing white neon outline effect around shoulders, right side features a floating 3D metallic golden brain emitting volumetric laser rays, dark navy bokeh background with high contrast yellow and white bold text banner reading "AI IS CHANGING!", 8k resolution, vibrant color grading, max detail --ar 16:9',
    categoryId: 'image-prompt',
    tags: ['YouTube', 'Thumbnail', 'Viral', 'Graphic Design', 'Midjourney'],
    imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80',
    views: 2510,
    copies: 680,
    likes: 118,
    featured: false,
    trending: false,
    status: 'published',
    createdAt: '2026-08-03T16:20:00.000Z',
    updatedAt: '2026-08-03T16:20:00.000Z',
    seoTitle: 'Viral YouTube Thumbnail AI Prompt - Sahil Edits',
    metaDescription: 'Boost YouTube CTR with high contrast expressive portrait thumbnail prompts.'
  },
  {
    id: 'prompt-6',
    title: 'Programmatic SEO Content Outline & Cluster Strategy (Gemini 1.5 Pro)',
    shortDescription: 'Creates 10 pillar topic clusters with internal linking strategy & schema data.',
    fullPrompt: `Act as an SEO Specialist and Content Director. Generate a comprehensive Programmatic SEO Strategy for the niche keyword: [INSERT PRIMARY KEYWORD / NICHE].

Provide:
1. **10 Sub-topic Clusters**: High intent, long-tail variations mapped by search volume & search intent (Informational, Transactional, Commercial).
2. **Comprehensive Content Outline**:
   - H1 Title with exact target keyword.
   - H2 and H3 Headings structure with secondary keywords integrated naturally.
   - Recommended Word Count and Target Readability level.
3. **Internal Linking Blueprint**: Show how each cluster links back to the main pillar page.
4. **JSON-LD Schema Markup**: Provide Article or FAQ Schema code block ready to copy.
5. **Meta Title & Meta Description**: Optimized for max CTR in search engine results.`,
    categoryId: 'gemini',
    tags: ['SEO', 'Gemini', 'Content Strategy', 'Schema', 'Traffic'],
    imageUrl: 'https://images.unsplash.com/photo-1571786256017-aee7a0c009b6?auto=format&fit=crop&w=1200&q=80',
    views: 2190,
    copies: 590,
    likes: 95,
    featured: false,
    trending: false,
    status: 'published',
    createdAt: '2026-08-04T08:00:00.000Z',
    updatedAt: '2026-08-04T08:00:00.000Z',
    seoTitle: 'Programmatic SEO Strategy AI Prompt - Sahil Edits',
    metaDescription: 'Master SEO rankings with automated topic clusters and schema generator prompts.'
  }
];

export const INITIAL_PAGES: CustomPage[] = [
  {
    id: 'page-privacy',
    title: 'Privacy Policy',
    slug: 'privacy-policy',
    content: `## Privacy Policy
At **Sahil Edits**, we respect your privacy. We do not collect personal identifying information unless explicitly provided. Usage logs and copy counts are aggregated anonymously to optimize search quality and prompt performance.

### Data We Collect
- Anonymous usage statistics (prompt views, copy counts).
- Browser local storage keys for caching your dark mode preferences and active search states.

### Data Security
All database records are protected via secure Firebase Firestore rules and HTTPS transport encryption.`,
    seoTitle: 'Privacy Policy - Sahil Edits',
    metaDescription: 'Read the privacy policy for Sahil Edits AI Prompt Library.',
    status: 'published',
    isSystem: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'page-terms',
    title: 'Terms & Conditions',
    slug: 'terms-and-conditions',
    content: `## Terms & Conditions
All AI prompts and templates provided on **Sahil Edits** are free to use, modify, and integrate into personal or commercial projects.

### Permitted Uses
- You may copy, adapt, and run these prompts in ChatGPT, Gemini, Claude, Midjourney, Flux, or any other AI tool.
- You may use outputs created from these prompts for commercial products, clients, or publication.

### Prohibited Uses
- Re-distributing or re-selling our prompt database as a paid digital asset without express written consent is strictly prohibited.`,
    seoTitle: 'Terms & Conditions - Sahil Edits',
    metaDescription: 'Terms and conditions for using Sahil Edits prompts.',
    status: 'published',
    isSystem: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'page-disclaimer',
    title: 'Disclaimer',
    slug: 'disclaimer',
    content: `## Disclaimer
Prompts provided on **Sahil Edits** are designed for various generative AI platforms (including ChatGPT, Gemini, Claude, Midjourney, and Flux). 

Outputs generated by external AI models are determined by third-party services and are provided as-is without performance guarantees or warranties.`,
    seoTitle: 'Disclaimer - Sahil Edits',
    metaDescription: 'Disclaimer for external AI model outputs on Sahil Edits.',
    status: 'published',
    isSystem: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'page-about',
    title: 'About Us',
    slug: 'about-us',
    content: `## About Us
**Sahil Edits** is a clean, curated AI Prompt Library created by **Sahil**. Our mission is to provide high-precision, copy-ready prompts for creators, developers, designers, and marketers around the world.

### Our Mission
To democratize advanced generative AI engineering by crafting tested, reliable prompts that save time and inspire innovation.`,
    seoTitle: 'About Us - Sahil Edits',
    metaDescription: 'Learn about Sahil Edits and our mission for AI prompt curation.',
    status: 'published',
    isSystem: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'page-contact',
    title: 'Contact Us',
    slug: 'contact-us',
    content: `## Contact Us
Have a prompt recommendation, business inquiry, or feature request?

Reach out directly via email at **mdsahil012002@gmail.com**. We respond to inquiries within 24-48 business hours.`,
    seoTitle: 'Contact Us - Sahil Edits',
    metaDescription: 'Contact Sahil Edits for inquiries and prompt submissions.',
    status: 'published',
    isSystem: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'page-dmca',
    title: 'DMCA Policy',
    slug: 'dmca',
    content: `## DMCA Policy
**Sahil Edits** respects intellectual property rights. If you believe any content on our platform infringes your copyright, please notify us immediately with full details at **mdsahil012002@gmail.com**.`,
    seoTitle: 'DMCA Policy - Sahil Edits',
    metaDescription: 'DMCA copyright policy for Sahil Edits.',
    status: 'published',
    isSystem: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'page-refund',
    title: 'Refund Policy',
    slug: 'refund-policy',
    content: `## Refund Policy
All prompts, tools, and resources on **Sahil Edits** are currently provided 100% free of charge. No payment credentials or purchase subscriptions are required.`,
    seoTitle: 'Refund Policy - Sahil Edits',
    metaDescription: 'Refund policy for free resources on Sahil Edits.',
    status: 'published',
    isSystem: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'page-cookie',
    title: 'Cookie Policy',
    slug: 'cookie-policy',
    content: `## Cookie Policy
**Sahil Edits** uses local storage and standard anonymous cookies to preserve your site preferences (e.g., Dark Mode) and prevent duplicate analytics counting.`,
    seoTitle: 'Cookie Policy - Sahil Edits',
    metaDescription: 'Cookie policy for Sahil Edits.',
    status: 'published',
    isSystem: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
];

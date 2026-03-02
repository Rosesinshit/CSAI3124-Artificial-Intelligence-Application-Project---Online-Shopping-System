import { useEffect, useRef } from 'react';

/**
 * SEO Head Component (Block Y - Y2, Y3)
 * Dynamically manages document head for meta tags, Open Graph, and structured data.
 *
 * Props:
 * - title: Page title
 * - description: Meta description
 * - keywords: Meta keywords
 * - canonical: Canonical URL (should be absolute)
 * - ogTitle, ogDescription, ogImage, ogUrl, ogType: Open Graph tags
 * - twitterCard, twitterTitle, twitterDescription, twitterImage: Twitter Card tags
 * - jsonLd: JSON-LD structured data object (or array of objects)
 * - noindex: If true, sets robots to 'noindex, nofollow'
 */
export default function SEOHead({
  title,
  description,
  keywords,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  ogType = 'website',
  ogSiteName = 'ShopOnline',
  twitterCard = 'summary_large_image',
  twitterTitle,
  twitterDescription,
  twitterImage,
  jsonLd,
  noindex = false,
}) {
  const createdElementsRef = useRef([]);

  useEffect(() => {
    // Track all elements we create/manage so we can clean them up
    const managedElements = [];

    // Set document title
    const prevTitle = document.title;
    if (title) {
      document.title = title;
    }

    // Helper: create or update a meta tag, track it for cleanup
    const setMeta = (name, content, property = false) => {
      const selector = property
        ? `meta[property="${name}"]`
        : `meta[name="${name}"]`;
      let el = document.querySelector(selector);

      if (!content) {
        // Remove existing tag if content is empty
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
        return;
      }

      if (!el) {
        el = document.createElement('meta');
        if (property) {
          el.setAttribute('property', name);
        } else {
          el.setAttribute('name', name);
        }
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
      managedElements.push({ type: 'meta', selector, el });
    };

    // Basic meta tags
    setMeta('description', description);
    setMeta('keywords', keywords);
    setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonical);
      managedElements.push({ type: 'link', el: canonicalLink });
    } else if (canonicalLink && canonicalLink.parentNode) {
      // Remove stale canonical if this page doesn't specify one
      canonicalLink.parentNode.removeChild(canonicalLink);
    }

    // Open Graph tags
    setMeta('og:title', ogTitle || title, true);
    setMeta('og:description', ogDescription || description, true);
    setMeta('og:image', ogImage, true);
    setMeta('og:url', ogUrl || canonical, true);
    setMeta('og:type', ogType, true);
    setMeta('og:site_name', ogSiteName, true);

    // Twitter Card tags
    setMeta('twitter:card', twitterCard);
    setMeta('twitter:title', twitterTitle || ogTitle || title);
    setMeta('twitter:description', twitterDescription || ogDescription || description);
    setMeta('twitter:image', twitterImage || ogImage);

    // JSON-LD structured data - use separate <script> tags for each object
    // Remove any previously injected JSON-LD
    document.querySelectorAll('script[data-seo-jsonld]').forEach(el => {
      if (el.parentNode) el.parentNode.removeChild(el);
    });

    const scriptTags = [];
    if (jsonLd) {
      const ldItems = Array.isArray(jsonLd) ? jsonLd.filter(Boolean) : [jsonLd];
      for (const item of ldItems) {
        const scriptTag = document.createElement('script');
        scriptTag.type = 'application/ld+json';
        scriptTag.setAttribute('data-seo-jsonld', 'true');
        scriptTag.textContent = JSON.stringify(item);
        document.head.appendChild(scriptTag);
        scriptTags.push(scriptTag);
      }
    }

    createdElementsRef.current = managedElements;

    // Cleanup function
    return () => {
      // Remove JSON-LD script tags
      scriptTags.forEach(tag => {
        if (tag.parentNode) tag.parentNode.removeChild(tag);
      });

      // Remove canonical link we created
      const canon = document.querySelector('link[rel="canonical"]');
      if (canon && canon.parentNode) {
        canon.parentNode.removeChild(canon);
      }

      // Restore previous title
      document.title = prevTitle;
    };
  }, [title, description, keywords, canonical, ogTitle, ogDescription, ogImage, ogUrl, ogType, ogSiteName, twitterCard, twitterTitle, twitterDescription, twitterImage, jsonLd, noindex]);

  return null; // This component doesn't render anything visible
}

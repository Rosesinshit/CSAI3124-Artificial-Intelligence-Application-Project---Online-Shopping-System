import { useEffect } from 'react';

/**
 * SEO Head Component (Block Y - Y2, Y3)
 * Dynamically manages document head for meta tags, Open Graph, and structured data.
 * 
 * Props:
 * - title: Page title
 * - description: Meta description
 * - keywords: Meta keywords
 * - canonical: Canonical URL
 * - ogTitle, ogDescription, ogImage, ogUrl, ogType: Open Graph tags
 * - twitterCard, twitterTitle, twitterDescription, twitterImage: Twitter Card tags
 * - jsonLd: JSON-LD structured data object (or array of objects)
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
}) {
  useEffect(() => {
    // Set document title
    if (title) {
      document.title = title;
    }

    const metaTags = [];

    // Helper function to set meta tag
    const setMeta = (name, content, property = false) => {
      if (!content) return;
      let el = property
        ? document.querySelector(`meta[property="${name}"]`)
        : document.querySelector(`meta[name="${name}"]`);
      
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
      metaTags.push(el);
    };

    // Basic meta tags
    setMeta('description', description);
    setMeta('keywords', keywords);
    setMeta('robots', 'index, follow');

    // Canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonical);
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

    // JSON-LD structured data
    let scriptTag = document.querySelector('script[data-seo-jsonld]');
    if (jsonLd) {
      const ldData = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.type = 'application/ld+json';
        scriptTag.setAttribute('data-seo-jsonld', 'true');
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(ldData.length === 1 ? ldData[0] : ldData);
    }

    // Cleanup function
    return () => {
      // We don't remove meta tags on cleanup to avoid flickering,
      // they'll be overwritten by the next page.
      // Only remove JSON-LD on unmount
      if (scriptTag && scriptTag.parentNode) {
        scriptTag.parentNode.removeChild(scriptTag);
      }
    };
  }, [title, description, keywords, canonical, ogTitle, ogDescription, ogImage, ogUrl, ogType, ogSiteName, twitterCard, twitterTitle, twitterDescription, twitterImage, jsonLd]);

  return null; // This component doesn't render anything visible
}

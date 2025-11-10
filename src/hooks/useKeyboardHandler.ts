import { useEffect } from 'react';

/**
 * Hook to handle mobile keyboard appearance smoothly
 * Prevents viewport jumping and zooming when keyboard opens
 */
export const useKeyboardHandler = () => {
  useEffect(() => {
    // Only run on mobile devices
    if (typeof window === 'undefined' || !window.visualViewport) {
      return;
    }

    const handleViewportResize = () => {
      // Get the visual viewport (excludes keyboard)
      const viewport = window.visualViewport;
      if (!viewport) return;

      // Lock the document height to prevent jumping
      const documentHeight = document.documentElement.clientHeight;
      document.documentElement.style.setProperty('--viewport-height', `${documentHeight}px`);

      // Prevent scroll on resize
      const scrollY = window.scrollY;
      window.scrollTo(0, scrollY);
    };

    const handleScroll = (e: Event) => {
      // Prevent default scroll behavior when keyboard is open
      if (window.visualViewport && window.visualViewport.height < window.innerHeight * 0.75) {
        e.preventDefault();
      }
    };

    // Listen to visual viewport changes
    window.visualViewport?.addEventListener('resize', handleViewportResize);
    window.visualViewport?.addEventListener('scroll', handleViewportResize);

    // Prevent unwanted scroll
    window.addEventListener('scroll', handleScroll, { passive: false });

    // Set initial height
    handleViewportResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportResize);
      window.visualViewport?.removeEventListener('scroll', handleViewportResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
};

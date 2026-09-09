import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-[45] p-3 rounded-full bg-amber-600 hover:bg-amber-500 text-white shadow-lg transition-all duration-300 transform hover:-translate-y-1"
      aria-label="Vissza a tetejére"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}

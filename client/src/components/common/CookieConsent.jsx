import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({ marketing: true, analytics: true, date: new Date().toISOString() }));
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({ marketing: false, analytics: false, date: new Date().toISOString() }));
    setIsVisible(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem('cookie-consent', JSON.stringify({ marketing: false, analytics: false, date: new Date().toISOString() }));
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="container-wide">
            <div className="bg-white rounded-2xl shadow-elevated p-6 border border-cream-200">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-tea-900 mb-1">
                    Nous utilisons des cookies
                  </h3>
                  <p className="text-sm text-tea-600">
                    Ce site utilise des cookies pour améliorer votre expérience. Les cookies essentiels sont nécessaires au fonctionnement du site.
                    Vous pouvez accepter ou refuser les cookies analytiques et marketing.{' '}
                    <a href="/privacy" className="text-matcha-600 underline hover:text-matcha-700">En savoir plus</a>
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 shrink-0">
                  <Button variant="ghost" size="sm" onClick={handleEssentialOnly}>
                    Essentiels uniquement
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleReject}>
                    Tout refuser
                  </Button>
                  <Button variant="primary" size="sm" onClick={handleAccept}>
                    Tout accepter
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

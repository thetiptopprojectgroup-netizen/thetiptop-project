import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

const STORAGE_KEY = 'pwa-install-dismissed';
const DISMISS_DAYS = 7;

function getDismissedUntil() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const t = parseInt(raw, 10);
    return isNaN(t) ? null : t;
  } catch {
    return null;
  }
}

function setDismissedUntil() {
  try {
    const t = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, String(t));
  } catch {}
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true
      || document.referrer.includes('android-app://');
    setIsStandalone(standalone);

    if (standalone) return;

    const dismissedUntil = getDismissedUntil();
    if (dismissedUntil && Date.now() < dismissedUntil) return;

    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
    setIsIOS(ios);

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    if (ios) {
      setVisible(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setVisible(false);
      } finally {
        setIsInstalling(false);
      }
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissedUntil();
  };

  if (!visible || isStandalone) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.25 }}
        className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-6"
      >
        <div className="mx-auto max-w-lg rounded-2xl bg-tea-900 text-white shadow-xl border border-tea-700 overflow-hidden">
          <div className="p-4 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-matcha-500/30 flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6 text-matcha-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-lg">Installer Thé Tip Top</h3>
              <p className="text-sm text-cream-200 mt-0.5">
                {isIOS
                  ? 'Ajoutez l\'app à votre écran d\'accueil : menu ⋮ ou Partager → « Sur l\'écran d\'accueil ».'
                  : 'Installez l\'application pour y accéder plus vite depuis votre bureau ou votre téléphone.'}
              </p>
              <div className="flex items-center gap-2 mt-3">
                {deferredPrompt && !isIOS ? (
                  <button
                    type="button"
                    onClick={handleInstall}
                    disabled={isInstalling}
                    className="px-4 py-2 rounded-xl bg-matcha-500 hover:bg-matcha-600 text-white font-medium text-sm transition-colors disabled:opacity-60"
                  >
                    {isInstalling ? 'Installation…' : 'Installer'}
                  </button>
                ) : null}
                {isIOS && (
                  <span className="text-xs text-cream-300">
                    Safari → Partager → Sur l&apos;écran d&apos;accueil
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

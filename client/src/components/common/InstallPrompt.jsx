import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

const STORAGE_KEY = 'pwa-install-dismissed';
const DISMISS_LATER_HOURS = 24;
const DISMISS_DAYS = 7;
/** Délai avant d’afficher le bandeau : l’utilisateur voit d’abord le site. */
const SHOW_DELAY_MS = 6000;

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

function setDismissedUntil(hours = DISMISS_DAYS * 24) {
  try {
    const t = Date.now() + hours * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, String(t));
  } catch {
    return;
  }
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [delayPassed, setDelayPassed] = useState(false);
  const canShowRef = useRef(false);

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
    if (ios) canShowRef.current = true;

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      canShowRef.current = true;
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    const timer = setTimeout(() => {
      setDelayPassed(true);
    }, SHOW_DELAY_MS);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
    };
  }, []);

  // Afficher le bandeau quand le délai est passé ET (iOS ou navigateur a proposé l’install).
  useEffect(() => {
    if (!delayPassed || isStandalone) return;
    if (isIOS || deferredPrompt) setVisible(true);
  }, [delayPassed, isStandalone, isIOS, deferredPrompt]);

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

  const handleDismissLater = () => {
    setVisible(false);
    setDismissedUntil(DISMISS_LATER_HOURS);
  };

  const handleDismissNotNow = () => {
    setVisible(false);
    setDismissedUntil(DISMISS_DAYS * 24);
  };

  if (!visible || isStandalone) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-6 safe-area-pb"
      >
        <div className="mx-auto max-w-lg rounded-2xl bg-tea-900 text-white shadow-xl border border-tea-700 overflow-hidden">
          <div className="p-4 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-matcha-500/30 flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6 text-matcha-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-semibold text-lg">Installer l’application</h3>
              <p className="text-sm text-cream-200 mt-0.5">
                {isIOS
                  ? 'Accédez au jeu plus vite : ajoutez Thé Tip Top sur l’écran d’accueil. Safari → Partager → « Sur l’écran d’accueil ».'
                  : 'Accédez au jeu comme une app depuis votre bureau ou votre téléphone, sans repasser par le navigateur.'}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
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
                <button
                  type="button"
                  onClick={handleDismissLater}
                  className="px-3 py-2 rounded-xl text-cream-200 hover:bg-white/10 text-sm transition-colors"
                >
                  Plus tard
                </button>
                <button
                  type="button"
                  onClick={handleDismissNotNow}
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

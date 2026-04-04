import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download } from 'lucide-react';

const STORAGE_KEY = 'pwa-install-dismissed';
const DISMISS_LATER_HOURS = 24;
const DISMISS_REFUSE_DAYS = 180;

/** Délai avant d’afficher le bandeau (laisser la page se charger). */
const SHOW_DELAY_MS = 2800;

function getDismissedUntil() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const t = parseInt(raw, 10);
    return Number.isNaN(t) ? null : t;
  } catch {
    return null;
  }
}

function setDismissedUntil(hoursFromNow) {
  try {
    const t = Date.now() + hoursFromNow * 60 * 60 * 1000;
    localStorage.setItem(STORAGE_KEY, String(t));
  } catch {
    /* ignore */
  }
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [delayPassed, setDelayPassed] = useState(false);

  const hide = useCallback(() => setVisible(false), []);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');
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
    };

    const onAppInstalled = () => {
      hide();
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    const timer = setTimeout(() => setDelayPassed(true), SHOW_DELAY_MS);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, [hide]);

  useEffect(() => {
    if (delayPassed && !isStandalone) setVisible(true);
  }, [delayPassed, isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') hide();
      setDeferredPrompt(null);
    } finally {
      setIsInstalling(false);
    }
  };

  /** Refuser : ne plus proposer pendant longtemps */
  const handleDecline = () => {
    hide();
    setDismissedUntil(DISMISS_REFUSE_DAYS * 24);
  };

  /** Plus tard : reposer la question après 24 h */
  const handleLater = () => {
    hide();
    setDismissedUntil(DISMISS_LATER_HOURS);
  };

  if (!visible || isStandalone) return null;

  const canNativeInstall = Boolean(deferredPrompt) && !isIOS;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        role="dialog"
        aria-labelledby="pwa-install-title"
        aria-describedby="pwa-install-desc"
      >
        <div className="mx-auto max-w-lg rounded-2xl bg-tea-900 text-white shadow-xl border border-tea-700 overflow-hidden">
          <div className="p-4 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-matcha-500/30 flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6 text-matcha-300" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 id="pwa-install-title" className="font-display font-semibold text-lg">
                Installer l’application ?
              </h3>
              <p id="pwa-install-desc" className="text-sm text-cream-200 mt-1">
                {isIOS
                  ? 'Ajoutez Thé Tip Top sur l’écran d’accueil : Safari → Partager → « Sur l’écran d’accueil ».'
                  : canNativeInstall
                    ? 'Installez le site comme une application pour un accès rapide depuis votre bureau ou l’écran d’accueil.'
                    : 'Sur Chrome ou Edge (ordinateur ou Android), utilisez le menu ou l’icône d’installation dans la barre d’adresse. Le site doit être en HTTPS.'}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {canNativeInstall ? (
                  <button
                    type="button"
                    onClick={handleInstall}
                    disabled={isInstalling}
                    className="px-4 py-2.5 rounded-xl bg-matcha-500 hover:bg-matcha-600 text-white font-medium text-sm transition-colors disabled:opacity-60"
                  >
                    {isInstalling ? 'Installation…' : 'Installer'}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleDecline}
                  className="px-4 py-2.5 rounded-xl border-2 border-white/30 text-white hover:bg-white/10 font-medium text-sm transition-colors"
                >
                  Refuser
                </button>
                <button
                  type="button"
                  onClick={handleLater}
                  className="px-3 py-2 rounded-xl text-cream-300 hover:text-white hover:bg-white/10 text-sm transition-colors underline-offset-2 hover:underline"
                >
                  Plus tard
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

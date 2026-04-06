import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { getOAuthStartUrl } from '../../utils/oauth';
import { ensureGoogleIdentityInitialized } from '../../utils/googleIdentity';

/**
 * Modale : bouton officiel Google (renderButton). L’initialisation GIS est partagée avec One Tap (utils/googleIdentity).
 */
export default function GoogleSignInModal({
  open,
  onClose,
  title = 'Connexion avec Google',
  description = 'Choisissez un compte enregistré sur cet appareil.',
}) {
  const buttonRef = useRef(null);
  const [gsiReady, setGsiReady] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!open || !clientId) return;
    let cancelled = false;
    (async () => {
      const ok = await ensureGoogleIdentityInitialized(clientId);
      if (!cancelled && ok) setGsiReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, clientId]);

  useEffect(() => {
    if (!open || !gsiReady || !buttonRef.current || !clientId) return;
    const id = requestAnimationFrame(() => {
      if (!buttonRef.current || !window.google?.accounts?.id) return;
      buttonRef.current.innerHTML = '';
      const w = buttonRef.current.parentElement?.clientWidth || 320;
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: Math.min(340, Math.max(280, w - 8)),
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        locale: 'fr',
      });
    });
    return () => cancelAnimationFrame(id);
  }, [open, gsiReady, clientId]);

  if (typeof document === 'undefined') return null;

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-signin-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className="relative z-[101] w-full max-w-md rounded-2xl border border-cream-200 bg-cream-50 p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-tea-500 transition hover:bg-cream-200 hover:text-tea-800"
          aria-label="Fermer"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 id="google-signin-modal-title" className="font-display text-xl font-bold text-tea-900 pr-8">
          {title}
        </h2>
        <p className="mt-2 text-sm text-tea-600">{description}</p>

        <div className="relative mt-6 flex min-h-[48px] flex-col items-center justify-center">
          <div ref={buttonRef} className="flex w-full justify-center" />
        </div>

        <p className="mt-6 text-center text-xs text-tea-500">
          Fenêtre proposée par Google — vos comptes enregistrés sur cet appareil peuvent apparaître ici.
        </p>

        <button
          type="button"
          onClick={() => {
            onClose();
            window.location.href = getOAuthStartUrl('google');
          }}
          className="mt-4 w-full text-center text-sm font-medium text-matcha-700 underline-offset-2 hover:underline"
        >
          Continuer dans le navigateur (méthode classique)
        </button>
      </div>
    </div>,
    document.body
  );
}

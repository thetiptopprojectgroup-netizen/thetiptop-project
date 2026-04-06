/**
 * Google Identity Services (One Tap + bouton) — une seule initialisation par onglet.
 * One Tap : petit encart en haut à droite (souvent) avec les comptes déjà connus sur le navigateur.
 */

const GSI_SCRIPT = 'https://accounts.google.com/gsi/client';

let loadPromise = null;
let initialized = false;
let lastClientId = '';

/** @type {((response: { credential?: string }) => void) | null} */
let credentialCallback = null;

export function setGoogleCredentialCallback(fn) {
  credentialCallback = typeof fn === 'function' ? fn : null;
}

export function loadGsiScript() {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GSI_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('GSI')));
      return;
    }
    const s = document.createElement('script');
    s.src = GSI_SCRIPT;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('GSI'));
    document.head.appendChild(s);
  });
  return loadPromise;
}

/**
 * @returns {Promise<boolean>}
 */
export async function ensureGoogleIdentityInitialized(clientId) {
  if (!clientId) return false;
  try {
    await loadGsiScript();
  } catch {
    return false;
  }
  if (!window.google?.accounts?.id) return false;
  if (initialized && lastClientId === clientId) return true;

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      credentialCallback?.(response);
    },
    auto_select: false,
    cancel_on_tap_outside: true,
    itp_support: true,
  });
  initialized = true;
  lastClientId = clientId;
  return true;
}

/**
 * Affiche One Tap (souvent en haut à droite sur bureau). Peut ne rien afficher si
 * l’utilisateur l’a déjà fermé, si les cookies tiers sont bloqués, ou si Google décide de ne pas l’afficher.
 */
export function promptGoogleOneTap() {
  if (!initialized || !window.google?.accounts?.id) return;
  try {
    window.google.accounts.id.prompt((notification) => {
      if (import.meta.env.DEV && notification?.isNotDisplayed?.()) {
        console.debug('[Google One Tap] non affiché (cookies, déjà fermé, ou règles Google).');
      }
    });
  } catch (e) {
    if (import.meta.env.DEV) console.debug('[Google One Tap] prompt', e);
  }
}

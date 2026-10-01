export function isStandalone(displayMode = '(display-mode: standalone)') {
  return window.matchMedia(displayMode).matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function watchConnectivity(onChange: (offline: boolean) => void) {
  const update = () => onChange(!navigator.onLine);
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
  return () => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
  };
}

export async function registerAuroraServiceWorker(
  onUpdateReady: (registration: ServiceWorkerRegistration) => void,
) {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  const registration = await navigator.serviceWorker.register(
    `${import.meta.env.BASE_URL}sw.js`,
    { updateViaCache: 'none' },
  );
  const reportWaitingWorker = () => {
    if (registration.waiting && navigator.serviceWorker.controller) onUpdateReady(registration);
  };
  reportWaitingWorker();
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') reportWaitingWorker();
    });
  });
  window.addEventListener('focus', () => void registration.update());
  return registration;
}

export function activateUpdate(registration: ServiceWorkerRegistration) {
  registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
}

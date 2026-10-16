// Imported before App and Supabase so auth initialization cannot escape the guard.
import { productionEnabled, staticRenderEnabled, previewMessage, services } from '../lib/runtime';
import { isExternalAction, isPublicPrerenderRead } from '../lib/runtimePolicy';
import { fixtureResponse } from './fixtures';

if (!productionEnabled) {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const request = new Request(input instanceof Request ? input : new URL(String(input), location.href), init);
    const url = new URL(request.url);
    if (services.supabaseUrl && url.origin === new URL(services.supabaseUrl).origin) {
      if (!staticRenderEnabled) return fixtureResponse(request);
      if (isPublicPrerenderRead(request.method, url.pathname)) return nativeFetch(input, init);
      throw new Error(previewMessage);
    }
    if (url.origin === location.origin && ['GET', 'HEAD'].includes(request.method)) return nativeFetch(input, init);
    throw new Error(previewMessage);
  };
  // SDKs must not bypass fetch using XHR or beacon transports.
  const nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...rest: unknown[]) {
    const target = new URL(String(url), location.href);
    if (target.origin !== location.origin || !['GET', 'HEAD'].includes(method.toUpperCase())) throw new Error(previewMessage);
    return Reflect.apply(nativeOpen, this, [method, url, ...rest]);
  } as typeof XMLHttpRequest.prototype.open;
  navigator.sendBeacon = () => false;
  const nativeWindowOpen = window.open.bind(window);
  window.open = (url, target, features) => {
    if (url && isExternalAction(String(url), location.href)) { window.alert(previewMessage); return null; }
    return nativeWindowOpen(url, target, features);
  };
  document.addEventListener('click', event => {
    const link = event.composedPath().find(node => node instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;
    if (link && isExternalAction(link.href, location.href)) {
      event.preventDefault(); event.stopImmediatePropagation(); window.alert(previewMessage);
    }
  }, true);
  document.addEventListener('submit', event => {
    // React forms use preventDefault and remain interactive; block native form navigation.
    event.preventDefault();
  });
}

/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<unknown> };
self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST as never);
registerRoute(({ url }) => url.origin === self.location.origin && !url.pathname.startsWith('/api/') && !url.pathname.startsWith('/auth/'), new NetworkFirst({ cacheName: 'dosagem-v2-pages' }));

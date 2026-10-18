/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<unknown> };
precacheAndRoute(self.__WB_MANIFEST as never);
registerRoute(({ url }) => url.origin === self.location.origin && url.pathname.startsWith('/dosagem-concreto/v2/'), new NetworkFirst({ cacheName: 'dosagem-v2-pages' }));

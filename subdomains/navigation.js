// Routing only. This file does not touch credentials, cart, or checkout state.
(() => {
  const host = location.hostname.toLowerCase();
  const root = 'https://bisabikinweb.site';
  const allowed = {
    'app.bisabikinweb.site': ['/', '/admin', '/seller'],
    'media.bisabikinweb.site': ['/', '/artikel', '/berita', '/redaksi'],
    'shop.bisabikinweb.site': ['/', '/merch', '/toko', '/cart', '/checkout', '/track-order', '/account']
  };
  const routes = allowed[host];
  if (!routes) return;
  const local = (pathname) => {
    const path = pathname.replace(/\/+$/, '') || '/';
    return routes.some(p => path === p || (p !== '/' && path.startsWith(p + '/')));
  };
  // Pertahankan /toko/:slug pada domain toko agar storefront seller tidak meloncat ke host utama.
  // Never intercept external anchors or hashes. Unknown local routes still resolve on the primary website.
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const element = event.target;
    if (!(element instanceof Element)) return;
    const anchor = element.closest('a[href]');
    if (!anchor || anchor.target || anchor.hasAttribute('download')) return;
    const href = anchor.getAttribute('href') || '';
    if (!href.startsWith('/') || href.startsWith('//')) return;
    const url = new URL(href, location.origin);
    if (local(url.pathname)) return;
    event.preventDefault();
    location.assign(root + url.pathname + url.search + url.hash);
  }, true);
})();

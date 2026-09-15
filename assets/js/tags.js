// Installs the "existing merchant setup" the way a real merchant ends up with it: the classic GTM
// snippet first, then gtag and the Meta pixel pasted directly on the page. Loads AFTER config.js
// (which wraps dataLayer.push for the inspector) and BEFORE anything else.
// directly on the page, the way a merchant who pasted three snippets over the years ends up.
(function () {
  var ids = window.DEMO_IDS || {};
  window.dataLayer = window.dataLayer || [];
  if (ids.gtm && ids.gtm.indexOf("XXXX") < 0) {
    (function (w, d, s, l, i) { w[l] = w[l] || []; w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      var f = d.getElementsByTagName(s)[0], j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
      j.async = true; j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl; f.parentNode.insertBefore(j, f);
    })(window, document, 'script', 'dataLayer', ids.gtm);
  }
  if (ids.ga4 && ids.ga4.indexOf("XXXX") < 0) {
    var g = document.createElement('script'); g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + ids.ga4; document.head.appendChild(g);
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', ids.ga4);
    if (ids.aw && ids.aw.indexOf("XXXX") < 0) gtag('config', ids.aw);
  }
  if (ids.metaPixel) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', ids.metaPixel); fbq('track', 'PageView');
  }
})();

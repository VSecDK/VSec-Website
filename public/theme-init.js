(function () {
  try {
    var t = localStorage.getItem('vsec-theme') || 'system';
    var resolved = t === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t;
    document.documentElement.setAttribute('data-theme', resolved);
  } catch (e) {}
})();

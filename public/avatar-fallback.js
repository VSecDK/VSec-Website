document.querySelectorAll('img[data-avatar]').forEach(function (img) {
  function onError() {
    img.classList.add('hidden');
    var fallback = img.nextElementSibling;
    if (fallback) fallback.classList.remove('hidden');
  }
  img.addEventListener('error', onError);
  // Handle images that already failed before this script ran
  if (img.complete && img.naturalWidth === 0) onError();
});

(function () {
  'use strict';

  var filters = Array.prototype.slice.call(document.querySelectorAll('[data-filter]'));
  var cards = Array.prototype.slice.call(document.querySelectorAll('.gallery-card'));
  var dialog = document.querySelector('.lightbox');
  var dialogImage = dialog.querySelector('img');
  var title = dialog.querySelector('figcaption span');
  var caption = dialog.querySelector('figcaption small');
  var close = dialog.querySelector('.lightbox__close');
  var previous = dialog.querySelector('.lightbox__arrow--prev');
  var next = dialog.querySelector('.lightbox__arrow--next');
  var visibleCards = cards.slice();
  var current = 0;

  function updateViewer(index) {
    current = (index + visibleCards.length) % visibleCards.length;
    var card = visibleCards[current];
    dialogImage.src = card.dataset.image;
    dialogImage.alt = card.querySelector('img').alt;
    title.textContent = card.dataset.title;
    caption.textContent = card.dataset.caption;
  }

  function openViewer(card) {
    visibleCards = cards.filter(function (item) { return !item.classList.contains('is-hidden'); });
    updateViewer(visibleCards.indexOf(card));
    dialog.showModal();
  }

  filters.forEach(function (filter) {
    filter.addEventListener('click', function () {
      var category = filter.dataset.filter;
      filters.forEach(function (item) { item.classList.toggle('is-active', item === filter); });
      cards.forEach(function (card) {
        card.classList.toggle('is-hidden', category !== 'all' && card.dataset.gallery !== category);
      });
    });
  });

  cards.forEach(function (card) { card.addEventListener('click', function () { openViewer(card); }); });
  close.addEventListener('click', function () { dialog.close(); });
  previous.addEventListener('click', function () { updateViewer(current - 1); });
  next.addEventListener('click', function () { updateViewer(current + 1); });
  dialog.addEventListener('click', function (event) { if (event.target === dialog) dialog.close(); });
  window.addEventListener('keydown', function (event) {
    if (!dialog.open) return;
    if (event.key === 'ArrowLeft') updateViewer(current - 1);
    if (event.key === 'ArrowRight') updateViewer(current + 1);
  });
}());

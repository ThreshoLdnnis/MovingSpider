/* Background previews are selected without adding copy to the composition. */
(() => {
  'use strict';
  const choices = new Set(['silver', 'rose', 'blue', 'original']);
  const requested = new URLSearchParams(location.search).get('theme');
  const preferred = choices.has(requested) ? requested : document.documentElement.dataset.defaultTheme || 'blue';
  const setTheme = theme => {
    if (!choices.has(theme)) return;
    document.documentElement.dataset.theme = theme;
    const colors = {silver:'#e5e5e5', rose:'#633547', blue:'#174b9e', original:'#1129e2'};
    document.querySelector('meta[name="theme-color"]').setAttribute('content', colors[theme]);
    document.dispatchEvent(new CustomEvent('found:theme', {detail:{theme}}));
  };
  setTheme(preferred);
  window.FoundTheme = {set: setTheme, get current(){return document.documentElement.dataset.theme;}};
})();

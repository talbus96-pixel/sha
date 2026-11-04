// The "Learn" page: studies and sources, added by the app's owner.
// Nothing is listed here until the owner supplies it, and while ENTRIES is empty the page stays hidden.
//
// To add a study, copy a block into ENTRIES. Every text field has all three languages:
//   {
//       title:   { en: '…', he: '…', ru: '…' },   // the paper's title or a short heading
//       summary: { en: '…', he: '…', ru: '…' },   // what it found, in a sentence or two
//       source:  'Journal name, year',            // shown under the summary
//       url:     'https://…'                      // link to the paper
//   }
const Research = (() => {
    const ENTRIES = [];

    const pick = (field) => field[I18n.lang] || field.en || '';

    function el(tag, cls, text) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text !== undefined) e.textContent = text;
        return e;
    }

    function render(root) {
        root.innerHTML = '';
        root.appendChild(el('p', 'research-note', I18n.t('research.note')));
        ENTRIES.forEach(entry => {
            const card = el('article', 'research-entry');
            const title = el('a', 'research-title', pick(entry.title));
            title.href = entry.url;
            title.target = '_blank';
            title.rel = 'noopener';
            card.appendChild(title);
            card.appendChild(el('p', 'research-summary', pick(entry.summary)));
            card.appendChild(el('small', 'research-source', entry.source));
            root.appendChild(card);
        });
    }

    return { render, hasEntries: () => ENTRIES.length > 0 };
})();

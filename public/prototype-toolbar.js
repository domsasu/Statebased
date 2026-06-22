/**
 * Prototype Toolbar — a drop-in dev toolbar for HTML prototypes.
 *
 * Adds a fixed bottom-left toolbar with:
 *   • Home  — back link to your prototype's home/index page
 *   • Experiment switcher  — toggles between variants (sets body class + sessionStorage)
 *   • Features list  — opens an overlay listing per-experiment features, with click-to-highlight
 *   • Trigger events  — flyout of buttons that fire arbitrary callbacks (e.g. "open module complete dialog")
 *
 * Usage:
 *   PrototypeToolbar.init({
 *     home: { href: 'index.html', label: 'Home' },
 *     experiments: [
 *       { id: 'a', label: 'Experiment A' },
 *       { id: 'b', label: 'Experiment B' }
 *     ],
 *     features: {
 *       a: {
 *         sections: [
 *           {
 *             title: 'New things',
 *             items: [
 *               { text: 'New banner', hl: '#new-banner' },
 *               { text: 'Open intro modal', action: 'openIntro' }
 *             ]
 *           }
 *         ]
 *       }
 *     },
 *     actions: {
 *       openIntro: function() { document.getElementById('intro').showModal(); }
 *     },
 *     triggers: [
 *       { label: 'Module complete', icon: 'school', onClick: function() {} }
 *     ]
 *   });
 *
 * After init, body gets `proto-experiment-<id>` so you can scope CSS to a variant.
 * Window dispatches `experiment-changed` (CustomEvent with `detail.id`) when the user switches.
 */
(function(global) {
  'use strict';

  var DEFAULTS = {
    home: null,
    experiments: [],
    features: {},
    actions: {},
    triggers: [],
    storageKey: 'proto-experiment',
    onExperimentChange: null,
    reloadOnExperimentChange: true
  };

  var config = null;
  var currentExp = null;
  var activeHighlightKey = null;
  var rootEl = null;

  /* ─── Utils ─────────────────────────────────────────────────────── */

  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function(k) {
        var v = props[k];
        if (v == null || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k.indexOf('on') === 0 && typeof v === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else {
          node.setAttribute(k, v === true ? '' : v);
        }
      });
    }
    (children || []).forEach(function(c) {
      if (c == null || c === false) return;
      if (typeof c === 'string' || typeof c === 'number') {
        node.appendChild(document.createTextNode(String(c)));
      } else {
        node.appendChild(c);
      }
    });
    return node;
  }

  function icon(name) {
    return el('span', { class: 'material-symbols-rounded' }, [name]);
  }

  function findExperiment(id) {
    for (var i = 0; i < config.experiments.length; i++) {
      if (config.experiments[i].id === id) return config.experiments[i];
    }
    return null;
  }

  /* ─── Experiment state ─────────────────────────────────────────── */

  function readStoredExp() {
    if (!config.experiments.length) return null;
    var stored = window.sessionStorage.getItem(config.storageKey);
    return findExperiment(stored) ? stored : config.experiments[0].id;
  }

  function applyBodyClass(expId) {
    document.body.className = document.body.className
      .replace(/\bproto-experiment-[\w-]+/g, '').trim();
    if (expId) document.body.classList.add('proto-experiment-' + expId);
  }

  function setExperiment(expId, opts) {
    opts = opts || {};
    if (!findExperiment(expId)) return;
    window.sessionStorage.setItem(config.storageKey, expId);
    currentExp = expId;
    applyBodyClass(expId);
    window.dispatchEvent(new CustomEvent('experiment-changed', { detail: { id: expId } }));
    if (typeof config.onExperimentChange === 'function') config.onExperimentChange(expId);
    var shouldReload = opts.reload != null ? opts.reload : config.reloadOnExperimentChange;
    if (shouldReload) location.reload();
  }

  /* ─── Home button ──────────────────────────────────────────────── */

  function buildHome() {
    if (!config.home || !config.home.href) return null;
    return el('a', {
      class: 'proto-toolbar__btn proto-toolbar__home',
      href: config.home.href
    }, [
      icon('arrow_back'),
      config.home.label || 'Home'
    ]);
  }

  /* ─── Experiment dropdown ──────────────────────────────────────── */

  function buildExperimentDropdown() {
    if (config.experiments.length < 2) return null;

    var current = findExperiment(currentExp);
    var container = el('div', { class: 'proto-toolbar__exp' });
    var labelEl = el('span', { class: 'proto-toolbar__exp-label' }, [current ? current.label : '']);
    var trigger = el('button', {
      type: 'button',
      class: 'proto-toolbar__btn proto-toolbar__exp-trigger',
      'aria-haspopup': 'listbox',
      'aria-expanded': 'false'
    }, [icon('science'), labelEl, icon('expand_more')]);

    var menu = el('ul', {
      class: 'proto-toolbar__exp-menu',
      role: 'listbox',
      'aria-label': 'Select experiment'
    });
    config.experiments.forEach(function(opt) {
      var isSel = opt.id === currentExp;
      menu.appendChild(el('li', {
        class: 'proto-toolbar__exp-option' + (isSel ? ' is-selected' : ''),
        role: 'option',
        'aria-selected': isSel ? 'true' : 'false',
        'data-value': opt.id
      }, [opt.label]));
    });

    container.appendChild(trigger);
    container.appendChild(menu);

    trigger.addEventListener('click', function(e) {
      e.stopPropagation();
      var open = container.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    menu.addEventListener('click', function(e) {
      var li = e.target.closest('.proto-toolbar__exp-option');
      if (!li) return;
      var expId = li.getAttribute('data-value');
      setExperiment(expId);
      var exp = findExperiment(expId);
      if (exp) labelEl.textContent = exp.label;
      menu.querySelectorAll('.proto-toolbar__exp-option').forEach(function(opt) {
        var sel = opt.getAttribute('data-value') === expId;
        opt.classList.toggle('is-selected', sel);
        opt.setAttribute('aria-selected', sel ? 'true' : 'false');
      });
      container.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    });

    document.addEventListener('click', function(e) {
      if (!container.contains(e.target)) {
        container.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });

    return container;
  }

  /* ─── Features list overlay ────────────────────────────────────── */

  function clearFeatureHighlights() {
    document.querySelectorAll('.proto-feature-hl').forEach(function(el) {
      el.classList.remove('proto-feature-hl');
    });
    if (rootEl) {
      rootEl.querySelectorAll('.proto-toolbar__features-item.is-active').forEach(function(el) {
        el.classList.remove('is-active');
      });
    }
    activeHighlightKey = null;
  }

  function applyFeatureHighlight(selector) {
    if (!selector) return false;
    var found = false;
    selector.split(',').map(function(s) { return s.trim(); }).forEach(function(sel) {
      try {
        document.querySelectorAll(sel).forEach(function(el) {
          el.classList.add('proto-feature-hl');
          found = true;
        });
      } catch (e) {}
    });
    return found;
  }

  function scrollToHighlighted() {
    var first = document.querySelector('.proto-feature-hl');
    if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function renderFeatureItem(item, idx, parentIdx) {
    var key = parentIdx != null ? parentIdx + '-' + idx : String(idx);
    var hasInteraction = !!(item.hl || item.action || item.nav);
    var classes = 'proto-toolbar__features-item' + (hasInteraction ? ' is-clickable' : '');
    var li = el('li', {
      class: classes,
      'data-fl-key': key,
      'data-fl-hl': item.hl || null,
      'data-fl-action': item.action || null,
      'data-fl-nav': item.nav || null
    }, [
      el('span', { class: 'proto-toolbar__features-bullet' }),
      el('span', null, [item.text])
    ]);
    return li;
  }

  function renderFeaturesOverlay(overlay) {
    overlay.innerHTML = '';
    var data = (config.features && config.features[currentExp]) || null;
    var label = (findExperiment(currentExp) || {}).label || 'Features';

    var header = el('div', { class: 'proto-toolbar__features-header' }, [
      el('span', { class: 'proto-toolbar__features-title' }, [label]),
      el('button', {
        type: 'button',
        class: 'proto-toolbar__features-close',
        'aria-label': 'Close',
        onclick: function() { closeFeaturesOverlay(); }
      }, [icon('close')])
    ]);
    overlay.appendChild(header);

    if (!data || !data.sections || !data.sections.length) {
      overlay.appendChild(el('div', {
        class: 'proto-toolbar__features-empty'
      }, ['No features defined for this experiment yet.']));
      return;
    }

    if (data.notice) {
      overlay.appendChild(el('div', { class: 'proto-toolbar__features-notice' }, [data.notice]));
    }

    var itemIdx = 0;
    data.sections.forEach(function(section) {
      overlay.appendChild(el('div', { class: 'proto-toolbar__features-section-title' }, [section.title]));
      var list = el('ul', { class: 'proto-toolbar__features-list' });
      section.items.forEach(function(item) {
        list.appendChild(renderFeatureItem(item, itemIdx));
        if (item.children && item.children.length) {
          var sub = el('ul', { class: 'proto-toolbar__features-sublist' });
          item.children.forEach(function(child, ci) {
            sub.appendChild(renderFeatureItem(child, ci, itemIdx));
          });
          list.appendChild(sub);
        }
        itemIdx++;
      });
      overlay.appendChild(list);
    });

    overlay.querySelectorAll('.proto-toolbar__features-item.is-clickable').forEach(function(li) {
      li.addEventListener('click', function() {
        var key = li.getAttribute('data-fl-key');
        var hl = li.getAttribute('data-fl-hl');
        var actionName = li.getAttribute('data-fl-action');
        var nav = li.getAttribute('data-fl-nav');

        if (activeHighlightKey === key) { clearFeatureHighlights(); return; }
        clearFeatureHighlights();

        if (actionName && config.actions && typeof config.actions[actionName] === 'function') {
          var handled = config.actions[actionName]();
          if (handled !== false) {
            li.classList.add('is-active');
            activeHighlightKey = key;
            return;
          }
        }
        if (hl) {
          var found = applyFeatureHighlight(hl);
          if (found) {
            li.classList.add('is-active');
            activeHighlightKey = key;
            scrollToHighlighted();
            return;
          }
        }
        if (nav) {
          var sep = nav.indexOf('?') === -1 ? '?' : '&';
          var hashIdx = nav.indexOf('#');
          var base = hashIdx !== -1 ? nav.substring(0, hashIdx) : nav;
          var hash = hashIdx !== -1 ? nav.substring(hashIdx) : '';
          window.location.href = base + sep + 'exp=' + currentExp + hash;
        }
      });
    });
  }

  function openFeaturesOverlay() {
    var overlay = rootEl.querySelector('.proto-toolbar__features-overlay');
    var btn = rootEl.querySelector('.proto-toolbar__features-trigger');
    renderFeaturesOverlay(overlay);
    overlay.classList.add('is-open');
    if (btn) btn.setAttribute('aria-pressed', 'true');
  }

  function closeFeaturesOverlay() {
    var overlay = rootEl.querySelector('.proto-toolbar__features-overlay');
    var btn = rootEl.querySelector('.proto-toolbar__features-trigger');
    if (overlay) overlay.classList.remove('is-open');
    if (btn) btn.setAttribute('aria-pressed', 'false');
    clearFeatureHighlights();
  }

  function buildFeaturesButton() {
    if (!config.features || !Object.keys(config.features).length) return null;
    var btn = el('button', {
      type: 'button',
      class: 'proto-toolbar__btn proto-toolbar__features-trigger proto-toolbar__btn--icon',
      'aria-pressed': 'false',
      'aria-label': 'Features list',
      'data-tooltip': 'Features list'
    }, [icon('checklist')]);

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var overlay = rootEl.querySelector('.proto-toolbar__features-overlay');
      if (overlay && overlay.classList.contains('is-open')) {
        closeFeaturesOverlay();
      } else {
        openFeaturesOverlay();
      }
    });
    return btn;
  }

  function buildFeaturesOverlayEl() {
    if (!config.features || !Object.keys(config.features).length) return null;
    var overlay = el('div', { class: 'proto-toolbar__features-overlay' });
    overlay.addEventListener('click', function(e) { e.stopPropagation(); });
    return overlay;
  }

  /* ─── Triggers flyout ──────────────────────────────────────────── */

  function buildTriggersFlyout() {
    if (!config.triggers) return null;

    var wrapper = el('div', { class: 'proto-toolbar__tools' });
    var btn = el('button', {
      type: 'button',
      class: 'proto-toolbar__btn proto-toolbar__btn--icon proto-toolbar__tools-trigger',
      'aria-label': 'Trigger event',
      'data-tooltip': 'Trigger event'
    }, [icon('bolt')]);

    var flyout = el('div', { class: 'proto-toolbar__tools-flyout' });
    flyout.appendChild(el('div', { class: 'proto-toolbar__tools-header' }, ['Trigger event']));

    config.triggers.forEach(function(t) {
      var disabled = !!t.disabled;
      var row = el('button', {
        type: 'button',
        class: 'proto-toolbar__tools-row' + (disabled ? ' is-disabled' : ''),
        disabled: disabled || null,
        'aria-label': t.label
      }, [icon(t.icon || 'bolt'), el('span', null, [t.label])]);

      if (!disabled && typeof t.onClick === 'function') {
        row.addEventListener('click', function() {
          t.onClick();
          wrapper.classList.remove('is-open');
        });
      }
      flyout.appendChild(row);
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(flyout);

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      wrapper.classList.toggle('is-open');
    });
    document.addEventListener('click', function(e) {
      if (!wrapper.contains(e.target)) wrapper.classList.remove('is-open');
    });

    return wrapper;
  }

  /* ─── Init ─────────────────────────────────────────────────────── */

  function init(userConfig) {
    if (rootEl) return; // idempotent
    config = Object.assign({}, DEFAULTS, userConfig || {});
    config.experiments = config.experiments || [];
    config.features = config.features || {};
    config.actions = config.actions || {};
    config.triggers = config.triggers || [];

    function ready(fn) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
      } else fn();
    }

    ready(function() {
      currentExp = readStoredExp();
      applyBodyClass(currentExp);

      rootEl = el('div', { class: 'proto-toolbar', role: 'toolbar', 'aria-label': 'Prototype toolbar' });
      [buildHome(), buildExperimentDropdown(), buildFeaturesButton(), buildTriggersFlyout()]
        .forEach(function(c) { if (c) rootEl.appendChild(c); });

      var overlay = buildFeaturesOverlayEl();
      if (overlay) rootEl.appendChild(overlay);

      document.body.appendChild(rootEl);
    });
  }

  global.PrototypeToolbar = {
    init: init,
    setExperiment: setExperiment,
    getExperiment: function() { return currentExp; }
  };
})(window);

/*
 * Invoxa embed. Usage and options: /dashboard/developers
 *
 *   <div id="invoice"></div>
 *   <script src="https://YOUR-INVOXA-DOMAIN/embed.js"></script>
 *   <script>
 *     Invoxa.mount('#invoice', {
 *       document: { client: { name: 'Globex' } },
 *       onSave: function (invoice) { console.log(invoice); },
 *     });
 *   </script>
 */
(function () {
  'use strict';

  var script = document.currentScript;
  var origin = new URL(script ? script.src : window.location.href).origin;

  function mount(target, options) {
    options = options || {};
    var container = typeof target === 'string' ? document.querySelector(target) : target;
    if (!container) throw new Error('Invoxa.mount: could not find ' + target);

    var iframe = document.createElement('iframe');
    iframe.src = origin + '/embed';
    iframe.title = options.title || 'Invoice editor';
    iframe.style.width = '100%';
    iframe.style.height = options.height || '900px';
    iframe.style.border = '0';
    iframe.style.display = 'block';

    var latest = null;
    var ready = false;

    function onMessage(event) {
      // Only believe messages from this iframe, on the domain this script was loaded from.
      if (event.source !== iframe.contentWindow || event.origin !== origin || !event.data) return;
      switch (event.data.type) {
        case 'invoxa:ready':
          if (ready) break;
          ready = true;
          iframe.contentWindow.postMessage({ type: 'invoxa:init', document: options.document }, origin);
          if (options.onReady) options.onReady();
          break;
        case 'invoxa:change':
          latest = event.data.document;
          if (options.onChange) options.onChange(latest);
          break;
        case 'invoxa:save':
          latest = event.data.document;
          if (options.onSave) options.onSave(latest);
          break;
        case 'invoxa:error':
          if (options.onError) options.onError(event.data.message);
          else console.error('Invoxa: ' + event.data.message);
          break;
      }
    }

    window.addEventListener('message', onMessage);
    container.appendChild(iframe);

    return {
      getDocument: function () {
        return latest;
      },
      destroy: function () {
        window.removeEventListener('message', onMessage);
        iframe.remove();
      },
    };
  }

  window.Invoxa = { mount: mount };
})();

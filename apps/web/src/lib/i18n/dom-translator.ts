/**
 * Shows the interface in another language without touching what React renders. The pages are written
 * in English, and this swaps each piece of visible text for its translation as it appears on screen.
 *
 * - Text with no translation stays in English, so a new string can never break a page.
 * - Anything inside translate="no" is left alone. The invoice uses that, because it goes to the
 *   customer and must not change language with the person's screen.
 * - A `#` in a dictionary key matches any value, and `$1`, `$2` place those values in the translation.
 */
export type PhraseDictionary = Record<string, string>;

const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'KBD']);
const TEXT_ATTRIBUTES = ['placeholder', 'title', 'aria-label', 'alt', 'label'];

interface Pattern {
  regex: RegExp;
  template: string;
}

function compilePatterns(dictionary: PhraseDictionary): Pattern[] {
  return Object.entries(dictionary)
    // A key like "Invoice #" with no $1 is just text containing a hash, not a pattern.
    .filter(([key, template]) => key.includes('#') && template.includes('$'))
    .map(([key, template]) => {
      const source = key
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/#/g, '(.+?)');
      return { regex: new RegExp(`^${source}$`), template };
    });
}

export function createPhraseTranslator(dictionary: PhraseDictionary): (text: string) => string {
  const patterns = compilePatterns(dictionary);
  return (text) => {
    const match = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!match) return text;
    const [, before, body, after] = match;
    if (!body || !/[A-Za-z]/.test(body)) return text;
    const key = body.replace(/\s+/g, ' ');
    const exact = Object.prototype.hasOwnProperty.call(dictionary, key) ? dictionary[key] : undefined;
    if (exact !== undefined) return before + exact + after;
    for (const { regex, template } of patterns) {
      const found = key.match(regex);
      if (found) return before + template.replace(/\$(\d)/g, (_, index) => found[Number(index)] ?? '') + after;
    }
    return text;
  };
}

interface Swap {
  source: string;
  shown: string;
}

export function startDomTranslator(root: HTMLElement, dictionary: PhraseDictionary): () => void {
  const translate = createPhraseTranslator(dictionary);
  const textSwaps = new WeakMap<Text, Swap>();
  const attributeSwaps = new WeakMap<Element, Map<string, Swap>>();

  const applyText = (node: Text) => {
    const current = node.nodeValue ?? '';
    if (textSwaps.get(node)?.shown === current) return;
    const shown = translate(current);
    if (shown === current) {
      textSwaps.delete(node);
      return;
    }
    textSwaps.set(node, { source: current, shown });
    node.nodeValue = shown;
  };

  const applyAttribute = (element: Element, name: string) => {
    const current = element.getAttribute(name);
    if (current === null) return;
    const swaps = attributeSwaps.get(element) ?? new Map<string, Swap>();
    if (swaps.get(name)?.shown === current) return;
    const shown = translate(current);
    if (shown === current) {
      swaps.delete(name);
      return;
    }
    swaps.set(name, { source: current, shown });
    attributeSwaps.set(element, swaps);
    element.setAttribute(name, shown);
  };

  const isActive = (element: Element | null) => element?.closest('[translate]')?.getAttribute('translate') !== 'no';

  const visit = (node: Node, active: boolean) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (active) applyText(node as Text);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as Element;
    if (SKIPPED_TAGS.has(element.tagName)) return;
    const setting = element.getAttribute('translate');
    const nowActive = setting ? setting !== 'no' : active;
    if (nowActive) TEXT_ATTRIBUTES.forEach((name) => applyAttribute(element, name));
    element.childNodes.forEach((child) => visit(child, nowActive));
  };

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        const active = isActive(mutation.target as Element);
        mutation.addedNodes.forEach((node) => visit(node, active));
      } else if (mutation.type === 'characterData') {
        const text = mutation.target as Text;
        const parent = text.parentElement;
        if (parent && !SKIPPED_TAGS.has(parent.tagName) && isActive(parent)) applyText(text);
      } else if (mutation.attributeName && isActive(mutation.target as Element)) {
        applyAttribute(mutation.target as Element, mutation.attributeName);
      }
    }
  });

  visit(root, true);
  observer.observe(root, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: TEXT_ATTRIBUTES,
  });

  // Puts the English back everywhere, for switching language without a reload.
  return () => {
    observer.disconnect();
    const restore = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const swap = textSwaps.get(node as Text);
        if (swap && node.nodeValue === swap.shown) node.nodeValue = swap.source;
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      attributeSwaps.get(node as Element)?.forEach((swap, name) => {
        if ((node as Element).getAttribute(name) === swap.shown) (node as Element).setAttribute(name, swap.source);
      });
      node.childNodes.forEach(restore);
    };
    restore(root);
  };
}

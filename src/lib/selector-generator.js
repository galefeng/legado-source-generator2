/**
 * Lightweight CSS Selector Generator
 * Generates CSS selectors for DOM elements
 */

const DEFAULT_BLACKLIST = [
  'css-*',
  'sc-*',
  'emotion-*',
  'makeStyles-*',
  'Mui*',
  'picker-*',
  /^[0-9]+$/,
];

const DEFAULT_PRIORITY = ['id', 'class', 'tagClass'];

// Common utility CSS class prefixes that are too generic to be useful
const UTILITY_PREFIXES = [
  'flex', 'grid', 'block', 'inline', 'hidden', 'visible', 'overflow',
  'relative', 'absolute', 'fixed', 'sticky', 'static',
  'w-', 'h-', 'min-w', 'min-h', 'max-w', 'max-h',
  'p-', 'px-', 'py-', 'pt-', 'pb-', 'pl-', 'pr-',
  'm-', 'mx-', 'my-', 'mt-', 'mb-', 'ml-', 'mr-',
  'text-', 'font-', 'leading-', 'tracking-', 'whitespace',
  'bg-', 'border', 'rounded', 'shadow', 'ring',
  'hover\\:', 'focus\\:', 'active\\:', 'disabled\\:', 'group',
  'items-', 'justify-', 'content-', 'self-', 'place-',
  'gap-', 'space-', 'order-', 'col-', 'row-',
  'z-', 'top-', 'bottom-', 'left-', 'right-',
  'cursor-', 'select-', 'pointer-events', 'resize',
  'transition', 'duration-', 'delay-', 'ease-',
  'transform', 'scale-', 'rotate-', 'translate-',
  'opacity-', 'mix-blend', 'filter', 'backdrop',
  'sr-only', 'not-sr-only',
  'truncate', 'overflow-', 'scrollbar',
  'appearance-', 'outline',
  'antialiased', 'subpixel',
  'table-', 'caption-', 'border-',
  'list-', 'align-', 'valign',
  'box-', 'clear-', 'float-',
  'object-', 'fit-',
  'isolate', 'isolation',
  'inset-', 'start-', 'end-',
  'basis-', 'grow', 'shrink',
  'aspect-', 'container',
  'divide-', 'sort-',
  'line-clamp', 'break-',
  'decoration-', 'underline', 'no-underline',
  'caret-', 'accent-',
  'scroll-', 'snap-',
  'touch-', 'overscroll-',
];

function isUtilityClass(cls) {
  return UTILITY_PREFIXES.some(prefix => cls.startsWith(prefix));
}

function isBlacklisted(className, blacklist) {
  return blacklist.some(pattern => {
    if (typeof pattern === 'string') {
      if (pattern.endsWith('*')) {
        return className.startsWith(pattern.slice(0, -1));
      }
      return className === pattern;
    }
    if (pattern instanceof RegExp) {
      return pattern.test(className);
    }
    return false;
  });
}

function getValidClasses(element, blacklist) {
  const className = element.className;
  if (!className || typeof className !== 'string') {
    return [];
  }
  const classes = className.split(/\s+/).filter(cls => cls && !isBlacklisted(cls, blacklist));
  // Return semantic classes first, then utility classes
  return classes.sort((a, b) => {
    const aIsUtil = isUtilityClass(a);
    const bIsUtil = isUtilityClass(b);
    if (aIsUtil && !bIsUtil) return 1;
    if (!aIsUtil && bIsUtil) return -1;
    return 0;
  });
}

function getIdSelector(element) {
  if (element.id) {
    const cleanId = element.id.replace(/[^\w-]/g, '\\$&');
    try {
      if (document.querySelectorAll(`#${cleanId}`).length === 1) {
        return `#${cleanId}`;
      }
    } catch (e) {
      // Invalid selector characters
    }
  }
  return null;
}

function getClassSelector(element, blacklist, preferReusable) {
  const classes = getValidClasses(element, blacklist);

  // Try single class first
  for (const cls of classes) {
    try {
      const selector = `.${cls.replace(/[^\w-]/g, '\\$&')}`;
      const count = document.querySelectorAll(selector).length;
      if (count === 1) {
        return selector;
      }
      if (preferReusable && count > 1) {
        return selector;
      }
    } catch (e) {
      // Invalid selector
    }
  }

  // Try 2-class combinations (prioritize semantic classes)
  const maxSingle = Math.min(classes.length, 8);
  for (let i = 0; i < maxSingle; i++) {
    for (let j = i + 1; j < maxSingle; j++) {
      try {
        const selector = `.${classes[i].replace(/[^\w-]/g, '\\$&')}.${classes[j].replace(/[^\w-]/g, '\\$&')}`;
        const count = document.querySelectorAll(selector).length;
        if (count === 1) {
          return selector;
        }
        if (preferReusable && count > 1) {
          return selector;
        }
      } catch (e) {
        // Invalid selector
      }
    }
  }

  return null;
}

function getTagClassSelector(element, blacklist, preferReusable) {
  const classes = getValidClasses(element, blacklist);
  const tagName = element.tagName.toLowerCase();

  // Try single class
  for (const cls of classes) {
    try {
      const safeClass = cls.replace(/[^\w-]/g, '\\$&');
      const selector = `${tagName}.${safeClass}`;
      const count = document.querySelectorAll(selector).length;
      if (count === 1) {
        return selector;
      }
      if (preferReusable && count > 1) {
        return selector;
      }
    } catch (e) {
      // Invalid selector
    }
  }

  // Try 2-class combinations
  const maxSingle = Math.min(classes.length, 8);
  for (let i = 0; i < maxSingle; i++) {
    for (let j = i + 1; j < maxSingle; j++) {
      try {
        const selector = `${tagName}.${classes[i].replace(/[^\w-]/g, '\\$&')}.${classes[j].replace(/[^\w-]/g, '\\$&')}`;
        const count = document.querySelectorAll(selector).length;
        if (count === 1) {
          return selector;
        }
        if (preferReusable && count > 1) {
          return selector;
        }
      } catch (e) {
        // Invalid selector
      }
    }
  }

  return null;
}

function getTagPath(element, root) {
  const path = [];
  let current = element;

  while (current && current !== root && current !== document.body) {
    const tagName = current.tagName.toLowerCase();
    path.unshift({ tag: tagName });
    current = current.parentElement;
  }

  return path;
}

function buildTagPathSelector(path) {
  return path.map(p => p.tag).join(' > ');
}

function getCssSelector(element, options = {}) {
  if (!element || !(element instanceof Element)) {
    throw new Error('Invalid element provided');
  }

  if (element.shadowRoot || (element.getRootNode && element.getRootNode().host)) {
    console.warn('Shadow DOM detected - selector generation may be inaccurate');
  }

  const root = options.root || document.body;
  const blacklist = options.blacklist || DEFAULT_BLACKLIST;
  const priority = options.selectors || DEFAULT_PRIORITY;
  const preferReusable = options.preferReusable || false;

  for (const strategy of priority) {
    let selector = null;

    switch (strategy) {
      case 'id':
        selector = getIdSelector(element);
        break;
      case 'class':
        selector = getClassSelector(element, blacklist, preferReusable);
        break;
      case 'tagClass':
        selector = getTagClassSelector(element, blacklist, preferReusable);
        break;
      default:
        continue;
    }

    if (selector) {
      try {
        const matches = root.querySelectorAll(selector);
        if (matches.length === 1 && matches[0] === element) {
          return selector;
        }
        if (preferReusable && matches.length > 1 && Array.from(matches).includes(element)) {
          return selector;
        }
      } catch (e) {
        // Invalid selector, continue
      }
    }
  }

  // Fallback 1: try anchored selector
  const anchored = getAnchoredSelector(element, root, blacklist);
  if (anchored) return anchored;

  // Fallback 2: pure tag path (no nth-child), e.g. dd > h3 > a
  const path = getTagPath(element, root);
  return buildTagPathSelector(path);
}

function getAnchoredSelector(element, root, blacklist) {
  let anchor = null;
  let current = element.parentElement;
  while (current && current !== document.body && current !== root.parentElement) {
    if (current.id) { anchor = current; break; }
    const classes = getValidClasses(current, blacklist);
    if (classes.length > 0) { anchor = current; break; }
    current = current.parentElement;
  }
  if (!anchor) return null;

  // Build path from element to anchor
  const path = [];
  current = element;
  while (current && current !== anchor) {
    const tag = current.tagName.toLowerCase();
    path.unshift({ tag });
    current = current.parentElement;
  }

  const anchorTag = anchor.tagName.toLowerCase();
  const anchorId = anchor.id ? `#${anchor.id}` : '';
  const anchorClasses = getValidClasses(anchor, blacklist);
  const anchorClassStr = anchorClasses.map(c => `.${c.replace(/[^\w-]/g, '\\$&')}`).join('');
  const anchorSelector = `${anchorTag}${anchorId}${anchorClassStr}`;

  const childPath = path.map(p => p.tag).join(' > ');

  const fullSelector = childPath ? `${anchorSelector} > ${childPath}` : anchorSelector;

  try {
    if (root.querySelectorAll(fullSelector).length > 0) {
      return fullSelector;
    }
  } catch (e) { /* skip */ }
  return null;
}

function getIntersectionSelector(el1, el2, options = {}) {
  const blacklist = options.blacklist || DEFAULT_BLACKLIST;
  const classes1 = getValidClasses(el1, blacklist);
  const classes2 = getValidClasses(el2, blacklist);
  const commonClasses = classes1.filter(cls => classes2.includes(cls));
  const tagMatches = el1.tagName.toLowerCase() === el2.tagName.toLowerCase();
  const tagName = tagMatches ? el1.tagName.toLowerCase() : '';

  // Strategy 1: Same tag with common classes
  if (tagMatches && commonClasses.length > 0) {
    const safeClasses = commonClasses.map(cls => cls.replace(/[^\w-]/g, '\\$&'));
    const selector = `${tagName}.${safeClasses.join('.')}`;
    try {
      if (document.querySelectorAll(selector).length > 0) {
        return selector;
      }
    } catch (e) { /* skip */ }
  }

  // Strategy 2: Same tag via common parent (e.g. ul > li)
  if (tagMatches) {
    const parent1 = el1.parentElement;
    const parent2 = el2.parentElement;
    if (parent1 === parent2 && !['BODY', 'HTML', '#document'].includes(parent1.tagName)) {
      const parentTagName = parent1.tagName.toLowerCase();
      const parentClass = parent1.id
        ? `#${parent1.id}`
        : parent1.className
          ? `.${parent1.className.trim().split(/\s+/).filter(c => !isBlacklisted(c, blacklist))[0]}`
          : '';
      const baseSelector = `${parentTagName}${parentClass} > ${tagName}`;

      let bestSelector = null;
      let bestCount = Infinity;

      // Try base selector and each ancestor-scoped version, pick the most specific
      const trySelector = (selector) => {
        try {
          const count = document.querySelectorAll(selector).length;
          if (count > 1 && count < bestCount) {
            bestSelector = selector;
            bestCount = count;
          }
        } catch (e) { /* skip */ }
      };

      trySelector(baseSelector);

      let ancestor = parent1.parentElement;
      while (ancestor && !['BODY', 'HTML', '#document'].includes(ancestor.tagName)) {
        const ancTag = ancestor.tagName.toLowerCase();
        const ancId = ancestor.id ? `#${ancestor.id}` : '';
        const ancClasses = ancestor.className
          ? ancestor.className.trim().split(/\s+/)
              .filter(c => !isBlacklisted(c, blacklist))
              .map(c => `.${c.replace(/[^\w-]/g, '\\$&')}`).join('')
          : '';
        trySelector(`${ancTag}${ancId}${ancClasses} ${baseSelector}`);
        ancestor = ancestor.parentElement;
      }

      return bestSelector;
    }
  }

  // Strategy 3: Same tag only
  if (tagMatches) {
    try {
      if (document.querySelectorAll(tagName).length > 0) {
        return tagName;
      }
    } catch (e) { /* skip */ }
  }

  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getCssSelector, getIntersectionSelector };
}

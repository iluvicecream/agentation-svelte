// =============================================================================
// Element Identification Utilities
// =============================================================================

// =============================================================================
// Shadow DOM Helpers
// =============================================================================

function getParentElement(element: Element): Element | null {
  if (element.parentElement) {
    return element.parentElement;
  }
  const root = element.getRootNode();
  if (root instanceof ShadowRoot) {
    return root.host;
  }
  return null;
}

export function closestCrossingShadow(element: Element, selector: string): Element | null {
  let current: Element | null = element;
  while (current) {
    if (current.matches(selector)) return current;
    current = getParentElement(current);
  }
  return null;
}

export function deepElementFromPoint(x: number, y: number): HTMLElement | null {
  let element = document.elementFromPoint(x, y) as HTMLElement | null;
  if (!element) return null;

  while (element?.shadowRoot) {
    const deeper = element.shadowRoot.elementFromPoint(x, y) as HTMLElement | null;
    if (!deeper || deeper === element) break;
    element = deeper;
  }

  return element;
}

// =============================================================================
// Element Path Utilities
// =============================================================================

export function getElementPath(target: HTMLElement, maxDepth = 4): string {
  const parts: string[] = [];
  let current: HTMLElement | null = target;
  let depth = 0;

  while (current && depth < maxDepth) {
    const tag = current.tagName.toLowerCase();
    if (tag === "html" || tag === "body") break;

    let identifier = tag;
    if (current.id) {
      identifier = `#${current.id}`;
    } else if (current.className && typeof current.className === "string") {
      const meaningfulClass = current.className
        .split(/\s+/)
        .find((c) => c.length > 2 && !c.match(/^[a-z]{1,2}$/) && !c.match(/[A-Z0-9]{5,}/));
      if (meaningfulClass) {
        identifier = `.${meaningfulClass.split("_")[0]}`;
      }
    }

    const nextParent = getParentElement(current);
    if (!current.parentElement && nextParent) {
      identifier = `⟨shadow⟩ ${identifier}`;
    }

    parts.unshift(identifier);
    current = nextParent as HTMLElement | null;
    depth += 1;
  }

  return parts.join(" > ");
}

export function identifyElement(target: HTMLElement): { name: string; path: string } {
  const path = getElementPath(target);

  if (target.dataset.element) {
    return { name: target.dataset.element, path };
  }

  const tag = target.tagName.toLowerCase();

  if (["path", "circle", "rect", "line", "g"].includes(tag)) {
    const svg = closestCrossingShadow(target, "svg");
    if (svg) {
      const parent = getParentElement(svg);
      if (parent instanceof HTMLElement) {
        const parentName = identifyElement(parent).name;
        return { name: `graphic in ${parentName}`, path };
      }
    }
    return { name: "graphic element", path };
  }

  if (tag === "svg") {
    const parent = getParentElement(target);
    if (parent?.tagName.toLowerCase() === "button") {
      const btnText = parent.textContent?.trim();
      return { name: btnText ? `icon in "${btnText}" button` : "button icon", path };
    }
    return { name: "icon", path };
  }

  if (tag === "button") {
    const text = target.textContent?.trim();
    const ariaLabel = target.getAttribute("aria-label");
    if (ariaLabel) return { name: `button [${ariaLabel}]`, path };
    return { name: text ? `button "${text.slice(0, 25)}"` : "button", path };
  }

  if (tag === "a") {
    const text = target.textContent?.trim();
    const href = target.getAttribute("href");
    if (text) return { name: `link "${text.slice(0, 25)}"`, path };
    if (href) return { name: `link to ${href.slice(0, 30)}`, path };
    return { name: "link", path };
  }

  if (tag === "input") {
    const type = target.getAttribute("type") || "text";
    const placeholder = target.getAttribute("placeholder");
    const name = target.getAttribute("name");
    if (placeholder) return { name: `input "${placeholder}"`, path };
    if (name) return { name: `input [${name}]`, path };
    return { name: `${type} input`, path };
  }

  if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
    const text = target.textContent?.trim();
    return { name: text ? `${tag} "${text.slice(0, 35)}"` : tag, path };
  }

  if (tag === "p") {
    const text = target.textContent?.trim();
    if (text) return { name: `paragraph: "${text.slice(0, 40)}${text.length > 40 ? "..." : ""}"`, path };
    return { name: "paragraph", path };
  }

  if (tag === "span" || tag === "label") {
    const text = target.textContent?.trim();
    if (text && text.length < 40) return { name: `"${text}"`, path };
    return { name: tag, path };
  }

  if (tag === "li") {
    const text = target.textContent?.trim();
    if (text && text.length < 40) return { name: `list item: "${text.slice(0, 35)}"`, path };
    return { name: "list item", path };
  }

  if (tag === "blockquote") return { name: "blockquote", path };

  if (tag === "code") {
    const text = target.textContent?.trim();
    if (text && text.length < 30) return { name: `code: \`${text}\``, path };
    return { name: "code", path };
  }

  if (tag === "pre") return { name: "code block", path };

  if (tag === "img") {
    const alt = target.getAttribute("alt");
    return { name: alt ? `image "${alt.slice(0, 30)}"` : "image", path };
  }

  if (tag === "video") return { name: "video", path };

  if (["div", "section", "article", "nav", "header", "footer", "aside", "main"].includes(tag)) {
    const className = target.className;
    const role = target.getAttribute("role");
    const ariaLabel = target.getAttribute("aria-label");

    if (ariaLabel) return { name: `${tag} [${ariaLabel}]`, path };
    if (role) return { name: `${role}`, path };

    if (typeof className === "string" && className) {
      const words = className
        .split(/[\s_-]+/)
        .map((c) => c.replace(/[A-Z0-9]{5,}.*$/, ""))
        .filter((c) => c.length > 2 && !/^[a-z]{1,2}$/.test(c))
        .slice(0, 2);
      if (words.length > 0) return { name: words.join(" "), path };
    }

    return { name: tag === "div" ? "container" : tag, path };
  }

  return { name: tag, path };
}

export function getNearbyText(element: HTMLElement): string {
  const texts: string[] = [];
  const ownText = element.textContent?.trim();
  if (ownText && ownText.length < 100) {
    texts.push(ownText);
  }

  const prev = element.previousElementSibling;
  if (prev) {
    const prevText = prev.textContent?.trim();
    if (prevText && prevText.length < 50) {
      texts.unshift(`[before: "${prevText.slice(0, 40)}"]`);
    }
  }

  const next = element.nextElementSibling;
  if (next) {
    const nextText = next.textContent?.trim();
    if (nextText && nextText.length < 50) {
      texts.push(`[after: "${nextText.slice(0, 40)}"]`);
    }
  }

  return texts.join(" ");
}

export function getNearbyElements(element: HTMLElement): string {
  const parent = getParentElement(element);
  if (!parent) return "";

  const elementRoot = element.getRootNode();
  const children =
    elementRoot instanceof ShadowRoot && element.parentElement
      ? Array.from(element.parentElement.children)
      : Array.from(parent.children);

  const siblings = children.filter((child) => child !== element && child instanceof HTMLElement) as HTMLElement[];
  if (siblings.length === 0) return "";

  const siblingIds = siblings.slice(0, 4).map((sib) => {
    const tag = sib.tagName.toLowerCase();
    const className = sib.className;

    let cls = "";
    if (typeof className === "string" && className) {
      const meaningful = className
        .split(/\s+/)
        .map((c) => c.replace(/[_][a-zA-Z0-9]{5,}.*$/, ""))
        .find((c) => c.length > 2 && !/^[a-z]{1,2}$/.test(c));
      if (meaningful) cls = `.${meaningful}`;
    }

    if (tag === "button" || tag === "a") {
      const text = sib.textContent?.trim().slice(0, 15);
      if (text) return `${tag}${cls} "${text}"`;
    }

    return `${tag}${cls}`;
  });

  const parentTag = parent.tagName.toLowerCase();
  let parentId = parentTag;
  if (typeof parent.className === "string" && parent.className) {
    const parentCls = parent.className
      .split(/\s+/)
      .map((c) => c.replace(/[_][a-zA-Z0-9]{5,}.*$/, ""))
      .find((c) => c.length > 2 && !/^[a-z]{1,2}$/.test(c));
    if (parentCls) parentId = `.${parentCls}`;
  }

  const total = parent.children.length;
  const suffix = total > siblingIds.length + 1 ? ` (${total} total in ${parentId})` : "";
  return siblingIds.join(", ") + suffix;
}

export function getElementClasses(target: HTMLElement): string {
  const className = target.className;
  if (typeof className !== "string" || !className) return "";

  const classes = className
    .split(/\s+/)
    .filter((c) => c.length > 0)
    .map((c) => {
      const match = c.match(/^([a-zA-Z][a-zA-Z0-9_-]*?)(?:_[a-zA-Z0-9]{5,})?$/);
      return match ? match[1] : c;
    })
    .filter((c, i, arr) => arr.indexOf(c) === i);

  return classes.join(", ");
}

const DEFAULT_STYLE_VALUES = new Set([
  "none",
  "normal",
  "auto",
  "0px",
  "rgba(0, 0, 0, 0)",
  "transparent",
  "static",
  "visible"
]);

const TEXT_ELEMENTS = new Set([
  "p",
  "span",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "label",
  "li",
  "td",
  "th",
  "blockquote",
  "figcaption",
  "caption",
  "legend",
  "dt",
  "dd",
  "pre",
  "code",
  "em",
  "strong",
  "b",
  "i",
  "a",
  "time",
  "cite",
  "q"
]);

const FORM_INPUT_ELEMENTS = new Set(["input", "textarea", "select"]);
const MEDIA_ELEMENTS = new Set(["img", "video", "canvas", "svg"]);
const CONTAINER_ELEMENTS = new Set([
  "div",
  "section",
  "article",
  "nav",
  "header",
  "footer",
  "aside",
  "main",
  "ul",
  "ol",
  "form",
  "fieldset"
]);

export function getDetailedComputedStyles(target: HTMLElement): Record<string, string> {
  if (typeof window === "undefined") return {};

  const styles = window.getComputedStyle(target);
  const result: Record<string, string> = {};
  const tag = target.tagName.toLowerCase();

  let properties: string[];
  if (TEXT_ELEMENTS.has(tag)) {
    properties = ["color", "fontSize", "fontWeight", "fontFamily", "lineHeight"];
  } else if (tag === "button" || (tag === "a" && target.getAttribute("role") === "button")) {
    properties = ["backgroundColor", "color", "padding", "borderRadius", "fontSize"];
  } else if (FORM_INPUT_ELEMENTS.has(tag)) {
    properties = ["backgroundColor", "color", "padding", "borderRadius", "fontSize"];
  } else if (MEDIA_ELEMENTS.has(tag)) {
    properties = ["width", "height", "objectFit", "borderRadius"];
  } else if (CONTAINER_ELEMENTS.has(tag)) {
    properties = ["display", "padding", "margin", "gap", "backgroundColor"];
  } else {
    properties = ["color", "fontSize", "margin", "padding", "backgroundColor"];
  }

  for (const prop of properties) {
    const cssPropertyName = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
    const value = styles.getPropertyValue(cssPropertyName);
    if (value && !DEFAULT_STYLE_VALUES.has(value)) {
      result[prop] = value;
    }
  }

  return result;
}

const FORENSIC_PROPERTIES = [
  "color",
  "backgroundColor",
  "borderColor",
  "fontSize",
  "fontWeight",
  "fontFamily",
  "lineHeight",
  "letterSpacing",
  "textAlign",
  "width",
  "height",
  "padding",
  "margin",
  "border",
  "borderRadius",
  "display",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "zIndex",
  "flexDirection",
  "justifyContent",
  "alignItems",
  "gap",
  "opacity",
  "visibility",
  "overflow",
  "boxShadow",
  "transform"
];

export function getForensicComputedStyles(target: HTMLElement): string {
  if (typeof window === "undefined") return "";

  const styles = window.getComputedStyle(target);
  const parts: string[] = [];
  for (const prop of FORENSIC_PROPERTIES) {
    const cssPropertyName = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
    const value = styles.getPropertyValue(cssPropertyName);
    if (value && !DEFAULT_STYLE_VALUES.has(value)) {
      parts.push(`${cssPropertyName}: ${value}`);
    }
  }
  return parts.join("; ");
}

export function getAccessibilityInfo(target: HTMLElement): string {
  const parts: string[] = [];

  const role = target.getAttribute("role");
  const ariaLabel = target.getAttribute("aria-label");
  const ariaDescribedBy = target.getAttribute("aria-describedby");
  const tabIndex = target.getAttribute("tabindex");
  const ariaHidden = target.getAttribute("aria-hidden");

  if (role) parts.push(`role="${role}"`);
  if (ariaLabel) parts.push(`aria-label="${ariaLabel}"`);
  if (ariaDescribedBy) parts.push(`aria-describedby="${ariaDescribedBy}"`);
  if (tabIndex) parts.push(`tabindex=${tabIndex}`);
  if (ariaHidden === "true") parts.push("aria-hidden");

  const focusable = target.matches("a, button, input, select, textarea, [tabindex]");
  if (focusable) parts.push("focusable");

  return parts.join(", ");
}

export function getFullElementPath(target: HTMLElement): string {
  const parts: string[] = [];
  let current: HTMLElement | null = target;

  while (current && current.tagName.toLowerCase() !== "html") {
    const tag = current.tagName.toLowerCase();
    let identifier = tag;

    if (current.id) {
      identifier = `${tag}#${current.id}`;
    } else if (current.className && typeof current.className === "string") {
      const cls = current.className
        .split(/\s+/)
        .map((c) => c.replace(/[_][a-zA-Z0-9]{5,}.*$/, ""))
        .find((c) => c.length > 2);
      if (cls) identifier = `${tag}.${cls}`;
    }

    const nextParent = getParentElement(current);
    if (!current.parentElement && nextParent) {
      identifier = `⟨shadow⟩ ${identifier}`;
    }

    parts.unshift(identifier);
    current = nextParent as HTMLElement | null;
  }

  return parts.join(" > ");
}

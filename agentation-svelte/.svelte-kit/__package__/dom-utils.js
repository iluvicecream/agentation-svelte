export function getElementPath(target, maxDepth = 4) {
    const parts = [];
    let current = target;
    let depth = 0;
    while (current && depth < maxDepth) {
        const tag = current.tagName.toLowerCase();
        if (tag === "html" || tag === "body")
            break;
        let identifier = tag;
        if (current.id) {
            identifier = `#${current.id}`;
        }
        else if (typeof current.className === "string" && current.className) {
            const className = current.className
                .split(/\s+/)
                .find((c) => c.length > 2 && !c.match(/^[a-z]{1,2}$/));
            if (className)
                identifier = `.${className.split("_")[0]}`;
        }
        parts.unshift(identifier);
        current = current.parentElement;
        depth += 1;
    }
    return parts.join(" > ");
}
export function identifyElement(target) {
    const path = getElementPath(target);
    const tag = target.tagName.toLowerCase();
    if (tag === "button") {
        const text = target.textContent?.trim();
        return { name: text ? `button \"${text.slice(0, 25)}\"` : "button", path };
    }
    if (tag === "a") {
        const text = target.textContent?.trim();
        return { name: text ? `link \"${text.slice(0, 25)}\"` : "link", path };
    }
    if (tag === "input") {
        const type = target.getAttribute("type") || "text";
        return { name: `${type} input`, path };
    }
    if (["h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
        const text = target.textContent?.trim();
        return { name: text ? `${tag} \"${text.slice(0, 35)}\"` : tag, path };
    }
    if (tag === "p") {
        const text = target.textContent?.trim();
        if (text)
            return { name: `paragraph: \"${text.slice(0, 40)}\"`, path };
    }
    return { name: tag === "div" ? "container" : tag, path };
}
export function getNearbyText(element) {
    const parts = [];
    const ownText = element.textContent?.trim();
    if (ownText && ownText.length < 120) {
        parts.push(ownText);
    }
    const prevText = element.previousElementSibling?.textContent?.trim();
    if (prevText && prevText.length < 60) {
        parts.unshift(`[before: \"${prevText.slice(0, 40)}\"]`);
    }
    const nextText = element.nextElementSibling?.textContent?.trim();
    if (nextText && nextText.length < 60) {
        parts.push(`[after: \"${nextText.slice(0, 40)}\"]`);
    }
    return parts.join(" ");
}
export function getElementClasses(target) {
    if (typeof target.className !== "string" || !target.className)
        return "";
    const classes = target.className
        .split(/\s+/)
        .filter(Boolean)
        .map((cls) => {
        const match = cls.match(/^([a-zA-Z][a-zA-Z0-9_-]*?)(?:_[a-zA-Z0-9]{5,})?$/);
        return match ? match[1] : cls;
    })
        .filter((value, index, all) => all.indexOf(value) === index);
    return classes.join(", ");
}

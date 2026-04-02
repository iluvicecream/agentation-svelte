const STORAGE_PREFIX = "feedback-annotations-";
const DEFAULT_RETENTION_DAYS = 7;
export function getStorageKey(pathname) {
    return `${STORAGE_PREFIX}${pathname}`;
}
export function loadAnnotations(pathname) {
    if (typeof window === "undefined")
        return [];
    try {
        const stored = localStorage.getItem(getStorageKey(pathname));
        if (!stored)
            return [];
        const data = JSON.parse(stored);
        const cutoff = Date.now() - DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
        return data.filter((annotation) => !annotation.timestamp || annotation.timestamp > cutoff);
    }
    catch {
        return [];
    }
}
export function saveAnnotations(pathname, annotations) {
    if (typeof window === "undefined")
        return;
    try {
        localStorage.setItem(getStorageKey(pathname), JSON.stringify(annotations));
    }
    catch {
        // localStorage might be full or disabled
    }
}

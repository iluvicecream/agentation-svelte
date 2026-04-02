export declare function closestCrossingShadow(element: Element, selector: string): Element | null;
export declare function deepElementFromPoint(x: number, y: number): HTMLElement | null;
export declare function getElementPath(target: HTMLElement, maxDepth?: number): string;
export declare function identifyElement(target: HTMLElement): {
    name: string;
    path: string;
};
export declare function getNearbyText(element: HTMLElement): string;
export declare function getNearbyElements(element: HTMLElement): string;
export declare function getElementClasses(target: HTMLElement): string;
export declare function getDetailedComputedStyles(target: HTMLElement): Record<string, string>;
export declare function getForensicComputedStyles(target: HTMLElement): string;
export declare function getAccessibilityInfo(target: HTMLElement): string;
export declare function getFullElementPath(target: HTMLElement): string;
//# sourceMappingURL=dom-utils.d.ts.map
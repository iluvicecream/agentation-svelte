<script lang="ts">
  import { ModeWatcher, mode, setMode } from "mode-watcher";
  import { onMount, tick } from "svelte";
  import Toolbar from "./components/Toolbar.svelte";
  import MarkersLayer from "./components/MarkersLayer.svelte";
  import HoverOverlay from "./components/HoverOverlay.svelte";
  import AnnotationPopup from "./components/AnnotationPopup.svelte";
  import {
    closestCrossingShadow,
    deepElementFromPoint,
    getAccessibilityInfo,
    getDetailedComputedStyles,
    getElementClasses,
    getForensicComputedStyles,
    getFullElementPath,
    getNearbyElements,
    getNearbyText,
    identifyElement
  } from "./dom-utils";
  import { generateOutput } from "./output";
  import {
    getSvelteComponentHierarchy,
    getSvelteComponentName,
    getSvelteSourceLocation
  } from "./svelte-detection";
  import {
    freeze as freezeAll,
    originalSetInterval,
    originalSetTimeout,
    unfreeze as unfreezeAll
  } from "./freeze-animations";
  import type { PopupAnimState, PopupTimers } from "./popup";
  import { clearPopupTimers, startOpenPopupAnimation } from "./popup";
  import { loadAnnotations, saveAnnotations } from "./storage";
  import type { AgentationProps, Annotation, DraftAnnotation, OutputMode } from "./types";

  type PendingMultiSelectItem = {
    element: HTMLElement;
    rect: DOMRect;
    name: string;
    path: string;
  };

  type DragMatch = { element: HTMLElement; rect: DOMRect };

  type ToolbarSettings = {
    autoClearAfterCopy: boolean;
    blockInteractions: boolean;
    annotationColorId: "blue" | "green" | "yellow" | "orange" | "red" | "indigo" | "cyan";
    webhookUrl: string;
    webhooksEnabled: boolean;
  };

  const COLOR_OPTIONS: Array<{ id: ToolbarSettings["annotationColorId"]; label: string; color: string }> = [
    { id: "indigo", label: "Indigo", color: "#6155f5" },
    { id: "blue", label: "Blue", color: "#3c82f7" },
    { id: "cyan", label: "Cyan", color: "#00c3d0" },
    { id: "green", label: "Green", color: "#34c759" },
    { id: "yellow", label: "Yellow", color: "#ffcc00" },
    { id: "orange", label: "Orange", color: "#ff8d28" },
    { id: "red", label: "Red", color: "#ff383c" }
  ];

  const DRAG_THRESHOLD = 8;
  const ELEMENT_UPDATE_THROTTLE = 50;

  const DRAG_TEXT_TAGS = new Set([
    "P",
    "SPAN",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "LI",
    "TD",
    "TH",
    "LABEL",
    "BLOCKQUOTE",
    "FIGCAPTION",
    "CAPTION",
    "LEGEND",
    "DT",
    "DD",
    "PRE",
    "CODE",
    "EM",
    "STRONG",
    "B",
    "I",
    "U",
    "S",
    "A",
    "TIME",
    "ADDRESS",
    "CITE",
    "Q",
    "ABBR",
    "DFN",
    "MARK",
    "SMALL",
    "SUB",
    "SUP"
  ]);

  const PREVIEW_MEANINGFUL_TAGS = new Set([
    "BUTTON",
    "A",
    "INPUT",
    "IMG",
    "P",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "LI",
    "LABEL",
    "TD",
    "TH",
    "SECTION",
    "ARTICLE",
    "ASIDE",
    "NAV"
  ]);

  let {
    copyToClipboard = true,
    defaultOutputMode = "standard",
    endpoint,
    onAnnotationAdd,
    onAnnotationDelete,
    onAnnotationUpdate,
    onAnnotationsClear,
    onCopy,
    onSubmit
  }: AgentationProps = $props();

  let mounted = $state(false);
  let showToolbarEntrance = $state(true);
  let isToolbarExpanded = $state(false);
  let isActive = $state(false);
  let showMarkers = $state(false);
  let annotations = $state<Annotation[]>([]);
  let scrollY = $state(0);

  let draft = $state<DraftAnnotation | null>(null);
  let draftComment = $state("");
  let editingAnnotationId = $state<string | null>(null);
  let popupAnimState = $state<PopupAnimState>("initial");
  let popupShake = $state(false);
  let popupX = $state(0);
  let popupY = $state(0);
  let showSettings = $state(false);
  let tooltipsHiddenUntilMouseLeave = $state(false);
  let outputMode = $state<OutputMode>("standard");
  let resolvedMode = $state<"dark" | "light">("dark");
  let hoverRect = $state<{ left: number; top: number; width: number; height: number } | null>(null);
  let hoverLabel = $state("");
  let hoverElementName = $state("");
  let hoverReactPath = $state("");
  let hoverTooltipX = $state(0);
  let hoverTooltipY = $state(0);
  let pendingMultiSelectElements = $state<PendingMultiSelectItem[]>([]);
  let modifiersHeld = $state({ cmdOrCtrl: false, shift: false });
  let dragStart = $state<{ x: number; y: number } | null>(null);
  let dragCurrent = $state<{ x: number; y: number } | null>(null);
  let isDragSelecting = $state(false);
  let justFinishedDragSelection = $state(false);
  let dragSelectionPreview = $state<PendingMultiSelectItem[]>([]);
  let lastDragElementUpdate = 0;
  let isFrozen = $state(false);
  let connectionStatus = $state<"disconnected" | "connecting" | "connected">("disconnected");
  let sendState = $state<"idle" | "sending" | "sent" | "failed">("idle");
  let settings = $state<ToolbarSettings>({
    autoClearAfterCopy: false,
    blockInteractions: true,
    annotationColorId: "blue",
    webhookUrl: "",
    webhooksEnabled: true
  });

  const pathname = $derived(typeof window !== "undefined" ? window.location.pathname : "/");
  const hasPopup = $derived(draft !== null);
  const popupPlaceholder = $derived.by(() => {
    if (editingAnnotationId) return "Edit your feedback...";
    if (!draft) return "What should change?";
    if (draft.element === "Area selection") return "What should change in this area?";
    if (draft.isMultiSelect) return "Feedback for this group of elements...";
    return "What should change?";
  });
  const pendingMultiSelectBounds = $derived.by(() => {
    if (pendingMultiSelectElements.length === 0) return null;
    const left = Math.min(...pendingMultiSelectElements.map((item) => item.rect.left));
    const top = Math.min(...pendingMultiSelectElements.map((item) => item.rect.top));
    const right = Math.max(...pendingMultiSelectElements.map((item) => item.rect.right));
    const bottom = Math.max(...pendingMultiSelectElements.map((item) => item.rect.bottom));
    return {
      left,
      top,
      width: right - left,
      height: bottom - top
    };
  });
  const dragSelectionRect = $derived.by(() => {
    if (!dragStart || !dragCurrent) return null;
    const left = Math.min(dragStart.x, dragCurrent.x);
    const top = Math.min(dragStart.y, dragCurrent.y);
    const right = Math.max(dragStart.x, dragCurrent.x);
    const bottom = Math.max(dragStart.y, dragCurrent.y);
    return {
      left,
      top,
      width: right - left,
      height: bottom - top,
      right,
      bottom
    };
  });
  const dragSelectionPreviewLabel = $derived.by(() => {
    if (dragSelectionPreview.length === 0) return "";
    const names = dragSelectionPreview.slice(0, 3).map((item) => item.name).join(", ");
    const suffix = dragSelectionPreview.length > 3 ? ` +${dragSelectionPreview.length - 3} more` : "";
    return `${names}${suffix}`;
  });
  const OUTPUT_MODE_KEY = "agentation-svelte-output-mode";
  const SETTINGS_KEY = "agentation-svelte-settings";
  let popupTimers = $state<PopupTimers>({
    popupEnterTimer: null,
    popupEnteredTimer: null,
    popupExitTimer: null,
    popupShakeTimer: null
  });
  let toolbarEntranceTimer: ReturnType<typeof setTimeout> | null = null;

  function resetPopupTimers() {
    popupTimers = clearPopupTimers(popupTimers);
  }

  function autoResizeTextarea() {
    const textarea = document.querySelector("[data-agentation-root] .popupTextarea") as HTMLTextAreaElement | null;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  function isElementFixed(element: HTMLElement): boolean {
    let current: HTMLElement | null = element;
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      if (style.position === "fixed" || style.position === "sticky") {
        return true;
      }
      current = current.parentElement;
    }
    return false;
  }

  function openPopup(nextDraft: DraftAnnotation, clientX: number, clientY: number) {
    resetPopupTimers();
    clearHover();
    draft = nextDraft;
    popupShake = false;
    const { timers, result } = startOpenPopupAnimation(nextDraft, clientX, clientY, (state) => {
      popupAnimState = state;
    });
    popupTimers = {
      ...popupTimers,
      ...timers
    };
    popupX = result.popupX;
    popupY = result.popupY;

    tick().then(() => {
      autoResizeTextarea();
    });
  }

  function forceClosePopup() {
    draft = null;
    draftComment = "";
    editingAnnotationId = null;
    popupAnimState = "initial";
    popupShake = false;
  }

  function closePopup() {
    if (!draft) return;
    resetPopupTimers();
    popupAnimState = "exit";
    popupTimers = {
      ...popupTimers,
      popupExitTimer: originalSetTimeout(() => {
        forceClosePopup();
      }, 150)
    };
  }

  function shakePopup() {
    if (!draft) return;
    if (popupTimers.popupShakeTimer) clearTimeout(popupTimers.popupShakeTimer);
    popupShake = true;
    popupTimers = {
      ...popupTimers,
      popupShakeTimer: originalSetTimeout(() => {
        popupShake = false;
      }, 250)
    };
  }

  function clearHover() {
    hoverRect = null;
    hoverLabel = "";
    hoverElementName = "";
    hoverReactPath = "";
  }

  function setHoverFromTarget(target: HTMLElement, clientX: number, clientY: number) {
    const rect = target.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) {
      clearHover();
      return;
    }

    const { name } = identifyElement(target);
    hoverElementName = name;
    hoverReactPath = target.tagName.toLowerCase();
    if (target.id) {
      hoverReactPath = `#${target.id}`;
    }
    hoverRect = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height
    };
    hoverLabel = name;
    hoverTooltipX = Math.max(8, Math.min(clientX, window.innerWidth - 100));
    hoverTooltipY = Math.max(8, rect.top - 32);
  }

  function resetDragSelectionState() {
    dragStart = null;
    dragCurrent = null;
    isDragSelecting = false;
    dragSelectionPreview = [];
  }

  function collectPreviewDragMatches(bounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  }): DragMatch[] {
    const candidates = new Set<HTMLElement>();
    const points: Array<[number, number]> = [
      [bounds.left, bounds.top],
      [bounds.right, bounds.top],
      [bounds.left, bounds.bottom],
      [bounds.right, bounds.bottom],
      [(bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2],
      [(bounds.left + bounds.right) / 2, bounds.top],
      [(bounds.left + bounds.right) / 2, bounds.bottom],
      [bounds.left, (bounds.top + bounds.bottom) / 2],
      [bounds.right, (bounds.top + bounds.bottom) / 2]
    ];

    for (const [x, y] of points) {
      const elements = document.elementsFromPoint(x, y);
      for (const el of elements) {
        if (el instanceof HTMLElement) candidates.add(el);
      }
    }

    const nearbyElements = document.querySelectorAll(
      "button, a, input, img, p, h1, h2, h3, h4, h5, h6, li, label, td, th, div, span, section, article, aside, nav"
    );
    for (const el of nearbyElements) {
      if (el instanceof HTMLElement) candidates.add(el);
    }

    const allMatching: DragMatch[] = [];
    for (const node of candidates) {
      if (!node.isConnected || node.closest("[data-agentation-root]")) continue;
      if (
        closestCrossingShadow(
          node,
          "[data-agentation-root], [data-annotation-marker], [data-annotation-popup]"
        )
      )
        continue;
      const rect = node.getBoundingClientRect();
      if (rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.5) continue;
      if (rect.width < 10 || rect.height < 10) continue;

      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const centerInside =
        centerX >= bounds.left && centerX <= bounds.right && centerY >= bounds.top && centerY <= bounds.bottom;

      const overlapX = Math.min(rect.right, bounds.right) - Math.max(rect.left, bounds.left);
      const overlapY = Math.min(rect.bottom, bounds.bottom) - Math.max(rect.top, bounds.top);
      const overlapArea = overlapX > 0 && overlapY > 0 ? overlapX * overlapY : 0;
      const elementArea = rect.width * rect.height;
      const overlapRatio = elementArea > 0 ? overlapArea / elementArea : 0;

      if (!centerInside && overlapRatio <= 0.5) continue;

      if (
        rect.left < bounds.right &&
        rect.right > bounds.left &&
        rect.top < bounds.bottom &&
        rect.bottom > bounds.top
      ) {
        const tagName = node.tagName;
        let shouldInclude = PREVIEW_MEANINGFUL_TAGS.has(tagName);

        if (!shouldInclude && (tagName === "DIV" || tagName === "SPAN")) {
          const hasText = !!(node.textContent && node.textContent.trim().length > 0);
          const isInteractive =
            node.onclick !== null ||
            node.getAttribute("role") === "button" ||
            node.getAttribute("role") === "link" ||
            node.classList.contains("clickable") ||
            node.hasAttribute("data-clickable");

          if ((hasText || isInteractive) && !node.querySelector("p, h1, h2, h3, h4, h5, h6, button, a")) {
            shouldInclude = true;
          }
        }

        if (shouldInclude) {
          let dominated = false;
          for (const existing of allMatching) {
            if (
              existing.rect.left <= rect.left &&
              existing.rect.right >= rect.right &&
              existing.rect.top <= rect.top &&
              existing.rect.bottom >= rect.bottom
            ) {
              dominated = true;
              break;
            }
          }
          if (!dominated) allMatching.push({ element: node, rect });
        }
      }
    }

    return allMatching;
  }

  function toPendingItems(matches: DragMatch[]): PendingMultiSelectItem[] {
    return matches.map(({ element, rect }) => {
      const { name, path } = identifyElement(element);
      return { element, rect, name, path };
    });
  }

  function getFinalDragItems(bounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  }): PendingMultiSelectItem[] {
    const allMatching: DragMatch[] = [];
    const selector = "button, a, input, img, p, h1, h2, h3, h4, h5, h6, li, label, td, th";

    document.querySelectorAll(selector).forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      if (
        closestCrossingShadow(el, "[data-agentation-root], [data-annotation-marker], [data-annotation-popup]")
      )
        return;

      const rect = el.getBoundingClientRect();
      if (rect.width > window.innerWidth * 0.8 && rect.height > window.innerHeight * 0.5) return;
      if (rect.width < 10 || rect.height < 10) return;

      if (
        rect.left < bounds.right &&
        rect.right > bounds.left &&
        rect.top < bounds.bottom &&
        rect.bottom > bounds.top
      ) {
        allMatching.push({ element: el, rect });
      }
    });

    const finalMatches = allMatching.filter(
      ({ element }) => !allMatching.some(({ element: other }) => other !== element && element.contains(other))
    );

    return toPendingItems(finalMatches);
  }

  function collapseToolbar() {
    if (!isToolbarExpanded) return;
    isToolbarExpanded = false;
    showSettings = false;
    tooltipsHiddenUntilMouseLeave = false;
    showMarkers = false;
    if (isActive) {
      isActive = false;
      closePopup();
      clearHover();
    }
  }

  function beginCreate(target: HTMLElement, event: MouseEvent) {
    const rect = target.getBoundingClientRect();
    const { name, path } = identifyElement(target);
    const selection = window.getSelection()?.toString().trim() || undefined;
    const fixed = isElementFixed(target);
    const sourceFile = getSvelteSourceLocation(target);
    const sourceComponent = getSvelteComponentName(target);
    const svelteComponents = getSvelteComponentHierarchy(target);
    const computedStylesObj = getDetailedComputedStyles(target);
    const computedStyles = getForensicComputedStyles(target);

    openPopup(
      {
        x: (event.clientX / window.innerWidth) * 100,
        y: fixed ? event.clientY : event.clientY + window.scrollY,
        element: name,
        elementPath: path,
        selectedText: selection,
        boundingBox: {
          x: rect.left,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height
        },
        nearbyText: getNearbyText(target),
        cssClasses: getElementClasses(target),
        isFixed: fixed,
        sourceFile,
        sourceComponent,
        svelteComponents,
        nearbyElements: getNearbyElements(target),
        fullPath: getFullElementPath(target),
        accessibility: getAccessibilityInfo(target),
        computedStyles,
        computedStylesObj
      },
      event.clientX,
      event.clientY
    );
    draftComment = "";
    editingAnnotationId = null;
  }

  function createMultiSelectDraft(items: PendingMultiSelectItem[]) {
    if (items.length === 0) return;

    const freshRects = items.map((item) => item.element.getBoundingClientRect());
    const firstItem = items[0];
    const firstEl = firstItem.element;

    if (items.length === 1) {
      const rect = freshRects[0];
      const isFixed = isElementFixed(firstEl);
      openPopup(
        {
          x: (rect.left / window.innerWidth) * 100,
          y: isFixed ? rect.top : rect.top + window.scrollY,
          element: firstItem.name,
          elementPath: firstItem.path,
          boundingBox: {
            x: rect.left,
            y: rect.top + window.scrollY,
            width: rect.width,
            height: rect.height
          },
          nearbyText: getNearbyText(firstEl),
          cssClasses: getElementClasses(firstEl),
          isFixed,
          sourceFile: getSvelteSourceLocation(firstEl),
          sourceComponent: getSvelteComponentName(firstEl),
          svelteComponents: getSvelteComponentHierarchy(firstEl),
          nearbyElements: getNearbyElements(firstEl),
          fullPath: getFullElementPath(firstEl),
          accessibility: getAccessibilityInfo(firstEl),
          computedStyles: getForensicComputedStyles(firstEl),
          computedStylesObj: getDetailedComputedStyles(firstEl)
        },
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );
      draftComment = "";
      editingAnnotationId = null;
      return;
    }

    const bounds = {
      left: Math.min(...freshRects.map((r) => r.left)),
      top: Math.min(...freshRects.map((r) => r.top)),
      right: Math.max(...freshRects.map((r) => r.right)),
      bottom: Math.max(...freshRects.map((r) => r.bottom))
    };

    const names = items.slice(0, 5).map((item) => item.name).join(", ");
    const suffix = items.length > 5 ? ` +${items.length - 5} more` : "";
    const lastItem = items[items.length - 1];
    const lastRect = freshRects[freshRects.length - 1];
    const lastCenterX = lastRect.left + lastRect.width / 2;
    const lastCenterY = lastRect.top + lastRect.height / 2;
    const lastIsFixed = isElementFixed(lastItem.element);

    openPopup(
      {
        x: (lastCenterX / window.innerWidth) * 100,
        y: lastIsFixed ? lastCenterY : lastCenterY + window.scrollY,
        element: `${items.length} elements: ${names}${suffix}`,
        elementPath: "multi-select",
        boundingBox: {
          x: bounds.left,
          y: bounds.top + window.scrollY,
          width: bounds.right - bounds.left,
          height: bounds.bottom - bounds.top
        },
        elementBoundingBoxes: freshRects.map((rect) => ({
          x: rect.left,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height
        })),
        nearbyText: getNearbyText(firstEl),
        cssClasses: getElementClasses(firstEl),
        isFixed: lastIsFixed,
        isMultiSelect: true,
        sourceFile: getSvelteSourceLocation(firstEl),
        sourceComponent: getSvelteComponentName(firstEl),
        svelteComponents: getSvelteComponentHierarchy(firstEl),
        nearbyElements: getNearbyElements(firstEl),
        fullPath: getFullElementPath(firstEl),
        accessibility: getAccessibilityInfo(firstEl),
        computedStyles: getForensicComputedStyles(firstEl),
        computedStylesObj: getDetailedComputedStyles(firstEl)
      },
      lastCenterX,
      lastCenterY
    );

    draftComment = "";
    editingAnnotationId = null;
  }

  function beginEdit(annotation: Annotation, event: MouseEvent) {
    openPopup(
      {
        x: annotation.x,
        y: annotation.y,
        element: annotation.element,
        elementPath: annotation.elementPath,
        selectedText: annotation.selectedText,
        boundingBox: annotation.boundingBox,
        nearbyText: annotation.nearbyText,
        cssClasses: annotation.cssClasses,
        isFixed: annotation.isFixed,
        sourceFile: annotation.sourceFile,
        sourceComponent: annotation.sourceComponent,
        svelteComponents: annotation.svelteComponents,
        nearbyElements: annotation.nearbyElements,
        fullPath: annotation.fullPath,
        accessibility: annotation.accessibility,
        computedStyles: annotation.computedStyles,
        computedStylesObj: annotation.computedStylesObj
      },
      event.clientX,
      event.clientY
    );
    draftComment = annotation.comment;
    editingAnnotationId = annotation.id;
  }

  function saveDraft() {
    if (!draft || !draftComment.trim()) return;

    if (editingAnnotationId) {
      annotations = annotations.map((annotation) => {
        if (annotation.id !== editingAnnotationId) return annotation;
        const updated = {
          ...annotation,
          ...draft,
          comment: draftComment.trim()
        } satisfies Annotation;
        onAnnotationUpdate?.(updated);
        return updated;
      });
      closePopup();
      return;
    }

    const annotation: Annotation = {
      id: `annotation-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ...draft,
      comment: draftComment.trim(),
      timestamp: Date.now()
    };
    annotations = [...annotations, annotation];
    onAnnotationAdd?.(annotation);
    closePopup();
  }

  function removeAnnotation(annotation: Annotation) {
    annotations = annotations.filter((item) => item.id !== annotation.id);
    onAnnotationDelete?.(annotation);
    if (editingAnnotationId === annotation.id) closePopup();
  }

  function clearAll() {
    if (annotations.length === 0) return;
    const previous = annotations;
    annotations = [];
    closePopup();
    onAnnotationsClear?.(previous);
  }

  function hideTooltipsUntilMouseLeave() {
    tooltipsHiddenUntilMouseLeave = true;
  }

  function toggleThemeMode() {
    setMode(resolvedMode === "dark" ? "light" : "dark");
    hideTooltipsUntilMouseLeave();
  }

  async function copyAnnotations() {
    const output = generateOutput(annotations, pathname, outputMode);
    if (!output) return;

    if (copyToClipboard && typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(output);
      } catch {
        // Ignore clipboard failures.
      }
    }

    onCopy?.(output);

    if (settings.webhooksEnabled && settings.webhookUrl) {
      await fireWebhook("copy", { output, annotations });
    }

    if (settings.autoClearAfterCopy) {
      clearAll();
    }
  }

  function renderMarkerY(annotation: Annotation): number {
    return annotation.isFixed ? annotation.y : annotation.y - scrollY;
  }

  function renderDraftMarkerY(): number {
    if (!draft) return 0;
    return draft.isFixed ? draft.y : draft.y - scrollY;
  }

  function openToolbar() {
    isToolbarExpanded = true;
    showMarkers = true;
    isActive = true;
  }

  function toggleMarkers() {
    hideTooltipsUntilMouseLeave();
    showMarkers = !showMarkers;
  }

  function toggleSettings() {
    hideTooltipsUntilMouseLeave();
    showSettings = !showSettings;
  }

  function clearPendingMultiSelect() {
    pendingMultiSelectElements = [];
    modifiersHeld = { cmdOrCtrl: false, shift: false };
  }

  function togglePendingMultiSelect(target: HTMLElement) {
    const existingIndex = pendingMultiSelectElements.findIndex((item) => item.element === target);
    if (existingIndex >= 0) {
      pendingMultiSelectElements = pendingMultiSelectElements.filter((_, index) => index !== existingIndex);
      return;
    }

    const rect = target.getBoundingClientRect();
    const { name, path } = identifyElement(target);
    pendingMultiSelectElements = [...pendingMultiSelectElements, { element: target, rect, name, path }];
  }

  function updateSettings(patch: Partial<ToolbarSettings>) {
    settings = { ...settings, ...patch };
  }

  function isValidUrl(url: string): boolean {
    if (!url.trim()) return false;
    try {
      const parsed = new URL(url.trim());
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  async function fireWebhook(eventName: string, payload: Record<string, unknown>, force = false): Promise<boolean> {
    const targetUrl = settings.webhookUrl;
    if (!targetUrl || (!settings.webhooksEnabled && !force)) return false;
    if (!isValidUrl(targetUrl)) return false;

    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: eventName,
          timestamp: Date.now(),
          url: typeof window !== "undefined" ? window.location.href : undefined,
          ...payload
        })
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async function checkConnection() {
    if (!endpoint) {
      connectionStatus = "disconnected";
      return;
    }
    try {
      const response = await fetch(`${endpoint}/health`);
      connectionStatus = response.ok ? "connected" : "disconnected";
    } catch {
      connectionStatus = "disconnected";
    }
  }

  async function sendToAgent() {
    if (!endpoint || connectionStatus !== "connected") return;
    const output = generateOutput(annotations, pathname, outputMode);
    if (!output) return;

    onSubmit?.(output, annotations);
    sendState = "sending";
    await new Promise((resolve) => originalSetTimeout(resolve, 150));

    try {
      const response = await fetch(`${endpoint}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ output, annotations, pathname, timestamp: Date.now() })
      });
      const ok = response.ok;
      sendState = ok ? "sent" : "failed";
      if (ok && settings.autoClearAfterCopy) {
        originalSetTimeout(() => {
          clearAll();
        }, 500);
      }
    } catch {
      sendState = "failed";
    }

    originalSetTimeout(() => {
      sendState = "idle";
    }, 2500);
  }

  onMount(() => {
    mounted = true;
    scrollY = window.scrollY;
    annotations = loadAnnotations(pathname);

    toolbarEntranceTimer = originalSetTimeout(() => {
      showToolbarEntrance = false;
    }, 500);

    try {
      if (
        defaultOutputMode === "compact" ||
        defaultOutputMode === "standard" ||
        defaultOutputMode === "detailed" ||
        defaultOutputMode === "forensic"
      ) {
        outputMode = defaultOutputMode;
      }

      const savedMode = localStorage.getItem(OUTPUT_MODE_KEY);
      if (
        savedMode === "compact" ||
        savedMode === "standard" ||
        savedMode === "detailed" ||
        savedMode === "forensic"
      ) {
        outputMode = savedMode;
      }

      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings) as Partial<ToolbarSettings>;
        settings = {
          ...settings,
          ...parsed,
          annotationColorId:
            parsed.annotationColorId && COLOR_OPTIONS.some((c) => c.id === parsed.annotationColorId)
              ? parsed.annotationColorId
              : settings.annotationColorId
        };
      }
    } catch {
      // ignore localStorage issues
    }

    const onScroll = () => {
      scrollY = window.scrollY;
      if (pendingMultiSelectElements.length > 0) {
        pendingMultiSelectElements = pendingMultiSelectElements
          .filter((item) => item.element.isConnected)
          .map((item) => ({
            ...item,
            rect: item.element.getBoundingClientRect()
          }));
      }
      clearHover();
    };

    const onDocumentMouseMove = (event: MouseEvent) => {
      if (!isActive || draft) {
        clearHover();
        return;
      }

      const target = deepElementFromPoint(event.clientX, event.clientY);
      if (!target || closestCrossingShadow(target, "[data-agentation-root]")) {
        clearHover();
        return;
      }

      setHoverFromTarget(target, event.clientX, event.clientY);
    };

    const onDocumentDragMouseMove = (event: MouseEvent) => {
      if (!isActive || !dragStart || draft) return;
      dragCurrent = { x: event.clientX, y: event.clientY };
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      const thresholdSq = DRAG_THRESHOLD * DRAG_THRESHOLD;
      if (dx * dx + dy * dy >= thresholdSq) {
        isDragSelecting = true;
        clearHover();

        const now = Date.now();
        if (now - lastDragElementUpdate < ELEMENT_UPDATE_THROTTLE) {
          return;
        }
        lastDragElementUpdate = now;

        const bounds = {
          left: Math.min(dragStart.x, event.clientX),
          top: Math.min(dragStart.y, event.clientY),
          right: Math.max(dragStart.x, event.clientX),
          bottom: Math.max(dragStart.y, event.clientY)
        };
        dragSelectionPreview = toPendingItems(collectPreviewDragMatches(bounds));
      }
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (!isActive) return;
      if (justFinishedDragSelection) {
        justFinishedDragSelection = false;
        return;
      }

      const target = (event.composedPath()[0] || event.target) as HTMLElement | null;
      if (!target) return;

      if (draft) {
        if (!closestCrossingShadow(target, "[data-agentation-root]")) {
          event.preventDefault();
          event.stopPropagation();
          shakePopup();
        }
        return;
      }

      if (closestCrossingShadow(target, "[data-agentation-root]")) return;

      const isInteractive = closestCrossingShadow(
        target,
        "button, a, input, select, textarea, [role='button'], [onclick]"
      );

      if (settings.blockInteractions && isInteractive) {
        event.preventDefault();
        event.stopPropagation();
      }

      if ((event.metaKey || event.ctrlKey) && event.shiftKey && !draft && !editingAnnotationId) {
        event.preventDefault();
        event.stopPropagation();
        const elementUnder = deepElementFromPoint(event.clientX, event.clientY);
        if (!elementUnder) return;
        if (closestCrossingShadow(elementUnder, "[data-agentation-root]")) return;
        togglePendingMultiSelect(elementUnder);
        setHoverFromTarget(elementUnder, event.clientX, event.clientY);
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const elementUnder = deepElementFromPoint(event.clientX, event.clientY);
      if (!elementUnder) return;
      if (closestCrossingShadow(elementUnder, "[data-agentation-root]")) return;
      beginCreate(elementUnder, event);
    };

    const onDocumentMouseDown = (event: MouseEvent) => {
      if (!isActive) return;
      const target = (event.composedPath()[0] || event.target) as HTMLElement | null;
      if (target && closestCrossingShadow(target, "[data-agentation-root]")) return;
      if (draft) return;
      if (target && (DRAG_TEXT_TAGS.has(target.tagName) || target.isContentEditable)) return;
      pendingMultiSelectElements = [];
      dragStart = { x: event.clientX, y: event.clientY };
      dragCurrent = { x: event.clientX, y: event.clientY };
      isDragSelecting = false;
      lastDragElementUpdate = 0;
      event.preventDefault();
    };

    const onDocumentMouseUp = (event: MouseEvent) => {
      if (!isActive || !dragStart || !dragCurrent || draft) {
        resetDragSelectionState();
        return;
      }

      if (!isDragSelecting || !dragSelectionRect) {
        resetDragSelectionState();
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const items = getFinalDragItems(dragSelectionRect);
      if (items.length > 0) {
        createMultiSelectDraft(items);
      } else {
        if (dragSelectionRect.width <= 20 || dragSelectionRect.height <= 20) {
          resetDragSelectionState();
          return;
        }

        const centerX = dragSelectionRect.left + dragSelectionRect.width / 2;
        const centerY = dragSelectionRect.top + dragSelectionRect.height / 2;
        openPopup(
          {
            x: (centerX / window.innerWidth) * 100,
            y: centerY + window.scrollY,
            element: "Area selection",
            elementPath: `region at (${Math.round(dragSelectionRect.left)}, ${Math.round(dragSelectionRect.top)})`,
            boundingBox: {
              x: dragSelectionRect.left,
              y: dragSelectionRect.top + window.scrollY,
              width: dragSelectionRect.width,
              height: dragSelectionRect.height
            },
            nearbyText: "",
            cssClasses: "",
            isFixed: false,
            isMultiSelect: true
          },
          centerX,
          centerY
        );
        draftComment = "";
        editingAnnotationId = null;
      }

      justFinishedDragSelection = true;
      originalSetTimeout(() => {
        justFinishedDragSelection = false;
      }, 0);
      resetDragSelectionState();
    };

    const onDocumentSelectStart = (event: Event) => {
      if (!isActive) return;
      const target = (event.composedPath()[0] || event.target) as HTMLElement | null;
      if (target && closestCrossingShadow(target, "[data-agentation-root]")) return;
      event.preventDefault();
    };

    const onDocumentDragStart = (event: DragEvent) => {
      if (!isActive) return;
      const target = (event.composedPath()[0] || event.target) as HTMLElement | null;
      if (target && closestCrossingShadow(target, "[data-agentation-root]")) return;
      event.preventDefault();
    };

    const onModifierKeyDown = (event: KeyboardEvent) => {
      const next = {
        cmdOrCtrl: modifiersHeld.cmdOrCtrl || event.key === "Meta" || event.key === "Control",
        shift: modifiersHeld.shift || event.key === "Shift"
      };
      modifiersHeld = next;
    };

    const onModifierKeyUp = (event: KeyboardEvent) => {
      const wasHoldingBoth = modifiersHeld.cmdOrCtrl && modifiersHeld.shift;
      const next = {
        cmdOrCtrl:
          event.key === "Meta" || event.key === "Control"
            ? false
            : modifiersHeld.cmdOrCtrl,
        shift: event.key === "Shift" ? false : modifiersHeld.shift
      };
      modifiersHeld = next;
      const nowHoldingBoth = next.cmdOrCtrl && next.shift;

      if (wasHoldingBoth && !nowHoldingBoth && pendingMultiSelectElements.length > 0) {
        const items = pendingMultiSelectElements;
        pendingMultiSelectElements = [];
        createMultiSelectDraft(items);
      }
    };

    const onWindowBlur = () => {
      clearPendingMultiSelect();
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (draft) {
        closePopup();
        return;
      }
      if (showSettings) {
        showSettings = false;
        return;
      }
      if (isActive) {
        isActive = false;
        clearHover();
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mousemove", onDocumentMouseMove, { capture: true, passive: true });
    document.addEventListener("mousedown", onDocumentMouseDown, true);
    document.addEventListener("mousemove", onDocumentDragMouseMove, true);
    document.addEventListener("mouseup", onDocumentMouseUp, true);
    document.addEventListener("click", onDocumentClick, true);
    document.addEventListener("selectstart", onDocumentSelectStart, true);
    document.addEventListener("dragstart", onDocumentDragStart, true);
    window.addEventListener("keydown", onEscape);
    document.addEventListener("keydown", onModifierKeyDown);
    document.addEventListener("keyup", onModifierKeyUp);
    window.addEventListener("blur", onWindowBlur);

    return () => {
      resetPopupTimers();
      if (toolbarEntranceTimer) clearTimeout(toolbarEntranceTimer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousemove", onDocumentMouseMove, true);
      document.removeEventListener("mousemove", onDocumentDragMouseMove, true);
      document.removeEventListener("mousedown", onDocumentMouseDown, true);
      document.removeEventListener("mouseup", onDocumentMouseUp, true);
      document.removeEventListener("click", onDocumentClick, true);
      document.removeEventListener("selectstart", onDocumentSelectStart, true);
      document.removeEventListener("dragstart", onDocumentDragStart, true);
      window.removeEventListener("keydown", onEscape);
      document.removeEventListener("keydown", onModifierKeyDown);
      document.removeEventListener("keyup", onModifierKeyUp);
      window.removeEventListener("blur", onWindowBlur);
    };
  });

  $effect(() => {
    if (typeof document === "undefined") return;
    const enableCursor = isActive && !draft;
    document.body.classList.toggle("agentation-annotate-cursor", enableCursor);

    if (!enableCursor) {
      clearHover();
    }

    return () => {
      document.body.classList.remove("agentation-annotate-cursor");
    };
  });

  $effect(() => {
    if (!isActive) {
      pendingMultiSelectElements = [];
      modifiersHeld = { cmdOrCtrl: false, shift: false };
      if (isFrozen) {
        unfreezeAll();
        isFrozen = false;
      }
    }
  });

  onMount(() => {
    return () => {
      unfreezeAll();
    };
  });

  $effect(() => {
    if (!mounted) return;
    if (!endpoint) {
      connectionStatus = "disconnected";
      return;
    }

    connectionStatus = "connecting";
    checkConnection();
    const interval = originalSetInterval(checkConnection, 10000);
    return () => {
      clearInterval(interval);
    };
  });

  $effect(() => {
    if (!mounted) return;
    saveAnnotations(pathname, annotations);
  });

  $effect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(OUTPUT_MODE_KEY, outputMode);
    } catch {
      // ignore localStorage issues
    }
  });

  $effect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore localStorage issues
    }
  });

  $effect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-agentation-accent", settings.annotationColorId);
    const selected = COLOR_OPTIONS.find((color) => color.id === settings.annotationColorId);
    const fallback = selected?.color || "#3c82f7";
    document.documentElement.style.setProperty("--agentation-color-accent", fallback);
    document.documentElement.style.setProperty(`--agentation-color-${settings.annotationColorId}`, fallback);
  });

  $effect(() => {
    const current = mode.current;
    if (current === "dark" || current === "light") {
      resolvedMode = current;
    }
  });
</script>

  <div
    data-agentation-root
    class="agentation-root"
    data-active={isActive}
    data-agentation-theme={resolvedMode}
    data-agentation-accent={settings.annotationColorId}
  >
  <ModeWatcher defaultMode="system" darkClassNames={["dark"]} lightClassNames={["light"]} />

  <Toolbar
    {isToolbarExpanded}
    {showToolbarEntrance}
    annotationsCount={annotations.length}
    {showMarkers}
    {showSettings}
    {tooltipsHiddenUntilMouseLeave}
    {resolvedMode}
    {outputMode}
    {isFrozen}
    {connectionStatus}
    {sendState}
    showSendButton={!!endpoint}
    {settings}
    endpoint={endpoint}
    onOpenToolbar={openToolbar}
    onMouseLeave={() => {
      tooltipsHiddenUntilMouseLeave = false;
    }}
    onToggleMarkers={toggleMarkers}
    onCopy={copyAnnotations}
    onSend={sendToAgent}
    onClear={clearAll}
    onToggleSettings={toggleSettings}
    onCollapse={collapseToolbar}
    onToggleFreeze={() => {
      if (isFrozen) {
        unfreezeAll();
        isFrozen = false;
      } else {
        freezeAll();
        isFrozen = true;
      }
      tooltipsHiddenUntilMouseLeave = true;
    }}
    onToggleTheme={toggleThemeMode}
    onUpdateSettings={updateSettings}
    onSetOutputMode={(modeValue) => {
      outputMode = modeValue;
    }}
  />

  <MarkersLayer
    {annotations}
    {showMarkers}
    {hasPopup}
    {draft}
    {editingAnnotationId}
    {renderMarkerY}
    {renderDraftMarkerY}
    onBeginEdit={beginEdit}
  />

  <HoverOverlay
    isActive={isActive && !hasPopup}
    isMultiSelectMode={modifiersHeld.cmdOrCtrl && modifiersHeld.shift}
    {hoverRect}
    {hoverTooltipX}
    {hoverTooltipY}
    {hoverReactPath}
    {hoverElementName}
    {hoverLabel}
  />

  {#if pendingMultiSelectElements.length > 0}
    {#if pendingMultiSelectBounds}
      <div
        class="multiSelectCombinedOutline"
        style={`left: ${pendingMultiSelectBounds.left}px; top: ${pendingMultiSelectBounds.top}px; width: ${pendingMultiSelectBounds.width}px; height: ${pendingMultiSelectBounds.height}px;`}
      ></div>
    {/if}
    {#each pendingMultiSelectElements as item (item.element)}
      <div
        class={`multiSelectHighlight ${pendingMultiSelectElements.length > 1 ? "green" : "blue"}`}
        style={`left: ${item.rect.left}px; top: ${item.rect.top}px; width: ${item.rect.width}px; height: ${item.rect.height}px;`}
      ></div>
    {/each}
  {/if}

  {#if isDragSelecting && dragSelectionRect}
    {#each dragSelectionPreview as item (item.element)}
      <div
        class="dragAffectedElement"
        style={`left: ${item.rect.left}px; top: ${item.rect.top}px; width: ${item.rect.width}px; height: ${item.rect.height}px;`}
      ></div>
    {/each}
    <div
      class="dragSelectionOutline"
      style={`left: ${dragSelectionRect.left}px; top: ${dragSelectionRect.top}px; width: ${dragSelectionRect.width}px; height: ${dragSelectionRect.height}px;`}
    ></div>
    {#if dragSelectionPreview.length > 0}
      <div
        class="dragSelectionLabel"
        style={`left: ${dragSelectionRect.left + dragSelectionRect.width / 2}px; top: ${Math.max(8, dragSelectionRect.top - 34)}px;`}
      >
        {dragSelectionPreview.length} affected: {dragSelectionPreviewLabel}
      </div>
    {/if}
  {/if}

  <AnnotationPopup
    {hasPopup}
    {draft}
    {popupAnimState}
    {popupShake}
    {popupX}
    {popupY}
    {draftComment}
    placeholder={popupPlaceholder}
    accentColor={draft?.isMultiSelect ? "var(--agentation-color-green, #34c759)" : "var(--agentation-color-blue, #3c82f7)"}
    {editingAnnotationId}
    {annotations}
    onDraftCommentChange={(value) => {
      draftComment = value;
    }}
    onAutoResize={autoResizeTextarea}
    onSave={saveDraft}
    onClose={closePopup}
    onRemove={removeAnnotation}
  />
</div>

<style>
  .agentation-root {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 2147483647;
    font-family: Inter, "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    pointer-events: none;
  }

  :global([data-agentation-root] button) {
    border: none;
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 12px;
    line-height: 1.2;
    font-family: inherit;
    cursor: pointer;
  }

  :global([data-agentation-root] button:disabled) {
    opacity: 0.45;
    cursor: default;
  }

  :global(body.agentation-annotate-cursor) {
    cursor: crosshair !important;
    -webkit-user-select: none;
    user-select: none;
  }

  :global(body.agentation-annotate-cursor [draggable="true"]) {
    -webkit-user-drag: none;
  }

  .multiSelectHighlight {
    position: fixed;
    border-radius: 6px;
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
    pointer-events: none;
    z-index: 99996;
  }

  .multiSelectHighlight.blue {
    border: 2px solid color-mix(in srgb, var(--agentation-color-blue, #3c82f7) 72%, transparent);
    background: color-mix(in srgb, var(--agentation-color-blue, #3c82f7) 12%, transparent);
  }

  .multiSelectHighlight.green {
    border: 2px solid color-mix(in srgb, var(--agentation-color-green, #34c759) 80%, transparent);
    background: color-mix(in srgb, var(--agentation-color-green, #34c759) 14%, transparent);
  }

  .multiSelectCombinedOutline {
    position: fixed;
    border: 2px dashed color-mix(in srgb, var(--agentation-color-green, #34c759) 88%, transparent);
    border-radius: 8px;
    background: color-mix(in srgb, var(--agentation-color-green, #34c759) 8%, transparent);
    pointer-events: none;
    z-index: 99996;
  }

  .dragSelectionOutline {
    position: fixed;
    border: 2px dashed color-mix(in srgb, var(--agentation-color-green, #34c759) 86%, transparent);
    background: color-mix(in srgb, var(--agentation-color-green, #34c759) 10%, transparent);
    border-radius: 8px;
    pointer-events: none;
    z-index: 99997;
  }

  .dragAffectedElement {
    position: fixed;
    border: 2px solid color-mix(in srgb, var(--agentation-color-green, #34c759) 70%, transparent);
    background: color-mix(in srgb, var(--agentation-color-green, #34c759) 12%, transparent);
    border-radius: 6px;
    pointer-events: none;
    z-index: 99996;
  }

  .dragSelectionLabel {
    position: fixed;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    font-size: 11px;
    font-weight: 500;
    line-height: 1.2;
    border-radius: 999px;
    padding: 0.35rem 0.6rem;
    pointer-events: none;
    z-index: 99997;
    white-space: nowrap;
    max-width: min(70vw, 420px);
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :global([data-agentation-theme="light"]) .dragSelectionLabel {
    background: rgba(255, 255, 255, 0.96);
    color: rgba(0, 0, 0, 0.85);
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.14),
      0 0 0 1px rgba(0, 0, 0, 0.08);
  }

  :global([data-agentation-theme="light"]) .multiSelectHighlight.green {
    border-color: color-mix(in srgb, var(--agentation-color-green, #34c759) 74%, transparent);
    background: color-mix(in srgb, var(--agentation-color-green, #34c759) 10%, transparent);
  }

  @media (max-width: 640px) {
    .agentation-root {
      right: 10px;
      bottom: 10px;
    }
  }
</style>

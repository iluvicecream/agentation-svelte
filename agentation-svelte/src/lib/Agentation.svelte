<script lang="ts">
  import { Copy, Eye, EyeOff, Minus, Moon, Pencil, Plus, Settings, Sun, Trash2 } from "@lucide/svelte";
  import { ModeWatcher, mode, setMode } from "mode-watcher";
  import { onMount, tick } from "svelte";
  import { generateOutput } from "./output";
  import { getElementClasses, getNearbyText, identifyElement } from "./dom-utils";
  import { loadAnnotations, saveAnnotations } from "./storage";
  import type { AgentationProps, Annotation, OutputMode } from "./types";

  type DraftAnnotation = Omit<Annotation, "id" | "timestamp" | "comment">;

  let {
    copyToClipboard = true,
    defaultOutputMode = "standard",
    onAnnotationAdd,
    onAnnotationDelete,
    onAnnotationUpdate,
    onAnnotationsClear,
    onCopy
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
  let textareaEl = $state<HTMLTextAreaElement | null>(null);
  let editingAnnotationId = $state<string | null>(null);
  let popupAnimState = $state<"initial" | "enter" | "entered" | "exit">("initial");
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

  const pathname = $derived(typeof window !== "undefined" ? window.location.pathname : "/");
  const hasPopup = $derived(draft !== null);
  const OUTPUT_MODE_KEY = "agentation-svelte-output-mode";
  let popupEnterTimer: ReturnType<typeof setTimeout> | null = null;
  let popupEnteredTimer: ReturnType<typeof setTimeout> | null = null;
  let popupExitTimer: ReturnType<typeof setTimeout> | null = null;
  let popupShakeTimer: ReturnType<typeof setTimeout> | null = null;
  let toolbarEntranceTimer: ReturnType<typeof setTimeout> | null = null;

  function clearPopupTimers() {
    if (popupEnterTimer) clearTimeout(popupEnterTimer);
    if (popupEnteredTimer) clearTimeout(popupEnteredTimer);
    if (popupExitTimer) clearTimeout(popupExitTimer);
    if (popupShakeTimer) clearTimeout(popupShakeTimer);
    popupEnterTimer = null;
    popupEnteredTimer = null;
    popupExitTimer = null;
    popupShakeTimer = null;
  }

  function autoResizeTextarea() {
    if (!textareaEl) return;
    textareaEl.style.height = "auto";
    textareaEl.style.height = `${textareaEl.scrollHeight}px`;
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
    clearPopupTimers();
    draft = nextDraft;
    popupAnimState = "initial";
    popupShake = false;
    popupX = Math.min(Math.max(clientX, 150), window.innerWidth - 150);
    popupY = Math.min(clientY + 22, window.innerHeight - 230);

    popupEnterTimer = setTimeout(() => {
      popupAnimState = "enter";
    }, 0);

    popupEnteredTimer = setTimeout(() => {
      popupAnimState = "entered";
    }, 200);

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
    textareaEl = null;
  }

  function closePopup() {
    if (!draft) return;
    clearPopupTimers();
    popupAnimState = "exit";
    popupExitTimer = setTimeout(() => {
      forceClosePopup();
    }, 150);
  }

  function shakePopup() {
    if (!draft) return;
    if (popupShakeTimer) clearTimeout(popupShakeTimer);
    popupShake = true;
    popupShakeTimer = setTimeout(() => {
      popupShake = false;
    }, 250);
  }

  function clearHover() {
    hoverRect = null;
    hoverLabel = "";
    hoverElementName = "";
    hoverReactPath = "";
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
        isFixed: fixed
      },
      event.clientX,
      event.clientY
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
        isFixed: annotation.isFixed
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
  }

  function renderMarkerY(annotation: Annotation): number {
    return annotation.isFixed ? annotation.y : annotation.y - scrollY;
  }

  function renderDraftMarkerY(): number {
    if (!draft) return 0;
    return draft.isFixed ? draft.y : draft.y - scrollY;
  }

  onMount(() => {
    mounted = true;
    scrollY = window.scrollY;
    annotations = loadAnnotations(pathname);

    toolbarEntranceTimer = setTimeout(() => {
      showToolbarEntrance = false;
    }, 500);

    try {
      if (defaultOutputMode === "compact" || defaultOutputMode === "standard" || defaultOutputMode === "detailed") {
        outputMode = defaultOutputMode;
      }

      const savedMode = localStorage.getItem(OUTPUT_MODE_KEY);
      if (savedMode === "compact" || savedMode === "standard" || savedMode === "detailed") {
        outputMode = savedMode;
      }
    } catch {
      // ignore localStorage issues
    }

    const onScroll = () => {
      scrollY = window.scrollY;
      clearHover();
    };

    const onDocumentMouseMove = (event: MouseEvent) => {
      if (!isActive || draft) {
        clearHover();
        return;
      }

      const target = event.target as HTMLElement | null;
      if (!target || target.closest("[data-agentation-root]")) {
        clearHover();
        return;
      }

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
      hoverTooltipX = Math.min(event.clientX + 14, window.innerWidth - 260);
      hoverTooltipY = Math.max(8, rect.top - 34);
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (!isActive) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      if (draft) {
        if (!target.closest("[data-agentation-root]")) {
          event.preventDefault();
          event.stopPropagation();
          shakePopup();
        }
        return;
      }

      if (target.closest("[data-agentation-root]")) return;

      event.preventDefault();
      event.stopPropagation();
      beginCreate(target, event);
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
    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("keydown", onEscape);

    return () => {
      clearPopupTimers();
      if (toolbarEntranceTimer) clearTimeout(toolbarEntranceTimer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mousemove", onDocumentMouseMove, true);
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("keydown", onEscape);
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
>
  <ModeWatcher defaultMode="system" darkClassNames={["dark"]} lightClassNames={["light"]} />
  <div class="toolbarDock">
    <div class={`toolbarContainer ${isToolbarExpanded ? "expanded" : "collapsed"} ${showToolbarEntrance ? "entrance" : ""}`}>
      <button
        class={`toggleBubble ${isToolbarExpanded ? "hidden" : "visible"}`}
        type="button"
        aria-label="Open toolbar"
        onclick={() => {
          isToolbarExpanded = true;
          showMarkers = true;
          isActive = true;
        }}
      >
        <Pencil size={18} strokeWidth={2.2} class="icon" aria-hidden="true" />
        {#if annotations.length > 0}
          <span class="bubbleBadge">{annotations.length}</span>
        {/if}
      </button>

      <div
        class={`controlsContent ${isToolbarExpanded ? "visible" : "hidden"} ${showSettings || tooltipsHiddenUntilMouseLeave ? "tooltipsHidden" : ""}`}
        role="presentation"
        onmouseleave={() => {
          tooltipsHiddenUntilMouseLeave = false;
        }}
      >
        <div class="buttonWrapper">
          <button
            class={`controlButton ${showMarkers ? "active" : ""}`}
            type="button"
            aria-label={showMarkers ? "Hide markers" : "Show markers"}
            disabled={annotations.length === 0}
            onclick={() => {
              hideTooltipsUntilMouseLeave();
              showMarkers = !showMarkers;
            }}
          >
            {#if showMarkers}
              <Eye size={17} strokeWidth={2.2} class="icon" aria-hidden="true" />
            {:else}
              <EyeOff size={17} strokeWidth={2.2} class="icon" aria-hidden="true" />
            {/if}
          </button>
          <span class="buttonTooltip">{showMarkers ? "Hide Markers" : "Show Markers"}</span>
        </div>

        <div class="buttonWrapper">
          <button
            class="controlButton"
            type="button"
            aria-label="Copy output"
            disabled={annotations.length === 0}
            onclick={copyAnnotations}
          >
            <Copy size={17} strokeWidth={2.2} class="icon" aria-hidden="true" />
          </button>
          <span class="buttonTooltip">Copy</span>
        </div>

        <div class="buttonWrapper">
          <button
            class="controlButton"
            type="button"
            aria-label="Clear annotations"
            data-danger="true"
            disabled={annotations.length === 0}
            onclick={clearAll}
          >
            <Trash2 size={17} strokeWidth={2.2} class="icon" aria-hidden="true" />
          </button>
          <span class="buttonTooltip">Clear</span>
        </div>

        <div class="buttonWrapper">
          <button
            class={`controlButton ${showSettings ? "active" : ""}`}
            type="button"
            aria-label="Settings"
            onclick={() => {
              hideTooltipsUntilMouseLeave();
              showSettings = !showSettings;
            }}
          >
            <Settings size={17} strokeWidth={2.2} class="icon" aria-hidden="true" />
          </button>
          <span class="buttonTooltip">Settings</span>
        </div>

        <div class="buttonWrapper buttonWrapperAlignRight collapseButtonWrapper">
          <button
            class="controlButton collapseButton"
            type="button"
            aria-label="Collapse toolbar"
            onclick={collapseToolbar}
          >
            <Minus size={17} strokeWidth={2.2} class="icon" aria-hidden="true" />
          </button>
          <span class="buttonTooltip">Collapse</span>
        </div>
      </div>
    </div>

    <div class={`settingsPanel ${showSettings && isToolbarExpanded ? "enter" : "exit"}`}>
      <div class="settingsPanelContainer">
        <div class="settingsPage">
          <div class="settingsHeader">
            <span class="settingsBrand">agentation<span class="settingsBrandSlash">/</span></span>
            <span class="settingsVersion">svelte</span>
          </div>

          <div class="settingsSection settingsSectionExtraPadding">
            <div class="settingsRow settingsRowMarginTop">
              <span class="settingsLabel">Theme</span>
              <button
                type="button"
                class="cycleButton"
                onclick={toggleThemeMode}
              >
                {#if resolvedMode === "dark"}
                  <Moon size={14} strokeWidth={2.2} class="cycleIcon" aria-hidden="true" />
                {:else}
                  <Sun size={14} strokeWidth={2.2} class="cycleIcon" aria-hidden="true" />
                {/if}
                <span class="cycleButtonText">{resolvedMode === "dark" ? "Dark" : "Light"}</span>
              </button>
            </div>
          </div>

          <div class="settingsSection settingsSectionExtraPadding">
            <div class="settingsRow">
              <span class="settingsLabel settingsLabelMarker">Output detail</span>
            </div>

            <div class="settingsOptions">
              <button
                type="button"
                class={`settingsOption ${outputMode === "compact" ? "selected" : ""}`}
                onclick={() => {
                  outputMode = "compact";
                }}
              >
                Compact
              </button>
              <button
                type="button"
                class={`settingsOption ${outputMode === "standard" ? "selected" : ""}`}
                onclick={() => {
                  outputMode = "standard";
                }}
              >
                Standard
              </button>
              <button
                type="button"
                class={`settingsOption ${outputMode === "detailed" ? "selected" : ""}`}
                onclick={() => {
                  outputMode = "detailed";
                }}
              >
                Detailed
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  {#if showMarkers && annotations.length > 0}
    {#each annotations as annotation, index (annotation.id)}
      <button
        class={`marker ${hasPopup ? "editingAny" : ""}`}
        type="button"
        style={`left: ${annotation.x}%; top: ${renderMarkerY(annotation)}px;`}
        onclick={(event) => beginEdit(annotation, event)}
        aria-label={`Edit annotation ${index + 1}`}
      >
        <span class="markerLabel">{index + 1}</span>
        <span class="markerEditIcon" aria-hidden="true">
          <Pencil size={12} strokeWidth={2.2} class="markerEditIconSvg" />
        </span>
        <div class="markerTooltip">
          <span class="markerQuote">
            {annotation.element}
            {#if annotation.selectedText}
              {` "${annotation.selectedText.slice(0, 30)}${annotation.selectedText.length > 30 ? "..." : ""}"`}
            {/if}
          </span>
          <span class="markerNote">{annotation.comment}</span>
        </div>
      </button>
    {/each}
  {/if}

  {#if showMarkers && draft && !editingAnnotationId}
    <div class="marker pending" style={`left: ${draft.x}%; top: ${renderDraftMarkerY()}px;`}>
      <Plus size={12} strokeWidth={2.5} class="icon" aria-hidden="true" />
    </div>
  {/if}

  {#if isActive}
    {#if hoverRect}
      <div
        class="hover-highlight"
        style={`left: ${hoverRect.left}px; top: ${hoverRect.top}px; width: ${hoverRect.width}px; height: ${hoverRect.height}px;`}
      ></div>
      <div class="hover-tooltip" style={`left: ${hoverTooltipX}px; top: ${hoverTooltipY}px;`}>
        <div class="hoverReactPath">{hoverReactPath}</div>
        <div class="hoverElementName">{hoverElementName || hoverLabel}</div>
      </div>
    {/if}

  {/if}

  {#if hasPopup && draft}
    <div
      class={`popup ${popupAnimState === "enter" ? "enter" : ""} ${popupAnimState === "entered" ? "entered" : ""} ${popupAnimState === "exit" ? "exit" : ""} ${popupShake ? "shake" : ""}`}
      style={`left: ${popupX}px; top: ${popupY}px;`}
    >
      <div class="popupHeader">
        <span class="popupElement">{draft.element}</span>
      </div>

      {#if draft.selectedText}
        <div class="popupQuote">&ldquo;{draft.selectedText.slice(0, 80)}{draft.selectedText.length > 80 ? "..." : ""}&rdquo;</div>
      {/if}

      <textarea
        class="popupTextarea"
        bind:this={textareaEl}
        rows="3"
        bind:value={draftComment}
        placeholder="What should change?"
        oninput={autoResizeTextarea}
        onkeydown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            saveDraft();
          }
        }}
      ></textarea>

      <div class="popupActions">
        {#if editingAnnotationId}
          <button
            class="deleteButton"
            type="button"
            aria-label="Delete annotation"
            onclick={() => {
              const current = annotations.find((item) => item.id === editingAnnotationId);
              if (current) removeAnnotation(current);
            }}
          >
            <Trash2 size={17} strokeWidth={2.2} class="icon" aria-hidden="true" />
          </button>
        {/if}

        <button class="cancelButton" type="button" onclick={closePopup}>Cancel</button>
        <button class="submitButton" type="button" disabled={!draftComment.trim()} onclick={saveDraft}>
          {editingAnnotationId ? "Update" : "Add"}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  @keyframes badgeEnter {
    from {
      opacity: 0;
      transform: scale(0);
    }

    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes toolbarEnter {
    from {
      opacity: 0;
      transform: scale(0.5) rotate(90deg);
    }

    to {
      opacity: 1;
      transform: scale(1) rotate(0deg);
    }
  }

  @keyframes hoverHighlightIn {
    from {
      opacity: 0;
      transform: scale(0.98);
    }

    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes hoverTooltipIn {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(4px);
    }

    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes markerIn {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.3);
    }

    100% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }

  @keyframes tooltipIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(2px) scale(0.891);
    }

    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0) scale(0.909);
    }
  }

  @keyframes popupEnter {
    from {
      opacity: 0;
      transform: translateX(-50%) scale(0.95) translateY(4px);
    }

    to {
      opacity: 1;
      transform: translateX(-50%) scale(1) translateY(0);
    }
  }

  @keyframes popupExit {
    from {
      opacity: 1;
      transform: translateX(-50%) scale(1) translateY(0);
    }

    to {
      opacity: 0;
      transform: translateX(-50%) scale(0.95) translateY(4px);
    }
  }

  @keyframes shake {
    0%,
    100% {
      transform: translateX(-50%) scale(1) translateY(0) translateX(0);
    }

    20% {
      transform: translateX(-50%) scale(1) translateY(0) translateX(-3px);
    }

    40% {
      transform: translateX(-50%) scale(1) translateY(0) translateX(3px);
    }

    60% {
      transform: translateX(-50%) scale(1) translateY(0) translateX(-2px);
    }

    80% {
      transform: translateX(-50%) scale(1) translateY(0) translateX(2px);
    }
  }

  .agentation-root {
    position: fixed;
    right: 20px;
    bottom: 20px;
    z-index: 2147483647;
    font-family: Inter, "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    pointer-events: none;
  }

  .toolbarDock {
    position: relative;
    pointer-events: auto;
  }

  .toolbarContainer {
    position: relative;
    user-select: none;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1a1a1a;
    color: #fff;
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.2),
      0 4px 16px rgba(0, 0, 0, 0.1);
    transition:
      width 0.4s cubic-bezier(0.19, 1, 0.22, 1),
      transform 0.4s cubic-bezier(0.19, 1, 0.22, 1);
    overflow: visible;
  }

  .toolbarContainer.entrance {
    animation: toolbarEnter 0.5s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
  }

  .toolbarContainer.collapsed {
    width: 44px;
    height: 44px;
    border-radius: 22px;
  }

  .toolbarContainer.expanded {
    width: 297px;
    height: 44px;
    border-radius: 1.5rem;
    padding: 0.375rem;
  }

  .toggleBubble {
    width: 44px;
    height: 44px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: transparent;
    color: rgba(255, 255, 255, 0.95);
    position: relative;
    transition: opacity 0.12s ease;
  }

  .toggleBubble.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .toggleBubble .icon {
    transform: translateY(-1px);
  }

  [data-agentation-theme="light"] .toggleBubble {
    color: rgba(0, 0, 0, 0.8);
  }

  .toggleBubble.visible:hover {
    background: #2a2a2a;
  }

  .toggleBubble.visible:active {
    transform: scale(0.95);
  }

  .toggleBubble.hidden {
    opacity: 0;
    pointer-events: none;
  }

  .bubbleBadge {
    position: absolute;
    top: 0;
    right: 0;
    user-select: none;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    border-radius: 8px;
    background-color: var(--agentation-color-accent, #0088ff);
    color: white;
    font-size: 0.625rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      0 0 0 2px #1a1a1a,
      0 1px 3px rgba(0, 0, 0, 0.2);
    opacity: 1;
    transform: scale(1);
    transition:
      transform 0.3s ease,
      opacity 0.2s ease;
    animation: badgeEnter 0.3s cubic-bezier(0.34, 1.2, 0.64, 1) 0.4s both;
  }

  .controlsContent {
    position: absolute;
    inset: 0;
    padding: 0.375rem;
    display: flex;
    align-items: center;
    gap: 0.375rem;
    transition:
      filter 0.8s cubic-bezier(0.19, 1, 0.22, 1),
      opacity 0.8s cubic-bezier(0.19, 1, 0.22, 1),
      transform 0.6s cubic-bezier(0.19, 1, 0.22, 1);
  }

  .controlsContent.visible {
    opacity: 1;
    transform: scale(1);
    filter: blur(0);
    pointer-events: auto;
  }

  .controlsContent.hidden {
    opacity: 0;
    filter: blur(10px);
    transform: scale(0.4);
    pointer-events: none;
  }

  .divider {
    width: 1px;
    height: 12px;
    background: rgba(255, 255, 255, 0.15);
  }

  .buttonWrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .buttonWrapper:hover .buttonTooltip {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) scale(1);
    transition-delay: 0.85s;
  }

  .buttonWrapper:has(.controlButton:disabled):hover .buttonTooltip {
    opacity: 0;
    visibility: hidden;
  }

  .tooltipsHidden .buttonTooltip {
    opacity: 0 !important;
    visibility: hidden !important;
    transition: none !important;
  }

  .buttonTooltip {
    position: absolute;
    bottom: calc(100% + 14px);
    left: 50%;
    transform: translateX(-50%) scale(0.95);
    padding: 6px 10px;
    background: #1a1a1a;
    color: rgba(255, 255, 255, 0.9);
    font-size: 12px;
    font-weight: 500;
    border-radius: 8px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    z-index: 2147483647;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition:
      opacity 0.135s ease,
      transform 0.135s ease,
      visibility 0.135s ease;
  }

  .buttonTooltip::after {
    content: "";
    position: absolute;
    top: calc(100% - 4px);
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 8px;
    height: 8px;
    background: #1a1a1a;
    border-radius: 0 0 2px 0;
  }

  .buttonWrapperAlignLeft .buttonTooltip {
    left: 50%;
    transform: translateX(-12px) scale(0.95);
  }

  .buttonWrapperAlignLeft .buttonTooltip::after {
    left: 16px;
  }

  .buttonWrapperAlignLeft:hover .buttonTooltip {
    transform: translateX(-12px) scale(1);
  }

  .buttonWrapperAlignRight .buttonTooltip {
    left: 50%;
    transform: translateX(calc(-100% + 12px)) scale(0.95);
  }

  .buttonWrapperAlignRight .buttonTooltip::after {
    left: auto;
    right: 8px;
  }

  .buttonWrapperAlignRight:hover .buttonTooltip {
    transform: translateX(calc(-100% + 12px)) scale(1);
  }

  .settingsPanel {
    position: absolute;
    right: 5px;
    bottom: calc(100% + 0.5rem);
    z-index: 1;
    overflow: hidden;
    background: #1a1a1a;
    border-radius: 1rem;
    padding: 13px 0 16px;
    min-width: 205px;
    cursor: default;
    opacity: 1;
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.08);
    transition:
      background-color 0.25s ease,
      box-shadow 0.25s ease;
  }

  .settingsPanel.enter {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
    transition:
      opacity 0.2s ease,
      transform 0.2s ease,
      filter 0.2s ease;
  }

  .settingsPanel.exit {
    opacity: 0;
    transform: translateY(8px) scale(0.95);
    filter: blur(5px);
    pointer-events: none;
    transition:
      opacity 0.1s ease,
      transform 0.1s ease,
      filter 0.1s ease;
  }

  .settingsPanelContainer {
    overflow: visible;
    position: relative;
    display: flex;
    padding: 0 1rem;
  }

  .settingsPage {
    min-width: 100%;
    flex-shrink: 0;
    transition:
      transform 0.2s ease,
      opacity 0.2s ease;
    transition-delay: 0s;
    opacity: 1;
  }

  .settingsHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 24px;
    margin-bottom: 0.5rem;
    padding-bottom: 9px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  }

  .settingsBrand {
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: -0.0094em;
    color: #fff;
    text-decoration: none;
  }

  .settingsBrandSlash {
    color: var(--agentation-color-accent, #0088ff);
    transition: color 0.2s ease;
  }

  .settingsVersion {
    font-size: 11px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.4);
    margin-left: auto;
    letter-spacing: -0.0094em;
  }

  .settingsSection {
    margin-top: 0;
    padding-top: calc(0.5rem + 4px);
  }

  .settingsRow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 24px;
  }

  .settingsRow.settingsRowMarginTop {
    margin-top: 8px;
  }

  .cycleButton {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0;
    border: none;
    background: transparent;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #fff;
    cursor: pointer;
    letter-spacing: -0.0094em;
  }

  .cycleIcon {
    opacity: 0.85;
  }

  .cycleButtonText {
    display: inline-block;
    animation: cycleTextIn 0.2s ease-out;
  }

  @keyframes cycleTextIn {
    0% {
      opacity: 0;
      transform: translateY(-6px);
    }

    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .settingsLabel {
    font-size: 0.8125rem;
    font-weight: 400;
    letter-spacing: -0.0094em;
    color: rgba(255, 255, 255, 0.5);
    display: flex;
    align-items: center;
    gap: 0.125rem;
  }

  .settingsLabelMarker {
    padding-top: 3px;
    margin-bottom: 10px;
  }

  .settingsOptions {
    display: flex;
    gap: 0.25rem;
  }

  .settingsOption {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.375rem 0.5rem;
    border: none;
    border-radius: 0.375rem;
    background: transparent;
    font-size: 0.6875rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.85);
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      color 0.15s ease;
  }

  .settingsOption:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  .settingsOption.selected {
    background: color-mix(in srgb, var(--agentation-color-blue, #0088ff) 15%, transparent);
    color: var(--agentation-color-blue, #0088ff);
  }

  button {
    border: none;
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 12px;
    line-height: 1.2;
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .primary {
    background: linear-gradient(120deg, #3b82f6, #2f66d9);
    color: #fff;
  }

  .secondary {
    background: rgba(255, 255, 255, 0.12);
    color: #f2f4ff;
  }

  .danger {
    background: rgba(239, 68, 68, 0.16);
    color: #ffd9d9;
  }

  .controlButton {
    width: 34px;
    height: 34px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: transparent;
    color: rgba(255, 255, 255, 0.85);
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      transform 0.1s ease,
      opacity 0.2s ease;
  }

  .buttonWrapperAlignLeft .controlButton {
    margin-left: -1px;
  }

  .buttonWrapperAlignRight .controlButton {
    margin-right: -1px;
  }

  .icon {
    display: block;
  }

  .controlButton:hover:not(:disabled):not(.active) {
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
  }

  .controlButton:active:not(:disabled) {
    transform: scale(0.92);
  }

  .controlButton.active {
    color: #60a5fa;
    background: color-mix(in srgb, #60a5fa 24%, transparent);
  }

  .controlButton[data-danger="true"]:hover:not(:disabled):not(.active) {
    background: color-mix(in srgb, #ef4444 24%, transparent);
    color: #ef4444;
  }

  .collapseButton {
    margin-left: 0;
  }

  .collapseButtonWrapper {
    margin-left: auto;
  }

  .marker {
    position: fixed;
    width: 22px;
    height: 22px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--agentation-color-blue, #0088ff);
    color: #fff;
    border: none;
    transform: translate(-50%, -50%);
    font-size: 0.6875rem;
    font-weight: 600;
    cursor: pointer;
    pointer-events: auto;
    box-shadow:
      0 2px 6px rgba(0, 0, 0, 0.2),
      inset 0 0 0 1px rgba(0, 0, 0, 0.04);
    user-select: none;
    will-change: transform, opacity;
    contain: layout style;
    z-index: 2147483647;
    transition:
      background-color 0.12s ease,
      transform 0.1s ease;
    animation: markerIn 0.25s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .marker.pending {
    position: fixed;
    background-color: var(--agentation-color-blue, #0088ff);
    cursor: default;
    pointer-events: none;
  }

  .markerLabel {
    display: block;
  }

  .markerEditIcon {
    position: absolute;
    inset: 0;
    display: none;
    place-items: center;
    pointer-events: none;
  }

  .markerEditIconSvg {
    display: block;
  }

  .marker:hover {
    z-index: 2147483648;
    animation: none;
    transform: translate(-50%, -50%) scale(1.06);
  }

  .marker:hover .markerLabel {
    display: none;
  }

  .marker:hover .markerEditIcon {
    display: grid;
  }

  .markerTooltip {
    position: absolute;
    top: calc(100% + 10px);
    left: 50%;
    transform: translateX(-50%) scale(0.909);
    z-index: 2147483647;
    background: #1a1a1a;
    padding: 8px 0.75rem;
    border-radius: 0.75rem;
    font-family:
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      sans-serif;
    text-align: left;
    font-weight: 400;
    color: #fff;
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.08);
    min-width: 120px;
    max-width: 200px;
    pointer-events: none;
    cursor: default;
    opacity: 0;
    visibility: hidden;
  }

  .marker:hover .markerTooltip {
    opacity: 1;
    visibility: visible;
    animation: tooltipIn 0.1s ease-out forwards;
  }

  .marker.editingAny .markerTooltip {
    display: none;
  }

  .markerQuote {
    display: block;
    font-size: 12px;
    font-style: italic;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 0.3125rem;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .markerNote {
    display: block;
    font-size: 13px;
    font-weight: 400;
    line-height: 1.4;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-bottom: 2px;
  }

  .hover-highlight {
    position: fixed;
    border: 2px solid color-mix(in srgb, #3b82f6 62%, transparent);
    border-radius: 6px;
    background: color-mix(in srgb, #3b82f6 10%, transparent);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.35);
    pointer-events: none;
    z-index: 2147483645;
    animation: hoverHighlightIn 0.12s ease-out forwards;
  }

  .hover-tooltip {
    position: fixed;
    font-size: 0.6875rem;
    font-weight: 500;
    color: #fff;
    background: rgba(0, 0, 0, 0.85);
    padding: 0.35rem 0.6rem;
    border-radius: 0.375rem;
    pointer-events: none !important;
    white-space: nowrap;
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    z-index: 2147483646;
    animation: hoverTooltipIn 0.1s ease-out forwards;
  }

  .hoverReactPath {
    font-size: 0.625rem;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 0.15rem;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hoverElementName {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  :global(body.agentation-annotate-cursor) {
    cursor: crosshair !important;
  }

  .popup {
    position: fixed;
    transform: translateX(-50%);
    width: 280px;
    padding: 0.75rem 1rem 14px;
    border-radius: 16px;
    background: #1a1a1a;
    color: #fff;
    border: none;
    box-shadow:
      0 4px 24px rgba(0, 0, 0, 0.3),
      0 0 0 1px rgba(255, 255, 255, 0.08);
    z-index: 2147483647;
    pointer-events: auto;
    will-change: transform, opacity;
    opacity: 0;
  }

  .popup.enter {
    animation: popupEnter 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .popup.entered {
    opacity: 1;
    transform: translateX(-50%) scale(1) translateY(0);
  }

  .popup.exit {
    animation: popupExit 0.15s ease-in forwards;
  }

  .popup.entered.shake {
    animation: shake 0.25s ease-out;
  }

  .popupHeader {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5625rem;
  }

  .popupElement {
    font-size: 0.75rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .popupQuote {
    font-size: 12px;
    font-style: italic;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 0.5rem;
    padding: 0.4rem 0.5rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 0.25rem;
    line-height: 1.45;
  }

  .popupTextarea {
    box-sizing: border-box;
    width: 100%;
    resize: none;
    overflow: hidden;
    min-height: 74px;
    padding: 0.5rem 0.625rem;
    font-size: 0.8125rem;
    font-family: inherit;
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    outline: none;
    margin-bottom: 0;
    transition: border-color 0.15s ease;
  }

  .popupTextarea:focus {
    border-color: var(--agentation-color-blue, #0088ff);
  }

  .popupTextarea::placeholder {
    color: rgba(255, 255, 255, 0.35);
  }

  .popupActions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.375rem;
    margin-top: 0.5rem;
  }

  .deleteButton {
    margin-right: auto;
    width: 34px;
    height: 34px;
    padding: 0;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      transform 0.1s ease;
  }

  .deleteButton:hover {
    background-color: color-mix(in srgb, var(--agentation-color-red, #ff383c) 25%, transparent);
    color: var(--agentation-color-red, #ff383c);
  }

  .deleteButton:active {
    transform: scale(0.92);
  }

  .cancelButton,
  .submitButton {
    padding: 0.4rem 0.875rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 1rem;
    border: none;
    transition:
      background-color 0.15s ease,
      color 0.15s ease,
      opacity 0.15s ease;
  }

  .cancelButton {
    background: transparent;
    color: rgba(255, 255, 255, 0.5);
  }

  .cancelButton:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.8);
  }

  .submitButton {
    color: #fff;
    background: var(--agentation-color-blue, #0088ff);
  }

  .submitButton:hover:not(:disabled) {
    filter: brightness(0.9);
  }

  .submitButton:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  [data-agentation-theme="light"] .toolbarContainer {
    background: #fff;
    color: rgba(0, 0, 0, 0.85);
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.08),
      0 4px 16px rgba(0, 0, 0, 0.06),
      0 0 0 1px rgba(0, 0, 0, 0.04);
  }

  [data-agentation-theme="light"] .toggleBubble.visible:hover {
    background: #f5f5f5;
  }

  [data-agentation-theme="light"] .controlButton {
    color: rgba(0, 0, 0, 0.5);
  }

  [data-agentation-theme="light"] .controlButton:hover:not(:disabled):not(.active) {
    background: rgba(0, 0, 0, 0.06);
    color: rgba(0, 0, 0, 0.85);
  }

  [data-agentation-theme="light"] .controlButton.active {
    color: var(--agentation-color-blue, #0088ff);
    background: color-mix(in srgb, var(--agentation-color-blue, #0088ff) 15%, transparent);
  }

  [data-agentation-theme="light"] .controlButton[data-danger="true"]:hover:not(:disabled):not(.active) {
    color: var(--agentation-color-red, #ff383c);
    background: color-mix(in srgb, var(--agentation-color-red, #ff383c) 15%, transparent);
  }

  [data-agentation-theme="light"] .buttonTooltip {
    background: #fff;
    color: rgba(0, 0, 0, 0.82);
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.14),
      0 0 0 1px rgba(0, 0, 0, 0.08);
  }

  [data-agentation-theme="light"] .buttonTooltip::after {
    background: #fff;
  }

  [data-agentation-theme="light"] .settingsPanel {
    background: #fff;
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.12),
      0 0 0 1px rgba(0, 0, 0, 0.06);
  }

  [data-agentation-theme="light"] .settingsHeader {
    border-bottom-color: rgba(0, 0, 0, 0.08);
  }

  [data-agentation-theme="light"] .settingsBrand {
    color: rgba(0, 0, 0, 0.88);
  }

  [data-agentation-theme="light"] .settingsVersion,
  [data-agentation-theme="light"] .settingsLabel {
    color: rgba(0, 0, 0, 0.5);
  }

  [data-agentation-theme="light"] .cycleButton {
    color: rgba(0, 0, 0, 0.85);
  }

  [data-agentation-theme="light"] .settingsOption {
    color: rgba(0, 0, 0, 0.7);
  }

  [data-agentation-theme="light"] .settingsOption:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  [data-agentation-theme="light"] .settingsOption.selected {
    color: var(--agentation-color-blue, #0088ff);
    background: color-mix(in srgb, var(--agentation-color-blue, #0088ff) 15%, transparent);
  }

  [data-agentation-theme="light"] .markerTooltip {
    background: #fff;
    box-shadow:
      0 4px 20px rgba(0, 0, 0, 0.12),
      0 0 0 1px rgba(0, 0, 0, 0.06);
  }

  [data-agentation-theme="light"] .markerQuote {
    color: rgba(0, 0, 0, 0.5);
  }

  [data-agentation-theme="light"] .markerNote {
    color: rgba(0, 0, 0, 0.85);
  }

  [data-agentation-theme="light"] .popup {
    background: #fff;
    color: rgba(0, 0, 0, 0.85);
    box-shadow:
      0 4px 24px rgba(0, 0, 0, 0.12),
      0 0 0 1px rgba(0, 0, 0, 0.06);
  }

  [data-agentation-theme="light"] .popupElement {
    color: rgba(0, 0, 0, 0.6);
  }

  [data-agentation-theme="light"] .popupQuote {
    color: rgba(0, 0, 0, 0.55);
    background: rgba(0, 0, 0, 0.04);
  }

  [data-agentation-theme="light"] .popupTextarea {
    background: rgba(0, 0, 0, 0.03);
    color: #1a1a1a;
    border-color: rgba(0, 0, 0, 0.12);
  }

  [data-agentation-theme="light"] .popupTextarea::placeholder {
    color: rgba(0, 0, 0, 0.4);
  }

  [data-agentation-theme="light"] .cancelButton {
    color: rgba(0, 0, 0, 0.5);
  }

  [data-agentation-theme="light"] .cancelButton:hover {
    background: rgba(0, 0, 0, 0.06);
    color: rgba(0, 0, 0, 0.75);
  }

  [data-agentation-theme="light"] .hover-tooltip {
    background: rgba(255, 255, 255, 0.96);
    color: rgba(0, 0, 0, 0.82);
    box-shadow:
      0 2px 8px rgba(0, 0, 0, 0.14),
      0 0 0 1px rgba(0, 0, 0, 0.08);
  }

  [data-agentation-theme="light"] .hoverReactPath {
    color: rgba(0, 0, 0, 0.45);
  }

  [data-agentation-theme="light"] .deleteButton {
    color: rgba(0, 0, 0, 0.4);
  }

  @media (max-width: 640px) {
    .agentation-root {
      right: 10px;
      bottom: 10px;
    }

    .toolbarContainer.expanded {
      width: 297px;
    }

    .settingsPanel {
      right: 0;
    }
  }
</style>

<script lang="ts">
  import { ChevronRight, Trash2 } from "@lucide/svelte";
  import { originalSetTimeout } from "../freeze-animations";
  import type { Annotation, DraftAnnotation } from "../types";
  import type { PopupAnimState } from "../popup";

  let textareaEl = $state<HTMLTextAreaElement | null>(null);
  let stylesExpanded = $state(false);

  function toggleStyles() {
    const wasExpanded = stylesExpanded;
    stylesExpanded = !stylesExpanded;
    if (wasExpanded) {
      originalSetTimeout(() => {
        if (!textareaEl) return;
        textareaEl.focus();
        const end = textareaEl.value.length;
        textareaEl.selectionStart = end;
        textareaEl.selectionEnd = end;
      }, 0);
    }
  }

  function setTextareaRef(node: HTMLTextAreaElement) {
    textareaEl = node;
    return {
      destroy() {
        textareaEl = null;
      }
    };
  }

  let {
    hasPopup,
    draft,
    popupAnimState,
    popupShake,
    popupX,
    popupY,
    draftComment,
    placeholder = "What should change?",
    accentColor = "var(--agentation-color-blue, #3c82f7)",
    editingAnnotationId,
    annotations,
    onDraftCommentChange,
    onAutoResize,
    onSave,
    onClose,
    onRemove,
    onOpenSource
  }: {
    hasPopup: boolean;
    draft: DraftAnnotation | null;
    popupAnimState: PopupAnimState;
    popupShake: boolean;
    popupX: number;
    popupY: number;
    draftComment: string;
    placeholder?: string;
    accentColor?: string;
    editingAnnotationId: string | null;
    annotations: Annotation[];
    onDraftCommentChange: (value: string) => void;
    onAutoResize: () => void;
    onSave: () => void;
    onClose: () => void;
    onRemove: (annotation: Annotation) => void;
    onOpenSource: (sourceFile: string, annotationId?: string) => void;
  } = $props();

  const editingAnnotation = $derived.by(() =>
    editingAnnotationId ? annotations.find((item) => item.id === editingAnnotationId) ?? null : null
  );

  const sourceLocation = $derived.by(() => editingAnnotation?.sourceFile ?? draft?.sourceFile);

  function handleOpenSource() {
    if (!sourceLocation) return;
    onOpenSource(sourceLocation, editingAnnotation?.id);
  }
</script>

{#if hasPopup && draft}
  <div
    class={`popup ${popupAnimState === "enter" ? "enter" : ""} ${popupAnimState === "entered" ? "entered" : ""} ${popupAnimState === "exit" ? "exit" : ""} ${popupShake ? "shake" : ""}`}
    style={`left: ${popupX}px; top: ${popupY}px; --agentation-popup-accent: ${accentColor};`}
  >
    <div class="popupHeader">
      {#if draft.computedStylesObj && Object.keys(draft.computedStylesObj).length > 0}
        <button class="popupHeaderToggle" type="button" onclick={toggleStyles}>
          <ChevronRight size={14} strokeWidth={2.2} class={`popupChevron ${stylesExpanded ? "expanded" : ""}`} aria-hidden="true" />
          <span class="popupElement">{draft.element}</span>
        </button>
      {:else}
        <span class="popupElement">{draft.element}</span>
      {/if}
    </div>

    {#if sourceLocation}
      <button class="sourceButton" type="button" onclick={handleOpenSource} title={`Open ${sourceLocation}`}>
        Open in editor
      </button>
    {/if}

    {#if draft.computedStylesObj && Object.keys(draft.computedStylesObj).length > 0}
      <div class={`stylesWrapper ${stylesExpanded ? "expanded" : ""}`}>
        <div class="stylesInner">
          <div class="stylesBlock">
            {#each Object.entries(draft.computedStylesObj) as [key, value] (key)}
              <div class="styleLine">
                <span class="styleProperty">{key}</span>: <span class="styleValue">{value}</span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/if}

    {#if draft.selectedText}
      <div class="popupQuote">&ldquo;{draft.selectedText.slice(0, 80)}{draft.selectedText.length > 80 ? "..." : ""}&rdquo;</div>
    {/if}

    <textarea
      class="popupTextarea"
      bind:this={textareaEl}
      rows="3"
      value={draftComment}
      {placeholder}
      oninput={(event) => {
        onDraftCommentChange((event.currentTarget as HTMLTextAreaElement).value);
        onAutoResize();
      }}
      onkeydown={(event) => {
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          onSave();
        }
      }}
      use:setTextareaRef
    ></textarea>

    <div class="popupActions">
      {#if editingAnnotationId}
        <button
          class="deleteButton"
          type="button"
          aria-label="Delete annotation"
          onclick={() => {
            const current = annotations.find((item) => item.id === editingAnnotationId);
            if (current) onRemove(current);
          }}
        >
          <Trash2 size={17} strokeWidth={2.2} class="icon" aria-hidden="true" />
        </button>
      {/if}

      <button class="cancelButton" type="button" onclick={onClose}>Cancel</button>
      <button class="submitButton" type="button" disabled={!draftComment.trim()} onclick={onSave}>
        {editingAnnotationId ? "Update" : "Add"}
      </button>
    </div>
  </div>
{/if}

<style>
  @keyframes popupEnter {
    from { opacity: 0; transform: translateX(-50%) scale(.95) translateY(4px); }
    to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
  }

  @keyframes popupExit {
    from { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
    to { opacity: 0; transform: translateX(-50%) scale(.95) translateY(4px); }
  }

  @keyframes shake {
    0%,100% { transform: translateX(-50%) scale(1) translateY(0) translateX(0); }
    20% { transform: translateX(-50%) scale(1) translateY(0) translateX(-3px); }
    40% { transform: translateX(-50%) scale(1) translateY(0) translateX(3px); }
    60% { transform: translateX(-50%) scale(1) translateY(0) translateX(-2px); }
    80% { transform: translateX(-50%) scale(1) translateY(0) translateX(2px); }
  }

  .popup { position: fixed; transform: translateX(-50%); width: 280px; padding: .75rem 1rem 14px; border-radius: 16px; background: #1a1a1a; color: #fff; border: none; box-shadow: 0 4px 24px rgba(0,0,0,.3), 0 0 0 1px rgba(255,255,255,.08); z-index: 2147483647; pointer-events: auto; will-change: transform, opacity; opacity: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  .popup.enter { animation: popupEnter .2s cubic-bezier(.34,1.56,.64,1) forwards; }
  .popup.entered { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
  .popup.exit { animation: popupExit .15s ease-in forwards; }
  .popup.entered.shake { animation: shake .25s ease-out; }
  .popupHeader { display: flex; align-items: center; justify-content: space-between; margin-bottom: .5625rem; }
  .popupHeaderToggle { display: inline-flex; align-items: center; gap: .25rem; padding: 0; border: 0; background: transparent; color: inherit; cursor: pointer; flex: 1; min-width: 0; text-align: left; }
  .popupChevron { color: rgba(255,255,255,.5); transition: transform .25s cubic-bezier(.16,1,.3,1); flex-shrink: 0; }
  .popupChevron.expanded { transform: rotate(90deg); }
  .popupElement { font-size: .75rem; color: rgba(255,255,255,.5); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .stylesWrapper { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .3s cubic-bezier(.16,1,.3,1); }
  .stylesWrapper.expanded { grid-template-rows: 1fr; }
  .stylesInner { overflow: hidden; }
  .stylesBlock { background: rgba(255,255,255,.05); border-radius: .375rem; padding: .5rem .625rem; margin-bottom: .5rem; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; font-size: .6875rem; line-height: 1.5; }
  .styleLine { color: rgba(255,255,255,.85); word-break: break-word; }
  .styleProperty { color: #c792ea; }
  .styleValue { color: rgba(255,255,255,.85); }
  .popupQuote { font-size: 12px; font-style: italic; color: rgba(255,255,255,.6); margin-bottom: .5rem; padding: .4rem .5rem; background: rgba(255,255,255,.05); border-radius: .25rem; line-height: 1.45; }
  .sourceButton { margin-bottom: .5rem; padding: .35rem .7rem; border-radius: 999px; border: none; background: color-mix(in srgb, var(--agentation-popup-accent, var(--agentation-color-blue, #3c82f7)) 20%, transparent); color: #fff; font-size: 11px; font-weight: 500; line-height: 1.2; }
  .sourceButton:hover { background: color-mix(in srgb, var(--agentation-popup-accent, var(--agentation-color-blue, #3c82f7)) 34%, transparent); }
  .popupTextarea { box-sizing: border-box; width: 100%; resize: none; overflow: hidden; min-height: 74px; padding: .5rem .625rem; font-size: .8125rem; font-family: inherit; background: rgba(255,255,255,.05); color: #fff; border: 1px solid rgba(255,255,255,.15); border-radius: 8px; outline: none; margin-bottom: 0; transition: border-color .15s ease; }
  .popupTextarea:focus { border-color: var(--agentation-popup-accent, var(--agentation-color-blue, #3c82f7)); }
  .popupTextarea::placeholder { color: rgba(255,255,255,.35); }
  .popupTextarea::-webkit-scrollbar { width: 6px; }
  .popupTextarea::-webkit-scrollbar-track { background: transparent; }
  .popupTextarea::-webkit-scrollbar-thumb { background: rgba(255,255,255,.2); border-radius: 3px; }
  .popupActions { display: flex; align-items: center; justify-content: flex-end; gap: .375rem; margin-top: .5rem; }
  .deleteButton { margin-right: auto; width: 28px; height: 28px; padding: 0; border-radius: 50%; border: none; background: transparent; color: rgba(255,255,255,.4); display: flex; align-items: center; justify-content: center; transition: background-color .15s ease, color .15s ease, transform .1s ease; }
  .deleteButton:hover { background-color: color-mix(in srgb, var(--agentation-color-red, #ff383c) 25%, transparent); color: var(--agentation-color-red, #ff383c); }
  .deleteButton:active { transform: scale(.92); }
  .cancelButton,.submitButton { padding: .4rem .875rem; font-size: .75rem; font-weight: 500; border-radius: 1rem; border: none; transition: background-color .15s ease, color .15s ease, opacity .15s ease; }
  .cancelButton { background: transparent; color: rgba(255,255,255,.5); }
  .cancelButton:hover { background: rgba(255,255,255,.1); color: rgba(255,255,255,.8); }
  .submitButton { color: #fff; background: var(--agentation-popup-accent, var(--agentation-color-blue, #3c82f7)); }
  .submitButton:hover:not(:disabled) { filter: brightness(.9); }
  .submitButton:disabled { opacity: .4; cursor: not-allowed; }
  .icon { display: block; }

  :global([data-agentation-theme="light"]) .popup { background: #fff; color: rgba(0,0,0,.85); box-shadow: 0 4px 24px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.06); }
  :global([data-agentation-theme="light"]) .popupElement { color: rgba(0,0,0,.6); }
  :global([data-agentation-theme="light"]) .popupChevron { color: rgba(0,0,0,.4); }
  :global([data-agentation-theme="light"]) .popupQuote { color: rgba(0,0,0,.55); background: rgba(0,0,0,.04); }
  :global([data-agentation-theme="light"]) .sourceButton { color: var(--agentation-popup-accent, var(--agentation-color-blue, #3c82f7)); background: color-mix(in srgb, var(--agentation-popup-accent, var(--agentation-color-blue, #3c82f7)) 12%, transparent); }
  :global([data-agentation-theme="light"]) .sourceButton:hover { background: color-mix(in srgb, var(--agentation-popup-accent, var(--agentation-color-blue, #3c82f7)) 18%, transparent); }
  :global([data-agentation-theme="light"]) .stylesBlock { background: rgba(0,0,0,.03); }
  :global([data-agentation-theme="light"]) .styleLine { color: rgba(0,0,0,.75); }
  :global([data-agentation-theme="light"]) .styleProperty { color: #7c3aed; }
  :global([data-agentation-theme="light"]) .styleValue { color: rgba(0,0,0,.75); }
  :global([data-agentation-theme="light"]) .popupTextarea { background: rgba(0,0,0,.03); color: #1a1a1a; border-color: rgba(0,0,0,.12); }
  :global([data-agentation-theme="light"]) .popupTextarea::placeholder { color: rgba(0,0,0,.4); }
  :global([data-agentation-theme="light"]) .popupTextarea::-webkit-scrollbar-thumb { background: rgba(0,0,0,.15); }
  :global([data-agentation-theme="light"]) .cancelButton { color: rgba(0,0,0,.5); }
  :global([data-agentation-theme="light"]) .cancelButton:hover { background: rgba(0,0,0,.06); color: rgba(0,0,0,.75); }
  :global([data-agentation-theme="light"]) .deleteButton { color: rgba(0,0,0,.4); }
</style>

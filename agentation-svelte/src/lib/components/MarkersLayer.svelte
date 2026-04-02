<script lang="ts">
  import { Pencil, Plus } from "@lucide/svelte";
  import type { Annotation, DraftAnnotation } from "../types";

  let {
    annotations,
    showMarkers,
    hasPopup,
    draft,
    editingAnnotationId,
    renderMarkerY,
    renderDraftMarkerY,
    onBeginEdit
  }: {
    annotations: Annotation[];
    showMarkers: boolean;
    hasPopup: boolean;
    draft: DraftAnnotation | null;
    editingAnnotationId: string | null;
    renderMarkerY: (annotation: Annotation) => number;
    renderDraftMarkerY: () => number;
    onBeginEdit: (annotation: Annotation, event: MouseEvent) => void;
  } = $props();
</script>

{#if showMarkers && annotations.length > 0}
  {#each annotations as annotation, index (annotation.id)}
    <button
      class={`marker ${annotation.isMultiSelect ? "multiSelect" : ""} ${hasPopup ? "editingAny" : ""}`}
      type="button"
      style={`left: ${annotation.x}%; top: ${renderMarkerY(annotation)}px;`}
      onclick={(event) => onBeginEdit(annotation, event)}
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
  <div class={`marker pending ${draft.isMultiSelect ? "multiSelect" : ""}`} style={`left: ${draft.x}%; top: ${renderDraftMarkerY()}px;`}>
    <Plus size={12} strokeWidth={2.5} class="icon" aria-hidden="true" />
  </div>
{/if}

<style>
  @keyframes markerIn {
    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
    100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }

  @keyframes tooltipIn {
    from { opacity: 0; transform: translateX(-50%) translateY(2px) scale(0.891); }
    to { opacity: 1; transform: translateX(-50%) translateY(0) scale(0.909); }
  }

  .marker { position: fixed; width: 22px; height: 22px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: var(--agentation-color-blue, #3c82f7); color: #fff; border: none; transform: translate(-50%, -50%); font-size: .6875rem; font-weight: 600; cursor: pointer; pointer-events: auto; box-shadow: 0 2px 6px rgba(0,0,0,.2), inset 0 0 0 1px rgba(0,0,0,.04); user-select: none; will-change: transform, opacity; contain: layout style; z-index: 2147483647; transition: background-color .12s ease, transform .1s ease; animation: markerIn .25s cubic-bezier(.22,1,.36,1) both; }
  .marker.multiSelect { background: var(--agentation-color-green, #34c759); }
  .marker.pending { background-color: var(--agentation-color-blue, #3c82f7); cursor: default; pointer-events: none; }
  .markerLabel { display: block; }
  .markerEditIcon { position: absolute; inset: 0; display: none; place-items: center; pointer-events: none; }
  .markerEditIconSvg,
  .icon { display: block; }
  .marker:hover { z-index: 2147483648; animation: none; transform: translate(-50%, -50%) scale(1.06); }
  .marker:hover .markerLabel { display: none; }
  .marker:hover .markerEditIcon { display: grid; }
  .markerTooltip { position: absolute; top: calc(100% + 10px); left: 50%; transform: translateX(-50%) scale(0.909); z-index: 2147483647; background: #1a1a1a; padding: 8px .75rem; border-radius: .75rem; text-align: left; color: #fff; box-shadow: 0 4px 20px rgba(0,0,0,.3), 0 0 0 1px rgba(255,255,255,.08); min-width: 120px; max-width: 200px; pointer-events: none; opacity: 0; visibility: hidden; }
  .marker:hover .markerTooltip { opacity: 1; visibility: visible; animation: tooltipIn .1s ease-out forwards; }
  .marker.editingAny .markerTooltip { display: none; }
  .markerQuote { display: block; font-size: 12px; font-style: italic; color: rgba(255,255,255,.6); margin-bottom: .3125rem; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .markerNote { display: block; font-size: 13px; line-height: 1.4; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-bottom: 2px; }

  :global([data-agentation-theme="light"]) .markerTooltip { background: #fff; box-shadow: 0 4px 20px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.06); }
  :global([data-agentation-theme="light"]) .markerQuote { color: rgba(0,0,0,.5); }
  :global([data-agentation-theme="light"]) .markerNote { color: rgba(0,0,0,.85); }
</style>

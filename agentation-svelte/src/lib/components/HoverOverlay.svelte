<script lang="ts">
  let {
    isActive,
    isMultiSelectMode,
    hoverRect,
    hoverTooltipX,
    hoverTooltipY,
    hoverReactPath,
    hoverElementName,
    hoverLabel
  }: {
    isActive: boolean;
    isMultiSelectMode: boolean;
    hoverRect: { left: number; top: number; width: number; height: number } | null;
    hoverTooltipX: number;
    hoverTooltipY: number;
    hoverReactPath: string;
    hoverElementName: string;
    hoverLabel: string;
  } = $props();
</script>

{#if isActive && hoverRect}
  <div
    class={`hover-highlight ${isMultiSelectMode ? "multiSelect" : ""}`}
    style={`left: ${hoverRect.left}px; top: ${hoverRect.top}px; width: ${hoverRect.width}px; height: ${hoverRect.height}px;`}
  ></div>
  <div class="hover-tooltip" style={`left: ${hoverTooltipX}px; top: ${hoverTooltipY}px;`}>
    <div class="hoverReactPath">{hoverReactPath}</div>
    <div class="hoverElementName">{hoverElementName || hoverLabel}</div>
  </div>
{/if}

<style>
  @keyframes hoverHighlightIn {
    from { opacity: 0; transform: scale(.98); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes hoverTooltipIn {
    from { opacity: 0; transform: scale(.95) translateY(4px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  .hover-highlight { position: fixed; border: 2px solid color-mix(in srgb, #3b82f6 62%, transparent); border-radius: 4px; background: color-mix(in srgb, #3b82f6 5%, transparent); box-shadow: inset 0 0 0 1px rgba(255,255,255,.35); pointer-events: none; z-index: 99997; animation: hoverHighlightIn .12s ease-out forwards; }
  .hover-highlight.multiSelect { border-color: color-mix(in srgb, var(--agentation-color-green, #34c759) 72%, transparent); background: color-mix(in srgb, var(--agentation-color-green, #34c759) 12%, transparent); }
  .hover-tooltip { position: fixed; font-size: .6875rem; font-weight: 500; color: #fff; background: rgba(0,0,0,.85); padding: .35rem .6rem; border-radius: .375rem; pointer-events: none !important; white-space: nowrap; max-width: 280px; overflow: hidden; text-overflow: ellipsis; z-index: 99997; animation: hoverTooltipIn .1s ease-out forwards; }
  .hoverReactPath { font-size: .625rem; color: rgba(255,255,255,.6); margin-bottom: .15rem; overflow: hidden; text-overflow: ellipsis; }
  .hoverElementName { overflow: hidden; text-overflow: ellipsis; }

  :global([data-agentation-theme="light"]) .hover-tooltip { background: rgba(255,255,255,.96); color: rgba(0,0,0,.82); box-shadow: 0 2px 8px rgba(0,0,0,.14), 0 0 0 1px rgba(0,0,0,.08); }
  :global([data-agentation-theme="light"]) .hoverReactPath { color: rgba(0,0,0,.45); }
</style>

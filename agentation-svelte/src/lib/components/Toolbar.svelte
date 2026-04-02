<script lang="ts">
  import {
    Check,
    ChevronLeft,
    ChevronRight,
    Copy,
    Eye,
    EyeOff,
    HelpCircle,
    Loader2,
    Minus,
    Moon,
    Pause,
    Pencil,
    Play,
    Send,
    Settings,
    Sun,
    Trash2,
    X
  } from "@lucide/svelte";
  import type { OutputMode } from "../types";

  type ToolbarSettings = {
    autoClearAfterCopy: boolean;
    blockInteractions: boolean;
    annotationColorId: "blue" | "green" | "yellow" | "orange" | "red" | "indigo" | "cyan";
    workspaceRoot: string;
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

  let settingsPage = $state<"main" | "automations">("main");

  let {
    isToolbarExpanded,
    showToolbarEntrance,
    annotationsCount,
    showMarkers,
    showSettings,
    tooltipsHiddenUntilMouseLeave,
    resolvedMode,
    outputMode,
    isFrozen,
    connectionStatus,
    sendState,
    showSendButton,
    settings,
    endpoint,
    onOpenToolbar,
    onMouseLeave,
    onToggleMarkers,
    onCopy,
    onClear,
    onToggleSettings,
    onCollapse,
    onToggleFreeze,
    onSend,
    onToggleTheme,
    onUpdateSettings,
    onSetOutputMode
  }: {
    isToolbarExpanded: boolean;
    showToolbarEntrance: boolean;
    annotationsCount: number;
    showMarkers: boolean;
    showSettings: boolean;
    tooltipsHiddenUntilMouseLeave: boolean;
    resolvedMode: "dark" | "light";
    outputMode: OutputMode;
    isFrozen: boolean;
    connectionStatus: "disconnected" | "connecting" | "connected";
    sendState: "idle" | "sending" | "sent" | "failed";
    showSendButton: boolean;
    settings: ToolbarSettings;
    endpoint?: string;
    onOpenToolbar: () => void;
    onMouseLeave: () => void;
    onToggleMarkers: () => void;
    onCopy: () => void;
    onClear: () => void;
    onToggleSettings: () => void;
    onCollapse: () => void;
    onToggleFreeze: () => void;
    onSend: () => void;
    onToggleTheme: () => void;
    onUpdateSettings: (patch: Partial<ToolbarSettings>) => void;
    onSetOutputMode: (mode: OutputMode) => void;
  } = $props();

  const panelVisible = $derived(showSettings && isToolbarExpanded);

  $effect(() => {
    if (!showSettings) {
      settingsPage = "main";
    }
  });
</script>

<div class="toolbarDock">
  <div class={`toolbarContainer ${isToolbarExpanded ? "expanded" : "collapsed"} ${showToolbarEntrance ? "entrance" : ""}`}>
    <button
      class={`toggleBubble ${isToolbarExpanded ? "hidden" : "visible"}`}
      type="button"
      aria-label="Open toolbar"
      onclick={onOpenToolbar}
    >
      <Pencil size={18} strokeWidth={2.2} class="icon" aria-hidden="true" />
      {#if annotationsCount > 0}
        <span class="bubbleBadge">{annotationsCount}</span>
      {/if}
    </button>

    <div
      class={`controlsContent ${isToolbarExpanded ? "visible" : "hidden"} ${showSettings || tooltipsHiddenUntilMouseLeave ? "tooltipsHidden" : ""}`}
      role="presentation"
      onmouseleave={onMouseLeave}
    >
      <div class="buttonWrapper">
        <button
          class={`controlButton ${isFrozen ? "active" : ""}`}
          type="button"
          aria-label={isFrozen ? "Resume animations" : "Pause animations"}
          onclick={onToggleFreeze}
        >
          {#if isFrozen}
            <Play size={17} strokeWidth={2.2} class="icon" aria-hidden="true" />
          {:else}
            <Pause size={17} strokeWidth={2.2} class="icon" aria-hidden="true" />
          {/if}
        </button>
        <span class="buttonTooltip">{isFrozen ? "Resume animations" : "Pause animations"}</span>
      </div>

      <div class="buttonWrapper">
        <button
          class={`controlButton ${showMarkers ? "active" : ""}`}
          type="button"
          aria-label={showMarkers ? "Hide markers" : "Show markers"}
          disabled={annotationsCount === 0}
          onclick={onToggleMarkers}
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
        <button class="controlButton" type="button" aria-label="Copy output" disabled={annotationsCount === 0} onclick={onCopy}>
          <Copy size={17} strokeWidth={2.2} class="icon" aria-hidden="true" />
        </button>
        <span class="buttonTooltip">Copy</span>
      </div>

      {#if showSendButton}
        <div class="buttonWrapper">
          <button
            class={`controlButton ${sendState === "sent" ? "active" : ""}`}
            type="button"
            aria-label="Send to agent"
            disabled={annotationsCount === 0 || connectionStatus !== "connected" || sendState === "sending"}
            onclick={onSend}
          >
            {#if sendState === "sending"}
              <Loader2 size={17} strokeWidth={2.2} class="icon spin" aria-hidden="true" />
            {:else if sendState === "sent"}
              <Check size={17} strokeWidth={2.2} class="icon" aria-hidden="true" />
            {:else if sendState === "failed"}
              <X size={17} strokeWidth={2.2} class="icon" aria-hidden="true" />
            {:else}
              <Send size={17} strokeWidth={2.2} class="icon" aria-hidden="true" />
            {/if}
          </button>
          <span class="buttonTooltip">
            {sendState === "sending" ? "Sending..." : sendState === "sent" ? "Sent" : sendState === "failed" ? "Failed" : "Send to agent"}
          </span>
        </div>
      {/if}

      <div class="buttonWrapper">
        <button
          class="controlButton"
          type="button"
          aria-label="Clear annotations"
          data-danger="true"
          disabled={annotationsCount === 0}
          onclick={onClear}
        >
          <Trash2 size={17} strokeWidth={2.2} class="icon" aria-hidden="true" />
        </button>
        <span class="buttonTooltip">Clear</span>
      </div>

      <div class="buttonWrapper settingsButtonWrapper">
        <button class={`controlButton ${showSettings ? "active" : ""}`} type="button" aria-label="Settings" onclick={onToggleSettings}>
          <Settings size={17} strokeWidth={2.2} class="icon" aria-hidden="true" />
          {#if showSendButton && connectionStatus !== "disconnected"}
            <span class={`mcpIndicator ${connectionStatus}`}></span>
          {/if}
        </button>
        <span class="buttonTooltip">Settings</span>
      </div>

      <div class="buttonWrapper buttonWrapperAlignRight collapseButtonWrapper">
        <button class="controlButton collapseButton" type="button" aria-label="Collapse toolbar" onclick={onCollapse}>
          <Minus size={17} strokeWidth={2.2} class="icon" aria-hidden="true" />
        </button>
        <span class="buttonTooltip">Collapse</span>
      </div>
    </div>
  </div>

  <div class={`settingsPanel ${panelVisible ? "enter" : "exit"}`}>
    <div class="settingsPanelContainer">
      <div class={`settingsPage ${settingsPage === "automations" ? "slideLeft" : ""}`}>
        <div class="settingsHeader">
          <span class="settingsBrand">agentation<span class="settingsBrandSlash">/</span></span>
          <span class="settingsVersion">svelte</span>
        </div>

        <div class="settingsSection settingsSectionExtraPadding">
          <div class="settingsRow settingsRowMarginTop">
            <span class="settingsLabel">Theme</span>
            <button type="button" class="cycleButton" onclick={onToggleTheme}>
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
            <button type="button" class={`settingsOption ${outputMode === "compact" ? "selected" : ""}`} onclick={() => onSetOutputMode("compact")}>
              Compact
            </button>
            <button
              type="button"
              class={`settingsOption ${outputMode === "standard" ? "selected" : ""}`}
              onclick={() => onSetOutputMode("standard")}
            >
              Standard
            </button>
            <button
              type="button"
              class={`settingsOption ${outputMode === "detailed" ? "selected" : ""}`}
              onclick={() => onSetOutputMode("detailed")}
            >
              Detailed
            </button>
            <button
              type="button"
              class={`settingsOption ${outputMode === "forensic" ? "selected" : ""}`}
              onclick={() => onSetOutputMode("forensic")}
            >
              Forensic
            </button>
          </div>
        </div>

        <div class="divider"></div>

        <div class="settingsSection settingsSectionExtraPadding">
          <div class="settingsRow">
            <span class="settingsLabel settingsLabelMarker">Marker Color</span>
          </div>
          <div class="colorOptions">
            {#each COLOR_OPTIONS as color (color.id)}
              <button
                class={`colorOption ${settings.annotationColorId === color.id ? "selected" : ""}`}
                style={`--swatch:${color.color};`}
                onclick={() => onUpdateSettings({ annotationColorId: color.id })}
                title={color.label}
                type="button"
              ></button>
            {/each}
          </div>
        </div>

        <div class="divider"></div>

        <div class="settingsSection settingsSectionExtraPadding">
          <label class="settingsRow settingsRowMarginTop settingsSwitchRow">
            <span class="settingsLabel">
              Clear on copy/send
              <span class="helpDot" title="Automatically clear annotations after copying or sending.">
                <HelpCircle size={12} strokeWidth={2.1} />
              </span>
            </span>
            <span class="switch">
              <input
                type="checkbox"
                checked={settings.autoClearAfterCopy}
                onchange={(event) => onUpdateSettings({ autoClearAfterCopy: (event.currentTarget as HTMLInputElement).checked })}
              />
              <span class="switchTrack"></span>
            </span>
          </label>
          <label class="settingsRow settingsRowMarginTop settingsSwitchRow">
            <span class="settingsLabel">
              Block page interactions
              <span class="helpDot" title="Prevent native interactions on controls while browsing elements.">
                <HelpCircle size={12} strokeWidth={2.1} />
              </span>
            </span>
            <span class="switch">
              <input
                type="checkbox"
                checked={settings.blockInteractions}
                onchange={(event) => onUpdateSettings({ blockInteractions: (event.currentTarget as HTMLInputElement).checked })}
              />
              <span class="switchTrack"></span>
            </span>
          </label>
        </div>

        <div class="divider"></div>

        <button class="settingsNavLink" type="button" onclick={() => (settingsPage = "automations")}>
          <span>Manage MCP &amp; Webhooks</span>
          <span class="settingsNavLinkRight">
            {#if endpoint && connectionStatus !== "disconnected"}
              <span class={`mcpNavIndicator ${connectionStatus}`}></span>
            {/if}
            <ChevronRight size={16} strokeWidth={1.8} class="settingsNavChevronIcon" />
          </span>
        </button>
      </div>

      <div class={`settingsPage automationsPage ${settingsPage === "automations" ? "slideIn" : ""}`}>
        <button class="settingsBackButton" type="button" onclick={() => (settingsPage = "main")}>
          <ChevronLeft size={16} strokeWidth={1.8} class="backChevronIcon" />
          <span>Manage MCP &amp; Webhooks</span>
        </button>

        <div class="divider"></div>

        <div class="settingsSection settingsSectionExtraPadding">
          <div class="settingsRow">
            <span class="settingsLabel">
              MCP Connection
              <span class="helpDot" title="Connect via MCP to let agents receive annotations in real-time.">
                <HelpCircle size={12} strokeWidth={2.1} />
              </span>
            </span>
            {#if endpoint}
              <span class={`mcpStatusDot ${connectionStatus}`}></span>
            {/if}
          </div>
          <p class="automationDescription">
            MCP connection allows agents to receive and act on annotations.
            <a href="https://agentation.dev/mcp" target="_blank" rel="noopener noreferrer" class="learnMoreLink"> Learn more</a>
          </p>
        </div>

        <div class="divider"></div>

        <div class="settingsSection settingsSectionExtraPadding settingsSectionGrow">
          <div class="settingsRow">
            <span class="settingsLabel">
              Workspace root
              <span class="helpDot" title="Used to resolve relative source paths for Open in editor.">
                <HelpCircle size={12} strokeWidth={2.1} />
              </span>
            </span>
          </div>
          <textarea
            class="workspaceRootInput"
            placeholder="/Users/you/dev/your-project"
            value={settings.workspaceRoot}
            oninput={(event) => onUpdateSettings({ workspaceRoot: (event.currentTarget as HTMLTextAreaElement).value })}
          ></textarea>
        </div>

        <div class="divider"></div>

        <div class="settingsSection settingsSectionExtraPadding settingsSectionGrow">
          <div class="settingsRow">
            <span class="settingsLabel">
              Webhooks
              <span class="helpDot" title="Send annotation events to your endpoint.">
                <HelpCircle size={12} strokeWidth={2.1} />
              </span>
            </span>
            <label class={`autoSendLabel ${settings.webhooksEnabled ? "active" : ""} ${!settings.webhookUrl.trim() ? "disabled" : ""}`}>
              <span>Auto-Send</span>
              <span class="switch">
                <input
                  type="checkbox"
                  checked={settings.webhooksEnabled}
                  disabled={!settings.webhookUrl.trim()}
                  onchange={(event) => onUpdateSettings({ webhooksEnabled: (event.currentTarget as HTMLInputElement).checked })}
                />
                <span class="switchTrack"></span>
              </span>
            </label>
          </div>
          <p class="automationDescription">The webhook URL will receive live annotation changes and annotation data.</p>
          <textarea
            class="webhookUrlInput"
            placeholder="Webhook URL"
            value={settings.webhookUrl}
            oninput={(event) => onUpdateSettings({ webhookUrl: (event.currentTarget as HTMLTextAreaElement).value })}
          ></textarea>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  @keyframes badgeEnter {
    from { opacity: 0; transform: scale(0); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes toolbarEnter {
    from { opacity: 0; transform: scale(0.5) rotate(90deg); }
    to { opacity: 1; transform: scale(1) rotate(0deg); }
  }

  @keyframes cycleTextIn {
    0% { opacity: 0; transform: translateY(-6px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  .toolbarDock { position: relative; pointer-events: auto; }
  .toolbarContainer { position: relative; user-select: none; margin-left: auto; display: flex; align-items: center; justify-content: center; background: #1a1a1a; color: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.2), 0 4px 16px rgba(0,0,0,.1); transition: width .4s cubic-bezier(.19,1,.22,1), transform .4s cubic-bezier(.19,1,.22,1); overflow: visible; }
  .toolbarContainer.entrance { animation: toolbarEnter .5s cubic-bezier(.34,1.2,.64,1) forwards; }
  .toolbarContainer.collapsed { width: 44px; height: 44px; border-radius: 22px; }
  .toolbarContainer.expanded { width: fit-content; height: 44px; border-radius: 1.5rem; padding: .375rem; }
  .toggleBubble { width: 44px; height: 44px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: transparent; color: rgba(255,255,255,.95); position: relative; transition: opacity .12s ease; }
  .toggleBubble.visible { opacity: 1; pointer-events: auto; }
  .toggleBubble .icon { transform: translateY(-1px); }
  .toggleBubble.visible:hover { background: #2a2a2a; }
  .toggleBubble.visible:active { transform: scale(.95); }
  .toggleBubble.hidden { display: none; opacity: 0; pointer-events: none; }
  .bubbleBadge { position: absolute; top: 0; right: 0; user-select: none; min-width: 16px; height: 16px; padding: 0 4px; border-radius: 8px; background-color: var(--agentation-color-accent, #3c82f7); color: #fff; font-size: .625rem; font-weight: 600; font-variant-numeric: tabular-nums; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 2px #1a1a1a, 0 1px 3px rgba(0,0,0,.2); animation: badgeEnter .3s cubic-bezier(.34,1.2,.64,1) .4s both; }
  .controlsContent { position: relative; inset: auto; padding: 0; display: flex; align-items: center; gap: .375rem; transition: filter .8s cubic-bezier(.19,1,.22,1), opacity .8s cubic-bezier(.19,1,.22,1), transform .6s cubic-bezier(.19,1,.22,1); }
  .controlsContent.visible { opacity: 1; transform: scale(1); filter: blur(0); pointer-events: auto; }
  .controlsContent.hidden { display: none; opacity: 0; filter: blur(10px); transform: scale(.4); pointer-events: none; }
  .buttonWrapper { position: relative; display: flex; align-items: center; justify-content: center; }
  .buttonWrapper:hover .buttonTooltip { opacity: 1; visibility: visible; transform: translateX(-50%) scale(1); transition-delay: .85s; }
  .buttonWrapper:has(.controlButton:disabled):hover .buttonTooltip { opacity: 0; visibility: hidden; }
  .tooltipsHidden .buttonTooltip { opacity: 0 !important; visibility: hidden !important; transition: none !important; }
  .buttonTooltip { position: absolute; bottom: calc(100% + 14px); left: 50%; transform: translateX(-50%) scale(.95); padding: 6px 10px; background: #1a1a1a; color: rgba(255,255,255,.9); font-size: 12px; font-weight: 500; border-radius: 8px; white-space: nowrap; opacity: 0; visibility: hidden; pointer-events: none; z-index: 2147483647; box-shadow: 0 2px 8px rgba(0,0,0,.3); transition: opacity .135s ease, transform .135s ease, visibility .135s ease; }
  .buttonTooltip::after { content: ""; position: absolute; top: calc(100% - 4px); left: 50%; transform: translateX(-50%) rotate(45deg); width: 8px; height: 8px; background: #1a1a1a; border-radius: 0 0 2px 0; }
  .buttonWrapperAlignRight .buttonTooltip { left: 50%; transform: translateX(calc(-100% + 12px)) scale(.95); }
  .buttonWrapperAlignRight .buttonTooltip::after { left: auto; right: 8px; }
  .buttonWrapperAlignRight:hover .buttonTooltip { transform: translateX(calc(-100% + 12px)) scale(1); }
  .settingsPanel { position: absolute; right: 5px; bottom: calc(100% + .5rem); z-index: 1; overflow: hidden; background: #1c1c1c; border-radius: 16px; padding: 12px 0; width: 100%; max-width: 253px; min-width: 205px; cursor: default; opacity: 1; box-shadow: 0 1px 8px rgba(0,0,0,.25), 0 0 0 1px rgba(0,0,0,.04); transition: background-color .25s ease, box-shadow .25s ease; }
  .settingsPanel::before, .settingsPanel::after { content: ""; position: absolute; top: 0; bottom: 0; width: 16px; z-index: 2; pointer-events: none; }
  .settingsPanel::before { left: 0; background: linear-gradient(to right, #1c1c1c 0%, transparent 100%); }
  .settingsPanel::after { right: 0; background: linear-gradient(to left, #1c1c1c 0%, transparent 100%); }
  .settingsPanel.enter { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); transition: opacity .2s ease, transform .2s ease, filter .2s ease; }
  .settingsPanel.exit { opacity: 0; transform: translateY(8px) scale(.95); filter: blur(5px); pointer-events: none; transition: opacity .1s ease, transform .1s ease, filter .1s ease; }
  .settingsPanelContainer { overflow: visible; position: relative; display: flex; padding: 0 16px; }
  .settingsPage { min-width: 100%; flex-shrink: 0; opacity: 1; transition: transform .2s ease, opacity .2s ease; }
  .settingsPage.slideLeft { transform: translateX(-24px); opacity: 0; pointer-events: none; }
  .automationsPage { position: absolute; top: 0; left: 24px; width: 100%; padding: 0 1rem 4px; box-sizing: border-box; opacity: 0; pointer-events: none; }
  .automationsPage.slideIn { transform: translateX(-24px); opacity: 1; pointer-events: auto; }
  .settingsHeader { display: flex; align-items: center; justify-content: space-between; height: 24px; }
  .settingsBrand { font-size: .8125rem; font-weight: 600; letter-spacing: -.0094em; color: #fff; }
  .settingsBrandSlash { color: var(--agentation-color-accent, #3c82f7); }
  .settingsVersion { font-size: 11px; font-weight: 400; color: rgba(255,255,255,.4); margin-left: auto; letter-spacing: -.0094em; }
  .settingsSection { margin-top: 0; padding-top: 0; }
  .settingsRow { display: flex; align-items: center; justify-content: space-between; min-height: 24px; }
  .settingsRow.settingsRowMarginTop { margin-top: 8px; }
  .cycleButton { display: flex; align-items: center; gap: .5rem; padding: 0; border: none; background: transparent; font-size: .8125rem; font-weight: 500; color: #fff; cursor: pointer; letter-spacing: -.0094em; }
  .cycleIcon { opacity: .85; }
  .cycleButtonText { display: inline-block; animation: cycleTextIn .2s ease-out; }
  .settingsLabel { font-size: 13px; line-height: 20px; font-weight: 400; letter-spacing: -0.15px; color: rgba(255,255,255,.5); display: flex; align-items: center; gap: .125rem; }
  .settingsLabelMarker { padding-top: 3px; margin-bottom: 10px; }
  .settingsOptions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .25rem; }
  .settingsOption { display: flex; align-items: center; justify-content: center; padding: .375rem .5rem; border: none; border-radius: .375rem; background: transparent; font-size: 11px; font-weight: 500; color: rgba(255,255,255,.85); cursor: pointer; transition: background-color .15s ease, color .15s ease; }
  .settingsOption:hover { background: rgba(255,255,255,.1); }
  .settingsOption.selected { background: color-mix(in srgb, var(--agentation-color-blue, #3c82f7) 15%, transparent); color: var(--agentation-color-blue, #3c82f7); }
  .divider { margin-block: 8px; width: 100%; height: 1px; background: rgba(255,255,255,.07); }
  .colorOptions { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; height: 26px; }
  .colorOption { padding: 0; border-radius: 50%; width: 20px; height: 20px; background: var(--swatch); }
  .colorOption.selected { box-shadow: 0 0 0 2px rgba(255,255,255,.22); }
  .settingsNavLink { display: flex; align-items: center; justify-content: space-between; width: 100%; height: 24px; padding: 0; border: none; background: transparent; font-family: inherit; line-height: 20px; font-size: 13px; font-weight: 400; color: rgba(255,255,255,.5); transition: color .15s ease; }
  .settingsNavLink:hover { color: rgba(255,255,255,.9); }
  .settingsNavLinkRight { display: flex; align-items: center; gap: 6px; }
  .settingsNavChevronIcon { color: rgba(255,255,255,.4); transition: color .15s ease; }
  .settingsNavLink:hover .settingsNavChevronIcon { color: #fff; }
  .settingsBackButton { display: flex; align-items: center; gap: 4px; height: 24px; padding: 0; border: none; background: transparent; font-family: inherit; line-height: 20px; font-size: 13px; font-weight: 500; letter-spacing: -0.15px; color: #fff; }
  .backChevronIcon { opacity: .4; transition: opacity .15s ease; }
  .settingsBackButton:hover .backChevronIcon { opacity: 1; }
  .automationDescription { font-size: 11px; font-weight: 300; color: rgba(255,255,255,.5); margin-top: 2px; line-height: 14px; }
  .settingsSectionGrow { display: flex; flex-direction: column; }
  .autoSendLabel { display: inline-flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 400; color: rgba(255,255,255,.4); }
  .autoSendLabel.active { color: #66b8ff; }
  .autoSendLabel.disabled { opacity: .3; }
  .webhookUrlInput { display: block; width: 100%; flex: 1; min-height: 60px; box-sizing: border-box; margin-top: 11px; padding: 8px 10px; border: 1px solid rgba(255,255,255,.1); border-radius: 6px; background: rgba(255,255,255,.03); font-family: inherit; font-size: .75rem; font-weight: 400; color: #fff; outline: none; resize: none; transition: border-color .15s ease, background-color .15s ease, box-shadow .15s ease; }
  .workspaceRootInput { display: block; width: 100%; box-sizing: border-box; margin-top: 11px; min-height: 44px; max-height: 96px; padding: 8px 10px; border: 1px solid rgba(255,255,255,.1); border-radius: 6px; background: rgba(255,255,255,.03); font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; font-size: .75rem; font-weight: 400; color: #fff; outline: none; resize: vertical; transition: border-color .15s ease, background-color .15s ease, box-shadow .15s ease; }
  .workspaceRootInput:focus { border-color: rgba(255,255,255,.3); background: rgba(255,255,255,.08); }
  .webhookUrlInput:focus { border-color: rgba(255,255,255,.3); background: rgba(255,255,255,.08); }
  .helpDot { display: inline-flex; align-items: center; justify-content: center; color: rgba(255,255,255,.38); }
  .learnMoreLink { color: rgba(255,255,255,.8); text-decoration-line: underline; text-decoration-style: dotted; text-decoration-color: rgba(255,255,255,.2); text-underline-offset: 2px; transition: color .15s ease; }
  .learnMoreLink:hover { color: #fff; }

  .settingsSwitchRow .settingsLabel { gap: 6px; }
  .switch { position: relative; display: inline-flex; }
  .switch input { position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%; cursor: pointer; margin: 0; z-index: 2; }
  .switchTrack { width: 28px; height: 16px; border-radius: 999px; background: rgba(255,255,255,.2); position: relative; transition: background-color .15s ease; }
  .switchTrack::after { content: ""; position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; transition: transform .15s ease; }
  .switch input:checked + .switchTrack { background: color-mix(in srgb, var(--agentation-color-blue, #3c82f7) 60%, transparent); }
  .switch input:checked + .switchTrack::after { transform: translateX(12px); }
  .switch input:disabled + .switchTrack { opacity: .4; }
  .mcpStatusDot, .mcpNavIndicator { width: 8px; height: 8px; border-radius: 50%; }
  .mcpStatusDot.connected, .mcpNavIndicator.connected { background: var(--agentation-color-green, #34c759); animation: mcpPulseConnected 2.5s ease-in-out infinite; }
  .mcpStatusDot.connecting, .mcpNavIndicator.connecting { background: var(--agentation-color-yellow, #ffcc00); animation: mcpPulseConnecting 1.5s ease-in-out infinite; }
  .mcpStatusDot.disconnected { background: var(--agentation-color-red, #ff383c); }
  .controlButton { width: 34px; height: 34px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: transparent; color: rgba(255,255,255,.85); transition: background-color .15s ease, color .15s ease, transform .1s ease, opacity .2s ease; }
  .buttonWrapperAlignRight .controlButton { margin-right: -1px; }
  .icon { display: block; }
  .spin { animation: spin 1s linear infinite; }
  .controlButton:hover:not(:disabled):not(.active) { background: rgba(255,255,255,.12); color: #fff; }
  .controlButton:active:not(:disabled) { transform: scale(.92); }
  .controlButton.active { color: #60a5fa; background: color-mix(in srgb, #60a5fa 24%, transparent); }
  .controlButton[data-danger="true"]:hover:not(:disabled):not(.active) { background: color-mix(in srgb, #ef4444 24%, transparent); color: #ef4444; }
  .collapseButtonWrapper { margin-left: 0; }
  .settingsButtonWrapper { position: relative; }
  .mcpIndicator { position: absolute; top: 7px; right: 7px; width: 6px; height: 6px; border-radius: 50%; pointer-events: none; }
  .mcpIndicator.connected { background: var(--agentation-color-green, #34c759); box-shadow: 0 0 0 0 color-mix(in srgb, var(--agentation-color-green, #34c759) 50%, transparent); animation: mcpPulseConnected 1.2s ease-in-out infinite; }
  .mcpIndicator.connecting { background: var(--agentation-color-yellow, #ffcc00); box-shadow: 0 0 0 0 color-mix(in srgb, var(--agentation-color-yellow, #ffcc00) 50%, transparent); animation: mcpPulseConnecting 1s ease-in-out infinite; }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  @keyframes mcpPulseConnected {
    0%,100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--agentation-color-green, #34c759) 50%, transparent); }
    50% { box-shadow: 0 0 0 5px color-mix(in srgb, var(--agentation-color-green, #34c759) 0%, transparent); }
  }
  @keyframes mcpPulseConnecting {
    0%,100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--agentation-color-yellow, #ffcc00) 50%, transparent); }
    50% { box-shadow: 0 0 0 5px color-mix(in srgb, var(--agentation-color-yellow, #ffcc00) 0%, transparent); }
  }

  :global([data-agentation-theme="light"]) .toggleBubble { color: rgba(0,0,0,.8); }
  :global([data-agentation-theme="light"]) .toolbarContainer { background: #fff; color: rgba(0,0,0,.85); box-shadow: 0 2px 8px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04); }
  :global([data-agentation-theme="light"]) .toggleBubble.visible:hover { background: #f5f5f5; }
  :global([data-agentation-theme="light"]) .controlButton { color: rgba(0,0,0,.5); }
  :global([data-agentation-theme="light"]) .controlButton:hover:not(:disabled):not(.active) { background: rgba(0,0,0,.06); color: rgba(0,0,0,.85); }
  :global([data-agentation-theme="light"]) .controlButton.active { color: var(--agentation-color-blue, #3c82f7); background: color-mix(in srgb, var(--agentation-color-blue, #3c82f7) 15%, transparent); }
  :global([data-agentation-theme="light"]) .controlButton[data-danger="true"]:hover:not(:disabled):not(.active) { color: var(--agentation-color-red, #ff383c); background: color-mix(in srgb, var(--agentation-color-red, #ff383c) 15%, transparent); }
  :global([data-agentation-theme="light"]) .buttonTooltip { background: #fff; color: rgba(0,0,0,.82); box-shadow: 0 2px 8px rgba(0,0,0,.14), 0 0 0 1px rgba(0,0,0,.08); }
  :global([data-agentation-theme="light"]) .buttonTooltip::after { background: #fff; }
  :global([data-agentation-theme="light"]) .settingsPanel { background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.06), 0 0 0 1px rgba(0,0,0,.04); }
  :global([data-agentation-theme="light"]) .settingsPanel::before { background: linear-gradient(to right, #fff 0%, transparent 100%); }
  :global([data-agentation-theme="light"]) .settingsPanel::after { background: linear-gradient(to left, #fff 0%, transparent 100%); }
  :global([data-agentation-theme="light"]) .settingsHeader { border-bottom-color: rgba(0,0,0,.08); }
  :global([data-agentation-theme="light"]) .settingsBrand { color: #E5484D; }
  :global([data-agentation-theme="light"]) .settingsVersion,
  :global([data-agentation-theme="light"]) .settingsLabel { color: rgba(0,0,0,.5); }
  :global([data-agentation-theme="light"]) .cycleButton { color: rgba(0,0,0,.85); }
  :global([data-agentation-theme="light"]) .settingsOption { color: rgba(0,0,0,.7); }
  :global([data-agentation-theme="light"]) .settingsOption:hover { background: rgba(0,0,0,.05); }
  :global([data-agentation-theme="light"]) .settingsOption.selected { color: var(--agentation-color-blue, #3c82f7); background: color-mix(in srgb, var(--agentation-color-blue, #3c82f7) 15%, transparent); }
  :global([data-agentation-theme="light"]) .divider { background: rgba(0,0,0,.08); }
  :global([data-agentation-theme="light"]) .settingsNavLink { color: rgba(0,0,0,.5); }
  :global([data-agentation-theme="light"]) .settingsNavLink:hover { color: rgba(0,0,0,.8); }
  :global([data-agentation-theme="light"]) .settingsNavChevronIcon { color: rgba(0,0,0,.25); }
  :global([data-agentation-theme="light"]) .settingsNavLink:hover .settingsNavChevronIcon { color: rgba(0,0,0,.8); }
  :global([data-agentation-theme="light"]) .settingsBackButton { color: rgba(0,0,0,.85); }
  :global([data-agentation-theme="light"]) .backChevronIcon { opacity: .4; }
  :global([data-agentation-theme="light"]) .automationDescription { color: rgba(0,0,0,.5); }
  :global([data-agentation-theme="light"]) .autoSendLabel { color: rgba(0,0,0,.45); }
  :global([data-agentation-theme="light"]) .autoSendLabel.active { color: var(--agentation-color-blue, #3c82f7); }
  :global([data-agentation-theme="light"]) .webhookUrlInput { border-color: rgba(0,0,0,.1); background: rgba(0,0,0,.03); color: rgba(0,0,0,.85); }
  :global([data-agentation-theme="light"]) .workspaceRootInput { border-color: rgba(0,0,0,.1); background: rgba(0,0,0,.03); color: rgba(0,0,0,.85); }
  :global([data-agentation-theme="light"]) .workspaceRootInput:focus { border-color: rgba(0,0,0,.25); background: rgba(0,0,0,.05); }
  :global([data-agentation-theme="light"]) .webhookUrlInput:focus { border-color: rgba(0,0,0,.25); background: rgba(0,0,0,.05); }
  :global([data-agentation-theme="light"]) .helpDot { color: rgba(0,0,0,.35); }
  :global([data-agentation-theme="light"]) .learnMoreLink { color: rgba(0,0,0,.6); text-decoration-color: rgba(0,0,0,.2); }
  :global([data-agentation-theme="light"]) .learnMoreLink:hover { color: rgba(0,0,0,.85); }
  :global([data-agentation-theme="light"]) .switchTrack { background: rgba(0,0,0,.18); }

  @media (max-width: 640px) {
    .settingsPanel { right: 0; }
  }
</style>

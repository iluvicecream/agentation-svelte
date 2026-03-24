import { COLOR_OPTIONS, ToolbarSettings } from "..";
import { OUTPUT_DETAIL_OPTIONS } from "../../../utils/generate-output";
import { HelpTooltip } from "../../help-tooltip";
import { IconChevronLeft, IconMoon, IconSun } from "../../icons";
import { Switch } from "../../switch";
import { CheckboxField } from "./checkbox-field";
import styles from "./styles.module.scss";

type ConnectionStatus = "disconnected" | "connecting" | "connected";

export type SettingsPanelProps = {
  settings: ToolbarSettings;
  onSettingsChange: (patch: Partial<ToolbarSettings>) => void;

  isDarkMode: boolean;
  onToggleTheme: () => void;

  isDevMode: boolean;

  connectionStatus: ConnectionStatus;
  endpoint?: string;

  /** Whether the panel is mounted (controls enter/exit class) */
  isVisible: boolean;

  /** Position override: show panel above toolbar when toolbar is near bottom */
  toolbarNearBottom: boolean;

  settingsPage: "main" | "automations";
  onSettingsPageChange: (page: "main" | "automations") => void;

  onHideToolbar: () => void;
};

export function SettingsPanel({
  settings,
  onSettingsChange,
  isDarkMode,
  onToggleTheme,
  isDevMode,
  connectionStatus,
  endpoint,
  isVisible,
  toolbarNearBottom,
  settingsPage,
  onSettingsPageChange,
  onHideToolbar,
}: SettingsPanelProps) {
  return (
    <div
      className={`${styles.settingsPanel} ${isVisible ? styles.enter : styles.exit}`}
      style={
        toolbarNearBottom
          ? { bottom: "auto", top: "calc(100% + 0.5rem)" }
          : undefined
      }
      data-agentation-settings-panel
    >
      <div className={styles.settingsPanelContainer}>
        {/* ── Main page ── */}
        <div
          className={`${styles.settingsPage} ${settingsPage === "automations" ? styles.slideLeft : ""}`}
        >
          <div className={styles.settingsHeader}>
            <a className={styles.settingsBrand} href="https://agentation.com" target="_blank" rel="noopener noreferrer">
              <svg width="72" height="16" viewBox="0 0 1067 240" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M832.549 80.1896C838.968 80.1896 844.168 74.9866 844.168 68.5681C844.168 62.1496 838.965 56.9465 832.549 56.9465C826.133 56.9465 820.928 62.1496 820.928 68.5681C820.928 74.9866 826.131 80.1896 832.549 80.1896ZM1066.51 157.056L1052.04 110.39C1048.08 97.598 1036.03 94.462 1025.74 102.584L980.318 141.571C977.981 143.416 983.432 146.27 983.844 143.898L990.826 103.517C992.507 93.7993 988.322 86.3882 975.606 86.6025L919.738 87.3272C914.986 87.4175 918.618 91.6363 918.618 96.4107C918.618 101.185 922.341 103.551 927.245 103.458L976.269 102.389C976.588 102.384 973.621 100.404 973.598 100.536L966.334 144.583C963.593 161.205 978.474 166.177 991.153 155.294L1036.58 116.306L1033.94 115.568L1048.29 161.853C1051.4 172.784 1069.63 167.987 1066.52 157.056H1066.51ZM907.439 162.344C953.906 163.182 968.24 88.1761 919.738 87.3272C872.177 86.4981 860.177 161.492 907.439 162.344ZM907.749 145.144C883.804 144.713 894.272 103.247 919.157 103.681C943.57 104.107 931.917 145.579 907.749 145.144ZM884.96 106.179C869.865 126.746 846.094 147.922 832.874 147.691C817.324 147.42 825.902 118.314 829.653 108.554C835.034 94.541 818.818 90.999 814.157 102.386C809.379 114.064 781.342 150.161 761.396 149.846C749.8 149.662 745.053 137.186 757.298 100.937L779.016 36.6392C780.572 31.6335 777.059 25.466 770.806 25.466C766.949 25.466 763.686 28.0041 762.594 31.5038L741.001 95.4322C725.572 141.112 731.105 166.617 757.174 167.031C788.875 167.536 823.666 121.132 828.432 104.473L814.439 102.386C807.191 121.258 795.826 164.273 829.473 164.862C854.865 165.305 879.081 139.53 896.026 116.351C897.07 114.927 897.685 113.173 897.685 111.273C897.685 106.521 896.652 102.668 891.901 102.668C889.052 102.668 886.528 104.05 884.963 106.182L884.96 106.179ZM793.7 56.8817L719.03 58.523C714.738 58.6047 711.286 62.1073 711.286 66.4164C711.286 70.7254 714.904 74.3944 719.334 74.3098L794.004 72.6685C798.297 72.5867 801.748 69.0842 801.748 64.7751C801.748 60.466 798.13 56.7971 793.7 56.8817ZM743.923 88.1451C723.92 142.471 695.352 155.802 684.236 155.607C676.822 155.477 674.453 151.698 675.586 139.713C676.644 128.548 662.803 123.813 656.306 132.95C648.934 143.317 638.655 153.154 625.124 152.917C601.669 152.508 611.393 111.557 646.861 112.175C659.836 112.401 669.016 118.444 672.916 126.354C674.182 128.918 676.822 130.68 679.873 130.68C684.157 130.68 687.631 127.206 687.631 122.922C687.631 121.687 687.343 120.517 686.822 119.482C680.4 106.521 666.071 96.9945 647.132 96.6645C591.421 95.6916 576.198 168.472 621.751 169.267C642.589 169.631 662.307 152.643 667.538 140.243C666.37 141.884 659.836 141.532 660.146 138.247C658.294 157.821 663.869 171.075 681.991 171.391C701.001 171.684 734.368 153.985 757.355 91.5235C759.109 86.7576 756.788 83.0633 751.204 83.0633C747.862 83.0633 745.014 85.1755 743.925 88.1394L743.923 88.1451ZM549.523 168.388C549.523 184.58 567.177 188.546 567.177 166.887C567.177 145.229 583.959 92.4823 588.497 78.2917L642.09 75.9651C656.105 75.356 653.677 59.9725 642.473 60.3701L593.793 62.096L599.794 44.1011C601.207 40.1417 602.264 36.9042 602.264 34.3831C602.264 30.0656 599.086 27.5444 595.203 27.5444C590.615 27.5444 586.731 28.9855 582.493 41.5799L575.431 63.1733L540.832 64.6143C534.831 64.9725 530.592 67.4936 530.592 72.8913C530.592 79.008 535.183 81.1682 541.537 80.81L570.135 79.3718C564.78 95.7508 549.52 147.824 549.52 168.385L549.523 168.388ZM322.659 129.504C333.556 95.6239 362.177 93.334 362.177 105.308C362.177 113.698 348.68 126.901 322.659 129.504ZM259.148 182.403C281.323 178.241 270.161 164.022 256.447 168.032C172.487 192.595 181.12 237.784 211.771 239.403C255.584 241.715 281.365 179.332 282.817 132.096C284.064 121.188 272.609 116.611 264.701 125.006C254.129 136.236 235.389 151.326 220.358 151.326C194.955 151.326 214.986 100.63 257.484 100.63C265.897 100.63 271.892 103.382 275.894 107.059C283.079 113.661 298.367 104.124 290.556 94.8907C284.693 87.9618 274.413 82.8631 258.889 82.8631C194.233 82.8631 165.815 169.375 215.823 169.375C243.339 169.375 268.596 143.932 274.498 135.599C273.319 136.614 265.643 133.354 265.973 130.466L265.251 136.786C264.924 172.66 242.628 225.102 214.893 222.197C200.135 220.652 211.413 191.363 259.151 182.401L259.148 182.403ZM9.39368 133.365L176.317 112.615C180.55 112.15 183.844 108.562 183.844 104.205C183.844 99.2026 179.411 95.2517 174.45 95.7959L7.52679 116.546C3.29385 117.011 0 120.599 0 124.956C0 129.958 4.43316 133.909 9.39368 133.365ZM153.824 178.162L164.43 15.3109C165.42 0.10504 149.54 -5.6733 139.315 6.79145L4.29498 171.43C3.01184 172.97 2.23914 174.953 2.23914 177.116C2.23914 182.023 6.21545 185.999 11.1224 185.999C13.8663 185.999 16.3198 184.755 17.9498 182.801L153.051 18.0605C154.151 16.7181 146.647 14.9584 146.7 14.1575L136.086 177.144C135.801 182.195 139.887 186.538 144.955 186.538C149.69 186.538 153.559 182.832 153.824 178.165V178.162ZM334.495 176.278C364.495 176.278 402.107 154.64 420.657 128.221C419.247 135.779 413.596 156.893 413.596 163.974C413.596 177.065 425.905 176.055 435.905 165.948L476.799 124.62L480.104 140.136C484.535 160.926 493.779 169.234 508.35 169.234C534.791 169.234 559.205 140.066 570.101 123.379L561.982 106.43C555.505 123.543 527.859 150.618 512.586 150.618C505.561 150.618 502.002 146.287 499.808 136.916L495.398 118.083C491.621 101.963 478.22 98.2776 462.809 113.275L436.681 138.701L440.564 116.109C443.392 99.651 427.301 98.1366 418.835 109.784C406.345 126.972 368.246 158.359 337.033 158.359C324.216 158.359 320.479 152.214 320.398 144.112C389.532 139.022 402.177 81.5066 356.472 81.5066C301.382 81.5066 277.312 176.275 334.49 176.275L334.495 176.278Z" fill="currentColor"/>
              </svg>
            </a>
            <p className={styles.settingsVersion}>v{__VERSION__}</p>
            <button
              className={styles.themeToggle}
              onClick={onToggleTheme}
              title={
                isDarkMode ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              <span className={styles.themeIconWrapper}>
                <span
                  key={isDarkMode ? "sun" : "moon"}
                  className={styles.themeIcon}
                >
                  {isDarkMode ? <IconSun size={20} /> : <IconMoon size={20} />}
                </span>
              </span>
            </button>
          </div>

          <div className={styles.divider}></div>

          {/* Output detail + React toggle */}
          <div className={styles.settingsSection}>
            <div className={styles.settingsRow}>
              <div className={styles.settingsLabel}>
                Output Detail
                <HelpTooltip content="Controls how much detail is included in the copied output" />
              </div>
              <button
                className={styles.cycleButton}
                onClick={() => {
                  const currentIndex = OUTPUT_DETAIL_OPTIONS.findIndex(
                    (opt) => opt.value === settings.outputDetail,
                  );
                  const nextIndex =
                    (currentIndex + 1) % OUTPUT_DETAIL_OPTIONS.length;
                  onSettingsChange({
                    outputDetail: OUTPUT_DETAIL_OPTIONS[nextIndex].value,
                  });
                }}
              >
                <span
                  key={settings.outputDetail}
                  className={styles.cycleButtonText}
                >
                  {
                    OUTPUT_DETAIL_OPTIONS.find(
                      (opt) => opt.value === settings.outputDetail,
                    )?.label
                  }
                </span>
                <span className={styles.cycleDots}>
                  {OUTPUT_DETAIL_OPTIONS.map((option) => (
                    <span
                      key={option.value}
                      className={`${styles.cycleDot} ${settings.outputDetail === option.value ? styles.active : ""}`}
                    />
                  ))}
                </span>
              </button>
            </div>

            <div
              className={`${styles.settingsRow} ${styles.settingsRowMarginTop} ${!isDevMode ? styles.settingsRowDisabled : ""}`}
            >
              <div className={styles.settingsLabel}>
                React Components
                <HelpTooltip
                  content={
                    !isDevMode
                      ? "Disabled — production builds minify component names, making detection unreliable. Use in development mode."
                      : "Include React component names in annotations"
                  }
                />
              </div>
              <Switch
                checked={isDevMode && settings.reactEnabled}
                onChange={(e) =>
                  onSettingsChange({ reactEnabled: e.target.checked })
                }
                disabled={!isDevMode}
              />
            </div>

            <div
              className={`${styles.settingsRow} ${styles.settingsRowMarginTop}`}
            >
              <div className={styles.settingsLabel}>
                Hide Until Restart
                <HelpTooltip content="Hides the toolbar until you open a new tab" />
              </div>
              <Switch
                checked={false}
                onChange={(e) => {
                  if (e.target.checked) onHideToolbar();
                }}
              />
            </div>
          </div>

          <div className={styles.divider}></div>

          {/* Color picker */}
          <div className={styles.settingsSection}>
            <div
              className={`${styles.settingsLabel} ${styles.settingsLabelMarker}`}
            >
              Marker Color
            </div>
            <div className={styles.colorOptions}>
              {COLOR_OPTIONS.map((color) => (
                <button
                  className={`${styles.colorOption} ${settings.annotationColorId === color.id ? styles.selected : ""}`}
                  style={
                    {
                      "--swatch": color.srgb,
                      "--swatch-p3": color.p3,
                    } as React.CSSProperties
                  }
                  onClick={() =>
                    onSettingsChange({ annotationColorId: color.id })
                  }
                  title={color.label}
                  type="button"
                  key={color.id}
                ></button>
              ))}
            </div>
          </div>

          <div className={styles.divider}></div>

          {/* Checkboxes */}
          <div className={styles.settingsSection}>
            <CheckboxField
              className="checkbox-field"
              label="Clear on copy/send"
              checked={settings.autoClearAfterCopy}
              onChange={(e) =>
                onSettingsChange({ autoClearAfterCopy: e.target.checked })
              }
              tooltip="Automatically clear annotations after copying"
            />
            <CheckboxField
              className={styles.checkboxField}
              label="Block page interactions"
              checked={settings.blockInteractions}
              onChange={(e) =>
                onSettingsChange({ blockInteractions: e.target.checked })
              }
            />
          </div>

          <div className={styles.divider} />

          {/* Nav to automations */}
          <button
            className={styles.settingsNavLink}
            onClick={() => onSettingsPageChange("automations")}
          >
            <span>Manage MCP & Webhooks</span>
            <span className={styles.settingsNavLinkRight}>
              {endpoint && connectionStatus !== "disconnected" && (
                <span
                  className={`${styles.mcpNavIndicator} ${styles[connectionStatus]}`}
                />
              )}
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M7.5 12.5L12 8L7.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>

        {/* ── Automations page ── */}
        <div
          className={`${styles.settingsPage} ${styles.automationsPage} ${settingsPage === "automations" ? styles.slideIn : ""}`}
        >
          <button
            className={styles.settingsBackButton}
            onClick={() => onSettingsPageChange("main")}
          >
            <IconChevronLeft size={16} />
            <span>Manage MCP & Webhooks</span>
          </button>

          <div className={styles.divider}></div>

          {/* MCP section */}
          <div className={styles.settingsSection}>
            <div className={styles.settingsRow}>
              <span className={styles.automationHeader}>
                MCP Connection
                <HelpTooltip content="Connect via Model Context Protocol to let AI agents like Claude Code receive annotations in real-time." />
              </span>
              {endpoint && (
                <div
                  className={`${styles.mcpStatusDot} ${styles[connectionStatus]}`}
                  title={
                    connectionStatus === "connected"
                      ? "Connected"
                      : connectionStatus === "connecting"
                        ? "Connecting..."
                        : "Disconnected"
                  }
                />
              )}
            </div>
            <p
              className={styles.automationDescription}
              style={{ paddingBottom: 6 }}
            >
              MCP connection allows agents to receive and act on annotations.{" "}
              <a
                href="https://agentation.dev/mcp"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.learnMoreLink}
              >
                Learn more
              </a>
            </p>
          </div>

          <div className={styles.divider}></div>

          {/* Webhooks section */}
          <div
            className={`${styles.settingsSection} ${styles.settingsSectionGrow}`}
          >
            <div className={styles.settingsRow}>
              <span className={styles.automationHeader}>
                Webhooks
                <HelpTooltip content="Send annotation data to any URL endpoint when annotations change. Useful for custom integrations." />
              </span>
              <div className={styles.autoSendContainer}>
                <label
                  htmlFor="agentation-auto-send"
                  className={`${styles.autoSendLabel} ${settings.webhooksEnabled ? styles.active : ""} ${!settings.webhookUrl ? styles.disabled : ""}`}
                >
                  Auto-Send
                </label>
                <Switch
                  id="agentation-auto-send"
                  checked={settings.webhooksEnabled}
                  onChange={(e) =>
                    onSettingsChange({
                      webhooksEnabled: e.target.checked,
                    })
                  }
                  disabled={!settings.webhookUrl}
                />
              </div>
            </div>
            <p className={styles.automationDescription}>
              The webhook URL will receive live annotation changes and
              annotation data.
            </p>
            <textarea
              className={styles.webhookUrlInput}
              placeholder="Webhook URL"
              value={settings.webhookUrl}
              onKeyDown={(e) => e.stopPropagation()}
              onChange={(e) => onSettingsChange({ webhookUrl: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

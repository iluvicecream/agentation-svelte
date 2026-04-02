const EXCLUDE_ATTRS = ["data-agentation-root"];
const NOT_SELECTORS = EXCLUDE_ATTRS
  .flatMap((attr) => [`:not([${attr}])`, `:not([${attr}] *)`])
  .join("");

const STYLE_ID = "agentation-freeze-styles";
const STATE_KEY = "__agentation_freeze";

type FreezeState = {
  frozen: boolean;
  installed: boolean;
  origSetTimeout: typeof setTimeout;
  origSetInterval: typeof setInterval;
  origRAF: typeof requestAnimationFrame;
  pausedAnimations: Animation[];
  frozenTimeoutQueue: Array<() => void>;
  frozenRAFQueue: FrameRequestCallback[];
};

function getState(): FreezeState {
  if (typeof window === "undefined") {
    return {
      frozen: false,
      installed: true,
      origSetTimeout: setTimeout,
      origSetInterval: setInterval,
      origRAF: (_cb: FrameRequestCallback) => 0,
      pausedAnimations: [],
      frozenTimeoutQueue: [],
      frozenRAFQueue: []
    };
  }

  const win = window as unknown as Record<string, unknown>;
  if (!win[STATE_KEY]) {
    win[STATE_KEY] = {
      frozen: false,
      installed: false,
      origSetTimeout: null,
      origSetInterval: null,
      origRAF: null,
      pausedAnimations: [],
      frozenTimeoutQueue: [],
      frozenRAFQueue: []
    };
  }
  return win[STATE_KEY] as FreezeState;
}

const state = getState();

if (typeof window !== "undefined" && !state.installed) {
  state.origSetTimeout = window.setTimeout.bind(window);
  state.origSetInterval = window.setInterval.bind(window);
  state.origRAF = window.requestAnimationFrame.bind(window);

  (window as unknown as { setTimeout: typeof setTimeout }).setTimeout = (
    handler: TimerHandler,
    timeout?: number,
    ...args: unknown[]
  ) => {
    if (typeof handler === "string") {
      return state.origSetTimeout(handler, timeout);
    }
    return state.origSetTimeout(
      (...runtimeArgs: unknown[]) => {
        if (state.frozen) {
          state.frozenTimeoutQueue.push(() => (handler as (...a: unknown[]) => void)(...runtimeArgs));
        } else {
          (handler as (...a: unknown[]) => void)(...runtimeArgs);
        }
      },
      timeout,
      ...args
    );
  };

  (window as unknown as { setInterval: typeof setInterval }).setInterval = (
    handler: TimerHandler,
    timeout?: number,
    ...args: unknown[]
  ) => {
    if (typeof handler === "string") {
      return state.origSetInterval(handler, timeout);
    }
    return state.origSetInterval(
      (...runtimeArgs: unknown[]) => {
        if (!state.frozen) {
          (handler as (...a: unknown[]) => void)(...runtimeArgs);
        }
      },
      timeout,
      ...args
    );
  };

  (window as unknown as { requestAnimationFrame: typeof requestAnimationFrame }).requestAnimationFrame = (callback) => {
    return state.origRAF((timestamp) => {
      if (state.frozen) {
        state.frozenRAFQueue.push(callback);
      } else {
        callback(timestamp);
      }
    });
  };

  state.installed = true;
}

export const originalSetTimeout = state.origSetTimeout;
export const originalSetInterval = state.origSetInterval;
export const originalRequestAnimationFrame = state.origRAF;

function isAgentationElement(el: Element | null): boolean {
  if (!el) return false;
  return EXCLUDE_ATTRS.some((attr) => !!el.closest?.(`[${attr}]`));
}

export function freeze(): void {
  if (typeof document === "undefined") return;
  if (state.frozen) return;
  state.frozen = true;
  state.frozenTimeoutQueue = [];
  state.frozenRAFQueue = [];

  let style = document.getElementById(STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = STYLE_ID;
  }

  style.textContent = `
    *${NOT_SELECTORS},
    *${NOT_SELECTORS}::before,
    *${NOT_SELECTORS}::after {
      animation-play-state: paused !important;
      transition: none !important;
    }
  `;

  document.head.appendChild(style);

  state.pausedAnimations = [];
  try {
    document.getAnimations().forEach((anim) => {
      if (anim.playState !== "running") return;
      const target = (anim.effect as KeyframeEffect)?.target as Element | null;
      if (!isAgentationElement(target)) {
        anim.pause();
        state.pausedAnimations.push(anim);
      }
    });
  } catch {
    // getAnimations may not be available
  }

  document.querySelectorAll("video").forEach((video) => {
    if (!video.paused) {
      video.dataset.wasPaused = "false";
      video.pause();
    }
  });
}

export function unfreeze(): void {
  if (typeof document === "undefined") return;
  if (!state.frozen) return;
  state.frozen = false;

  const timeoutQueue = state.frozenTimeoutQueue;
  state.frozenTimeoutQueue = [];
  for (const cb of timeoutQueue) {
    state.origSetTimeout(() => {
      if (state.frozen) {
        state.frozenTimeoutQueue.push(cb);
        return;
      }
      cb();
    }, 0);
  }

  const rafQueue = state.frozenRAFQueue;
  state.frozenRAFQueue = [];
  for (const cb of rafQueue) {
    state.origRAF((ts) => {
      if (state.frozen) {
        state.frozenRAFQueue.push(cb);
        return;
      }
      cb(ts);
    });
  }

  for (const anim of state.pausedAnimations) {
    try {
      anim.play();
    } catch {
      // ignore resume failures
    }
  }
  state.pausedAnimations = [];

  document.getElementById(STYLE_ID)?.remove();

  document.querySelectorAll("video").forEach((video) => {
    if (video.dataset.wasPaused === "false") {
      video.play().catch(() => {});
      delete video.dataset.wasPaused;
    }
  });
}

import type { DraftAnnotation } from "./types";
import { originalSetTimeout } from "./freeze-animations";

export type PopupAnimState = "initial" | "enter" | "entered" | "exit";

export type PopupTimers = {
  popupEnterTimer: ReturnType<typeof setTimeout> | null;
  popupEnteredTimer: ReturnType<typeof setTimeout> | null;
  popupExitTimer: ReturnType<typeof setTimeout> | null;
  popupShakeTimer: ReturnType<typeof setTimeout> | null;
};

export type OpenPopupResult = {
  animState: PopupAnimState;
  popupX: number;
  popupY: number;
};

export function clearPopupTimers(timers: PopupTimers): PopupTimers {
  if (timers.popupEnterTimer) clearTimeout(timers.popupEnterTimer);
  if (timers.popupEnteredTimer) clearTimeout(timers.popupEnteredTimer);
  if (timers.popupExitTimer) clearTimeout(timers.popupExitTimer);
  if (timers.popupShakeTimer) clearTimeout(timers.popupShakeTimer);
  return {
    popupEnterTimer: null,
    popupEnteredTimer: null,
    popupExitTimer: null,
    popupShakeTimer: null
  };
}

export function computePopupPosition(clientX: number, clientY: number): { popupX: number; popupY: number } {
  return {
    popupX: Math.min(Math.max(clientX, 150), window.innerWidth - 150),
    popupY: Math.min(clientY + 22, window.innerHeight - 230)
  };
}

export function toDraftAnnotationPosition(y: number, isFixed: boolean): number {
  return isFixed ? y : y - window.scrollY;
}

export function startOpenPopupAnimation(
  _draft: DraftAnnotation,
  clientX: number,
  clientY: number,
  onAnimState: (state: PopupAnimState) => void
): { timers: PopupTimers; result: OpenPopupResult } {
  const { popupX, popupY } = computePopupPosition(clientX, clientY);
  onAnimState("initial");

  const popupEnterTimer = originalSetTimeout(() => {
    onAnimState("enter");
  }, 0);

  const popupEnteredTimer = originalSetTimeout(() => {
    onAnimState("entered");
  }, 200);

  return {
    timers: {
      popupEnterTimer,
      popupEnteredTimer,
      popupExitTimer: null,
      popupShakeTimer: null
    },
    result: {
      animState: "initial",
      popupX,
      popupY
    }
  };
}

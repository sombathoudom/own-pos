export type FlashToastType = "success" | "error" | "info" | "warning";

export function flashToast(type: FlashToastType, message: string, toastId?: string | number) {
  window.dispatchEvent(
    new CustomEvent("flash-toast", {
      detail: { type, message, toastId },
    })
  );
}
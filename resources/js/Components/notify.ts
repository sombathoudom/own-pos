import { toast } from "react-toastify";

export function notifyError(msg: string) {
  // ✅ allow same message to re-appear
  toast.dismiss();

  toast(msg, {
    hideProgressBar: true,
    className: "bg-danger text-white",
  });
}

export function notifySuccess(msg: string) {
  toast.dismiss();
  toast(msg, {
    hideProgressBar: true,
    className: "bg-success text-white",
  });
}

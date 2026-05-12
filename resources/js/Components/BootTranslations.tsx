import { useEffect } from "react";
import { usePage } from "@inertiajs/react";
import i18n from "../i18n";

function flatten(obj: any, prefix = "", out: Record<string, any> = {}) {
  Object.entries(obj || {}).forEach(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out);
    else out[key] = v;
  });
  return out;
}

export default function BootTranslations() {
  const { props } = usePage<any>();

  useEffect(() => {
    if (!props.laravelTranslations) return;

    const flat = flatten(props.laravelTranslations);

    // Now keys are like "validation.required"
    i18n.addResourceBundle(i18n.language, "lv", flat, true, true);
  }, [props.laravelTranslations]);

  return null;
}

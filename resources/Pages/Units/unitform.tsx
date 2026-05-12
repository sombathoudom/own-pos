import React, { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import type { Unit } from "@/types/app";

type Props = {
  mode: "create" | "edit";
  unit: Unit | null;
  context: "page" | "modal";
  showAfterOptions: boolean;
  onBack?: () => void;
};

export default function UnitForm({ mode, unit, context, showAfterOptions, onBack }: Props) {
  const isEdit = mode === "edit";

  const form = useForm({
    name: unit?.name ?? "",
    context,
    after: "index",
  });

  useEffect(() => {
    form.setData("name", unit?.name ?? "");
  }, [unit?.id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEdit ? route("units.update", unit!.id) : route("units.store");

    (isEdit ? form.put : form.post)(url, {
      preserveScroll: true,
      onError: () => window.dispatchEvent(new CustomEvent("toast", { detail: { message: "Unsuccessfully saved. Please check errors." } })),
    });
  };

  return (
    <>
      {onBack && (
        <button type="button" className="btn btn-sm btn-link px-0 mb-2" onClick={onBack}>
          ← Back
        </button>
      )}

      <form onSubmit={submit}>
        <div className="mb-3">
          <label className="form-label">Unit Name</label>
          <input
            className={`form-control ${form.errors.name ? "is-invalid" : ""}`}
            value={form.data.name}
            onChange={(e) => form.setData("name", e.target.value)}
          />
          {form.errors.name && <div className="invalid-feedback">{String(form.errors.name)}</div>}
        </div>

        {showAfterOptions && (
          <div className="mb-3">
            <label className="form-label">After save</label>
            <select className="form-select" value={form.data.after} onChange={(e) => form.setData("after", e.target.value)}>
              <option value="index">Redirect to index</option>
              <option value="reset">Reset / create page</option>
              <option value="edit">Go to edit</option>
            </select>
          </div>
        )}

        <button className="btn btn-primary" disabled={form.processing}>
          {form.processing ? "Saving..." : isEdit ? "Update" : "Save"}
        </button>
      </form>
    </>
  );
}

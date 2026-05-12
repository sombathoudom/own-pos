import React from "react";
import { useForm } from "@inertiajs/react";
import type { IdName } from "@/types/app";

export type DraftProduct = {
  name: string;
  category_id: string;
  unit_id: string;
  context: "modal";
  meta_line_index: number | null;
};

type Props = {
  draft: DraftProduct;
  setDraft: React.Dispatch<React.SetStateAction<DraftProduct>>;
  categories: IdName[];
  units: IdName[];
  onNewCategory: () => void;
  onNewUnit: () => void;
};

export default function ProductQuickForm({ draft, setDraft, categories, units, onNewCategory, onNewUnit }: Props) {
  const form = useForm(draft);

  const set = (k: keyof DraftProduct, v: any) => {
    setDraft((d) => ({ ...d, [k]: v }));
    // @ts-expect-error inertia form typing ok
    form.setData(k, v);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    form.post(route("products.store"), { preserveScroll: true });
  };

  return (
    <form onSubmit={submit}>
      <div className="mb-3">
        <label className="form-label">Product Name</label>
        <input
          className={`form-control ${form.errors.name ? "is-invalid" : ""}`}
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
        />
        {form.errors.name && <div className="invalid-feedback">{String(form.errors.name)}</div>}
      </div>

      <div className="mb-3">
        <label className="form-label d-flex justify-content-between align-items-center">
          <span>Category</span>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={onNewCategory}>
            + New Category
          </button>
        </label>
        <select
          className={`form-select ${form.errors.category_id ? "is-invalid" : ""}`}
          value={draft.category_id}
          onChange={(e) => set("category_id", e.target.value)}
        >
          <option value="">-- Select --</option>
          {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
        {form.errors.category_id && <div className="invalid-feedback">{String(form.errors.category_id)}</div>}
      </div>

      <div className="mb-3">
        <label className="form-label d-flex justify-content-between align-items-center">
          <span>Unit</span>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={onNewUnit}>
            + New Unit
          </button>
        </label>
        <select
          className={`form-select ${form.errors.unit_id ? "is-invalid" : ""}`}
          value={draft.unit_id}
          onChange={(e) => set("unit_id", e.target.value)}
        >
          <option value="">-- Select --</option>
          {units.map((u) => <option key={u.id} value={String(u.id)}>{u.name}</option>)}
        </select>
        {form.errors.unit_id && <div className="invalid-feedback">{String(form.errors.unit_id)}</div>}
      </div>

      <button className="btn btn-primary" disabled={form.processing}>
        {form.processing ? "Saving..." : "Save Product"}
      </button>
    </form>
  );
}

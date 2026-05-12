import React from "react";
import CategoryForm from "./categoryform";
import type { Category } from "@/types/app";

type Props = {
  mode: "create" | "edit";
  category: Category | null;
};

export default function FormPage({ mode, category }: Props) {
  return (
    <div className="container py-4">
      <h3 className="mb-3">{mode === "edit" ? "Edit Category" : "Create Category"}</h3>

      <div className="card">
        <div className="card-body">
          <CategoryForm mode={mode} category={category} context="page" showAfterOptions />
        </div>
      </div>
    </div>
  );
}

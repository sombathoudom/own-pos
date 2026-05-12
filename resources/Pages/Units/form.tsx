import React from "react";
import UnitForm from "./unitform";
import type { Unit } from "@/types/app";

type Props = {
  mode: "create" | "edit";
  unit: Unit | null;
};

export default function FormPage({ mode, unit }: Props) {
  return (
    <div className="container py-4">
      <h3 className="mb-3">{mode === "edit" ? "Edit Unit" : "Create Unit"}</h3>

      <div className="card">
        <div className="card-body">
          <UnitForm mode={mode} unit={unit} context="page" showAfterOptions />
        </div>
      </div>
    </div>
  );
}

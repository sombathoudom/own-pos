import React from "react";
import { Link, router } from "@inertiajs/react";
import IndexToolbar from "../../Components/IndexToolbar";
import Pagination from "../../Components/Pagination";
import type { Unit, LaravelPaginator, IndexFilters } from "@/types/app";

type Props = {
  units: LaravelPaginator<Unit>;
  filters: IndexFilters;
};

export default function Index({ units, filters }: Props) {
  const del = (id: number) => {
    if (!confirm("Delete this unit?")) return;
    router.delete(route("units.destroy", id), { preserveScroll: true });
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h3 className="m-0">Units</h3>
        <Link className="btn btn-primary" href={route("units.create")}>+ Create</Link>
      </div>

      <IndexToolbar indexRouteName="units.index" filters={filters} searchPlaceholder="Search unit name..." />

      <table className="table table-striped">
        <thead><tr><th>ID</th><th>Name</th><th className="text-end">Actions</th></tr></thead>
        <tbody>
          {units.data.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.name}</td>
              <td className="text-end">
                <Link className="btn btn-sm btn-outline-secondary me-2" href={route("units.edit", u.id)}>Edit</Link>
                <button className="btn btn-sm btn-outline-danger" onClick={() => del(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination paginator={units} />
    </div>
  );
}

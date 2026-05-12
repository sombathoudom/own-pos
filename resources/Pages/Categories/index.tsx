import React from "react";
import { Link, router } from "@inertiajs/react";
import IndexToolbar from "../../Components/IndexToolbar";
import Pagination from "../../Components/Pagination";
import type { Category, LaravelPaginator, IndexFilters } from "@/types/app";

type Props = {
  categories: LaravelPaginator<Category>;
  filters: IndexFilters;
};

export default function Index({ categories, filters }: Props) {
  const del = (id: number) => {
    if (!confirm("Delete this category?")) return;
    router.delete(route("categories.destroy", id), { preserveScroll: true });
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h3 className="m-0">Categories</h3>
        <Link className="btn btn-primary" href={route("categories.create")}>+ Create</Link>
      </div>

      <IndexToolbar indexRouteName="categories.index" filters={filters} searchPlaceholder="Search category name..." />

      <table className="table table-striped">
        <thead><tr><th>ID</th><th>Name</th><th className="text-end">Actions</th></tr></thead>
        <tbody>
          {categories.data.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{c.name}</td>
              <td className="text-end">
                <Link className="btn btn-sm btn-outline-secondary me-2" href={route("categories.edit", c.id)}>Edit</Link>
                <button className="btn btn-sm btn-outline-danger" onClick={() => del(c.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Pagination paginator={categories} />
    </div>
  );
}

import React from "react";
import { Link, useForm, usePage } from "@inertiajs/react";

type Role = { id: number; name: string; slug: string };
type UserPayload = { id: number; name: string; email: string; role_ids: number[] };

export default function UserRoles({ user, roles }: { user: UserPayload; roles: Role[] }) {
  const { flash } = usePage().props as any;

  const { data, setData, put, processing } = useForm({
    role_ids: user.role_ids ?? [],
  });

  const toggle = (id: number) => {
    setData("role_ids", data.role_ids.includes(id) ? data.role_ids.filter(x => x !== id) : [...data.role_ids, id]);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route("users.roles.update", user.id));
  };

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h4 className="mb-0">Assign Roles</h4>
          <div className="text-muted">{user.name} ({user.email})</div>
        </div>
        <Link href={route("users.index")} className="btn btn-outline-secondary">Back</Link>
      </div>

      {flash?.success && <div className="alert alert-success">{flash.success}</div>}

      <form onSubmit={submit}>
        <div className="card">
          <div className="card-body">
            <div className="row g-2">
              {roles.map(r => (
                <div className="col-md-4" key={r.id}>
                  <label className="form-check d-flex gap-2 align-items-start">
                    <input
                      type="checkbox"
                      className="form-check-input mt-1"
                      checked={data.role_ids.includes(r.id)}
                      onChange={() => toggle(r.id)}
                    />
                    <span className="form-check-label">
                      <div className="fw-semibold">{r.name}</div>
                      <div className="text-muted"><code>{r.slug}</code></div>
                    </span>
                  </label>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <button className="btn btn-primary" disabled={processing}>
                {processing ? "Saving..." : "Save Roles"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

import React from "react";
import { Link, useForm, usePage } from "@inertiajs/react";

type UserMini = { id: number; name: string; email: string };

export default function Password({ user }: { user: UserMini }) {
  const { flash } = usePage().props as any;

  const { data, setData, put, processing, errors } = useForm({
    password: "",
    password_confirmation: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route("users.password.update", user.id));
  };

  return (
    <div className="page-content">
      <div className="container-fluid">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h4 className="mb-0">Reset Password</h4>
            <div className="text-muted">
              {user.name} ({user.email})
            </div>
          </div>

          <div className="d-flex gap-2">
            <Link href={route("users.edit", user.id)} className="btn btn-outline-secondary">
              Back
            </Link>
          </div>
        </div>

        {flash?.success && <div className="alert alert-success">{flash.success}</div>}
        {flash?.error && <div className="alert alert-danger">{flash.error}</div>}

        <form onSubmit={submit}>
          <div className="card">
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className={`form-control ${errors.password ? "is-invalid" : ""}`}
                  value={data.password}
                  onChange={(e) => setData("password", e.target.value)}
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>

              <div className="mb-0">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  className={`form-control ${errors.password_confirmation ? "is-invalid" : ""}`}
                  value={data.password_confirmation}
                  onChange={(e) => setData("password_confirmation", e.target.value)}
                />
                {errors.password_confirmation && (
                  <div className="invalid-feedback">{errors.password_confirmation}</div>
                )}
              </div>

              <div className="mt-3">
                <button className="btn btn-primary" disabled={processing}>
                  {processing ? "Saving..." : "Reset Password"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

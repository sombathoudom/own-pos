import React, { useState } from "react";
import { Link, useForm, usePage } from "@inertiajs/react";

type Role = {
  id: number;
  name: string;
  code: string;
  is_locked: boolean;
};

type UserPayload = {
  id: number;
  name: string;
  email: string;
  role_ids: number[];
};

export default function UserForm({
  mode,
  user,
  roles,
}: {
  mode: "create" | "edit";
  user: UserPayload | null;
  roles: Role[];
}) {
  const { flash } = usePage().props as any;
  const isEdit = mode === "edit";

  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  const { data, setData, post, put, processing, errors } = useForm({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    password_confirmation: "",
    role_ids: user?.role_ids ?? ([] as number[]),
  });

  const toggleRole = (id: number) => {
    setData(
      "role_ids",
      data.role_ids.includes(id) ? data.role_ids.filter((x) => x !== id) : [...data.role_ids, id]
    );
  };

  const selectAll = () => setData("role_ids", roles.map((r) => r.id));
  const clearAll = () => setData("role_ids", []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) put(route("users.update", user!.id));
    else post(route("users.store"));
  };

  return (
    <div className="page-content">
      <div className="container-fluid">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h4 className="mb-0">{isEdit ? "Edit User" : "Create User"}</h4>
            <div className="text-muted">
              {isEdit ? "Update user profile, roles, and password (optional)" : "Create user and assign roles"}
            </div>
          </div>

          <Link href={route("users.index")} className="btn btn-outline-secondary">
            Back
          </Link>
        </div>

        {flash?.success && <div className="alert alert-success">{flash.success}</div>}
        {flash?.error && <div className="alert alert-danger">{flash.error}</div>}

        <form onSubmit={submit}>
          {/* User information */}
          <div className="card mb-3">
            <div className="card-header">
              <strong>User Information</strong>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input
                  className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                  placeholder="Full name"
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">Email</label>
                <input
                  className={`form-control ${errors.email ? "is-invalid" : ""}`}
                  value={data.email}
                  onChange={(e) => setData("email", e.target.value)}
                  placeholder="user@example.com"
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>

              <div className="row g-2">
                {/* Password */}
                <div className="col-md-6">
                  <label className="form-label">
                    Password{" "}
                    {isEdit ? <span className="text-muted">(leave blank to keep current)</span> : null}
                  </label>

                  <div className="input-group">
                    <input
                      type={showPass ? "text" : "password"}
                      className={`form-control ${errors.password ? "is-invalid" : ""}`}
                      value={data.password}
                      onChange={(e) => setData("password", e.target.value)}
                      placeholder={isEdit ? "Optional (only if changing)" : "Set password"}
                    />

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPass((v) => !v)}
                      aria-label={showPass ? "Hide password" : "Show password"}
                      title={showPass ? "Hide password" : "Show password"}
                    >
                      <i className={showPass ? "ri-eye-off-line" : "ri-eye-line"} />
                    </button>
                  </div>

                  {errors.password ? <div className="invalid-feedback d-block">{errors.password}</div> : null}
                </div>

                {/* Confirm password */}
                <div className="col-md-6">
                  <label className="form-label">Re-password</label>

                  <div className="input-group">
                    <input
                      type={showPass2 ? "text" : "password"}
                      className={`form-control ${errors.password_confirmation ? "is-invalid" : ""}`}
                      value={data.password_confirmation}
                      onChange={(e) => setData("password_confirmation", e.target.value)}
                      placeholder="Confirm password"
                    />

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPass2((v) => !v)}
                      aria-label={showPass2 ? "Hide password" : "Show password"}
                      title={showPass2 ? "Hide password" : "Show password"}
                    >
                      <i className={showPass2 ? "ri-eye-off-line" : "ri-eye-line"} />
                    </button>
                  </div>

                  {errors.password_confirmation ? (
                    <div className="invalid-feedback d-block">{errors.password_confirmation}</div>
                  ) : null}

                  <div className="form-text">
                    {isEdit ? "Only needed when changing password." : "Must match the password."}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Roles */}
          <div className="card mb-3">
            <div className="card-header d-flex align-items-center justify-content-between">
              <strong>Roles</strong>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={selectAll}>
                  Select all
                </button>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearAll}>
                  Clear
                </button>
              </div>
            </div>

            <div className="card-body">
              {errors.role_ids && <div className="alert alert-danger mb-3">{errors.role_ids as any}</div>}

              <div className="row g-2">
                {roles.map((r) => (
                  <div className="col-md-4" key={r.id}>
                    <label className="form-check d-flex align-items-start gap-2">
                      <input
                        type="checkbox"
                        className="form-check-input mt-1"
                        checked={data.role_ids.includes(r.id)}
                        onChange={() => toggleRole(r.id)}
                      />
                      <span className="form-check-label">
                        <div className="fw-semibold">
                          {r.name}
                          {r.is_locked ? (
                            <span className="badge bg-warning-subtle text-warning ms-2">System</span>
                          ) : null}
                        </div>
                        <div className="text-muted">
                          <code>{r.code}</code>
                        </div>
                      </span>
                    </label>
                  </div>
                ))}
              </div>

              {!roles.length && (
                <div className="text-muted">No roles found. Create roles first, then assign them here.</div>
              )}
            </div>
          </div>

          <button className="btn btn-primary" disabled={processing}>
            {processing ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}

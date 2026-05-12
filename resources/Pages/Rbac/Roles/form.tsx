import React from "react";
import { Head, Link, useForm, usePage, router } from "@inertiajs/react";

import Layout from '../../../Layouts';
import BreadCrumb from '../../../Components/Common/BreadCrumb';
import UiContent from "../../../Components/Common/UiContent";

import { Card, Col, Container, Row, Dropdown, FloatingLabel } from 'react-bootstrap';

type Permission = { id: number; key: string; area: string; ability: string; label?: Record<string, string> };
type PermissionsGrouped = Record<string, Permission[]>;

type RolePayload = { id: number; name: string; code: string; is_locked?: boolean; permission_ids: number[] };

export default function Form({
  mode,
  role,
  permissions,
}: {
  mode: "create" | "edit";
  role: RolePayload | null;
  permissions: PermissionsGrouped;
}) {
  const { flash, auth, locale } = usePage().props as any;
  const isEdit = mode === "edit";
  const locked = !!role?.is_locked;

  const { data, setData, post, put, processing, errors } = useForm({
    name: role?.name ?? "",
    code: role?.code ?? "",
    permission_ids: role?.permission_ids ?? ([] as number[]),
  });

  const labelText = (p: Permission) => p.label?.[locale] ?? p.label?.en ?? p.key;

  const toggle = (id: number) => {
    setData("permission_ids",
      data.permission_ids.includes(id)
        ? data.permission_ids.filter((x) => x !== id)
        : [...data.permission_ids, id]
    );
  };

  const toggleGroup = (ids: number[]) => {
    const allOn = ids.every((id) => data.permission_ids.includes(id));
    if (allOn) setData("permission_ids", data.permission_ids.filter((x) => !ids.includes(x)));
    else setData("permission_ids", Array.from(new Set([...data.permission_ids, ...ids])));
  };

  const syncPermissions = () => {
    router.post(route("rbac.sync"), {}, {
      preserveScroll: true,
      onSuccess: () => router.reload({ only: ["permissions"] }),
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) put(route("rbac.roles.update", role!.id));
    else post(route("rbac.roles.store"));
  };

  return (
    <React.Fragment>
      <Head title='Basic Elements | Velzon - React Admin & Dashboard Template' />
      
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Basic Elements" pageTitle="Forms" />

          <Row>
            <Col lg={12}>
              <Card>
                <Card.Header>
                  
                  <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <h4 className="card-title mb-0">{isEdit ? "Edit Product" : "Create Role"}</h4>
          </div>

          <div className="d-flex gap-2">
            {auth?.isSuperAdmin && (
              <button type="button" className="btn btn-outline-secondary" onClick={syncPermissions}>
                Sync Permissions
              </button>
            )}
            <Link href={route("rbac.roles.index")} className="btn btn-outline-secondary">Back</Link>
          </div>
        </div>
                </Card.Header>

                <Card.Body>
<div>
      

        

        {flash?.success && <div className="alert alert-success">{flash.success}</div>}
        {flash?.error && <div className="alert alert-danger">{flash.error}</div>}
        {locked && <div className="alert alert-warning">System role is locked.</div>}

        <form onSubmit={submit}>
          <div className="card mb-3">
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Role Name</label>
                <input
                  className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  value={data.name}
                  onChange={(e) => setData("name", e.target.value)}
                  disabled={locked}
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              <div className="mb-0">
                <label className="form-label">Role Code</label>
                <input
                  className={`form-control ${errors.code ? "is-invalid" : ""}`}
                  value={data.code}
                  onChange={(e) => setData("code", e.target.value)}
                  disabled={locked}
                />
                {errors.code && <div className="invalid-feedback">{errors.code}</div>}
              </div>
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-header d-flex justify-content-between">
              <strong>Permissions</strong>
              <span className="text-muted">Selected: {data.permission_ids.length}</span>
            </div>
            <div className="card-body">
              {Object.keys(permissions).map((area) => {
                const items = permissions[area];
                const ids = items.map((p) => p.id);

                return (
                  <div key={area} className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="fw-semibold text-uppercase">{area}</div>
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => toggleGroup(ids)} disabled={locked}>
                        Toggle module
                      </button>
                    </div>

                    <div className="row g-2">
                      {items.map((p) => (
                        <div className="col-md-4" key={p.id}>
                          <label className="form-check d-flex gap-2 align-items-start">
                            <input
                              type="checkbox"
                              className="form-check-input mt-1"
                              checked={data.permission_ids.includes(p.id)}
                              onChange={() => toggle(p.id)}
                              disabled={locked}
                            />
                            <span className="form-check-label">
                              <div><code>{p.key}</code></div>
                              <div className="text-muted">{labelText(p)}</div>
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button className="btn btn-primary" disabled={processing || locked}>
            {processing ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>

  );
}

Form.layout = (page: any) => <Layout children={page} />;

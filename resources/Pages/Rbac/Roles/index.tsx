import React from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import Layout from "../../../Layouts";
import BreadCrumb from "../../../Components/Common/BreadCrumb";
import {
  Card,
  Col,
  Container,
  Nav,
  Row,
  Modal,
  Form,
  Tab,
  Button,
} from "react-bootstrap";

type Role = { id: number; name: string; code: string; users_count: number; is_locked: boolean };

export default function Index({ roles }: { roles: Role[] }) {
  const { flash, auth } = usePage().props as any;

  return (
    <React.Fragment>
      <Head title="Orders | Velzon - React Admin & Dashboard Template" />
      <div className="page-content">
        <Container fluid>
          <BreadCrumb title="Orders" pageTitle="Ecommerce" />
          <Row>
            <Col lg={12}>
              <Card id="rolelist">
                <Card.Header className="card-header border-0">
                  <Row className="align-items-center gy-3">
                    <div className="col-sm">
                      <h5 className="card-title mb-0">Role</h5>
                    </div>
                    <div className="col-sm-auto">
                      <div className="d-flex gap-1 flex-wrap">

                        {auth?.isSuperAdmin && (
                          <Link href={route("rbac.sync")} method="post" as="button" className="btn btn-outline-secondary">
                            Sync Permissions
                          </Link>
                        )}
                        {" "}
                        <Link href={route("rbac.roles.create")} className="btn btn-success">
                          <i className="ri-add-line align-bottom me-1"></i> Create
                        </Link>
                        

                      </div>
                    </div>
                  </Row>
                </Card.Header>

                <Card.Body className="pt-0">

                  <div>
                   

                    {flash?.success && <div className="alert alert-success">{flash.success}</div>}
                    {flash?.error && <div className="alert alert-danger">{flash.error}</div>}

                    <div className="card">
                      <div className="card-body table-responsive">
                        <table className="table table-striped align-middle mb-0">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Code</th>
                              <th className="text-end">Users</th>
                              <th className="text-end">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {roles.map((r) => (
                              <tr key={r.id}>
                                <td>
                                  {r.name}
                                  {r.is_locked ? <span className="badge bg-warning-subtle text-warning ms-2">System</span> : null}
                                </td>
                                <td><code>{r.code}</code></td>
                                <td className="text-end">{r.users_count}</td>
                                <td className="text-end">
                                  <Link className="btn btn-sm btn-outline-primary me-2" href={route("rbac.roles.edit", r.id)}>
                                    Edit
                                  </Link>
                                  <Link
                                    className="btn btn-sm btn-outline-danger"
                                    href={route("rbac.roles.destroy", r.id)}
                                    method="delete"
                                    as="button"
                                    disabled={r.is_locked}
                                    onBefore={() => confirm("Delete this role?")}
                                  >
                                    Delete
                                  </Link>
                                </td>
                              </tr>
                            ))}
                            {!roles.length && <tr><td colSpan={4} className="text-center py-4">No roles</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>
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

Index.layout = (page: any) => <Layout children={page} />
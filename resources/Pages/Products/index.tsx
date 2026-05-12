import React from "react";
import { Head, Link, router } from "@inertiajs/react";
import IndexToolbar from "../../Components/IndexToolbar";
import Pagination from "../../Components/Pagination";
import { Product, LaravelPaginator, IndexFilters } from "../../types/app";

import Layout from '../../Layouts';
import BreadCrumb from '../../Components/Common/BreadCrumb';
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

type Props = {
  products: LaravelPaginator<Product>;
  filters: IndexFilters;
};

export default function Index({ products, filters }: Props) {
  const del = (id: number) => {
    if (!confirm("Delete this product?")) return;
    router.delete(route("products.destroy", id), { preserveScroll: true });
  };

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
                      <h5 className="card-title mb-0">Product</h5>
                    </div>
                    <div className="col-sm-auto">
                      <div className="d-flex gap-1 flex-wrap">
                        <Link className="btn btn-success" href={route("products.create")}>+ Create</Link>
                       
                      </div>
                    </div>
                  </Row>
                </Card.Header>

                <Card.Body className="pt-0">
                  <div>

                    

                    <IndexToolbar indexRouteName="products.index" filters={filters} searchPlaceholder="Search product name..." />

                    <table className="table table-striped">
                      <thead>
                        <tr><th>ID</th><th>Name</th><th>Category</th><th>Unit</th><th className="text-end">Actions</th></tr>
                      </thead>
                      <tbody>
                        {products.data.map((p) => (
                          <tr key={p.id}>
                            <td>{p.id}</td>
                            <td>{p.name}</td>
                            <td>{p.category?.name ?? "-"}</td>
                            <td>{p.unit?.name ?? "-"}</td>
                            <td className="text-end">
                              <Link className="btn btn-sm btn-outline-secondary me-2" href={route("products.edit", p.id)}>Edit</Link>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => del(p.id)}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <Pagination paginator={products} />
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

Index.layout = (page: any) => <Layout children={page} />;

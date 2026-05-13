import { Head, usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';
import { Card, Col, Container, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';

function ReportsStockValue() {
    const { variantValues, grandTotal } = usePage<{
        variantValues: any[];
        grandTotal: string;
    }>().props;

    return (
        <>
            <Head title="Stock Value Report" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title="Stock Value Report"
                        pageTitle="Reports"
                    />
                    <Row>
                        <Col xs={12}>
                            <Card>
                                <Card.Body>
                                    <h4 className="card-title mb-3">
                                        Remaining Stock Value (FIFO)
                                    </h4>
                                    <Row className="mb-4">
                                        <Col md={4}>
                                            <Card className="bg-soft-primary">
                                                <Card.Body>
                                                    <h5>${grandTotal}</h5>
                                                    <p className="mb-0">
                                                        Total Stock Value
                                                    </p>
                                                </Card.Body>
                                            </Card>
                                        </Col>
                                    </Row>
                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>SKU</th>
                                                <th>Total Qty</th>
                                                <th>Total Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variantValues.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>{item.product_name}</td>
                                                    <td>{item.sku}</td>
                                                    <td>{item.total_qty}</td>
                                                    <td>${item.total_value}</td>
                                                </tr>
                                            ))}
                                            {variantValues.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className="text-center text-muted"
                                                    >
                                                        No stock layers found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

ReportsStockValue.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default ReportsStockValue;

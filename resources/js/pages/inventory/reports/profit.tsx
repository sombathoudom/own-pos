import { Head, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';

function ReportsProfit() {
    const { from, to, productProfits } = usePage<{
        from: string;
        to: string;
        productProfits: any[];
    }>().props;
    const [fromDate, setFromDate] = useState(from);
    const [toDate, setToDate] = useState(to);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            '/reports/profit',
            { from: fromDate, to: toDate },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <>
            <Head title="Profit Report" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Profit Report" pageTitle="Reports" />
                    <Row>
                        <Col xs={12}>
                            <Card>
                                <Card.Body>
                                    <Form
                                        onSubmit={submit}
                                        className="d-flex mb-4 gap-2"
                                    >
                                        <Form.Control
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) =>
                                                setFromDate(e.target.value)
                                            }
                                        />
                                        <Form.Control
                                            type="date"
                                            value={toDate}
                                            onChange={(e) =>
                                                setToDate(e.target.value)
                                            }
                                        />
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                        >
                                            Filter
                                        </button>
                                    </Form>

                                    <h4 className="card-title mb-3">
                                        Product Profit: {from} to {to}
                                    </h4>
                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>SKU</th>
                                                <th>Qty Sold</th>
                                                <th>Revenue</th>
                                                <th>COGS</th>
                                                <th>Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {productProfits.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td>{item.product_name}</td>
                                                    <td>{item.sku}</td>
                                                    <td>{item.qty_sold}</td>
                                                    <td>${item.revenue}</td>
                                                    <td>${item.cogs}</td>
                                                    <td
                                                        className={
                                                            parseFloat(
                                                                item.profit,
                                                            ) >= 0
                                                                ? 'text-success'
                                                                : 'text-danger'
                                                        }
                                                    >
                                                        ${item.profit}
                                                    </td>
                                                </tr>
                                            ))}
                                            {productProfits.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="text-center text-muted"
                                                    >
                                                        No data for selected
                                                        period.
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

ReportsProfit.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default ReportsProfit;

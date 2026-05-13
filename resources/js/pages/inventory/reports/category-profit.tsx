import { Head, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';

function ReportsCategoryProfit() {
    const { from, to, categoryProfits } = usePage<{
        from: string;
        to: string;
        categoryProfits: any[];
    }>().props;
    const [fromDate, setFromDate] = useState(from);
    const [toDate, setToDate] = useState(to);

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            '/reports/category-profit',
            { from: fromDate, to: toDate },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <>
            <Head title="Category Profit Report" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title="Category Profit Report"
                        pageTitle="Reports"
                    />
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
                                        Category Profit: {from} to {to}
                                    </h4>
                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>Category</th>
                                                <th>Qty Sold</th>
                                                <th>Revenue</th>
                                                <th>COGS</th>
                                                <th>Profit</th>
                                                <th>Margin</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categoryProfits.map(
                                                (item: any, idx: number) => {
                                                    const margin =
                                                        parseFloat(
                                                            item.revenue,
                                                        ) > 0
                                                            ? (
                                                                  (parseFloat(
                                                                      item.profit,
                                                                  ) /
                                                                      parseFloat(
                                                                          item.revenue,
                                                                      )) *
                                                                  100
                                                              ).toFixed(1)
                                                            : '0';
                                                    return (
                                                        <tr key={idx}>
                                                            <td className="fw-medium">
                                                                {
                                                                    item.category_name
                                                                }
                                                            </td>
                                                            <td>
                                                                {item.qty_sold}
                                                            </td>
                                                            <td>
                                                                ${item.revenue}
                                                            </td>
                                                            <td>
                                                                ${item.cogs}
                                                            </td>
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
                                                            <td>{margin}%</td>
                                                        </tr>
                                                    );
                                                },
                                            )}
                                            {categoryProfits.length === 0 && (
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

ReportsCategoryProfit.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default ReportsCategoryProfit;

import { Head, Link, usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';
import { Card, Col, Container, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import type { InventoryDailyClosing } from '@/types';

function DailyClosingsShow() {
    const { closing } = usePage<{ closing: InventoryDailyClosing }>().props;

    return (
        <>
            <Head title={`Closing ${closing.closing_date}`} />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title={`Closing ${closing.closing_date}`}
                        pageTitle="Inventory"
                    />
                    <Row>
                        <Col lg={8}>
                            <Card>
                                <Card.Body>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <h4 className="card-title">
                                            Daily Closing:{' '}
                                            {closing.closing_date}
                                        </h4>
                                        <Link
                                            href="/daily-closings"
                                            className="btn btn-light"
                                        >
                                            Back
                                        </Link>
                                    </div>
                                    <Table
                                        responsive
                                        className="table-borderless"
                                    >
                                        <tbody>
                                            <tr>
                                                <td
                                                    className="fw-bold"
                                                    style={{ width: 200 }}
                                                >
                                                    Total Orders
                                                </td>
                                                <td>{closing.total_orders}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">
                                                    Completed
                                                </td>
                                                <td>
                                                    {closing.completed_orders}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">
                                                    Cancelled
                                                </td>
                                                <td>
                                                    {closing.cancelled_orders}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">
                                                    Returned
                                                </td>
                                                <td>
                                                    {closing.returned_orders}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">
                                                    Total Qty Sold
                                                </td>
                                                <td>
                                                    {closing.total_qty_sold}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">
                                                    Gross Sales
                                                </td>
                                                <td>
                                                    ${closing.gross_sales_usd}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">
                                                    Discount
                                                </td>
                                                <td>${closing.discount_usd}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">
                                                    Net Sales
                                                </td>
                                                <td>
                                                    ${closing.net_sales_usd}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">
                                                    Total COGS
                                                </td>
                                                <td>
                                                    ${closing.total_cogs_usd}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">
                                                    Gross Profit
                                                </td>
                                                <td>
                                                    ${closing.gross_profit_usd}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">
                                                    Total Expenses
                                                </td>
                                                <td>
                                                    $
                                                    {closing.total_expenses_usd}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">
                                                    Net Profit
                                                </td>
                                                <td>
                                                    ${closing.net_profit_usd}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">
                                                    Cash USD
                                                </td>
                                                <td>${closing.cash_usd}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">
                                                    Cash KHR
                                                </td>
                                                <td>{closing.cash_khr}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">
                                                    Bank USD
                                                </td>
                                                <td>${closing.bank_usd}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">
                                                    Unpaid
                                                </td>
                                                <td>${closing.unpaid_usd}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">
                                                    Refund
                                                </td>
                                                <td>${closing.refund_usd}</td>
                                            </tr>
                                            <tr>
                                                <td className="fw-bold">
                                                    Note
                                                </td>
                                                <td>{closing.note ?? '-'}</td>
                                            </tr>
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

DailyClosingsShow.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default DailyClosingsShow;

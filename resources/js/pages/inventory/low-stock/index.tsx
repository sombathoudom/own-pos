import { Head, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Badge, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Pagination from '@/Components/Pagination';
import Layout from '@/Layouts';

function LowStockIndex() {
    const { variants, threshold } = usePage<{
        variants: any;
        threshold: number;
    }>().props;
    const [newThreshold, setNewThreshold] = useState(String(threshold));

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            '/low-stock',
            { threshold: newThreshold },
            { preserveScroll: true, preserveState: true },
        );
    };

    return (
        <>
            <Head title="Low Stock Alerts" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title="Low Stock Alerts"
                        pageTitle="Inventory"
                    />
                    <Row>
                        <Col xs={12}>
                            <Card>
                                <Card.Body>
                                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-3 gap-3">
                                        <h4 className="card-title mb-0">
                                            Low Stock Alerts
                                        </h4>
                                        <Form
                                            onSubmit={submit}
                                            className="d-flex gap-2"
                                        >
                                            <Form.Label className="d-flex align-items-center mb-0">
                                                Threshold:
                                            </Form.Label>
                                            <Form.Control
                                                type="number"
                                                min="0"
                                                value={newThreshold}
                                                onChange={(e) =>
                                                    setNewThreshold(
                                                        e.target.value,
                                                    )
                                                }
                                                style={{ width: 80 }}
                                            />
                                            <button
                                                type="submit"
                                                className="btn btn-light"
                                            >
                                                Update
                                            </button>
                                        </Form>
                                    </div>
                                    <Table responsive className="align-middle">
                                        <thead>
                                            <tr>
                                                <th>SKU</th>
                                                <th>Product</th>
                                                <th>Size</th>
                                                <th>Color</th>
                                                <th>Stock On Hand</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variants.data.map(
                                                (variant: any) => (
                                                    <tr key={variant.id}>
                                                        <td>{variant.sku}</td>
                                                        <td>
                                                            {
                                                                variant.product
                                                                    ?.name
                                                            }
                                                        </td>
                                                        <td>{variant.size}</td>
                                                        <td>
                                                            {variant.color ??
                                                                '-'}
                                                        </td>
                                                        <td>
                                                            <Badge
                                                                bg={
                                                                    variant
                                                                        .stock_balance
                                                                        ?.qty_on_hand <=
                                                                    5
                                                                        ? 'danger'
                                                                        : variant
                                                                                .stock_balance
                                                                                ?.qty_on_hand <=
                                                                            10
                                                                          ? 'warning'
                                                                          : 'success'
                                                                }
                                                            >
                                                                {variant
                                                                    .stock_balance
                                                                    ?.qty_on_hand ??
                                                                    0}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <Badge
                                                                bg={
                                                                    variant.status ===
                                                                    'active'
                                                                        ? 'success'
                                                                        : 'secondary'
                                                                }
                                                            >
                                                                {variant.status}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                            {variants.data.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={6}
                                                        className="py-4 text-center text-muted"
                                                    >
                                                        No low stock items
                                                        found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                    <Pagination paginator={variants} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

LowStockIndex.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default LowStockIndex;

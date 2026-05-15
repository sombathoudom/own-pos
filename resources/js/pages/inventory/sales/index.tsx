import { Head, Link, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
    Table,
} from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Pagination from '@/Components/Pagination';
import Layout from '@/Layouts';
import { store as storeConfirmDelivery } from '@/routes/sales/confirm-delivery';
import {
    create as salesCreate,
    show as salesShow,
    index as salesIndex,
} from '@/routes/sales';
import type { SaleIndexPageProps } from '@/types';

function SalesIndex() {
    const { sales, filters, toast } = usePage<SaleIndexPageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [confirmingSaleId, setConfirmingSaleId] = useState<number | null>(
        null,
    );

    useEffect(() => {
        setSearch(filters.search ?? '');
    }, [filters.search]);

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            salesIndex.url(),
            { search: search || undefined },
            { preserveState: true, preserveScroll: true },
        );
    };

    const paymentBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return 'success-subtle text-success';
            case 'partial':
                return 'warning-subtle text-warning';
            default:
                return 'danger-subtle text-danger';
        }
    };

    const orderBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
            case 'completed':
                return 'success-subtle text-success';
            case 'cancelled':
                return 'danger-subtle text-danger';
            case 'returned':
                return 'dark-subtle text-dark';
            default:
                return 'primary-subtle text-primary';
        }
    };

    const canConfirmDelivery = (
        sale: SaleIndexPageProps['sales']['data'][number],
    ) => {
        return (
            sale.delivery_completed_date === null &&
            sale.order_status !== 'cancelled' &&
            sale.order_status !== 'returned'
        );
    };

    const handleDeliveredAll = (
        sale: SaleIndexPageProps['sales']['data'][number],
    ) => {
        setConfirmingSaleId(sale.id);

        router.post(
            storeConfirmDelivery.url(sale.id),
            {
                confirmation_date: new Date().toISOString().split('T')[0],
                status: 'delivered',
                items: sale.items.map((item) => ({
                    sale_item_id: item.id,
                    accepted_qty: item.qty,
                    changed_qty: 0,
                })),
                added_items: [],
                final_delivery_fee_usd: sale.customer_delivery_fee_usd ?? '0',
                actual_delivery_cost_usd: sale.actual_delivery_cost_usd ?? '0',
            },
            {
                preserveScroll: true,
                onFinish: () => setConfirmingSaleId(null),
            },
        );
    };

    return (
        <>
            <Head title="Sales" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Sales" pageTitle="Inventory" />

                    {toast && (
                        <Alert
                            variant={
                                toast.type === 'error' ? 'danger' : toast.type
                            }
                            className="mb-3"
                        >
                            {toast.message}
                        </Alert>
                    )}

                    <Row>
                        <Col lg={12}>
                            <Card>
                                <Card.Header className="card-header border-0">
                                    <Row className="align-items-center gy-3">
                                        <div className="col-sm">
                                            <h5 className="card-title mb-0">
                                                Sales
                                            </h5>
                                        </div>
                                        <div className="col-sm-auto">
                                            <div className="d-flex flex-wrap gap-1">
                                                <Form
                                                    onSubmit={handleSearch}
                                                    className="d-flex gap-2"
                                                >
                                                    <Form.Control
                                                        type="search"
                                                        placeholder="Search invoice or customer..."
                                                        value={search}
                                                        onChange={(e) =>
                                                            setSearch(
                                                                e.target.value,
                                                            )
                                                        }
                                                        style={{
                                                            minWidth: 220,
                                                        }}
                                                    />
                                                    <Button
                                                        type="submit"
                                                        variant="light"
                                                    >
                                                        Search
                                                    </Button>
                                                    {search && (
                                                        <Button
                                                            type="button"
                                                            variant="light"
                                                            onClick={() => {
                                                                setSearch('');
                                                                router.get(
                                                                    salesIndex.url(),
                                                                    {},
                                                                    {
                                                                        preserveScroll: true,
                                                                        preserveState: true,
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            Clear
                                                        </Button>
                                                    )}
                                                </Form>
                                                <Link
                                                    className="btn btn-success"
                                                    href={salesCreate.url()}
                                                >
                                                    + New Sale
                                                </Link>
                                            </div>
                                        </div>
                                    </Row>
                                </Card.Header>

                                <Card.Body className="pt-0">
                                    <Table className="table-striped" responsive>
                                        <thead>
                                            <tr>
                                                <th>Invoice #</th>
                                                <th>Customer</th>
                                                <th>Source</th>
                                                <th>Date</th>
                                                <th>Items</th>
                                                <th>Total</th>
                                                <th>Payment</th>
                                                <th>Status</th>
                                                <th className="text-end">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sales.data.map((sale) => (
                                                <tr key={sale.id}>
                                                    <td className="fw-medium">
                                                        {sale.invoice_no}
                                                    </td>
                                                    <td>
                                                        {sale.customer_name ||
                                                            '-'}
                                                        {sale.customer_phone && (
                                                            <div className="small text-muted">
                                                                {
                                                                    sale.customer_phone
                                                                }
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <Badge
                                                            bg="light"
                                                            text="dark"
                                                        >
                                                            {sale.source_page ||
                                                                'Other'}
                                                        </Badge>
                                                    </td>
                                                    <td>{sale.sale_date}</td>
                                                    <td>{sale.items.length}</td>
                                                    <td>
                                                        $
                                                        {Number(
                                                            sale.total_usd,
                                                        ).toFixed(2)}
                                                    </td>
                                                    <td>
                                                        <Badge
                                                            bg={paymentBadge(
                                                                sale.payment_status,
                                                            )}
                                                        >
                                                            {
                                                                sale.payment_status
                                                            }
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        <Badge
                                                            bg={orderBadge(
                                                                sale.order_status,
                                                            )}
                                                        >
                                                            {sale.order_status}
                                                        </Badge>
                                                    </td>
                                                    <td className="text-end">
                                                        <div className="d-inline-flex justify-content-end flex-wrap gap-1">
                                                            {canConfirmDelivery(
                                                                sale,
                                                            ) && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="success"
                                                                    disabled={
                                                                        confirmingSaleId ===
                                                                        sale.id
                                                                    }
                                                                    onClick={() =>
                                                                        handleDeliveredAll(
                                                                            sale,
                                                                        )
                                                                    }
                                                                >
                                                                    {confirmingSaleId ===
                                                                    sale.id
                                                                        ? '...'
                                                                        : 'Delivered All'}
                                                                </Button>
                                                            )}
                                                            <Link
                                                                className="btn btn-sm btn-outline-secondary"
                                                                href={salesShow.url(
                                                                    {
                                                                        sale: sale.id,
                                                                    },
                                                                )}
                                                            >
                                                                View
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {sales.data.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={9}
                                                        className="py-4 text-center text-muted"
                                                    >
                                                        No sales found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>

                                    <Pagination paginator={sales} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

SalesIndex.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default SalesIndex;

import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
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
import {
    bulkDeliveredAll as salesBulkDeliveredAll,
    edit as salesEdit,
    create as salesCreate,
    receipt as salesReceipt,
    show as salesShow,
    index as salesIndex,
} from '@/routes/sales';
import { store as storeConfirmDelivery } from '@/routes/sales/confirm-delivery';
import type { SaleIndexPageProps } from '@/types';
import { getCurrentDate } from '@/utils/dateTime';

function SalesIndex() {
    const { sales, filters, toast } = usePage<SaleIndexPageProps>().props;
    const [search, setSearch] = useState(filters.search ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [paymentStatus, setPaymentStatus] = useState(
        filters.payment_status ?? '',
    );
    const [confirmingSaleId, setConfirmingSaleId] = useState<number | null>(
        null,
    );
    const [selectedSaleIds, setSelectedSaleIds] = useState<number[]>([]);

    useEffect(() => {
        setSearch(filters.search ?? '');
        setDateFrom(filters.date_from ?? '');
        setDateTo(filters.date_to ?? '');
        setPaymentStatus(filters.payment_status ?? '');
    }, [
        filters.search,
        filters.date_from,
        filters.date_to,
        filters.payment_status,
    ]);

    const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            salesIndex.url(),
            {
                search: search || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                payment_status: paymentStatus || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const clearFilters = () => {
        setSearch('');
        setDateFrom('');
        setDateTo('');
        setPaymentStatus('');
        router.get(
            salesIndex.url(),
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    const hasActiveFilters = search || dateFrom || dateTo || paymentStatus;

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
                redirect_to: 'index',
                redirect_page: sales.current_page,
                redirect_filters: {
                    search: filters.search,
                    date_from: filters.date_from,
                    date_to: filters.date_to,
                    payment_status: filters.payment_status,
                },
                confirmation_date: getCurrentDate(),
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
                preserveState: true,
                onFinish: () => setConfirmingSaleId(null),
            },
        );
    };

    const deliverableSaleIds = sales.data
        .filter((sale) => canConfirmDelivery(sale))
        .map((sale) => sale.id);

    const allDeliverableSelected =
        deliverableSaleIds.length > 0 &&
        deliverableSaleIds.every((saleId) => selectedSaleIds.includes(saleId));

    const toggleSaleSelection = (saleId: number) => {
        setSelectedSaleIds((current) =>
            current.includes(saleId)
                ? current.filter((id) => id !== saleId)
                : [...current, saleId],
        );
    };

    const toggleSelectAllDeliverable = () => {
        setSelectedSaleIds((current) =>
            allDeliverableSelected
                ? current.filter((id) => !deliverableSaleIds.includes(id))
                : Array.from(new Set([...current, ...deliverableSaleIds])),
        );
    };

    const handleBulkDeliveredAll = () => {
        if (selectedSaleIds.length === 0) {
            return;
        }

        router.post(
            salesBulkDeliveredAll.url(),
            {
                sale_ids: selectedSaleIds,
            },
            {
                preserveScroll: true,
                onSuccess: () => setSelectedSaleIds([]),
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
                                                {deliverableSaleIds.length >
                                                    0 && (
                                                    <Button
                                                        type="button"
                                                        variant="primary"
                                                        disabled={
                                                            selectedSaleIds.length ===
                                                            0
                                                        }
                                                        onClick={
                                                            handleBulkDeliveredAll
                                                        }
                                                    >
                                                        Delivered Selected (
                                                        {selectedSaleIds.length}
                                                        )
                                                    </Button>
                                                )}
                                                <Link
                                                    className="btn btn-success"
                                                    href={salesCreate.url()}
                                                >
                                                    + New Sale
                                                </Link>
                                            </div>
                                        </div>
                                    </Row>

                                    {/* Filters */}
                                    <Row className="mt-3">
                                        <Col>
                                            <Form
                                                onSubmit={handleSearch}
                                                className="d-flex align-items-end flex-wrap gap-2"
                                            >
                                                <div>
                                                    <Form.Label className="small mb-1">
                                                        Search
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="search"
                                                        placeholder="Invoice or customer..."
                                                        value={search}
                                                        onChange={(e) =>
                                                            setSearch(
                                                                e.target.value,
                                                            )
                                                        }
                                                        style={{
                                                            minWidth: 200,
                                                        }}
                                                    />
                                                </div>
                                                <div style={{ minWidth: 150 }}>
                                                    <Form.Label className="small mb-1">
                                                        Date From
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        id="dateFrom"
                                                        value={dateFrom}
                                                        onChange={(e) =>
                                                            setDateFrom(
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div style={{ minWidth: 150 }}>
                                                    <Form.Label className="small mb-1">
                                                        Date To
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        id="dateTo"
                                                        value={dateTo}
                                                        onChange={(e) =>
                                                            setDateTo(
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </div>
                                                <div style={{ minWidth: 140 }}>
                                                    <Form.Label className="small mb-1">
                                                        Payment Status
                                                    </Form.Label>
                                                    <Form.Select
                                                        value={paymentStatus}
                                                        onChange={(e) =>
                                                            setPaymentStatus(
                                                                e.target.value,
                                                            )
                                                        }
                                                    >
                                                        <option value="">
                                                            All
                                                        </option>
                                                        <option value="paid">
                                                            Paid
                                                        </option>
                                                        <option value="partial">
                                                            Partial
                                                        </option>
                                                        <option value="unpaid">
                                                            Unpaid
                                                        </option>
                                                    </Form.Select>
                                                </div>
                                                <Button
                                                    type="submit"
                                                    variant="primary"
                                                >
                                                    Filter
                                                </Button>
                                                {hasActiveFilters && (
                                                    <Button
                                                        type="button"
                                                        variant="light"
                                                        onClick={clearFilters}
                                                    >
                                                        Clear All
                                                    </Button>
                                                )}
                                            </Form>
                                        </Col>
                                    </Row>
                                </Card.Header>

                                <Card.Body className="pt-0">
                                    <Table className="table-striped" responsive>
                                        <thead>
                                            <tr>
                                                <th
                                                    className="text-center"
                                                    style={{ width: 44 }}
                                                >
                                                    <Form.Check
                                                        type="checkbox"
                                                        checked={
                                                            allDeliverableSelected
                                                        }
                                                        onChange={
                                                            toggleSelectAllDeliverable
                                                        }
                                                        disabled={
                                                            deliverableSaleIds.length ===
                                                            0
                                                        }
                                                    />
                                                </th>
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
                                                    <td className="text-center">
                                                        <Form.Check
                                                            type="checkbox"
                                                            checked={selectedSaleIds.includes(
                                                                sale.id,
                                                            )}
                                                            disabled={
                                                                !canConfirmDelivery(
                                                                    sale,
                                                                )
                                                            }
                                                            onChange={() =>
                                                                toggleSaleSelection(
                                                                    sale.id,
                                                                )
                                                            }
                                                        />
                                                    </td>
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
                                                    <td>
                                                        {sale.items.reduce(
                                                            (sum, item) =>
                                                                sum +
                                                                Number(
                                                                    item.qty ||
                                                                        0,
                                                                ),
                                                            0,
                                                        )}
                                                    </td>
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
                                                            <a
                                                                className="btn btn-sm btn-outline-dark"
                                                                href={salesReceipt.url(
                                                                    {
                                                                        sale: sale.id,
                                                                    },
                                                                )}
                                                            >
                                                                Receipt
                                                            </a>
                                                            <Link
                                                                className="btn btn-sm btn-outline-secondary"
                                                                href={salesEdit.url(
                                                                    {
                                                                        sale: sale.id,
                                                                    },
                                                                )}
                                                            >
                                                                Edit
                                                            </Link>
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
                                                        colSpan={10}
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

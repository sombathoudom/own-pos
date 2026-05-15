import { Head, Link, router, usePage } from '@inertiajs/react';
import { type ReactNode, useEffect, useState } from 'react';
import { Badge, Button, Card, Container, Form, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Pagination from '@/Components/Pagination';
import Layout from '@/Layouts';
import {
    index as stockIndex,
    movements as stockMovements,
} from '@/routes/stock';
import type {
    InventoryStockMovement,
    StockMovementIndexPageProps,
} from '@/types';
import { formatDateTime } from '@/utils/dateTime';

const TYPE_OPTIONS = [
    { value: '', label: 'All Types' },
    { value: 'purchase', label: 'Purchase' },
    { value: 'sale', label: 'Sale' },
];

function StockMovements() {
    const { movements, filters } = usePage<StockMovementIndexPageProps>().props;
    const [variantId, setVariantId] = useState(
        filters.product_variant_id ?? '',
    );
    const [type, setType] = useState(filters.type ?? '');

    useEffect(() => {
        setVariantId(filters.product_variant_id ?? '');
        setType(filters.type ?? '');
    }, [filters.product_variant_id, filters.type]);

    const handleFilter = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            stockMovements.url(),
            {
                product_variant_id: variantId || undefined,
                type: type || undefined,
            },
            { preserveScroll: true, preserveState: true },
        );
    };

    const typeBadge = (qtyChange: number) => {
        if (qtyChange > 0)
            return (
                <Badge bg="success">
                    <i className="ri-arrow-down-line me-1" />
                    Inbound
                </Badge>
            );
        return (
            <Badge bg="danger">
                <i className="ri-arrow-up-line me-1" />
                Outbound
            </Badge>
        );
    };

    const referenceLabel = (movement: InventoryStockMovement) => {
        if (!movement.reference) return '—';

        const { type: refType, label } = movement.reference;
        if (!label) return '—';

        if (refType === 'Purchase') {
            return (
                <span className="text-primary">
                    <i className="ri-shopping-cart-line me-1" />
                    {label}
                </span>
            );
        }

        if (refType === 'Sale') {
            return (
                <span className="text-success">
                    <i className="ri-bill-line me-1" />
                    {label}
                </span>
            );
        }

        return label;
    };

    return (
        <>
            <Head title="Stock Movements" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Stock Movements" pageTitle="Inventory" />

                    <Card>
                        <Card.Header className="d-flex align-items-center justify-content-between">
                            <h5 className="card-title mb-0">Stock Movements</h5>
                            <Link
                                href={stockIndex.url()}
                                className="btn btn-sm btn-outline-primary"
                            >
                                <i className="ri-archive-line me-1" />
                                Stock Balances
                            </Link>
                        </Card.Header>
                        <Card.Body>
                            <Form
                                onSubmit={handleFilter}
                                className="d-flex mb-3 flex-wrap gap-2"
                            >
                                <Form.Control
                                    placeholder="Filter by Variant ID..."
                                    type="number"
                                    value={variantId}
                                    onChange={(e) =>
                                        setVariantId(e.target.value)
                                    }
                                    style={{ maxWidth: 180 }}
                                />
                                <Form.Select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    style={{ maxWidth: 160 }}
                                >
                                    {TYPE_OPTIONS.map((opt) => (
                                        <option
                                            key={opt.value}
                                            value={opt.value}
                                        >
                                            {opt.label}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Button type="submit" variant="primary">
                                    <i className="ri-filter-search-line me-1" />
                                    Filter
                                </Button>
                                {(variantId || type) && (
                                    <Button
                                        type="button"
                                        variant="light"
                                        onClick={() => {
                                            setVariantId('');
                                            setType('');
                                            router.get(
                                                stockMovements.url(),
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

                            <div className="table-responsive">
                                <Table
                                    hover
                                    className="table-nowrap align-middle"
                                >
                                    <thead className="table-light">
                                        <tr>
                                            <th>Type</th>
                                            <th>SKU</th>
                                            <th>Product</th>
                                            <th className="text-end">
                                                Qty Change
                                            </th>
                                            <th className="text-end">
                                                Unit Cost
                                            </th>
                                            <th>Reference</th>
                                            <th>Note</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {movements.data.map((movement) => (
                                            <tr key={movement.id}>
                                                <td>
                                                    {typeBadge(
                                                        movement.qty_change,
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="fw-medium">
                                                        {movement.productVariant
                                                            ?.sku || '—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {movement.productVariant
                                                        ?.product?.name || '—'}
                                                    <div className="small text-muted">
                                                        {movement.productVariant
                                                            ?.color && (
                                                            <>
                                                                {
                                                                    movement
                                                                        .productVariant
                                                                        .color
                                                                }{' '}
                                                                ·{' '}
                                                            </>
                                                        )}
                                                        {
                                                            movement
                                                                .productVariant
                                                                ?.size
                                                        }
                                                    </div>
                                                </td>
                                                <td
                                                    className={`fw-bold text-end ${
                                                        movement.qty_change > 0
                                                            ? 'text-success'
                                                            : 'text-danger'
                                                    }`}
                                                >
                                                    {movement.qty_change > 0
                                                        ? '+'
                                                        : ''}
                                                    {movement.qty_change}
                                                </td>
                                                <td className="text-end">
                                                    $
                                                    {Number(
                                                        movement.unit_cost_usd,
                                                    ).toFixed(2)}
                                                </td>
                                                <td>
                                                    {referenceLabel(movement)}
                                                </td>
                                                <td>
                                                    <span className="small text-muted">
                                                        {movement.note || '—'}
                                                    </span>
                                                </td>
                                                <td className="small text-nowrap">
                                                    {formatDateTime(
                                                        movement.created_at,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        {movements.data.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={8}
                                                    className="py-4 text-center text-muted"
                                                >
                                                    <i className="ri-inbox-line fs-2 d-block mb-2" />
                                                    No movements found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>

                            <Pagination paginator={movements} />
                        </Card.Body>
                    </Card>
                </Container>
            </div>
        </>
    );
}

StockMovements.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default StockMovements;

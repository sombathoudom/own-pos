import { Head, Link, router, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
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

function StockMovements() {
    const { movements, filters } = usePage<StockMovementIndexPageProps>().props;
    const [variantId, setVariantId] = useState(
        filters.product_variant_id ?? '',
    );

    useEffect(() => {
        setVariantId(filters.product_variant_id ?? '');
    }, [filters.product_variant_id]);

    const handleFilter = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        router.get(
            stockMovements.url(),
            { product_variant_id: variantId || undefined },
            { preserveScroll: true, preserveState: true },
        );
    };

    const typeBadge = (qtyChange: number) => {
        if (qtyChange > 0) return <Badge bg="success">Inbound</Badge>;
        return <Badge bg="danger">Outbound</Badge>;
    };

    const referenceLabel = (movement: InventoryStockMovement) => {
        if (movement.reference?.purchase_no)
            return movement.reference.purchase_no;
        return '—';
    };

    return (
        <>
            <Head title="Stock Movements" />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb title="Stock Movements" pageTitle="Inventory" />

                    <Card>
                        <Card.Body>
                            <div className="d-flex align-items-center justify-content-between mb-3">
                                <Form
                                    onSubmit={handleFilter}
                                    className="d-flex gap-2"
                                    style={{ maxWidth: 400 }}
                                >
                                    <Form.Control
                                        placeholder="Filter by Variant ID..."
                                        type="number"
                                        value={variantId}
                                        onChange={(e) =>
                                            setVariantId(e.target.value)
                                        }
                                    />
                                    <Button type="submit" variant="primary">
                                        Filter
                                    </Button>
                                    {variantId && (
                                        <Link
                                            href={stockMovements.url()}
                                            className="btn btn-outline-secondary"
                                        >
                                            Clear
                                        </Link>
                                    )}
                                </Form>

                                <Link
                                    href={stockIndex.url()}
                                    className="btn btn-outline-primary"
                                >
                                    Stock Balances
                                </Link>
                            </div>

                            <Table
                                responsive
                                striped
                                hover
                                className="align-middle"
                            >
                                <thead>
                                    <tr>
                                        <th>Type</th>
                                        <th>SKU</th>
                                        <th>Product</th>
                                        <th>Qty Change</th>
                                        <th>Unit Cost</th>
                                        <th>Reference</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movements.data.map((movement) => (
                                        <tr key={movement.id}>
                                            <td>
                                                {typeBadge(movement.qty_change)}
                                            </td>
                                            <td>
                                                {movement.productVariant?.sku ||
                                                    '—'}
                                            </td>
                                            <td>
                                                {movement.productVariant
                                                    ?.product?.name || '—'}
                                            </td>
                                            <td
                                                className={
                                                    movement.qty_change > 0
                                                        ? 'text-success'
                                                        : 'text-danger'
                                                }
                                            >
                                                {movement.qty_change > 0
                                                    ? '+'
                                                    : ''}
                                                {movement.qty_change}
                                            </td>
                                            <td>
                                                $
                                                {Number(
                                                    movement.unit_cost_usd,
                                                ).toFixed(2)}
                                            </td>
                                            <td>{referenceLabel(movement)}</td>
                                            <td>{movement.created_at}</td>
                                        </tr>
                                    ))}
                                    {movements.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="text-center text-muted"
                                            >
                                                No movements found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>

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

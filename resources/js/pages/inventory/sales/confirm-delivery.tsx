import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type ReactNode } from 'react';
import {
    Alert,
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
    Table,
} from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import { store as storeConfirmDelivery } from '@/routes/sales/confirm-delivery';
import { show as showSale } from '@/routes/sales';
import { getCurrentDate } from '@/utils/dateTime';

type VariantOption = {
    id: number;
    sku: string;
    size: string;
    sale_price_usd: string;
    stock_on_hand: number;
    product: {
        name: string | null;
    };
};

type DeliveryItemForm = {
    sale_item_id: number;
    accepted_qty: string;
    changed_qty: string;
    new_variant_id: string;
    new_unit_price: string;
    note: string;
};

type AddedItemForm = {
    product_variant_id: string;
    qty: string;
    unit_price_usd: string;
    note: string;
};

function ConfirmDeliveryPage() {
    const { sale, variants } = usePage<{
        sale: {
            id: number;
            invoice_no: string;
            sale_date: string;
            customer_name: string | null;
            discount_usd: string;
            subtotal_usd: string;
            customer_delivery_fee_usd: string;
            actual_delivery_cost_usd: string;
            order_status: string;
            delivery_completed_date: string | null;
            has_delivery_confirmation: boolean;
            delivery: {
                customer_delivery_fee_usd: string;
                actual_delivery_cost_usd: string;
                delivery_status: string;
            } | null;
            items: Array<{
                id: number;
                qty: number;
                unit_price_usd: string;
                product_variant: {
                    id: number;
                    sku: string | null;
                    color: string | null;
                    size: string | null;
                    product_name: string | null;
                } | null;
            }>;
        };
        variants: VariantOption[];
    }>().props;

    const { data, setData, post, processing, errors } = useForm({
        confirmation_date: getCurrentDate(),
        status: 'delivered',
        items: sale.items.map<DeliveryItemForm>((item) => ({
            sale_item_id: item.id,
            accepted_qty: String(item.qty),
            changed_qty: '0',
            new_variant_id: '',
            new_unit_price: '',
            note: '',
        })),
        added_items: [] as AddedItemForm[],
        final_delivery_fee_usd:
            sale.delivery?.customer_delivery_fee_usd ??
            sale.customer_delivery_fee_usd,
        actual_delivery_cost_usd:
            sale.delivery?.actual_delivery_cost_usd ??
            sale.actual_delivery_cost_usd,
        delivery_fee_note: '',
        note: '',
    });
    const generalError = (errors as Record<string, string | undefined>).general;

    const updateItem = (
        index: number,
        field: keyof DeliveryItemForm,
        value: string,
    ) => {
        const originalQty = sale.items[index]?.qty ?? 0;

        setData(
            'items',
            data.items.map((item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }

                const updatedItem = { ...item, [field]: value };
                const acceptedQty = Math.max(
                    0,
                    Number(updatedItem.accepted_qty) || 0,
                );
                const changedQty = Math.max(
                    0,
                    Number(updatedItem.changed_qty) || 0,
                );

                if (field === 'changed_qty') {
                    updatedItem.accepted_qty = String(
                        Math.min(acceptedQty, originalQty - changedQty),
                    );
                }

                if (field === 'accepted_qty') {
                    updatedItem.changed_qty = String(
                        Math.min(changedQty, originalQty - acceptedQty),
                    );
                }

                return updatedItem;
            }),
        );
    };

    const updateAddedItem = (
        index: number,
        field: keyof AddedItemForm,
        value: string,
    ) => {
        setData(
            'added_items',
            data.added_items.map((item, itemIndex) =>
                itemIndex === index ? { ...item, [field]: value } : item,
            ),
        );
    };

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(storeConfirmDelivery.url(sale.id));
    };

    return (
        <>
            <Head title={`Confirm Delivery - ${sale.invoice_no}`} />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title={`Confirm Delivery: ${sale.invoice_no}`}
                        pageTitle="Sales"
                    />

                    <Row>
                        <Col xl={8}>
                            <Card className="mb-3">
                                <Card.Body>
                                    <div className="d-flex align-items-start justify-content-between mb-3">
                                        <div>
                                            <h4 className="card-title mb-1">
                                                {sale.invoice_no}
                                            </h4>
                                            <p className="mb-0 text-muted">
                                                {sale.customer_name ||
                                                    'Walk-in'}
                                                {' · '}
                                                {sale.sale_date}
                                            </p>
                                        </div>
                                        <div className="small text-end text-muted">
                                            <div>
                                                Original subtotal: $
                                                {Number(
                                                    sale.subtotal_usd,
                                                ).toFixed(2)}
                                            </div>
                                            <div>
                                                Original delivery fee: $
                                                {Number(
                                                    sale.customer_delivery_fee_usd,
                                                ).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    {(sale.delivery_completed_date ||
                                        sale.has_delivery_confirmation) && (
                                        <Alert
                                            variant="warning"
                                            className="mb-0"
                                        >
                                            Delivery has already been confirmed
                                            for this sale.
                                        </Alert>
                                    )}
                                </Card.Body>
                            </Card>

                            <Card>
                                <Card.Body>
                                    {generalError && (
                                        <Alert variant="danger">
                                            {generalError}
                                        </Alert>
                                    )}

                                    <Form onSubmit={submit}>
                                        <Row className="mb-3">
                                            <Col md={4}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Confirmation Date
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={
                                                            data.confirmation_date
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'confirmation_date',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Status
                                                    </Form.Label>
                                                    <Form.Select
                                                        value={data.status}
                                                        onChange={(e) => {
                                                            const newStatus =
                                                                e.target.value;
                                                            setData(
                                                                'status',
                                                                newStatus,
                                                            );

                                                            // Auto-reject all items when cancelled or failed
                                                            if (
                                                                newStatus ===
                                                                    'cancelled_at_door' ||
                                                                newStatus ===
                                                                    'failed_delivery'
                                                            ) {
                                                                setData(
                                                                    'items',
                                                                    data.items.map(
                                                                        (
                                                                            item,
                                                                        ) => ({
                                                                            ...item,
                                                                            accepted_qty:
                                                                                '0',
                                                                            changed_qty:
                                                                                '0',
                                                                        }),
                                                                    ),
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <option value="delivered">
                                                            Delivered all
                                                        </option>
                                                        <option value="partially_delivered">
                                                            Partially delivered
                                                        </option>
                                                        <option value="changed_items">
                                                            Changed item
                                                        </option>
                                                        <option value="added_items">
                                                            Added item
                                                        </option>
                                                        <option value="cancelled_at_door">
                                                            Cancelled at door
                                                        </option>
                                                        <option value="failed_delivery">
                                                            Failed delivery
                                                        </option>
                                                    </Form.Select>
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Final Delivery Fee (USD)
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={
                                                            data.final_delivery_fee_usd
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'final_delivery_fee_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row className="mb-3">
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Actual Delivery Cost
                                                        (USD)
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={
                                                            data.actual_delivery_cost_usd
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'actual_delivery_cost_usd',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Delivery Fee Note
                                                    </Form.Label>
                                                    <Form.Control
                                                        value={
                                                            data.delivery_fee_note
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'delivery_fee_note',
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Why did delivery fee change?"
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <h5 className="mb-3">Original Items</h5>
                                        <Table
                                            responsive
                                            className="align-middle"
                                        >
                                            <thead>
                                                <tr>
                                                    <th>Item</th>
                                                    <th className="text-center">
                                                        Original Qty
                                                    </th>
                                                    <th className="text-center">
                                                        Accepted Same
                                                    </th>
                                                    <th className="text-center">
                                                        Changed Qty
                                                    </th>
                                                    <th>Replacement Variant</th>
                                                    <th>Replacement Price</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sale.items.map(
                                                    (item, index) => {
                                                        const formItem =
                                                            data.items[index];
                                                        const acceptedQty =
                                                            Number(
                                                                formItem.accepted_qty,
                                                            ) || 0;
                                                        const changedQty =
                                                            Number(
                                                                formItem.changed_qty,
                                                            ) || 0;
                                                        const rejectedQty =
                                                            Math.max(
                                                                0,
                                                                item.qty -
                                                                    acceptedQty -
                                                                    changedQty,
                                                            );

                                                        return (
                                                            <tr key={item.id}>
                                                                <td>
                                                                    <div className="fw-medium">
                                                                        {item
                                                                            .product_variant
                                                                            ?.product_name ||
                                                                            item
                                                                                .product_variant
                                                                                ?.sku}
                                                                    </div>
                                                                    <div className="small text-muted">
                                                                        {
                                                                            item
                                                                                .product_variant
                                                                                ?.color
                                                                        }{' '}
                                                                        /{' '}
                                                                        {
                                                                            item
                                                                                .product_variant
                                                                                ?.size
                                                                        }
                                                                    </div>
                                                                </td>
                                                                <td className="text-center">
                                                                    {item.qty}
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        width: 120,
                                                                    }}
                                                                >
                                                                    <Form.Control
                                                                        type="number"
                                                                        min="0"
                                                                        max={Math.max(
                                                                            0,
                                                                            item.qty -
                                                                                changedQty,
                                                                        )}
                                                                        value={
                                                                            formItem.accepted_qty
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                'accepted_qty',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                    />
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        width: 120,
                                                                    }}
                                                                >
                                                                    <Form.Control
                                                                        type="number"
                                                                        min="0"
                                                                        max={Math.max(
                                                                            0,
                                                                            item.qty -
                                                                                acceptedQty,
                                                                        )}
                                                                        value={
                                                                            formItem.changed_qty
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                'changed_qty',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                    />
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        minWidth: 240,
                                                                    }}
                                                                >
                                                                    <Form.Select
                                                                        value={
                                                                            formItem.new_variant_id
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                'new_variant_id',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                    >
                                                                        <option value="">
                                                                            Select
                                                                            replacement...
                                                                        </option>
                                                                        {variants.map(
                                                                            (
                                                                                variant,
                                                                            ) => (
                                                                                <option
                                                                                    key={
                                                                                        variant.id
                                                                                    }
                                                                                    value={
                                                                                        variant.id
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        variant.sku
                                                                                    }{' '}
                                                                                    -{' '}
                                                                                    {
                                                                                        variant
                                                                                            .product
                                                                                            .name
                                                                                    }{' '}
                                                                                    (
                                                                                    {
                                                                                        variant.size
                                                                                    }

                                                                                    )
                                                                                </option>
                                                                            ),
                                                                        )}
                                                                    </Form.Select>
                                                                </td>
                                                                <td
                                                                    style={{
                                                                        width: 140,
                                                                    }}
                                                                >
                                                                    <Form.Control
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        value={
                                                                            formItem.new_unit_price
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            updateItem(
                                                                                index,
                                                                                'new_unit_price',
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        placeholder="0.00"
                                                                    />
                                                                    <div className="small mt-1 text-muted">
                                                                        Rejected:{' '}
                                                                        {
                                                                            rejectedQty
                                                                        }
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    },
                                                )}
                                            </tbody>
                                        </Table>

                                        <div className="mb-3">
                                            <div className="d-flex align-items-center justify-content-between mb-2">
                                                <h5 className="mb-0">
                                                    Added Items
                                                </h5>
                                                <Button
                                                    type="button"
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() =>
                                                        setData('added_items', [
                                                            ...data.added_items,
                                                            {
                                                                product_variant_id:
                                                                    '',
                                                                qty: '1',
                                                                unit_price_usd:
                                                                    '',
                                                                note: '',
                                                            },
                                                        ])
                                                    }
                                                >
                                                    Add Item
                                                </Button>
                                            </div>

                                            {data.added_items.length === 0 && (
                                                <div className="small text-muted">
                                                    No extra items added.
                                                </div>
                                            )}

                                            {data.added_items.map(
                                                (item, index) => (
                                                    <div
                                                        key={index}
                                                        className="d-flex align-items-end mb-2 gap-2"
                                                    >
                                                        <Form.Select
                                                            value={
                                                                item.product_variant_id
                                                            }
                                                            onChange={(e) =>
                                                                updateAddedItem(
                                                                    index,
                                                                    'product_variant_id',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        >
                                                            <option value="">
                                                                Select
                                                                product...
                                                            </option>
                                                            {variants.map(
                                                                (variant) => (
                                                                    <option
                                                                        key={
                                                                            variant.id
                                                                        }
                                                                        value={
                                                                            variant.id
                                                                        }
                                                                    >
                                                                        {
                                                                            variant.sku
                                                                        }{' '}
                                                                        -{' '}
                                                                        {
                                                                            variant
                                                                                .product
                                                                                .name
                                                                        }{' '}
                                                                        (
                                                                        {
                                                                            variant.size
                                                                        }
                                                                        )
                                                                    </option>
                                                                ),
                                                            )}
                                                        </Form.Select>
                                                        <Form.Control
                                                            type="number"
                                                            min="1"
                                                            value={item.qty}
                                                            onChange={(e) =>
                                                                updateAddedItem(
                                                                    index,
                                                                    'qty',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            style={{
                                                                width: 100,
                                                            }}
                                                        />
                                                        <Form.Control
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={
                                                                item.unit_price_usd
                                                            }
                                                            onChange={(e) =>
                                                                updateAddedItem(
                                                                    index,
                                                                    'unit_price_usd',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Price"
                                                            style={{
                                                                width: 120,
                                                            }}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="light"
                                                            onClick={() =>
                                                                setData(
                                                                    'added_items',
                                                                    data.added_items.filter(
                                                                        (
                                                                            _,
                                                                            itemIndex,
                                                                        ) =>
                                                                            itemIndex !==
                                                                            index,
                                                                    ),
                                                                )
                                                            }
                                                        >
                                                            Remove
                                                        </Button>
                                                    </div>
                                                ),
                                            )}
                                        </div>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Note</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                value={data.note}
                                                onChange={(e) =>
                                                    setData(
                                                        'note',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="What happened at delivery?"
                                            />
                                        </Form.Group>

                                        <div className="d-flex gap-2">
                                            <Button
                                                type="submit"
                                                variant="success"
                                                disabled={processing}
                                            >
                                                {processing
                                                    ? 'Saving...'
                                                    : 'Confirm Delivery'}
                                            </Button>
                                            <Link
                                                href={showSale.url(sale.id)}
                                                className="btn btn-light"
                                            >
                                                Back to Sale
                                            </Link>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </>
    );
}

ConfirmDeliveryPage.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default ConfirmDeliveryPage;

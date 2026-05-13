import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { type ReactNode, useMemo, useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Col,
    Container,
    Form,
    Modal,
    Row,
    Table,
} from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import { store as storeConfirmDelivery } from '@/routes/sales/confirm-delivery';
import {
    cancel as saleCancel,
    confirmDelivery,
    exchange as exchangeSale,
    index as salesIndex,
    returnMethod,
    updatePayment,
} from '@/routes/sales';
import type { SaleShowPageProps } from '@/types';

type ExchangeItemForm = {
    sale_item_id: number;
    qty: string;
    new_variant_id: string;
    new_unit_price: string;
};

type NewExchangeItemForm = {
    product_variant_id: string;
    qty: string;
    unit_price_usd: string;
};

function SalesShow() {
    const { sale, variants } = usePage<SaleShowPageProps>().props;
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [returning, setReturning] = useState(false);
    const [showExchangeModal, setShowExchangeModal] = useState(false);
    const [returnItems, setReturnItems] = useState<Record<number, string>>({});
    const [returnNote, setReturnNote] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNote, setPaymentNote] = useState('');
    const [updatingPayment, setUpdatingPayment] = useState(false);
    const [confirmingAll, setConfirmingAll] = useState(false);
    const exchangeForm = useForm<{
        exchange_date: string;
        items: ExchangeItemForm[];
        new_items: NewExchangeItemForm[];
        exchange_delivery_fee_usd: string;
        exchange_delivery_cost_usd: string;
        note: string;
    }>({
        exchange_date: new Date().toISOString().split('T')[0],
        items: sale.items.map((item) => ({
            sale_item_id: item.id,
            qty: '',
            new_variant_id: '',
            new_unit_price: '',
        })),
        new_items: [],
        exchange_delivery_fee_usd: '0',
        exchange_delivery_cost_usd: '0',
        note: '',
    });
    const exchangeGeneralError = (
        exchangeForm.errors as Record<string, string | undefined>
    ).general;

    const paymentBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return 'success';
            case 'partial':
                return 'warning';
            default:
                return 'danger';
        }
    };

    const orderBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return 'success';
            case 'cancelled':
                return 'danger';
            case 'returned':
                return 'dark';
            case 'partially_returned':
                return 'info';
            default:
                return 'primary';
        }
    };

    const returnedQtyByItem = useMemo(() => {
        const map: Record<number, number> = {};
        sale.returns.forEach((ret) => {
            ret.items.forEach((item) => {
                map[item.sale_item_id] =
                    (map[item.sale_item_id] ?? 0) + item.qty;
            });
        });

        return map;
    }, [sale.returns]);

    const exchangedQtyByItem = useMemo(() => {
        const map: Record<number, number> = {};
        sale.exchanges.forEach((exchange) => {
            exchange.items.forEach((item) => {
                map[item.sale_item_id] =
                    (map[item.sale_item_id] ?? 0) + item.qty_returned;
            });
        });

        return map;
    }, [sale.exchanges]);

    const replacementSaleItemIds = useMemo(
        () =>
            new Set(
                sale.exchanges.flatMap((exchange) =>
                    exchange.items
                        .map((item) => item.new_sale_item_id)
                        .filter((itemId): itemId is number => itemId !== null),
                ),
            ),
        [sale.exchanges],
    );

    const canReturn =
        sale.delivery_completed_date !== null &&
        sale.order_status !== 'cancelled' &&
        sale.order_status !== 'returned';

    const canConfirmDelivery =
        sale.delivery_completed_date === null &&
        sale.order_status !== 'cancelled' &&
        sale.order_status !== 'returned';

    const canExchange =
        sale.delivery_completed_date !== null &&
        sale.order_status !== 'cancelled' &&
        sale.order_status !== 'returned';

    const originalTotal = Number(sale.original_total_usd || sale.total_usd);
    const finalTotal = Number(sale.total_usd);
    const originalSubtotal = Number(
        sale.original_subtotal_usd || sale.subtotal_usd,
    );
    const finalSubtotal = Number(sale.subtotal_usd);

    const resetExchangeForm = () => {
        exchangeForm.setData({
            exchange_date: new Date().toISOString().split('T')[0],
            items: sale.items.map((item) => ({
                sale_item_id: item.id,
                qty: '',
                new_variant_id: '',
                new_unit_price: '',
            })),
            new_items: [],
            exchange_delivery_fee_usd: '0',
            exchange_delivery_cost_usd: '0',
            note: '',
        });
        exchangeForm.clearErrors();
    };

    const handleReturnSubmit = () => {
        const items = Object.entries(returnItems)
            .filter(([, qty]) => Number(qty) > 0)
            .map(([saleItemId, qty]) => ({
                sale_item_id: Number(saleItemId),
                qty: Number(qty),
            }));

        if (items.length === 0) {
            setShowReturnModal(false);
            return;
        }

        setReturning(true);
        router.post(
            returnMethod.url(sale.id),
            {
                returned_at: new Date().toISOString().split('T')[0],
                items,
                note: returnNote || undefined,
            },
            {
                onSuccess: () => {
                    setShowReturnModal(false);
                    setReturnItems({});
                    setReturnNote('');
                },
                onFinish: () => setReturning(false),
            },
        );
    };

    const updateExchangeItem = (
        index: number,
        field: keyof ExchangeItemForm,
        value: string,
    ) => {
        exchangeForm.setData(
            'items',
            exchangeForm.data.items.map((item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }

                const updatedItem = { ...item, [field]: value };

                if (field === 'new_variant_id') {
                    const selectedVariant = variants.find(
                        (variant) => variant.id === Number(value),
                    );

                    updatedItem.new_unit_price =
                        selectedVariant?.sale_price_usd ?? '';
                }

                return updatedItem;
            }),
        );
    };

    const updateNewExchangeItem = (
        index: number,
        field: keyof NewExchangeItemForm,
        value: string,
    ) => {
        exchangeForm.setData(
            'new_items',
            exchangeForm.data.new_items.map((item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }

                const updatedItem = { ...item, [field]: value };

                if (field === 'product_variant_id') {
                    const selectedVariant = variants.find(
                        (variant) => variant.id === Number(value),
                    );

                    updatedItem.unit_price_usd =
                        selectedVariant?.sale_price_usd ?? '';
                }

                return updatedItem;
            }),
        );
    };

    const handleExchangeSubmit = () => {
        const items = exchangeForm.data.items
            .filter((item) => Number(item.qty) > 0)
            .map((item) => ({
                sale_item_id: item.sale_item_id,
                qty: Number(item.qty),
                new_variant_id: Number(item.new_variant_id),
                new_unit_price: item.new_unit_price,
            }));

        const newItems = exchangeForm.data.new_items
            .filter(
                (item) =>
                    Number(item.qty) > 0 && Number(item.product_variant_id) > 0,
            )
            .map((item) => ({
                product_variant_id: Number(item.product_variant_id),
                qty: Number(item.qty),
                unit_price_usd: item.unit_price_usd,
            }));

        exchangeForm.transform(() => ({
            exchange_date: exchangeForm.data.exchange_date,
            items,
            new_items: newItems,
            exchange_delivery_fee_usd:
                exchangeForm.data.exchange_delivery_fee_usd,
            exchange_delivery_cost_usd:
                exchangeForm.data.exchange_delivery_cost_usd,
            note: exchangeForm.data.note || undefined,
        }));

        exchangeForm.post(exchangeSale.url(sale.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowExchangeModal(false);
                resetExchangeForm();
            },
        });
    };

    const handleDeliveredAll = () => {
        setConfirmingAll(true);

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
                onFinish: () => setConfirmingAll(false),
            },
        );
    };

    return (
        <>
            <Head title={`Sale ${sale.invoice_no}`} />

            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title={`Sale ${sale.invoice_no}`}
                        pageTitle="Sales"
                    />

                    <Row>
                        <Col xl={8}>
                            <Card className="mb-3">
                                <Card.Body>
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <div>
                                            <h4 className="card-title mb-1">
                                                {sale.invoice_no}
                                            </h4>
                                            <p className="mb-0 text-muted">
                                                {sale.sale_date}
                                            </p>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <Badge
                                                bg={paymentBadge(
                                                    sale.payment_status,
                                                )}
                                            >
                                                {sale.payment_status}
                                            </Badge>
                                            <Badge
                                                bg={orderBadge(
                                                    sale.order_status,
                                                )}
                                            >
                                                {sale.order_status}
                                            </Badge>
                                            {(sale.payment_status ===
                                                'unpaid' ||
                                                sale.payment_status ===
                                                    'partial') &&
                                                sale.order_status !==
                                                    'cancelled' && (
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        onClick={() => {
                                                            setPaymentAmount(
                                                                String(
                                                                    sale.total_usd,
                                                                ),
                                                            );
                                                            setShowPaymentModal(
                                                                true,
                                                            );
                                                        }}
                                                    >
                                                        Update Payment
                                                    </Button>
                                                )}
                                        </div>
                                    </div>

                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <div className="small text-muted">
                                                Customer
                                            </div>
                                            <div className="fw-medium">
                                                {sale.customer_name ||
                                                    'Walk-in'}
                                            </div>
                                            {sale.customer_phone && (
                                                <div className="small text-muted">
                                                    {sale.customer_phone}
                                                </div>
                                            )}
                                        </Col>
                                        <Col md={6}>
                                            <div className="small text-muted">
                                                Delivery Completed
                                            </div>
                                            <div>
                                                {sale.delivery_completed_date ||
                                                    '-'}
                                            </div>
                                        </Col>
                                    </Row>

                                    <Row className="mb-3">
                                        <Col md={6}>
                                            <div className="small text-muted">
                                                Note
                                            </div>
                                            <div>{sale.note || '-'}</div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="small text-muted">
                                                Payment Received Date
                                            </div>
                                            <div>
                                                {sale.payment_received_date ||
                                                    '-'}
                                            </div>
                                        </Col>
                                    </Row>

                                    <h5 className="mb-3">
                                        Items{' '}
                                        <Badge bg="light" text="dark">
                                            {sale.items.length}
                                        </Badge>
                                    </h5>

                                    <Table responsive className="mb-0">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th className="text-center">
                                                    Original Qty
                                                </th>
                                                <th className="text-center">
                                                    Accepted
                                                </th>
                                                <th className="text-center">
                                                    Rejected
                                                </th>
                                                <th className="text-center">
                                                    Returned
                                                </th>
                                                <th className="text-end">
                                                    Price
                                                </th>
                                                <th className="text-end">
                                                    Final Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sale.items.map((item) => (
                                                <tr key={item.id}>
                                                    <td>
                                                        {(() => {
                                                            const exchangedQty =
                                                                exchangedQtyByItem[
                                                                    item.id
                                                                ] ?? 0;

                                                            return (
                                                                <>
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
                                                                    <div className="small text-capitalize text-muted">
                                                                        Status:{' '}
                                                                        {
                                                                            item.status
                                                                        }
                                                                    </div>
                                                                    {replacementSaleItemIds.has(
                                                                        item.id,
                                                                    ) && (
                                                                        <div className="mt-1">
                                                                            <span className="badge bg-soft-info text-info">
                                                                                Replacement
                                                                                item
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    {!replacementSaleItemIds.has(
                                                                        item.id,
                                                                    ) &&
                                                                        exchangedQty >
                                                                            0 && (
                                                                            <div className="mt-1">
                                                                                <span className="badge bg-soft-primary text-primary">
                                                                                    Original
                                                                                    changed
                                                                                    item
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    {exchangedQty >
                                                                        0 && (
                                                                        <div className="small text-primary">
                                                                            Exchanged
                                                                            out:{' '}
                                                                            {
                                                                                exchangedQty
                                                                            }{' '}
                                                                            {exchangedQty ===
                                                                            1
                                                                                ? 'piece'
                                                                                : 'pieces'}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td className="text-center">
                                                        {item.qty}
                                                    </td>
                                                    <td className="text-center">
                                                        {item.final_qty}
                                                        {(exchangedQtyByItem[
                                                            item.id
                                                        ] ?? 0) > 0 && (
                                                            <div className="small text-primary">
                                                                Current kept qty
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        {item.rejected_qty}
                                                    </td>
                                                    <td className="text-center">
                                                        {returnedQtyByItem[
                                                            item.id
                                                        ] ?? 0}
                                                    </td>
                                                    <td className="text-end">
                                                        $
                                                        {Number(
                                                            item.unit_price_usd,
                                                        ).toFixed(2)}
                                                    </td>
                                                    <td className="fw-semibold text-end">
                                                        $
                                                        {Number(
                                                            item.total_usd,
                                                        ).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>

                            {sale.delivery_confirmations.length > 0 && (
                                <Card className="border-info mb-3">
                                    <Card.Body>
                                        <h5 className="mb-3">
                                            Delivery Confirmations
                                        </h5>
                                        {sale.delivery_confirmations.map(
                                            (confirmation) => (
                                                <div
                                                    key={confirmation.id}
                                                    className="border-bottom mb-3 pb-3"
                                                >
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <div>
                                                            <div className="fw-semibold text-capitalize">
                                                                {confirmation.status.replaceAll(
                                                                    '_',
                                                                    ' ',
                                                                )}
                                                            </div>
                                                            <div className="small text-muted">
                                                                {
                                                                    confirmation.confirmation_date
                                                                }
                                                            </div>
                                                        </div>
                                                        <div className="small text-end">
                                                            <div>
                                                                Original total:
                                                                $
                                                                {Number(
                                                                    confirmation.original_product_total_usd,
                                                                ).toFixed(2)}
                                                            </div>
                                                            <div>
                                                                Final total: $
                                                                {Number(
                                                                    confirmation.final_total_usd,
                                                                ).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <Table
                                                        size="sm"
                                                        responsive
                                                        className="mb-0"
                                                    >
                                                        <thead>
                                                            <tr>
                                                                <th>Action</th>
                                                                <th>
                                                                    Original
                                                                </th>
                                                                <th>Final</th>
                                                                <th>Qty</th>
                                                                <th className="text-end">
                                                                    Total
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {confirmation.items.map(
                                                                (item) => (
                                                                    <tr
                                                                        key={
                                                                            item.id
                                                                        }
                                                                    >
                                                                        <td className="text-capitalize">
                                                                            {item.action_type.replaceAll(
                                                                                '_',
                                                                                ' ',
                                                                            )}
                                                                        </td>
                                                                        <td>
                                                                            {item
                                                                                .original_variant
                                                                                .product_name ||
                                                                                item
                                                                                    .original_variant
                                                                                    .sku ||
                                                                                '-'}
                                                                        </td>
                                                                        <td>
                                                                            {item
                                                                                .final_variant
                                                                                .product_name ||
                                                                                item
                                                                                    .final_variant
                                                                                    .sku ||
                                                                                '-'}
                                                                        </td>
                                                                        <td>
                                                                            {item.accepted_qty >
                                                                            0
                                                                                ? item.accepted_qty
                                                                                : item.added_qty}
                                                                            {item.rejected_qty >
                                                                                0 &&
                                                                                ` / rejected ${item.rejected_qty}`}
                                                                        </td>
                                                                        <td className="text-end">
                                                                            $
                                                                            {Number(
                                                                                item.final_total_usd,
                                                                            ).toFixed(
                                                                                2,
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ),
                                                            )}
                                                        </tbody>
                                                    </Table>

                                                    {confirmation.note && (
                                                        <div className="small mt-2 text-muted">
                                                            {confirmation.note}
                                                        </div>
                                                    )}
                                                </div>
                                            ),
                                        )}
                                    </Card.Body>
                                </Card>
                            )}

                            {sale.exchanges.length > 0 && (
                                <Card className="mb-3 border-primary">
                                    <Card.Body>
                                        <h5 className="mb-3">Exchanges</h5>
                                        {sale.exchanges.map((exchange) => (
                                            <div
                                                key={exchange.id}
                                                className="border-bottom mb-3 pb-3"
                                            >
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <div>
                                                        <div className="fw-semibold">
                                                            Exchange #
                                                            {exchange.id}
                                                        </div>
                                                        <div className="small text-muted">
                                                            Exchange date:{' '}
                                                            {exchange.exchange_date ??
                                                                exchange.created_at}
                                                        </div>
                                                        <div className="small text-muted">
                                                            Extra money
                                                            received:{' '}
                                                            {exchange.payment_received_date ??
                                                                '-'}
                                                        </div>
                                                    </div>
                                                    <div className="small text-end">
                                                        <div>
                                                            Additional amount: $
                                                            {Number(
                                                                exchange.total_additional_amount_usd,
                                                            ).toFixed(2)}
                                                        </div>
                                                        <div>
                                                            Additional profit: $
                                                            {Number(
                                                                exchange.additional_profit_usd,
                                                            ).toFixed(2)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <Table
                                                    size="sm"
                                                    responsive
                                                    className="mb-0"
                                                >
                                                    <thead>
                                                        <tr>
                                                            <th>Original</th>
                                                            <th>New</th>
                                                            <th>Qty</th>
                                                            <th className="text-end">
                                                                New Price
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {exchange.items.map(
                                                            (item) => (
                                                                <tr
                                                                    key={
                                                                        item.id
                                                                    }
                                                                >
                                                                    <td>
                                                                        {item
                                                                            .original_variant
                                                                            .product_name ||
                                                                            item
                                                                                .original_variant
                                                                                .sku ||
                                                                            '-'}
                                                                    </td>
                                                                    <td>
                                                                        {item
                                                                            .new_variant
                                                                            .product_name ||
                                                                            item
                                                                                .new_variant
                                                                                .sku ||
                                                                            'Extra item'}
                                                                    </td>
                                                                    <td>
                                                                        {
                                                                            item.qty_returned
                                                                        }
                                                                    </td>
                                                                    <td className="text-end">
                                                                        $
                                                                        {Number(
                                                                            item.new_unit_price_usd,
                                                                        ).toFixed(
                                                                            2,
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ),
                                                        )}
                                                    </tbody>
                                                </Table>

                                                <div className="small mt-2 text-muted">
                                                    Price diff: $
                                                    {Number(
                                                        exchange.subtotal_adjustment_usd,
                                                    ).toFixed(2)}{' '}
                                                    | Extra items: $
                                                    {Number(
                                                        exchange.new_items_subtotal_usd,
                                                    ).toFixed(2)}{' '}
                                                    | Delivery fee: $
                                                    {Number(
                                                        exchange.exchange_delivery_fee_usd,
                                                    ).toFixed(2)}
                                                </div>

                                                {exchange.note && (
                                                    <div className="small mt-1 text-muted">
                                                        {exchange.note}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </Card.Body>
                                </Card>
                            )}

                            {sale.returns.length > 0 && (
                                <Card className="border-warning mb-3">
                                    <Card.Body>
                                        <h5 className="mb-3">Returns</h5>
                                        {sale.returns.map((ret) => (
                                            <div
                                                key={ret.id}
                                                className="border-bottom mb-3 pb-2"
                                            >
                                                <div className="d-flex justify-content-between small mb-1">
                                                    <span className="text-muted">
                                                        Return #{ret.id} ·{' '}
                                                        {ret.returned_at}
                                                        {ret.payment_received_date && (
                                                            <>
                                                                {' '}
                                                                · Refund date:{' '}
                                                                {
                                                                    ret.payment_received_date
                                                                }
                                                            </>
                                                        )}
                                                    </span>
                                                    <span className="fw-semibold text-danger">
                                                        -$
                                                        {Number(
                                                            ret.total_refund_usd,
                                                        ).toFixed(2)}
                                                    </span>
                                                </div>
                                                <Table
                                                    size="sm"
                                                    responsive
                                                    className="mb-0"
                                                >
                                                    <thead>
                                                        <tr>
                                                            <th>Item</th>
                                                            <th>Qty</th>
                                                            <th>Refund</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {ret.items.map((ri) => {
                                                            const saleItem =
                                                                sale.items.find(
                                                                    (item) =>
                                                                        item.id ===
                                                                        ri.sale_item_id,
                                                                );

                                                            return (
                                                                <tr key={ri.id}>
                                                                    <td>
                                                                        {saleItem
                                                                            ?.product_variant
                                                                            ?.product_name ||
                                                                            saleItem
                                                                                ?.product_variant
                                                                                ?.sku ||
                                                                            '-'}
                                                                    </td>
                                                                    <td>
                                                                        {ri.qty}
                                                                    </td>
                                                                    <td>
                                                                        $
                                                                        {Number(
                                                                            ri.refund_usd,
                                                                        ).toFixed(
                                                                            2,
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </Table>
                                                {ret.note && (
                                                    <div className="small mt-1 text-muted">
                                                        {ret.note}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </Card.Body>
                                </Card>
                            )}

                            {sale.items.some(
                                (item) => item.cost_layers.length > 0,
                            ) && (
                                <Card className="border-light">
                                    <Card.Body>
                                        <div className="d-flex align-items-center justify-content-between mb-3">
                                            <h5 className="mb-0">
                                                Stock Cost Breakdown
                                            </h5>
                                            <span className="badge bg-light text-muted">
                                                FIFO
                                            </span>
                                        </div>

                                        {sale.items.map((item) =>
                                            item.cost_layers.length > 0 ? (
                                                <div
                                                    key={item.id}
                                                    className="bg-light mb-3 rounded p-2"
                                                >
                                                    <div className="fw-medium mb-2">
                                                        {item.product_variant
                                                            ?.product_name ||
                                                            item.product_variant
                                                                ?.sku}
                                                        <span className="ms-1 text-muted">
                                                            (Final Qty:{' '}
                                                            {item.final_qty})
                                                        </span>
                                                    </div>

                                                    {item.cost_layers.map(
                                                        (layer, index) => (
                                                            <div
                                                                key={index}
                                                                className="d-flex justify-content-between small mb-1"
                                                            >
                                                                <span className="text-muted">
                                                                    Batch{' '}
                                                                    {index + 1}:{' '}
                                                                    {layer.qty}{' '}
                                                                    pcs
                                                                </span>
                                                                <span>
                                                                    $
                                                                    {Number(
                                                                        layer.unit_cost_usd,
                                                                    ).toFixed(
                                                                        2,
                                                                    )}{' '}
                                                                    each ={' $'}
                                                                    {Number(
                                                                        layer.total_cost_usd,
                                                                    ).toFixed(
                                                                        2,
                                                                    )}
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            ) : null,
                                        )}
                                    </Card.Body>
                                </Card>
                            )}
                        </Col>

                        <Col xl={4}>
                            <Card>
                                <Card.Body>
                                    <h4 className="card-title mb-3">
                                        Payment Summary
                                    </h4>

                                    <div className="vstack gap-2">
                                        {originalSubtotal !== finalSubtotal && (
                                            <div className="d-flex justify-content-between small text-muted">
                                                <span>Original Subtotal</span>
                                                <span>
                                                    $
                                                    {originalSubtotal.toFixed(
                                                        2,
                                                    )}
                                                </span>
                                            </div>
                                        )}
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">
                                                Final Items Subtotal
                                            </span>
                                            <span className="fw-semibold">
                                                ${finalSubtotal.toFixed(2)}
                                            </span>
                                        </div>
                                        {Number(sale.discount_usd) > 0 && (
                                            <div className="d-flex justify-content-between">
                                                <span className="text-muted">
                                                    Discount
                                                </span>
                                                <span className="fw-semibold text-success">
                                                    -$
                                                    {Number(
                                                        sale.discount_usd,
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                        {Number(
                                            sale.original_delivery_fee_usd,
                                        ) !==
                                            Number(
                                                sale.customer_delivery_fee_usd,
                                            ) && (
                                            <div className="d-flex justify-content-between small text-muted">
                                                <span>
                                                    Original Delivery Fee
                                                </span>
                                                <span>
                                                    $
                                                    {Number(
                                                        sale.original_delivery_fee_usd,
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">
                                                Final Delivery Fee
                                            </span>
                                            <span className="fw-semibold">
                                                $
                                                {Number(
                                                    sale.customer_delivery_fee_usd,
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                        <hr className="my-1" />
                                        {originalTotal !== finalTotal && (
                                            <div className="d-flex justify-content-between small text-muted">
                                                <span>Original Total</span>
                                                <span>
                                                    ${originalTotal.toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="d-flex justify-content-between fs-5">
                                            <span className="fw-bold">
                                                Final Total
                                            </span>
                                            <span className="fw-bold text-primary">
                                                ${finalTotal.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">
                                                Paid
                                            </span>
                                            <span className="fw-semibold text-success">
                                                $
                                                {Number(sale.paid_usd).toFixed(
                                                    2,
                                                )}
                                            </span>
                                        </div>
                                        {finalTotal > Number(sale.paid_usd) && (
                                            <div className="d-flex justify-content-between">
                                                <span className="text-danger">
                                                    Due
                                                </span>
                                                <span className="fw-bold text-danger">
                                                    $
                                                    {(
                                                        finalTotal -
                                                        Number(sale.paid_usd)
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                        <hr className="my-1" />
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">
                                                Product Cost
                                            </span>
                                            <span>
                                                $
                                                {sale.items
                                                    .reduce(
                                                        (sum, item) =>
                                                            sum +
                                                            Number(
                                                                item.cogs_usd,
                                                            ),
                                                        0,
                                                    )
                                                    .toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="text-muted">
                                                Delivery Cost
                                            </span>
                                            <span>
                                                $
                                                {Number(
                                                    sale.actual_delivery_cost_usd,
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="d-flex justify-content-between">
                                            <span className="fw-semibold">
                                                Net Profit
                                            </span>
                                            <span className="fw-bold text-success">
                                                $
                                                {(
                                                    sale.items.reduce(
                                                        (sum, item) =>
                                                            sum +
                                                            Number(
                                                                item.profit_usd,
                                                            ),
                                                        0,
                                                    ) +
                                                    Number(
                                                        sale.delivery_profit_usd,
                                                    )
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <hr />

                                    {canConfirmDelivery && (
                                        <>
                                            <Button
                                                variant="success"
                                                className="mb-2 w-100"
                                                disabled={confirmingAll}
                                                onClick={handleDeliveredAll}
                                            >
                                                <i className="ri-check-double-line me-1" />{' '}
                                                {confirmingAll
                                                    ? 'Confirming...'
                                                    : 'Delivered All'}
                                            </Button>
                                            <Link
                                                href={confirmDelivery.url(
                                                    sale.id,
                                                )}
                                                className="btn btn-outline-success mb-2 w-100"
                                            >
                                                <i className="ri-edit-circle-line me-1" />{' '}
                                                Delivery Changes
                                            </Link>
                                        </>
                                    )}

                                    {canReturn && (
                                        <Button
                                            variant="outline-warning"
                                            className="mb-2 w-100"
                                            onClick={() =>
                                                setShowReturnModal(true)
                                            }
                                        >
                                            <i className="ri-arrow-go-back-line me-1" />{' '}
                                            Return Items
                                        </Button>
                                    )}

                                    {canExchange && (
                                        <Button
                                            variant="outline-primary"
                                            className="mb-2 w-100"
                                            onClick={() =>
                                                setShowExchangeModal(true)
                                            }
                                        >
                                            <i className="ri-arrow-left-right-line me-1" />{' '}
                                            Exchange
                                        </Button>
                                    )}

                                    {sale.order_status !== 'cancelled' &&
                                        sale.order_status !== 'returned' && (
                                            <Button
                                                variant="outline-danger"
                                                className="mb-2 w-100"
                                                onClick={() =>
                                                    setShowCancelModal(true)
                                                }
                                            >
                                                <i className="ri-close-circle-line me-1" />{' '}
                                                Cancel Sale
                                            </Button>
                                        )}

                                    <Link
                                        href={`/sales/${sale.id}/delivery`}
                                        className="btn btn-outline-info mb-2 w-100"
                                    >
                                        <i className="ri-truck-line me-1" />{' '}
                                        Delivery
                                    </Link>
                                    <Link
                                        href={`/sales/${sale.id}/packaging`}
                                        className="btn btn-outline-secondary mb-2 w-100"
                                    >
                                        <i className="ri-archive-line me-1" />{' '}
                                        Packaging
                                    </Link>
                                    <Link
                                        href={salesIndex.url()}
                                        className="btn btn-light w-100"
                                    >
                                        Back to Sales
                                    </Link>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>

            <Modal
                show={showCancelModal}
                onHide={() => setShowCancelModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Cancel Sale</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Are you sure you want to cancel{' '}
                        <strong>{sale.invoice_no}</strong>?
                    </p>
                    <p className="small mb-0 text-muted">
                        This restores stock quantities back to their original
                        layers.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={() => setShowCancelModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        variant="danger"
                        disabled={cancelling}
                        onClick={() => {
                            setCancelling(true);
                            router.post(
                                saleCancel.url(sale.id),
                                {},
                                {
                                    onSuccess: () => setShowCancelModal(false),
                                    onFinish: () => setCancelling(false),
                                },
                            );
                        }}
                    >
                        {cancelling ? 'Cancelling...' : 'Yes, Cancel Sale'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal
                show={showReturnModal}
                onHide={() => setShowReturnModal(false)}
                centered
                size="lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Return Items</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Table responsive className="mb-3">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Final Qty</th>
                                <th>Already Returned</th>
                                <th>Return Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items.map((item) => {
                                const returned =
                                    returnedQtyByItem[item.id] ?? 0;
                                const maxReturn = item.final_qty - returned;

                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="fw-medium">
                                                {item.product_variant
                                                    ?.product_name ||
                                                    item.product_variant?.sku}
                                            </div>
                                            <div className="small text-muted">
                                                {item.product_variant?.color} /{' '}
                                                {item.product_variant?.size}
                                            </div>
                                        </td>
                                        <td>{item.final_qty}</td>
                                        <td>{returned}</td>
                                        <td style={{ width: 120 }}>
                                            <Form.Control
                                                type="number"
                                                min={0}
                                                max={maxReturn}
                                                value={
                                                    returnItems[item.id] ?? ''
                                                }
                                                onChange={(event) => {
                                                    const value =
                                                        event.target.value;
                                                    if (
                                                        value === '' ||
                                                        Number(value) <=
                                                            maxReturn
                                                    ) {
                                                        setReturnItems(
                                                            (previous) => ({
                                                                ...previous,
                                                                [item.id]:
                                                                    value,
                                                            }),
                                                        );
                                                    }
                                                }}
                                                placeholder="0"
                                                disabled={maxReturn <= 0}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>

                    <Form.Group>
                        <Form.Label>Note</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            value={returnNote}
                            onChange={(event) =>
                                setReturnNote(event.target.value)
                            }
                            placeholder="Optional reason for return..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={() => setShowReturnModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        variant="warning"
                        disabled={returning}
                        onClick={handleReturnSubmit}
                    >
                        {returning ? 'Processing...' : 'Process Return'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal
                show={showExchangeModal}
                onHide={() => {
                    setShowExchangeModal(false);
                    resetExchangeForm();
                }}
                centered
                size="xl"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Exchange After Delivery</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {exchangeGeneralError && (
                        <div className="alert alert-danger">
                            {exchangeGeneralError}
                        </div>
                    )}

                    <Row className="mb-3">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Exchange Date</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={exchangeForm.data.exchange_date}
                                    onChange={(event) =>
                                        exchangeForm.setData(
                                            'exchange_date',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>
                                    Extra Delivery Fee From Customer
                                </Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={
                                        exchangeForm.data
                                            .exchange_delivery_fee_usd
                                    }
                                    onChange={(event) =>
                                        exchangeForm.setData(
                                            'exchange_delivery_fee_usd',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Actual Delivery Cost</Form.Label>
                                <Form.Control
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={
                                        exchangeForm.data
                                            .exchange_delivery_cost_usd
                                    }
                                    onChange={(event) =>
                                        exchangeForm.setData(
                                            'exchange_delivery_cost_usd',
                                            event.target.value,
                                        )
                                    }
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <h6 className="mb-2">Change Size / Style</h6>
                    <Table responsive className="mb-3 align-middle">
                        <thead>
                            <tr>
                                <th>Exchangeable Item</th>
                                <th className="text-center">Available</th>
                                <th className="text-center">Qty</th>
                                <th>Replacement Variant</th>
                                <th>New Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sale.items.map((item, index) => {
                                const returnedQty =
                                    returnedQtyByItem[item.id] ?? 0;
                                const exchangedQty =
                                    exchangedQtyByItem[item.id] ?? 0;
                                const exchangeableQty =
                                    (item.final_qty > 0
                                        ? item.final_qty
                                        : item.qty) -
                                    returnedQty -
                                    exchangedQty;

                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="fw-medium">
                                                {item.product_variant
                                                    ?.product_name ||
                                                    item.product_variant?.sku}
                                            </div>
                                            <div className="small text-muted">
                                                {item.product_variant?.color} /{' '}
                                                {item.product_variant?.size}
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            {Math.max(0, exchangeableQty)}
                                        </td>
                                        <td style={{ width: 120 }}>
                                            <Form.Control
                                                type="number"
                                                min="0"
                                                max={Math.max(
                                                    0,
                                                    exchangeableQty,
                                                )}
                                                value={
                                                    exchangeForm.data.items[
                                                        index
                                                    ]?.qty ?? ''
                                                }
                                                onChange={(event) =>
                                                    updateExchangeItem(
                                                        index,
                                                        'qty',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="0"
                                            />
                                        </td>
                                        <td style={{ minWidth: 260 }}>
                                            <Form.Select
                                                value={
                                                    exchangeForm.data.items[
                                                        index
                                                    ]?.new_variant_id ?? ''
                                                }
                                                onChange={(event) =>
                                                    updateExchangeItem(
                                                        index,
                                                        'new_variant_id',
                                                        event.target.value,
                                                    )
                                                }
                                            >
                                                <option value="">
                                                    Select replacement...
                                                </option>
                                                {variants.map((variant) => (
                                                    <option
                                                        key={variant.id}
                                                        value={variant.id}
                                                    >
                                                        {variant.sku} -{' '}
                                                        {variant.product.name} (
                                                        {variant.size}) | Stock:{' '}
                                                        {variant.stock_on_hand}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </td>
                                        <td style={{ width: 150 }}>
                                            <Form.Control
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={
                                                    exchangeForm.data.items[
                                                        index
                                                    ]?.new_unit_price ?? ''
                                                }
                                                onChange={(event) =>
                                                    updateExchangeItem(
                                                        index,
                                                        'new_unit_price',
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="0.00"
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>

                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <h6 className="mb-0">Extra Items</h6>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline-primary"
                            onClick={() =>
                                exchangeForm.setData('new_items', [
                                    ...exchangeForm.data.new_items,
                                    {
                                        product_variant_id: '',
                                        qty: '1',
                                        unit_price_usd: '',
                                    },
                                ])
                            }
                        >
                            Add Item
                        </Button>
                    </div>

                    {exchangeForm.data.new_items.length > 0 ? (
                        exchangeForm.data.new_items.map((item, index) => (
                            <div
                                key={index}
                                className="d-flex align-items-end mb-2 gap-2"
                            >
                                <Form.Select
                                    value={item.product_variant_id}
                                    onChange={(event) =>
                                        updateNewExchangeItem(
                                            index,
                                            'product_variant_id',
                                            event.target.value,
                                        )
                                    }
                                >
                                    <option value="">Select product...</option>
                                    {variants.map((variant) => (
                                        <option
                                            key={variant.id}
                                            value={variant.id}
                                        >
                                            {variant.sku} -{' '}
                                            {variant.product.name} (
                                            {variant.size}) | Stock:{' '}
                                            {variant.stock_on_hand}
                                        </option>
                                    ))}
                                </Form.Select>
                                <Form.Control
                                    type="number"
                                    min="1"
                                    value={item.qty}
                                    onChange={(event) =>
                                        updateNewExchangeItem(
                                            index,
                                            'qty',
                                            event.target.value,
                                        )
                                    }
                                    style={{ width: 110 }}
                                />
                                <Form.Control
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.unit_price_usd}
                                    onChange={(event) =>
                                        updateNewExchangeItem(
                                            index,
                                            'unit_price_usd',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Price"
                                    style={{ width: 130 }}
                                />
                                <Button
                                    type="button"
                                    variant="light"
                                    onClick={() =>
                                        exchangeForm.setData(
                                            'new_items',
                                            exchangeForm.data.new_items.filter(
                                                (_, itemIndex) =>
                                                    itemIndex !== index,
                                            ),
                                        )
                                    }
                                >
                                    Remove
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="small mb-3 text-muted">
                            No extra items added.
                        </div>
                    )}

                    <Form.Group>
                        <Form.Label>Note</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={exchangeForm.data.note}
                            onChange={(event) =>
                                exchangeForm.setData('note', event.target.value)
                            }
                            placeholder="Customer asked for a later size change or extra item..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={() => {
                            setShowExchangeModal(false);
                            resetExchangeForm();
                        }}
                    >
                        Close
                    </Button>
                    <Button
                        variant="primary"
                        disabled={exchangeForm.processing}
                        onClick={handleExchangeSubmit}
                    >
                        {exchangeForm.processing
                            ? 'Processing...'
                            : 'Process Exchange'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal
                show={showPaymentModal}
                onHide={() => setShowPaymentModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Update Payment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-3">
                        <div className="d-flex justify-content-between small text-muted">
                            <span>Final Total</span>
                            <span>${Number(sale.total_usd).toFixed(2)}</span>
                        </div>
                        <div className="d-flex justify-content-between small text-muted">
                            <span>Previously Paid</span>
                            <span>${Number(sale.paid_usd).toFixed(2)}</span>
                        </div>
                    </div>

                    <Form.Group className="mb-3">
                        <Form.Label>New Paid Amount</Form.Label>
                        <Form.Control
                            type="number"
                            step="0.01"
                            min="0"
                            value={paymentAmount}
                            onChange={(event) =>
                                setPaymentAmount(event.target.value)
                            }
                            placeholder="Enter total paid amount"
                        />
                    </Form.Group>

                    <Form.Group>
                        <Form.Label>Note</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            value={paymentNote}
                            onChange={(event) =>
                                setPaymentNote(event.target.value)
                            }
                            placeholder="Optional payment note..."
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="light"
                        onClick={() => setShowPaymentModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        variant="primary"
                        disabled={updatingPayment}
                        onClick={() => {
                            setUpdatingPayment(true);
                            router.post(
                                updatePayment.url(sale.id),
                                {
                                    paid_usd: paymentAmount,
                                    payment_note: paymentNote || undefined,
                                },
                                {
                                    onSuccess: () => {
                                        setShowPaymentModal(false);
                                        setPaymentAmount('');
                                        setPaymentNote('');
                                    },
                                    onFinish: () => setUpdatingPayment(false),
                                },
                            );
                        }}
                    >
                        {updatingPayment ? 'Updating...' : 'Update Payment'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

SalesShow.layout = (page: ReactNode) => <Layout>{page}</Layout>;

export default SalesShow;

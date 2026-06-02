import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type FormEvent, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Badge, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import { index as adjustmentsIndex } from '@/routes/stock-adjustments';
import { getCurrentDate } from '@/utils/dateTime';

type AdjustmentVariant = {
    id: number;
    sku: string;
    size: string;
    color: string | null;
    product_name: string;
    stock_on_hand: number;
};

function StockAdjustmentsCreate() {
    const { variants } = usePage<{ variants: AdjustmentVariant[] }>().props;
    const { data, setData, post, processing } = useForm({
        adjustment_date: getCurrentDate(),
        reason: '',
        note: '',
        items: [] as {
            product_variant_id: number;
            actual_qty: string;
            note: string;
        }[],
    });

    const [search, setSearch] = useState('');
    const [showPicker, setShowPicker] = useState(false);

    const addedIds = useMemo(
        () => new Set(data.items.map((i) => i.product_variant_id)),
        [data.items],
    );

    const filteredVariants = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return variants.slice(0, 20);
        return variants.filter((v) => {
            const text =
                `${v.sku} ${v.product_name} ${v.color ?? ''} ${v.size}`.toLowerCase();
            return text.includes(term);
        });
    }, [variants, search]);

    const addItem = (variant: AdjustmentVariant) => {
        if (addedIds.has(variant.id)) return;
        setData('items', [
            ...data.items,
            {
                product_variant_id: variant.id,
                actual_qty: String(variant.stock_on_hand),
                note: '',
            },
        ]);
        setSearch('');
        setShowPicker(false);
    };

    const updateItem = (index: number, field: string, value: string) => {
        const newItems = [...data.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setData('items', newItems);
    };

    const removeItem = (index: number) => {
        setData(
            'items',
            data.items.filter((_, i) => i !== index),
        );
    };

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post(adjustmentsIndex.url());
    };

    return (
        <>
            <Head title="New Stock Adjustment" />
            <div className="page-content">
                <Container fluid>
                    <BreadCrumb
                        title="New Stock Adjustment"
                        pageTitle="Inventory"
                    />
                    <Row>
                        <Col lg={8}>
                            <Card>
                                <Card.Body>
                                    <Form onSubmit={submit}>
                                        <Row className="mb-3">
                                            <Col md={4}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Date
                                                    </Form.Label>
                                                    <Form.Control
                                                        type="date"
                                                        value={
                                                            data.adjustment_date
                                                        }
                                                        onChange={(e) =>
                                                            setData(
                                                                'adjustment_date',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={8}>
                                                <Form.Group>
                                                    <Form.Label>
                                                        Reason
                                                    </Form.Label>
                                                    <Form.Control
                                                        value={data.reason}
                                                        placeholder="e.g. Physical count, damaged goods..."
                                                        onChange={(e) =>
                                                            setData(
                                                                'reason',
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Form.Group className="mb-3">
                                            <Form.Label>Note</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                value={data.note}
                                                onChange={(e) =>
                                                    setData(
                                                        'note',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Form.Group>

                                        {/* Search picker */}
                                        <Form.Group className="mb-3">
                                            <Form.Label>Add Variant</Form.Label>
                                            <div className="position-relative">
                                                <Form.Control
                                                    type="text"
                                                    placeholder="Search by SKU, product name, size, color..."
                                                    value={search}
                                                    onChange={(e) => {
                                                        setSearch(
                                                            e.target.value,
                                                        );
                                                        setShowPicker(true);
                                                    }}
                                                    onFocus={() =>
                                                        setShowPicker(true)
                                                    }
                                                    onBlur={() =>
                                                        setTimeout(
                                                            () =>
                                                                setShowPicker(
                                                                    false,
                                                                ),
                                                            150,
                                                        )
                                                    }
                                                    autoComplete="off"
                                                />
                                                {showPicker &&
                                                    filteredVariants.length >
                                                        0 && (
                                                        <div
                                                            className="position-absolute w-100 rounded border bg-white shadow-sm"
                                                            style={{
                                                                zIndex: 1000,
                                                                maxHeight: 300,
                                                                overflowY:
                                                                    'auto',
                                                            }}
                                                        >
                                                            {filteredVariants.map(
                                                                (v) => {
                                                                    const alreadyAdded =
                                                                        addedIds.has(
                                                                            v.id,
                                                                        );
                                                                    return (
                                                                        <button
                                                                            key={
                                                                                v.id
                                                                            }
                                                                            type="button"
                                                                            className="d-flex align-items-center justify-content-between border-bottom w-100 border-0 bg-white px-3 py-2 text-start"
                                                                            style={{
                                                                                cursor: alreadyAdded
                                                                                    ? 'not-allowed'
                                                                                    : 'pointer',
                                                                                opacity:
                                                                                    alreadyAdded
                                                                                        ? 0.5
                                                                                        : 1,
                                                                            }}
                                                                            onMouseDown={(
                                                                                e,
                                                                            ) => {
                                                                                e.preventDefault();
                                                                                if (
                                                                                    !alreadyAdded
                                                                                )
                                                                                    addItem(
                                                                                        v,
                                                                                    );
                                                                            }}
                                                                        >
                                                                            <div>
                                                                                <div className="fw-medium">
                                                                                    {
                                                                                        v.product_name
                                                                                    }
                                                                                </div>
                                                                                <div className="small font-monospace text-muted">
                                                                                    {
                                                                                        v.sku
                                                                                    }
                                                                                    {v.color &&
                                                                                        ` · ${v.color}`}
                                                                                    {` · ${v.size}`}
                                                                                </div>
                                                                            </div>
                                                                            <Badge
                                                                                bg={
                                                                                    v.stock_on_hand >
                                                                                    0
                                                                                        ? 'success'
                                                                                        : 'secondary'
                                                                                }
                                                                            >
                                                                                {
                                                                                    v.stock_on_hand
                                                                                }{' '}
                                                                                in
                                                                                stock
                                                                            </Badge>
                                                                        </button>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    )}
                                            </div>
                                        </Form.Group>

                                        {data.items.length > 0 && (
                                            <Table responsive className="mb-3">
                                                <thead>
                                                    <tr>
                                                        <th>Variant</th>
                                                        <th>System Qty</th>
                                                        <th>Actual Qty</th>
                                                        <th>Change</th>
                                                        <th>Note</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {data.items.map(
                                                        (item, idx) => {
                                                            const variant =
                                                                variants.find(
                                                                    (v) =>
                                                                        v.id ===
                                                                        item.product_variant_id,
                                                                );
                                                            const systemQty =
                                                                variant?.stock_on_hand ??
                                                                0;
                                                            const actualQty =
                                                                parseInt(
                                                                    item.actual_qty,
                                                                ) || 0;
                                                            const diff =
                                                                actualQty -
                                                                systemQty;

                                                            return (
                                                                <tr
                                                                    key={
                                                                        item.product_variant_id
                                                                    }
                                                                >
                                                                    <td>
                                                                        <div className="fw-medium">
                                                                            {
                                                                                variant?.product_name
                                                                            }
                                                                        </div>
                                                                        <div className="small font-monospace text-muted">
                                                                            {
                                                                                variant?.sku
                                                                            }
                                                                            {variant?.color &&
                                                                                ` · ${variant.color}`}
                                                                            {` · ${variant?.size}`}
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        {
                                                                            systemQty
                                                                        }
                                                                    </td>
                                                                    <td>
                                                                        <Form.Control
                                                                            type="number"
                                                                            min="0"
                                                                            value={
                                                                                item.actual_qty
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateItem(
                                                                                    idx,
                                                                                    'actual_qty',
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            size="sm"
                                                                            style={{
                                                                                width: 80,
                                                                            }}
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <Badge
                                                                            bg={
                                                                                diff >
                                                                                0
                                                                                    ? 'success'
                                                                                    : diff <
                                                                                        0
                                                                                      ? 'danger'
                                                                                      : 'secondary'
                                                                            }
                                                                        >
                                                                            {diff >
                                                                            0
                                                                                ? `+${diff}`
                                                                                : diff}
                                                                        </Badge>
                                                                    </td>
                                                                    <td>
                                                                        <Form.Control
                                                                            value={
                                                                                item.note
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateItem(
                                                                                    idx,
                                                                                    'note',
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            size="sm"
                                                                            placeholder="Optional"
                                                                        />
                                                                    </td>
                                                                    <td>
                                                                        <button
                                                                            type="button"
                                                                            className="btn btn-sm btn-soft-danger"
                                                                            onClick={() =>
                                                                                removeItem(
                                                                                    idx,
                                                                                )
                                                                            }
                                                                        >
                                                                            <i className="ri-delete-bin-line"></i>
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        },
                                                    )}
                                                </tbody>
                                            </Table>
                                        )}

                                        {data.items.length === 0 && (
                                            <div className="mb-3 rounded border py-4 text-center text-muted">
                                                <i className="ri-search-line fs-3 d-block mb-1"></i>
                                                Search and add variants above
                                            </div>
                                        )}

                                        <div className="d-flex gap-2">
                                            <button
                                                type="submit"
                                                className="btn btn-success"
                                                disabled={
                                                    processing ||
                                                    data.items.length === 0
                                                }
                                            >
                                                {processing
                                                    ? 'Saving...'
                                                    : 'Save'}
                                            </button>
                                            <Link
                                                href={adjustmentsIndex.url()}
                                                className="btn btn-light"
                                            >
                                                Cancel
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

StockAdjustmentsCreate.layout = (page: ReactNode) => <Layout>{page}</Layout>;
export default StockAdjustmentsCreate;

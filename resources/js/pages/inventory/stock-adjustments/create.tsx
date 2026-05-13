import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

import BreadCrumb from '@/Components/Common/BreadCrumb';
import Layout from '@/Layouts';
import { index as adjustmentsIndex } from '@/routes/stock-adjustments';
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
    const { data, setData, post, processing, errors } = useForm({
        adjustment_date: new Date().toISOString().split('T')[0],
        reason: '',
        note: '',
        items: [] as {
            product_variant_id: number;
            actual_qty: string;
            note: string;
        }[],
    });

    const [selectedVariant, setSelectedVariant] = useState('');

    const addItem = () => {
        const variantId = parseInt(selectedVariant);
        if (!variantId) return;
        if (data.items.find((i) => i.product_variant_id === variantId)) return;
        const variant = variants.find((v) => v.id === variantId);
        if (!variant) return;
        setData('items', [
            ...data.items,
            {
                product_variant_id: variantId,
                actual_qty: String(variant.stock_on_hand ?? 0),
                note: '',
            },
        ]);
        setSelectedVariant('');
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
                                        <Form.Group className="mb-3">
                                            <Form.Label>Date</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={data.adjustment_date}
                                                onChange={(e) =>
                                                    setData(
                                                        'adjustment_date',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Reason</Form.Label>
                                            <Form.Control
                                                value={data.reason}
                                                onChange={(e) =>
                                                    setData(
                                                        'reason',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </Form.Group>
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

                                        <div className="mb-3">
                                            <label className="form-label">
                                                Add Variant
                                            </label>
                                            <div className="d-flex gap-2">
                                                <Form.Select
                                                    value={selectedVariant}
                                                    onChange={(e) =>
                                                        setSelectedVariant(
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Select variant...
                                                    </option>
                                                    {variants.map((v) => (
                                                        <option
                                                            key={v.id}
                                                            value={v.id}
                                                        >
                                                            {v.sku} -{' '}
                                                            {v.product_name} (
                                                            {v.size}) [Stock:{' '}
                                                            {v.stock_on_hand}]
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                                <button
                                                    type="button"
                                                    className="btn btn-light"
                                                    onClick={addItem}
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        </div>

                                        {data.items.length > 0 && (
                                            <Table responsive className="mb-3">
                                                <thead>
                                                    <tr>
                                                        <th>Variant</th>
                                                        <th>System Qty</th>
                                                        <th>Actual Qty</th>
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
                                                            return (
                                                                <tr
                                                                    key={
                                                                        item.product_variant_id
                                                                    }
                                                                >
                                                                    <td>
                                                                        {
                                                                            variant?.sku
                                                                        }{' '}
                                                                        -{' '}
                                                                        {
                                                                            variant?.product_name
                                                                        }{' '}
                                                                        (
                                                                        {
                                                                            variant?.size
                                                                        }
                                                                        )
                                                                    </td>
                                                                    <td>
                                                                        {variant?.stock_on_hand ??
                                                                            0}
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

                                        <div className="d-flex gap-2">
                                            <button
                                                type="submit"
                                                className="btn btn-success"
                                                disabled={
                                                    processing ||
                                                    data.items.length === 0
                                                }
                                            >
                                                Save
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

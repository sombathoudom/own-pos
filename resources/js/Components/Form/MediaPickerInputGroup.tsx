import React, { useMemo, useState } from 'react';
import MediaPickerModal from '../Media/MediaPickerModal';

type Props = {
    label?: string;
    value: number | null;
    onChange: (id: number | null) => void;

    targetType: string; // "warehouse" | "branch"
    collection: string; // "warehouse_icon" | "branch_icon"

    // ✅ new
    previewUrl?: string | null; // pass from parent
    placeholder?: string;
    onPreviewUrlChange?: (url: string | null) => void;
};

export default function MediaIdPickerGroup({
    label = 'Image',
    value,
    onChange,
    targetType,
    collection,
    previewUrl = null,
    onPreviewUrlChange,
    placeholder = 'Pick image from Media Bank',
}: Props) {
    const [open, setOpen] = useState(false);

    const hasPreview = !!previewUrl;

    const helperText = useMemo(() => {
        if (hasPreview) return '';
        if (!value) return placeholder;
        return `Media #${value}`;
    }, [hasPreview, value, placeholder]);

    return (
        <>
            <div className="mb-3">
                <label className="form-label">{label}</label>

                <div className="input-group">
                    {/* ✅ image preview box */}
                    <div
                        className="form-control d-flex align-items-center justify-content-center p-1"
                        style={{ height: 46, overflow: 'hidden' }}
                    >
                        {hasPreview ? (
                            <img
                                src={previewUrl!}
                                alt="Selected"
                                style={{
                                    height: '100%',
                                    width: 'auto',
                                    borderRadius: 6,
                                }}
                            />
                        ) : (
                            <span className="small text-muted">
                                {helperText}
                            </span>
                        )}
                    </div>

                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setOpen(true)}
                        title="Pick image"
                    >
                        <i className="ri-image-add-line" />
                    </button>

                    {!!value && (
                        <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => {
                                onChange(null);
                                onPreviewUrlChange?.(null);
                            }}
                            title="Clear"
                        >
                            <i className="ri-close-line" />
                        </button>
                    )}
                </div>
            </div>

            <MediaPickerModal
                show={open}
                onHide={() => setOpen(false)}
                targetType={targetType}
                targetId={0}
                collection={collection}
                multiple={false}
                initialType="image"
                attachOnConfirm={false}
                onPicked={(items) => {
                    const first = items?.[0];
                    if (!first) return;

                    onChange(first.id);

                    // ✅ pick best preview source
                    const preview =
                        first.thumbnail ||
                        first.url ||
                        first.external_url ||
                        null;
                    // store preview in parent or local (recommended: parent so Edit can load too)
                    onPreviewUrlChange?.(preview);

                    setOpen(false);
                }}
            />
        </>
    );
}

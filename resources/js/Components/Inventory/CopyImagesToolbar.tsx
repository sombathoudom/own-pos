import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from 'react-bootstrap';

type VariantWithImage = {
    id: number;
    product: {
        image_url: string | null;
    };
};

type Props = {
    selectedImageIds: number[];
    setSelectedImageIds: React.Dispatch<React.SetStateAction<number[]>>;
    filteredVariants: VariantWithImage[];
    processing: boolean;
};

export default function CopyImagesToolbar({
    selectedImageIds,
    setSelectedImageIds,
    filteredVariants,
    processing,
}: Props) {
    const [copyProgress, setCopyProgress] = useState<{
        done: number;
        total: number;
    } | null>(null);

    const copyBtnRef = useRef<HTMLButtonElement>(null);

    const toggleSelectAllFiltered = () => {
        const filterableIds = filteredVariants
            .filter((v) => v.product.image_url)
            .map((v) => v.id);
        if (filterableIds.length === 0) return;

        const allSelected = filterableIds.every((id) =>
            selectedImageIds.includes(id),
        );
        if (allSelected) {
            setSelectedImageIds((prev) =>
                prev.filter((id) => !filterableIds.includes(id)),
            );
        } else {
            setSelectedImageIds((prev) =>
                Array.from(new Set([...prev, ...filterableIds])),
            );
        }
    };

    // Pattern matches the user's working vanilla-JS: async function +
    // await navigator.clipboard.write(). Safari preserves transient
    // activation across await inside an async handler but NOT across
    // .then() callbacks (which create fresh execution contexts).
    const copyAllSelectedImages = useCallback(async () => {
        const imageSrcs: string[] = [];
        document.querySelectorAll('.product-card').forEach((card) => {
            const checkbox = card.querySelector(
                '.pos-check input[type="checkbox"]',
            ) as HTMLInputElement | null;
            const img = card.querySelector(
                '.pos-img',
            ) as HTMLImageElement | null;
            if (checkbox && checkbox.checked && img && img.src) {
                imageSrcs.push(img.src);
            }
        });

        if (imageSrcs.length === 0) {
            alert('Please select at least 1 image.');
            return;
        }

        const THUMB_WIDTH = 1200;
        const total = imageSrcs.length;
        setCopyProgress({ done: 0, total });
        let done = 0;

        const items: ClipboardItem[] = [];

        imageSrcs.forEach((src) => {
            const imagePromise = fetch(src)
                .then((r) => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.blob();
                })
                .then(
                    (blob) =>
                        new Promise<Blob>((resolve, reject) => {
                            const image = new Image();
                            image.src = URL.createObjectURL(blob);
                            image.onload = () => {
                                const scale = Math.min(
                                    1,
                                    THUMB_WIDTH / image.width,
                                );
                                const c = document.createElement('canvas');
                                c.width = Math.round(image.width * scale);
                                c.height = Math.round(image.height * scale);
                                const ctx = c.getContext('2d');
                                if (!ctx) {
                                    URL.revokeObjectURL(image.src);
                                    return reject(
                                        new Error('No canvas context'),
                                    );
                                }
                                ctx.drawImage(image, 0, 0, c.width, c.height);
                                c.toBlob(
                                    (png) =>
                                        png
                                            ? resolve(png)
                                            : reject(
                                                  new Error('toBlob failed'),
                                              ),
                                    'image/png',
                                );
                                URL.revokeObjectURL(image.src);
                            };
                            image.onerror = () => {
                                URL.revokeObjectURL(image.src);
                                reject(new Error('Decode failed'));
                            };
                        }),
                );

            imagePromise
                .then(() => {
                    done++;
                    setCopyProgress({ done, total });
                })
                .catch(() => {
                    done++;
                    setCopyProgress({ done, total });
                });

            items.push(new ClipboardItem({ 'image/png': imagePromise }));
        });

        try {
            await navigator.clipboard.write(items);
            setCopyProgress(null);
            alert(
                `Successfully copied ${items.length} item${items.length > 1 ? 's' : ''} to clipboard!`,
            );
        } catch (err) {
            setCopyProgress(null);
            console.error(err);
            alert(
                'Execution error: ' +
                    (err instanceof Error ? err.message : String(err)),
            );
        }
    }, []);

    // Use el.onclick (property) — same mechanism as the HTML onclick
    // attribute used in the working vanilla-JS version. Safari treats
    // this as a direct user gesture, unlike addEventListener.
    useEffect(() => {
        const el = copyBtnRef.current;
        if (!el) return;
        el.onclick = copyAllSelectedImages as unknown as (
            this: GlobalEventHandlers,
            ev: MouseEvent,
        ) => unknown;
        return () => {
            if (copyBtnRef.current) copyBtnRef.current.onclick = null;
        };
    }, [copyAllSelectedImages]);

    const disabled = processing || selectedImageIds.length === 0;
    const withImages = filteredVariants.filter((v) => v.product.image_url);
    const allWithImagesSelected =
        withImages.length > 0 &&
        withImages.every((v) => selectedImageIds.includes(v.id));

    return (
        <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
                <Button
                    variant="outline-secondary"
                    size="sm"
                    disabled={processing || filteredVariants.length === 0}
                    onClick={toggleSelectAllFiltered}
                >
                    {allWithImagesSelected ? 'Deselect All' : 'Select All'}
                </Button>
                <small className="text-muted">
                    {selectedImageIds.length} selected
                    {withImages.length > 0 && (
                        <> / {withImages.length} with images</>
                    )}
                </small>
            </div>
            <Button
                ref={copyBtnRef}
                variant="success"
                size="sm"
                disabled={disabled}
            >
                <i className="ri-file-copy-line me-1"></i>
                {copyProgress
                    ? `Copying ${copyProgress.done} / ${copyProgress.total}...`
                    : `Copy Images (${selectedImageIds.length})`}
            </Button>
        </div>
    );
}

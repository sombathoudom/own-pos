import { useState } from 'react';
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

/**
 * Toolbar with "Select All", image count, and "Copy Images" button.
 *
 * The clipboard copy uses DOM queries (`.product-card`, `.pos-check`,
 * `.pos-img`) so Safari sees a synchronous user gesture — the same
 * pattern that works in the user's vanilla-JS version.
 */
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

    const copyAllSelectedImages = async () => {
        // 1. Collect image URLs from checked cards — must be synchronous
        //    so Safari sees a fresh user gesture.
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

        // 2. Build ClipboardItems SYNCHRONOUSLY — this is the critical
        //    step that locks in Safari's user gesture.  Each item wraps
        //    a promise that fetches → resizes → returns a PNG blob.
        const THUMB_WIDTH = 1200;
        const total = imageSrcs.length;
        setCopyProgress({ done: 0, total });
        let done = 0;

        const clipboardItemsArray: ClipboardItem[] = [];

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
                                const canvas = document.createElement('canvas');
                                canvas.width = Math.round(image.width * scale);
                                canvas.height = Math.round(
                                    image.height * scale,
                                );
                                const ctx = canvas.getContext('2d');
                                if (!ctx) {
                                    URL.revokeObjectURL(image.src);
                                    return reject(
                                        new Error(
                                            'Could not get canvas context',
                                        ),
                                    );
                                }
                                ctx.drawImage(
                                    image,
                                    0,
                                    0,
                                    canvas.width,
                                    canvas.height,
                                );
                                canvas.toBlob(
                                    (pngBlob) =>
                                        pngBlob
                                            ? resolve(pngBlob)
                                            : reject(
                                                  new Error(
                                                      'Canvas toBlob failed',
                                                  ),
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

            // Track progress (independent of clipboard write)
            imagePromise
                .then(() => {
                    done++;
                    setCopyProgress({ done, total });
                })
                .catch(() => {
                    done++;
                    setCopyProgress({ done, total });
                });

            // Construct ClipboardItem synchronously — this is where
            // Safari validates the user gesture.
            clipboardItemsArray.push(
                new ClipboardItem({ 'image/png': imagePromise }),
            );
        });

        // 3. Write to clipboard.  Safari already validated the gesture
        //    during step 2, so this await is safe.
        try {
            await navigator.clipboard.write(clipboardItemsArray);
            setCopyProgress(null);
            alert(
                `Successfully copied ${clipboardItemsArray.length} item${clipboardItemsArray.length > 1 ? 's' : ''} to clipboard!`,
            );
        } catch (err) {
            setCopyProgress(null);
            console.error(err);
            alert(
                'Execution error: ' +
                    (err instanceof Error ? err.message : String(err)),
            );
        }
    };

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
                variant="success"
                size="sm"
                disabled={processing || selectedImageIds.length === 0}
                onClick={copyAllSelectedImages}
            >
                <i className="ri-file-copy-line me-1"></i>
                {copyProgress
                    ? `Copying ${copyProgress.done} / ${copyProgress.total}…`
                    : `Copy Images (${selectedImageIds.length})`}
            </Button>
        </div>
    );
}

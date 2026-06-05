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
        // 1. Collect image URLs from checked cards (synchronous = the
        //    user gesture Safari requires).
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

        const total = imageSrcs.length;
        setCopyProgress({ done: 0, total });

        // 2. Fetch + resize every image to a PNG blob.
        //    We pre-resolve ALL blobs before building ClipboardItems so
        //    navigator.clipboard.write() receives settled data — this
        //    prevents Safari's gesture timer from expiring on slow prod
        //    connections (e.g. ngrok).  Localhost is fast enough that
        //    pending promises resolved before the check anyway.
        const THUMB_WIDTH = 1200;

        // Load image via Image() (same mechanism as <img> tags) then
        // resize via canvas.  No fetch() — avoids CORS / proxy issues
        // that can differ between localhost and production (ngrok).
        const loadAndResize = (src: string): Promise<Blob> =>
            new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => {
                    const scale = Math.min(1, THUMB_WIDTH / image.width);
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.round(image.width * scale);
                    canvas.height = Math.round(image.height * scale);
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        return reject(
                            new Error('Could not get canvas context'),
                        );
                    }
                    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                    canvas.toBlob(
                        (pngBlob) =>
                            pngBlob
                                ? resolve(pngBlob)
                                : reject(
                                      new Error(
                                          'Canvas toBlob conversion failed',
                                      ),
                                  ),
                        'image/png',
                    );
                };
                image.onerror = () =>
                    reject(new Error(`Failed to load: ${src}`));
                image.src = src;
            });

        let done = 0;

        const blobPromises = imageSrcs.map((src) =>
            loadAndResize(src)
                .then((pngBlob) => {
                    done++;
                    setCopyProgress({ done, total });
                    return pngBlob;
                })
                .catch((err) => {
                    done++;
                    setCopyProgress({ done, total });
                    throw err;
                }),
        );

        try {
            // 3. Wait for ALL blobs → settled data → safe to write
            const pngBlobs = await Promise.all(blobPromises);

            const items = pngBlobs.map(
                (blob) =>
                    new ClipboardItem({
                        'image/png': Promise.resolve(blob),
                    }),
            );

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

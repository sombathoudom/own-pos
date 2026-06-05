import { useCallback, useMemo, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';

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

const THUMB_WIDTH = 600;

/**
 * Append or replace the width query parameter on an image URL
 * so the clipboard fetches an optimized thumbnail instead of
 * the full-resolution original.
 */
function optimizedUrl(src: string): string {
    const url = new URL(src, window.location.origin);

    url.searchParams.set('w', String(THUMB_WIDTH));

    return url.toString();
}

/**
 * Fetch an image and return it as a Blob suitable for ClipboardItem.
 *
 * JPEG images are passed through as-is (fast, small).
 * Everything else is converted to PNG via a canvas (needed for
 * PNG/GIF/WebP sources so the clipboard can hold them).
 */
function fetchImageForClipboard(src: string): Promise<Blob> {
    return fetch(src, {
        mode: 'cors',
        cache: 'no-store',
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return response.blob();
        })
        .then((blob) => {
            /*
             * JPEG can go straight to the clipboard — no canvas
             * conversion, so it stays small and fast.
             */
            if (blob.type === 'image/jpeg') {
                return blob;
            }

            /*
             * For PNG, GIF, WebP etc. we must convert to PNG
             * because the Clipboard API only reliably supports
             * image/png (and image/jpeg in some browsers).
             */
            return new Promise<Blob>((resolve, reject) => {
                const objectUrl = URL.createObjectURL(blob);
                const image = new Image();

                const cleanup = () => {
                    URL.revokeObjectURL(objectUrl);
                };

                image.onload = () => {
                    const canvas = document.createElement('canvas');

                    canvas.width = image.naturalWidth;
                    canvas.height = image.naturalHeight;

                    const context = canvas.getContext('2d');

                    if (!context) {
                        cleanup();
                        reject(new Error('Canvas is unavailable.'));

                        return;
                    }

                    context.drawImage(image, 0, 0);

                    canvas.toBlob((pngBlob) => {
                        cleanup();

                        if (!pngBlob) {
                            reject(
                                new Error(
                                    `Could not convert image to PNG: ${src}`,
                                ),
                            );

                            return;
                        }

                        resolve(pngBlob);
                    }, 'image/png');
                };

                image.onerror = () => {
                    cleanup();

                    reject(new Error(`Could not decode image: ${src}`));
                };

                image.src = objectUrl;
            });
        });
}

export default function CopyImagesToolbar({
    selectedImageIds,
    setSelectedImageIds,
    filteredVariants,
    processing,
}: Props) {
    const [copying, setCopying] = useState(false);
    const [copyError, setCopyError] = useState<string | null>(null);

    const variantsWithImages = useMemo(
        () =>
            filteredVariants.filter(
                (
                    variant,
                ): variant is VariantWithImage & {
                    product: {
                        image_url: string;
                    };
                } => Boolean(variant.product.image_url),
            ),
        [filteredVariants],
    );

    /*
     * Build image URLs directly from the selected variant IDs.
     *
     * A Set removes duplicate URLs when several sizes/variants
     * belong to the same product.
     */
    const selectedImageUrls = useMemo(() => {
        const selectedIds = new Set(selectedImageIds);

        return Array.from(
            new Set(
                variantsWithImages
                    .filter((variant) => selectedIds.has(variant.id))
                    .map((variant) => variant.product.image_url),
            ),
        );
    }, [selectedImageIds, variantsWithImages]);

    const allWithImagesSelected =
        variantsWithImages.length > 0 &&
        variantsWithImages.every((variant) =>
            selectedImageIds.includes(variant.id),
        );

    const toggleSelectAllFiltered = () => {
        const filterableIds = variantsWithImages.map((variant) => variant.id);

        if (filterableIds.length === 0) {
            return;
        }

        if (allWithImagesSelected) {
            setSelectedImageIds((previous) =>
                previous.filter((id) => !filterableIds.includes(id)),
            );

            return;
        }

        setSelectedImageIds((previous) =>
            Array.from(new Set([...previous, ...filterableIds])),
        );
    };

    const copyAllSelectedImages = useCallback(() => {
        setCopyError(null);

        if (selectedImageUrls.length === 0) {
            alert('Please select at least one image.');

            return;
        }

        if (!window.isSecureContext) {
            alert('Clipboard image copying requires HTTPS.');

            return;
        }

        if (!navigator.clipboard?.write) {
            alert('Clipboard image writing is not supported in this browser.');

            return;
        }

        if (typeof ClipboardItem === 'undefined') {
            alert('ClipboardItem is not supported in this browser.');

            return;
        }

        /*
         * Build ClipboardItems synchronously while the click
         * is still active — each item fetches its optimized
         * thumbnail in the background.
         *
         * The optimized image endpoint always returns JPEG,
         * so we use 'image/jpeg' as the MIME type key.
         * JPEG blobs pass through fetchImageForClipboard
         * without canvas conversion — fast and small.
         */
        const clipboardItems = selectedImageUrls.map((imageUrl) => {
            const thumbUrl = optimizedUrl(imageUrl);

            return new ClipboardItem({
                'image/jpeg': fetchImageForClipboard(thumbUrl),
            });
        });

        console.log('Clipboard write starting', {
            imageCount: clipboardItems.length,
            userActivation: navigator.userActivation?.isActive,
            focused: document.hasFocus(),
            secure: window.isSecureContext,
        });

        const writePromise = navigator.clipboard.write(clipboardItems);

        setCopying(true);

        writePromise.then(
            () => {
                setCopying(false);
                setCopyError(null);

                alert(
                    `Successfully copied ${clipboardItems.length} image${
                        clipboardItems.length === 1 ? '' : 's'
                    }!`,
                );
            },
            (error: unknown) => {
                setCopying(false);

                const message =
                    error instanceof Error
                        ? `${error.name}: ${error.message}`
                        : String(error);

                setCopyError(message);

                console.error('Clipboard write failed', {
                    error,
                    message,
                    imageCount: clipboardItems.length,
                    selectedImageUrls,
                    userActivation: navigator.userActivation?.isActive,
                    focused: document.hasFocus(),
                    secure: window.isSecureContext,
                });

                alert(`Execution error: ${message}`);
            },
        );
    }, [selectedImageUrls]);

    const disabled = processing || copying || selectedImageUrls.length === 0;

    return (
        <div className="mb-2">
            <div className="d-flex align-items-center justify-content-between gap-2">
                <div className="d-flex align-items-center flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline-secondary"
                        size="sm"
                        disabled={
                            processing ||
                            copying ||
                            variantsWithImages.length === 0
                        }
                        onClick={toggleSelectAllFiltered}
                    >
                        {allWithImagesSelected ? 'Deselect All' : 'Select All'}
                    </Button>

                    <small className="text-muted">
                        {selectedImageIds.length} variants selected
                        {' / '}
                        {selectedImageUrls.length} unique images
                    </small>
                </div>

                <Button
                    type="button"
                    variant="success"
                    size="sm"
                    disabled={disabled}
                    onClick={copyAllSelectedImages}
                >
                    <i className="ri-file-copy-line me-1" />

                    {copying
                        ? 'Copying...'
                        : `Copy Images (${selectedImageUrls.length})`}
                </Button>
            </div>

            {copyError && (
                <Alert variant="danger" className="small mt-2 mb-0 py-2">
                    {copyError}
                </Alert>
            )}
        </div>
    );
}

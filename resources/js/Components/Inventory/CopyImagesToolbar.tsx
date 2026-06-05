import { useCallback, useState } from 'react';
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

const THUMB_WIDTH = 800;

function createPngPromise(src: string, onDone?: () => void): Promise<Blob> {
    return fetch(src, {
        credentials: 'same-origin',
        cache: 'force-cache',
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`Image fetch failed: HTTP ${response.status}`);
            }

            const contentType = response.headers.get('content-type') ?? '';

            if (!contentType.startsWith('image/')) {
                throw new Error(
                    `Expected image response but got: ${contentType || 'unknown'}`,
                );
            }

            return response.blob();
        })
        .then((blob) => {
            return new Promise<Blob>((resolve, reject) => {
                const objectUrl = URL.createObjectURL(blob);
                const image = new Image();

                image.onload = () => {
                    const naturalWidth = image.naturalWidth;
                    const naturalHeight = image.naturalHeight;

                    if (!naturalWidth || !naturalHeight) {
                        URL.revokeObjectURL(objectUrl);
                        reject(new Error('Invalid image dimensions'));
                        return;
                    }

                    const scale = Math.min(1, THUMB_WIDTH / naturalWidth);

                    const canvas = document.createElement('canvas');
                    canvas.width = Math.max(
                        1,
                        Math.round(naturalWidth * scale),
                    );
                    canvas.height = Math.max(
                        1,
                        Math.round(naturalHeight * scale),
                    );

                    const context = canvas.getContext('2d');

                    if (!context) {
                        URL.revokeObjectURL(objectUrl);
                        reject(new Error('No canvas context'));
                        return;
                    }

                    context.drawImage(image, 0, 0, canvas.width, canvas.height);

                    canvas.toBlob((pngBlob) => {
                        URL.revokeObjectURL(objectUrl);

                        if (!pngBlob) {
                            reject(new Error('PNG conversion failed'));
                            return;
                        }

                        resolve(pngBlob);
                    }, 'image/png');
                };

                image.onerror = () => {
                    URL.revokeObjectURL(objectUrl);
                    reject(new Error('Image decode failed'));
                };

                image.src = objectUrl;
            });
        })
        .finally(() => {
            onDone?.();
        });
}

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
            .filter((variant) => variant.product.image_url)
            .map((variant) => variant.id);

        if (filterableIds.length === 0) {
            return;
        }

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

    const getSelectedImageUrls = (): string[] => {
        return Array.from(document.querySelectorAll('.product-card'))
            .filter((card) => {
                const checkbox = card.querySelector(
                    '.pos-check input[type="checkbox"]',
                ) as HTMLInputElement | null;

                return checkbox?.checked;
            })
            .map((card) => {
                const image = card.querySelector(
                    '.pos-img',
                ) as HTMLImageElement | null;

                return image?.src;
            })
            .filter((src): src is string => Boolean(src));
    };

    const copyAllSelectedImages = useCallback(async () => {
        const imageSrcs = getSelectedImageUrls();

        if (imageSrcs.length === 0) {
            alert('Please select at least 1 image.');
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

        let done = 0;
        const total = imageSrcs.length;

        try {
            const items = imageSrcs.map((src) => {
                const pngPromise = createPngPromise(src, () => {
                    done += 1;

                    setCopyProgress({
                        done,
                        total,
                    });
                });

                return new ClipboardItem({
                    'image/png': pngPromise,
                });
            });

            console.log('Clipboard attempt', {
                count: items.length,
                userAgent: navigator.userAgent,
                secure: window.isSecureContext,
                focused: document.hasFocus(),
                visible: document.visibilityState,
                activationActive: navigator.userActivation?.isActive,
                activationHasBeenActive:
                    navigator.userActivation?.hasBeenActive,
            });

            /*
             * Important:
             * Call navigator.clipboard.write() before React state updates.
             * This helps iPhone Safari keep the button-tap user gesture.
             */
            const writePromise = navigator.clipboard.write(items);

            setCopyProgress({
                done: 0,
                total,
            });

            await writePromise;

            setCopyProgress(null);

            alert(
                `Successfully copied ${items.length} image${
                    items.length > 1 ? 's' : ''
                } to clipboard!`,
            );
        } catch (error) {
            setCopyProgress(null);

            console.error('Clipboard failed', {
                error,
                userAgent: navigator.userAgent,
                secure: window.isSecureContext,
                focused: document.hasFocus(),
                visible: document.visibilityState,
                activationActive: navigator.userActivation?.isActive,
                selectedCount: imageSrcs.length,
            });

            alert(
                error instanceof Error
                    ? `Execution error: ${error.message}`
                    : 'Execution error: Copy failed.',
            );
        }
    }, []);

    const copyOneImageForTest = useCallback(async () => {
        const imageSrcs = getSelectedImageUrls();

        if (imageSrcs.length === 0) {
            alert('Please select at least 1 image.');
            return;
        }

        try {
            const item = new ClipboardItem({
                'image/png': createPngPromise(imageSrcs[0]),
            });

            await navigator.clipboard.write([item]);

            alert('One image copied successfully.');
        } catch (error) {
            console.error(error);

            alert(
                error instanceof Error
                    ? `One-image test failed: ${error.message}`
                    : 'One-image test failed.',
            );
        }
    }, []);

    const disabled = processing || selectedImageIds.length === 0;

    const withImages = filteredVariants.filter(
        (variant) => variant.product.image_url,
    );

    const allWithImagesSelected =
        withImages.length > 0 &&
        withImages.every((variant) => selectedImageIds.includes(variant.id));

    return (
        <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center gap-2">
                <Button
                    type="button"
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

            <div className="d-flex align-items-center gap-2">
                <Button
                    type="button"
                    variant="outline-primary"
                    size="sm"
                    disabled={disabled}
                    onClick={copyOneImageForTest}
                >
                    Test 1 Image
                </Button>

                <Button
                    type="button"
                    variant="success"
                    size="sm"
                    disabled={disabled}
                    onClick={copyAllSelectedImages}
                >
                    <i className="ri-file-copy-line me-1" />

                    {copyProgress
                        ? `Copying ${copyProgress.done} / ${copyProgress.total}...`
                        : `Copy Images (${selectedImageIds.length})`}
                </Button>
            </div>
        </div>
    );
}
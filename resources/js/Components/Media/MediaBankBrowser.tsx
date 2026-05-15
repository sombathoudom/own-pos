// resources/js/Components/Media/MediaBankBrowser.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ConfirmModal from '../Common/ConfirmModal';
import { flashToast } from '../../utils/flashToast';

export type MediaItem = {
    id: number;
    kind: 'file' | 'external';
    provider?: string | null;
    title?: string | null;
    original_name?: string | null;
    mime?: string | null;
    size?: number;
    url?: string | null;
    external_url?: string | null;
    external_id?: string | null;
    thumbnail?: string | null;
};

type Page<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
};

type Props = {
    mode: 'page' | 'modal';
    selectable?: boolean;
    multiple?: boolean;
    initialType?: 'all' | 'image' | 'doc' | 'youtube';

    // ✅ returns ids + selected items (for preview / instant pick)
    onConfirmSelect?: (
        selectedIds: number[],
        selectedItems: MediaItem[],
    ) => Promise<void> | void;
    onOpenItem?: (item: MediaItem) => void;

    useAfterUploadEnabled?: boolean;
    onUseAfterUploadChange?: (v: boolean) => void;

    onUploaded?: (ids: number[]) => void;
    showUploadPanel?: boolean; // default true

    // ✅ NEW: enable instant pick behavior in modal (default true)
    instantPick?: boolean;
};

export default function MediaBankBrowser({
    mode,
    selectable = false,
    multiple = true,
    initialType = 'all',
    onConfirmSelect,
    onOpenItem,

    useAfterUploadEnabled,
    onUseAfterUploadChange,
    onUploaded,
    showUploadPanel = true,

    instantPick = true,
}: Props) {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [meta, setMeta] = useState<Page<MediaItem> | null>(null);
    const [page, setPage] = useState(1);

    const [search, setSearch] = useState('');
    const [type, setType] = useState<'all' | 'image' | 'doc' | 'youtube'>(
        initialType,
    );

    // staged upload queue
    const [queue, setQueue] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadError, setUploadError] = useState<string | null>(null);

    // youtube
    const [ytUrl, setYtUrl] = useState('');
    const [ytTitle, setYtTitle] = useState('');
    const [ytBusy, setYtBusy] = useState(false);

    // selection
    const [selected, setSelected] = useState<number[]>([]);
    const [selectedMap, setSelectedMap] = useState<Record<number, MediaItem>>(
        {},
    );

    const load = async (p = 1) => {
        const { data } = await axios.get<Page<MediaItem>>(
            route('media.index'),
            {
                headers: { Accept: 'application/json' },
                params: { search, type, page: p },
            },
        );

        setItems(data.data);

        // ✅ FIX: always enrich/overwrite map entries using latest data
        setSelectedMap((prev) => {
            const next = { ...prev };
            for (const m of data.data) next[m.id] = m;
            return next;
        });

        setMeta(data);
        setPage(data.current_page);
    };

    useEffect(() => {
        load(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type]);

    const applySearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        await load(1);
    };

    const addToQueue = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setUploadError(null);

        const incoming = Array.from(files);
        setQueue((prev) => {
            const map = new Map<string, File>();
            for (const f of prev)
                map.set(`${f.name}|${f.size}|${f.lastModified}`, f);
            for (const f of incoming)
                map.set(`${f.name}|${f.size}|${f.lastModified}`, f);
            return Array.from(map.values());
        });
    };

    const removeFromQueue = (key: string) => {
        setQueue((prev) =>
            prev.filter((f) => `${f.name}|${f.size}|${f.lastModified}` !== key),
        );
    };

    const clearQueue = () => setQueue([]);

    const uploadQueue = async () => {
        if (queue.length === 0) return;

        setUploading(true);
        setProgress(0);
        setUploadError(null);

        const fd = new FormData();
        queue.forEach((f) => fd.append('files[]', f));

        try {
            const res = await axios.post(route('media.store'), fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (evt) => {
                    if (!evt.total) return;
                    setProgress(Math.round((evt.loaded * 100) / evt.total));
                },
            });

            const uploadedIds: number[] = (res.data?.items || [])
                .map((x: any) => x?.id)
                .filter((v: any) => typeof v === 'number');

            clearQueue();
            await load(1);

            if (uploadedIds.length) onUploaded?.(uploadedIds);

            // auto-select new uploads
            if (selectable && uploadedIds.length) {
                setSelected((prev) => {
                    if (!multiple) return [uploadedIds[0]];
                    return Array.from(new Set([...prev, ...uploadedIds]));
                });

                setSelectedMap((prev) => {
                    const next = { ...prev };
                    for (const id of uploadedIds) {
                        if (!next[id]) next[id] = { id } as any;
                    }
                    return next;
                });
            }

            flashToast('success', 'Upload completed');
        } catch (e: any) {
            const msg =
                e?.response?.data?.message ||
                (typeof e?.response?.data === 'string'
                    ? e.response.data
                    : null) ||
                'Upload failed. Please try again.';
            setUploadError(msg);
            flashToast('error', msg);
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    const addYoutube = async () => {
        if (!ytUrl.trim()) return;

        setYtBusy(true);
        try {
            const res = await axios.post(route('media.youtube'), {
                url: ytUrl.trim(),
                title: ytTitle.trim() || null,
            });

            const newId = res?.data?.item?.id;

            if (selectable && newId) {
                setSelected((prev) =>
                    multiple ? Array.from(new Set([...prev, newId])) : [newId],
                );
                setSelectedMap((prev) => ({
                    ...prev,
                    [newId]: prev[newId] ?? ({ id: newId } as any),
                }));
            }

            if (newId) onUploaded?.([newId]);

            setYtUrl('');
            setYtTitle('');
            await load(1);

            flashToast('success', 'YouTube added');
        } catch (e: any) {
            const msg =
                e?.response?.data?.message ||
                (typeof e?.response?.data === 'string'
                    ? e.response.data
                    : null) ||
                'Failed to add YouTube';
            flashToast('error', msg);
        } finally {
            setYtBusy(false);
        }
    };

    const isImage = (m: MediaItem) =>
        m.kind === 'file' && (m.mime || '').startsWith('image/');
    const isYoutube = (m: MediaItem) =>
        m.kind === 'external' && m.provider === 'youtube';
    const isDoc = (m: MediaItem) => m.kind === 'file' && !isImage(m);

    const cardThumb = (m: MediaItem) => {
        if (isYoutube(m)) return m.thumbnail || '';
        if (isImage(m)) return m.url || '';
        return '';
    };

    const openItem = (m: MediaItem) => {
        if (onOpenItem) return onOpenItem(m);

        if (isYoutube(m) && m.external_id) {
            window.open(
                `https://www.youtube.com/watch?v=${m.external_id}`,
                '_blank',
            );
            return;
        }
        if (m.url) window.open(m.url, '_blank');
    };

    // Toggle select (multi)
    const toggleSelect = (id: number) => {
        if (!selectable) return;

        const item = items.find((m) => m.id === id);

        if (!multiple) {
            setSelected([id]);
            setSelectedMap(item ? { [id]: item } : { [id]: { id } as any });
            return;
        }

        setSelected((prev) => {
            const exists = prev.includes(id);

            setSelectedMap((prevMap) => {
                const next = { ...prevMap };
                if (exists) delete next[id];
                else next[id] = item ? item : ({ id } as any);
                return next;
            });

            return exists ? prev.filter((x) => x !== id) : [...prev, id];
        });
    };

    const confirmSelect = async () => {
        if (!onConfirmSelect) return;
        if (selected.length === 0) return;

        const ids = multiple ? selected : [selected[0]];
        const selectedItems = ids
            .map((id) => selectedMap[id])
            .filter(Boolean) as MediaItem[];

        await onConfirmSelect(ids, selectedItems);
    };

    // ✅ NEW: click behavior
    const handleCardClick = async (e: React.MouseEvent, m: MediaItem) => {
        if (!selectable) {
            openItem(m);
            return;
        }

        const isMultiModifier = e.ctrlKey || e.metaKey; // Ctrl (Win) / Cmd (Mac)

        // Multi mode + modifier => toggle only (stay open)
        if (multiple && isMultiModifier) {
            toggleSelect(m.id);
            return;
        }

        // Otherwise => instant pick one (close handled by modal parent)
        if (instantPick && onConfirmSelect) {
            await onConfirmSelect([m.id], [m]);
            return;
        }

        // Fallback: old toggle
        toggleSelect(m.id);
    };

    const prettySize = (bytes?: number) => {
        if (!bytes) return '';
        const kb = bytes / 1024;
        if (kb < 1024) return `${kb.toFixed(1)} KB`;
        return `${(kb / 1024).toFixed(1)} MB`;
    };

    // ---- delete modal (page mode) ----
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteLabel, setDeleteLabel] = useState<string>('');
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const askDelete = (m: MediaItem) => {
        setDeleteId(m.id);
        setDeleteLabel(m.title || m.original_name || `Media #${m.id}`);
        setConfirmOpen(true);
    };

    const doDelete = async () => {
        if (!deleteId) return;

        setDeleting(true);
        setDeleteError(null);

        try {
            await axios.post(
                route('media.destroy', deleteId),
                { _method: 'DELETE' },
                { headers: { Accept: 'application/json' } },
            );

            flashToast('success', 'Media deleted successfully');

            setConfirmOpen(false);
            setDeleteId(null);
            await load(page);
        } catch (e: any) {
            const status = e?.response?.status;
            const msg =
                e?.response?.data?.message ||
                (typeof e?.response?.data === 'string'
                    ? e.response.data
                    : null) ||
                `Delete failed (HTTP ${status ?? '?'})`;

            setDeleteError(msg);
            flashToast('error', msg);
            console.error('Delete failed:', e);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <>
            <div className="row g-3">
                {/* LEFT: Media list */}
                <div className="col-lg-8 col-12">
                    <div className="card h-100">
                        <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                            <form
                                className="d-flex align-items-center flex-wrap gap-2"
                                onSubmit={applySearch}
                            >
                                <div className="row g-3">
                                    <div className="col-lg-4 col-12">
                                        <input
                                            className="form-control"
                                            style={{ minWidth: 220 }}
                                            placeholder="Search media..."
                                            value={search}
                                            onChange={(e) =>
                                                setSearch(e.target.value)
                                            }
                                        />
                                    </div>
                                    <div className="col-lg-4 col-12">
                                        <select
                                            className="form-select"
                                            value={type}
                                            onChange={(e) =>
                                                setType(e.target.value as any)
                                            }
                                        >
                                            <option value="all">All</option>
                                            <option value="image">
                                                Images
                                            </option>
                                            <option value="doc">
                                                Documents
                                            </option>
                                            <option value="youtube">
                                                YouTube
                                            </option>
                                        </select>
                                    </div>
                                    <div className="col-lg-4 col-12">
                                        <button
                                            className="btn btn-primary"
                                            type="submit"
                                        >
                                            Search
                                        </button>
                                    </div>
                                </div>
                            </form>

                            {/* ✅ only show Use Selected when multiple=true (single click auto picks) */}
                            {selectable && mode === 'modal' && multiple && (
                                <button
                                    className="btn btn-success"
                                    type="button"
                                    disabled={selected.length === 0}
                                    onClick={confirmSelect}
                                >
                                    Use Selected ({selected.length})
                                </button>
                            )}
                        </div>

                        <div className="card-body">
                            {selectable && mode === 'modal' && (
                                <div className="small mb-2 text-muted">
                                    Click to use one item. Hold <b>Ctrl</b>/
                                    <b>Cmd</b> and click to multi-select.
                                </div>
                            )}

                            <div className="row g-3">
                                {items.map((m) => {
                                    const thumb = cardThumb(m);
                                    const label =
                                        m.title ||
                                        m.original_name ||
                                        (isYoutube(m)
                                            ? 'YouTube'
                                            : `Media #${m.id}`);
                                    const active =
                                        selectable && selected.includes(m.id);

                                    return (
                                        <div
                                            className="col-md-4 col-xl-3 col-6"
                                            key={m.id}
                                        >
                                            <div
                                                className={`h-100 rounded border p-2 ${active ? 'border-primary' : ''}`}
                                                style={{
                                                    cursor: selectable
                                                        ? 'pointer'
                                                        : 'default',
                                                }}
                                                onClick={(e) =>
                                                    handleCardClick(e, m)
                                                }
                                                title={
                                                    selectable
                                                        ? 'Select / Use'
                                                        : 'Open'
                                                }
                                            >
                                                <div
                                                    className="bg-light d-flex align-items-center justify-content-center rounded"
                                                    style={{
                                                        height: 120,
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    {thumb ? (
                                                        <img
                                                            src={thumb}
                                                            style={{
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit:
                                                                    'cover',
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="small px-2 text-center text-muted">
                                                            {isDoc(m)
                                                                ? 'Document'
                                                                : 'Media'}
                                                        </div>
                                                    )}
                                                </div>

                                                <div
                                                    className="small text-truncate mt-2"
                                                    title={label}
                                                >
                                                    {label}
                                                </div>

                                                <div
                                                    className="text-muted"
                                                    style={{ fontSize: 12 }}
                                                >
                                                    {isYoutube(m)
                                                        ? 'YouTube'
                                                        : m.mime || ''}
                                                    {m.size
                                                        ? ` • ${prettySize(m.size)}`
                                                        : ''}
                                                </div>

                                                {mode === 'page' && (
                                                    <div className="d-flex mt-2 gap-1">
                                                        <button
                                                            className="btn btn-sm btn-outline-danger w-100"
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                askDelete(m);
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {meta && meta.last_page > 1 && (
                                <div className="d-flex justify-content-center mt-4 gap-2">
                                    <button
                                        className="btn btn-outline-secondary"
                                        disabled={page <= 1}
                                        onClick={() => load(page - 1)}
                                    >
                                        Prev
                                    </button>
                                    <div className="align-self-center">
                                        Page {meta.current_page} /{' '}
                                        {meta.last_page}
                                    </div>
                                    <button
                                        className="btn btn-outline-secondary"
                                        disabled={page >= meta.last_page}
                                        onClick={() => load(page + 1)}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Upload + YouTube */}
                {showUploadPanel && (
                    <div className="col-lg-4 col-12">
                        <div className="card mb-3">
                            <div className="card-header">
                                <div className="fw-semibold">Upload</div>
                                <div className="small text-muted">
                                    Select files, review, then click Upload.
                                </div>
                            </div>

                            <div className="card-body">
                                {mode === 'modal' && (
                                    <div className="form-check form-switch mb-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="useAfterUploadSwitch"
                                            checked={!!useAfterUploadEnabled}
                                            onChange={(e) =>
                                                onUseAfterUploadChange?.(
                                                    e.target.checked,
                                                )
                                            }
                                            disabled={uploading}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor="useAfterUploadSwitch"
                                        >
                                            Use after upload
                                        </label>
                                    </div>
                                )}

                                <div className="d-flex mb-3 flex-wrap gap-2">
                                    <label className="btn btn-outline-primary mb-0">
                                        Select files
                                        <input
                                            type="file"
                                            className="d-none"
                                            multiple
                                            accept="image/*,video/mp4,.pdf,.doc,.docx,.xls,.xlsx"
                                            onChange={(e) =>
                                                addToQueue(e.target.files)
                                            }
                                            disabled={uploading}
                                        />
                                    </label>

                                    <button
                                        className="btn btn-primary"
                                        type="button"
                                        disabled={
                                            uploading || queue.length === 0
                                        }
                                        onClick={uploadQueue}
                                    >
                                        {uploading
                                            ? `Uploading ${progress}%...`
                                            : `Upload (${queue.length})`}
                                    </button>

                                    <button
                                        className="btn btn-outline-secondary"
                                        type="button"
                                        disabled={
                                            uploading || queue.length === 0
                                        }
                                        onClick={clearQueue}
                                    >
                                        Clear
                                    </button>
                                </div>

                                {uploadError && (
                                    <div className="alert alert-danger mb-2 py-2">
                                        {uploadError}
                                    </div>
                                )}

                                {queue.length === 0 ? (
                                    <div className="text-muted">
                                        No files selected.
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table-sm mb-0 table align-middle">
                                            <thead>
                                                <tr>
                                                    <th style={{ width: 70 }}>
                                                        Preview
                                                    </th>
                                                    <th>Name</th>
                                                    <th style={{ width: 90 }} />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {queue.map((f) => {
                                                    const key = `${f.name}|${f.size}|${f.lastModified}`;
                                                    const isImg =
                                                        f.type.startsWith(
                                                            'image/',
                                                        );
                                                    return (
                                                        <tr key={key}>
                                                            <td>
                                                                {isImg ? (
                                                                    <img
                                                                        src={URL.createObjectURL(
                                                                            f,
                                                                        )}
                                                                        style={{
                                                                            width: 48,
                                                                            height: 48,
                                                                            objectFit:
                                                                                'cover',
                                                                        }}
                                                                        className="rounded border"
                                                                        onLoad={(
                                                                            e,
                                                                        ) => {
                                                                            const img =
                                                                                e.target as HTMLImageElement;
                                                                            URL.revokeObjectURL(
                                                                                img.src,
                                                                            );
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="small text-muted">
                                                                        FILE
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td
                                                                style={{
                                                                    minWidth: 0,
                                                                }}
                                                            >
                                                                <div className="fw-semibold text-truncate">
                                                                    {f.name}
                                                                </div>
                                                                <div className="small text-truncate text-muted">
                                                                    {f.type ||
                                                                        'unknown'}
                                                                </div>
                                                            </td>
                                                            <td className="text-end">
                                                                <button
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    type="button"
                                                                    disabled={
                                                                        uploading
                                                                    }
                                                                    onClick={() =>
                                                                        removeFromQueue(
                                                                            key,
                                                                        )
                                                                    }
                                                                >
                                                                    Remove
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>

                                        {uploading && (
                                            <div className="mt-3">
                                                <div className="progress">
                                                    <div
                                                        className="progress-bar"
                                                        role="progressbar"
                                                        style={{
                                                            width: `${progress}%`,
                                                        }}
                                                    >
                                                        {progress}%
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <div className="fw-semibold">Add YouTube</div>
                                <div className="small text-muted">
                                    Save a YouTube link into Media Bank.
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="mb-2">
                                    <input
                                        className="form-control"
                                        placeholder="YouTube URL"
                                        value={ytUrl}
                                        onChange={(e) =>
                                            setYtUrl(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="mb-2">
                                    <input
                                        className="form-control"
                                        placeholder="Title (optional)"
                                        value={ytTitle}
                                        onChange={(e) =>
                                            setYtTitle(e.target.value)
                                        }
                                    />
                                </div>
                                <button
                                    className="btn btn-outline-success w-100"
                                    type="button"
                                    onClick={addYoutube}
                                    disabled={ytBusy}
                                >
                                    {ytBusy ? 'Adding...' : 'Add YouTube'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmModal
                show={confirmOpen}
                onHide={() => {
                    setConfirmOpen(false);
                    setDeleteError(null);
                }}
                title="Delete media"
                message={
                    <>
                        Delete <b>{deleteLabel}</b>? This cannot be undone.
                        {deleteError && (
                            <div className="alert alert-danger mt-3 mb-0 py-2">
                                {deleteError}
                            </div>
                        )}
                    </>
                }
                confirmText="Delete"
                confirmVariant="danger"
                busy={deleting}
                onConfirm={doDelete}
            />
        </>
    );
}

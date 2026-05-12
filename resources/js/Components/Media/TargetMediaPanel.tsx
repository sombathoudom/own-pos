// resources/js/Components/Media/TargetMediaPanel.tsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Button } from "react-bootstrap";
import { flashToast } from "../../utils/flashToast";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Item = {
  id: number;
  kind: "file" | "external";
  provider?: string | null;
  title?: string | null;
  original_name?: string | null;
  mime?: string | null;
  url?: string | null;
  thumbnail?: string | null;
  external_id?: string | null;
  collection: string;
  sort: number;
  is_primary: boolean;
};

export type CollectionConfig = {
  key: string;
  label: string;
  view: "cards" | "docs";
  allowSetPrimary?: boolean;
  sortable?: boolean; // ✅ enable drag-drop for this collection
};

type Props = {
  targetType: string;
  targetId: number;
  collections: CollectionConfig[];
  refreshKey?: number;
};

function SortableCardWithHandle({
  id,
  handle,
  children,
}: {
  id: number;
  handle: React.ReactNode;
  children: React.ReactNode;
}) {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    setActivatorNodeRef,
    listeners,
    attributes,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  //  return (
  //   <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
  //     {children}
  //   </div>
  // );
  
  return (
    <div ref={setNodeRef} style={style}>
      {/* ✅ drag handle only */}
      <div ref={setActivatorNodeRef} {...listeners} {...attributes} style={{ cursor: "grab" }}>
        {handle}
      </div>
      {children}
    </div>
  );
}

export default function TargetMediaPanel({
  targetType,
  targetId,
  collections,
  refreshKey,
}: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Local order for sortable collections (so UI order is stable)
  const [orderMap, setOrderMap] = useState<Record<string, number[]>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const load = async () => {
    const { data } = await axios.get(route("media.attached"), {
      headers: { Accept: "application/json" },
      params: { target_type: targetType, target_id: targetId },
    });

    const list: Item[] = (data.items || []).map((x: any) => ({
      ...x,
      sort: typeof x.sort === "number" ? x.sort : 0,
    }));

    setItems(list);

    // Init orderMap for sortable collections if not set yet
    setOrderMap((prev) => {
      const next = { ...prev };
      for (const c of collections) {
        if (!c.sortable) continue;
        if (next[c.key]?.length) continue;

        const ids = list
          .filter((it) => it.collection === c.key)
          .slice()
          .sort((a, b) => a.sort - b.sort)
          .map((it) => it.id);

        if (ids.length) next[c.key] = ids;
      }
      return next;
    });
  };

  useEffect(() => {
    if (!targetId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, refreshKey]);

  const byCollection = useMemo(() => {
    const map: Record<string, Item[]> = {};
    for (const it of items) {
      map[it.collection] ??= [];
      map[it.collection].push(it);
    }
    return map;
  }, [items]);

  const openItem = (m: Item) => {
    if (m.kind === "external" && m.provider === "youtube" && m.external_id) {
      window.open(`https://www.youtube.com/watch?v=${m.external_id}`, "_blank");
      return;
    }
    if (m.url) window.open(m.url, "_blank");
  };

  const thumb = (m: Item) => {
    const isImage = m.kind === "file" && (m.mime || "").startsWith("image/");
    if (m.kind === "external") return m.thumbnail;
    if (isImage) return m.url;
    return null;
  };

  const detach = async (mediaId: number, collection: string) => {
    setBusyId(mediaId);
    try {
      await axios.post(
        route("media.detach"),
        {
          target_type: targetType,
          target_id: targetId,
          collection,
          media_id: mediaId,
        },
        { headers: { Accept: "application/json" } }
      );

      flashToast("success", "Removed");

      // Update local order
      setOrderMap((prev) => {
        if (!prev[collection]) return prev;
        return { ...prev, [collection]: prev[collection].filter((id) => id !== mediaId) };
      });

      await load();
    } catch (e: any) {
      flashToast("error", e?.response?.data?.message ?? "Remove failed");
    } finally {
      setBusyId(null);
    }
  };

  const setPrimary = async (mediaId: number, collection: string) => {
    setBusyId(mediaId);
    try {
      await axios.post(
        route("media.setPrimary"),
        {
          target_type: targetType,
          target_id: targetId,
          collection,
          media_id: mediaId,
        },
        { headers: { Accept: "application/json" } }
      );

      flashToast("success", "Updated");
      await load();
    } catch (e: any) {
      flashToast("error", e?.response?.data?.message ?? "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const getOrderedList = (collectionKey: string): Item[] => {
    const list = (byCollection[collectionKey] || []).slice();

    const order = orderMap[collectionKey];
    if (order?.length) {
      const pos = new Map<number, number>();
      order.forEach((id, idx) => pos.set(id, idx));

      return list.sort((a, b) => {
        const pa = pos.has(a.id) ? pos.get(a.id)! : 1e9 + a.sort;
        const pb = pos.has(b.id) ? pos.get(b.id)! : 1e9 + b.sort;
        return pa - pb;
      });
    }

    return list.sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort - b.sort
    );
  };

  const persistReorder = async (collectionKey: string, orderedIds: number[]) => {
    await axios.post(
      route("media.reorder"),
      {
        target_type: targetType,
        target_id: targetId,
        collection: collectionKey,
        ordered_ids: orderedIds,
      },
      { headers: { Accept: "application/json" } }
    );
  };

  const onDragEndFor = (collectionKey: string, list: Item[]) => async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const oldIndex = list.findIndex((x) => x.id === active.id);
    const newIndex = list.findIndex((x) => x.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const nextList = arrayMove(list, oldIndex, newIndex);
    const orderedIds = nextList.map((x) => x.id);

    // optimistic UI
    setOrderMap((prev) => ({ ...prev, [collectionKey]: orderedIds }));

    try {
      await persistReorder(collectionKey, orderedIds);
      flashToast("success", "Reordered");
      await load(); // sync sort values from server
    } catch (e: any) {
      flashToast("error", e?.response?.data?.message ?? "Reorder failed");
      await load(); // rollback
    }
  };

  return (
    <div className="mt-3">
      {collections.map((c) => {
        const list = getOrderedList(c.key);

        return (
          <div key={c.key} className="mb-3">
            <div className="fw-semibold mb-2">{c.label}</div>

            {c.view === "docs" ? (
              list.length === 0 ? (
                <div className="text-muted">None.</div>
              ) : (
                <div className="list-group">
                  {list.map((d) => (
                    <div
                      key={d.id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div style={{ minWidth: 0 }}>
                        <div className="fw-semibold text-truncate">
                          {d.title || d.original_name || `Doc #${d.id}`}
                        </div>
                        <div className="text-muted small">{d.mime}</div>
                      </div>

                      <div className="d-flex gap-2">
                        <Button size="sm" variant="outline-secondary" onClick={() => openItem(d)}>
                          Open
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          disabled={busyId === d.id}
                          onClick={() => detach(d.id, c.key)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : c.sortable ? (
              // ✅ Sortable cards with handle
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={onDragEndFor(c.key, list)}
              >
                <SortableContext items={list.map((x) => x.id)} strategy={rectSortingStrategy}>
                  <div className="d-flex gap-2 flex-wrap">
                    {list.length === 0 ? (
                      <div className="text-muted">None.</div>
                    ) : (
                      list.map((m) => (
                        <SortableCardWithHandle
                          key={m.id}
                          id={m.id}
                          handle={
                            <div
                              className="text-muted small"
                              style={{
                                userSelect: "none",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 6,
                              }}
                              title="Drag to reorder"
                            >
                              <span style={{ fontSize: 16, lineHeight: 1 }}>⋮⋮</span>
                              <span className="ms-2">Drag</span>
                            </div>
                          }
                        >
                          <div className="border rounded p-2">
                            <div
                              className="bg-light rounded"
                              style={{
                                width: 140,
                                height: 140,
                                overflow: "hidden",
                                cursor: "pointer",
                              }}
                              onClick={() => openItem(m)}
                              title="Click to open"
                            >
                              {thumb(m) ? (
                                <img
                                  src={thumb(m) || ""}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                <div className="h-100 d-flex align-items-center justify-content-center text-muted small">
                                  Media
                                </div>
                              )}
                            </div>

                            <div className="small mt-2 text-truncate" style={{ maxWidth: 140 }}>
                              {m.title || m.original_name || `Media #${m.id}`}
                            </div>

                            <div className="d-flex gap-2 mt-2 flex-wrap">
                              {c.allowSetPrimary && !m.is_primary && (
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  disabled={busyId === m.id}
                                  onClick={() => setPrimary(m.id, c.key)}
                                >
                                  Set primary
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline-danger"
                                disabled={busyId === m.id}
                                onClick={() => detach(m.id, c.key)}
                              >
                                Remove
                              </Button>
                            </div>

                            <div className="text-muted small mt-2" style={{ fontSize: 11 }}>
                              Drag handle to reorder
                            </div>
                          </div>
                        </SortableCardWithHandle>
                      ))
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              // Non-sortable cards
              <div className="d-flex gap-2 flex-wrap">
                {list.length === 0 ? (
                  <div className="text-muted">None.</div>
                ) : (
                  list.map((m) => (
                    <div key={m.id} className="border rounded p-2">
                      <div
                        className="bg-light rounded"
                        style={{
                          width: 140,
                          height: 140,
                          overflow: "hidden",
                          cursor: "pointer",
                        }}
                        onClick={() => openItem(m)}
                      >
                        {thumb(m) ? (
                          <img
                            src={thumb(m) || ""}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <div className="h-100 d-flex align-items-center justify-content-center text-muted small">
                            Media
                          </div>
                        )}
                      </div>

                      <div className="small mt-2 text-truncate" style={{ maxWidth: 140 }}>
                        {m.title || m.original_name || `Media #${m.id}`}
                      </div>

                      <div className="d-flex gap-2 mt-2 flex-wrap">
                        {c.allowSetPrimary && !m.is_primary && (
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            disabled={busyId === m.id}
                            onClick={() => setPrimary(m.id, c.key)}
                          >
                            Set primary
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline-danger"
                          disabled={busyId === m.id}
                          onClick={() => detach(m.id, c.key)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
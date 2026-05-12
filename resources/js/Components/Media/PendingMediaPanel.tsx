import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Button } from "react-bootstrap";

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

type MediaItem = {
  id: number;
  kind: "file" | "external";
  provider?: string | null;
  title?: string | null;
  original_name?: string | null;
  mime?: string | null;
  url?: string | null;
  thumbnail?: string | null;
  external_id?: string | null;
};

type Props = {
  title: string;
  ids: number[];
  onRemove: (id: number) => void;
  onClear?: () => void;

  sortable?: boolean;
  onReorder?: (nextIds: number[]) => void;
};

function SortableBoxWithHandle({
  id,
  handle,
  children,
}: {
  id: number;
  handle: React.ReactNode;
  children: React.ReactNode;
}) {
  const { setNodeRef, transform, transition, isDragging, setActivatorNodeRef, listeners, attributes } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Handle only */}
      <div
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        style={{ cursor: "grab" }}
      >
        {handle}
      </div>

      {children}
    </div>
  );
}

export default function PendingMediaPanel({
  title,
  ids,
  onRemove,
  onClear,
  sortable = true,
  onReorder,
}: Props) {
  const [items, setItems] = useState < MediaItem[] > ([]);
  const idsKey = useMemo(() => ids.join(","), [ids]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  useEffect(() => {
    const run = async () => {
      if (!ids.length) {
        setItems([]);
        return;
      }
      const { data } = await axios.get(route("media.byIds"), {
        headers: { Accept: "application/json" },
        params: { ids: ids.join(",") },
      });

      console.log("media.byIds raw:", data);
console.log("media.byIds items:", data?.items);

      // keep display order = ids order
      const fetched: MediaItem[] = data.items || [];
      const map = new Map < number, MediaItem> ();
      fetched.forEach((x) => map.set(x.id, x));
      setItems(ids.map((id) => map.get(id)).filter(Boolean) as MediaItem[]);
    };

    run();
  }, [idsKey]);

  const openItem = (m: MediaItem) => {
    if (m.kind === "external" && m.provider === "youtube" && m.external_id) {
      window.open(`https://www.youtube.com/watch?v=${m.external_id}`, "_blank");
      return;
    }
    if (m.url) window.open(m.url, "_blank");
  };

  const thumb = (m: MediaItem) => {
    // external (youtube)
    if (m.kind === "external") return m.thumbnail || null;

    const url = m.url || null;

    // file image by mime
    const mime = (m.mime || "").toLowerCase();
    const isImage = mime.startsWith("image/");
    if (isImage) return url;

    // ✅ fallback when mime is missing: detect by file extension
    if (url && /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url)) return url;

    // optional: backend can provide thumbnail for files too
    if (m.thumbnail) return m.thumbnail;

    return null;
  };

  const onDragEnd = (event: DragEndEvent) => {
    if (!sortable) return;
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const oldIndex = ids.findIndex((x) => x === active.id);
    const newIndex = ids.findIndex((x) => x === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const nextIds = arrayMove(ids, oldIndex, newIndex);
    onReorder?.(nextIds);

    // optimistic UI
    setItems((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="fw-semibold">{title}</div>

          <div className="d-flex gap-2">
            {sortable && ids.length > 1 && (
              <div className="text-muted small align-self-center">Drag handle to reorder</div>
            )}

            {onClear && ids.length > 0 && (
              <Button size="sm" variant="outline-secondary" onClick={onClear}>
                Clear
              </Button>
            )}
          </div>
        </div>

        {ids.length === 0 ? (
          <div className="text-muted">None.</div>
        ) : sortable ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={ids} strategy={rectSortingStrategy}>
              <div className="d-flex gap-2 flex-wrap">
                {items.map((m) => (
                  <SortableBoxWithHandle
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
                        style={{ width: 120, height: 120, overflow: "hidden", cursor: "pointer" }}
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

                      <div className="small mt-2 text-truncate" style={{ maxWidth: 120 }}>
                        {m.title || m.original_name || `#${m.id}`}
                      </div>

                      <Button
                        size="sm"
                        variant="outline-danger"
                        className="mt-2 w-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemove(m.id);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </SortableBoxWithHandle>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="d-flex gap-2 flex-wrap">
            {items.map((m) => (
              <div key={m.id} className="border rounded p-2">
                <div
                  className="bg-light rounded"
                  style={{ width: 120, height: 120, overflow: "hidden", cursor: "pointer" }}
                  onClick={() => openItem(m)}
                >
                  {thumb(m) ? (
                    <img src={thumb(m) || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div className="h-100 d-flex align-items-center justify-content-center text-muted small">Media</div>
                  )}
                </div>
                <div className="small mt-2 text-truncate" style={{ maxWidth: 120 }}>
                  {m.title || m.original_name || `#${m.id}`}
                </div>
                <Button size="sm" variant="outline-danger" className="mt-2 w-100" onClick={() => onRemove(m.id)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
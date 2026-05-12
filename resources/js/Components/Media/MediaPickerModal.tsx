import React, { useEffect, useState } from "react";
import axios from "axios";
import { Modal } from "react-bootstrap";

import MediaBankBrowser, { type MediaItem } from "./MediaBankBrowser";
import { flashToast } from "../../utils/flashToast";

type Props = {
  show: boolean;
  onHide: () => void;

  targetType: string;
  targetId: number;
  collection: string;

  multiple?: boolean;
  initialType?: "all" | "image" | "doc" | "youtube";
  makePrimary?: boolean;

  // if false => do NOT attach immediately (store pending in parent)
  attachOnConfirm?: boolean; // default true

  // ✅ create-mode: return actual media items (for preview)
  onPicked?: (items: MediaItem[]) => void;

  onAttached?: () => void;
};

export default function MediaPickerModal({
  show,
  onHide,
  targetType,
  targetId,
  collection,
  multiple = true,
  initialType = "all",
  makePrimary = false,

  attachOnConfirm = true,
  onPicked,

  onAttached,
}: Props) {
  const [useAfterUpload, setUseAfterUpload] = useState(true);

  useEffect(() => {
    if (!show) return;
    setUseAfterUpload(true);
  }, [show]);

  const doAttach = async (ids: number[]) => {
    await axios.post(
      route("media.attach"),
      {
        target_type: targetType,
        target_id: targetId,
        collection,
        media_ids: ids,
        make_primary: makePrimary || !multiple,
      },
      { headers: { Accept: "application/json" } }
    );
  };

  const attachSelected = async (selectedIds: number[], selectedItems: MediaItem[] = []) => {
    // ✅ create mode => return items for preview
    if (!attachOnConfirm) {
      const fallbackItems = selectedItems.length
        ? selectedItems
        : selectedIds.map((id) => ({ id, kind: "file" } as any));

      onPicked?.(multiple ? fallbackItems : [fallbackItems[0]]);
      flashToast("success", "Added to pending media (will attach after save)");
      onHide();
      return;
    }

    try {
      await doAttach(selectedIds);
      flashToast("success", "Media attached successfully");
      onHide();
      onAttached?.();
    } catch (e: any) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        `Attach failed (HTTP ${status ?? "?"})`;
      flashToast("error", msg);
      console.error("Attach failed:", e);
    }
  };

  const fetchByIds = async (ids: number[]): Promise<MediaItem[]> => {
    if (!ids.length) return [];
    const { data } = await axios.get(route("media.byIds"), {
      headers: { Accept: "application/json" },
      params: { ids: ids.join(",") },
    });
    return (data?.items || []) as MediaItem[];
  };

  const handleUploaded = async (uploadedIds: number[]) => {
    if (!uploadedIds?.length) return;
    if (!useAfterUpload) return;

    // edit mode => auto attach
    if (attachOnConfirm) {
      try {
        await doAttach(multiple ? uploadedIds : [uploadedIds[0]]);
        flashToast("success", "Uploaded & attached");
        onAttached?.();

        // ✅ optional: close modal because "use after upload" implies apply immediately
        onHide();
      } catch (e: any) {
        const status = e?.response?.status;
        const msg =
          e?.response?.data?.message ||
          (typeof e?.response?.data === "string" ? e.response.data : null) ||
          `Auto-attach failed (HTTP ${status ?? "?"})`;
        flashToast("error", msg);
      }
      return;
    }

    // create mode => fetch items then store pending (so preview shows)
    try {
      const items = await fetchByIds(multiple ? uploadedIds : [uploadedIds[0]]);
      onPicked?.(items);
      flashToast("success", "Uploaded & added to pending media");
      // keep modal open or close? choose close to reduce steps:
      onHide();
    } catch (e: any) {
      flashToast("error", "Uploaded but failed to load preview info");
      onPicked?.((multiple ? uploadedIds : [uploadedIds[0]]).map((id) => ({ id, kind: "file" } as any)));
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <div>
          <h5 className="modal-title mb-0">Media Bank</h5>
          <div className="text-muted small">
            {attachOnConfirm ? (
              <>
                Attach to <b>{targetType}</b> #{targetId} — collection: <b>{collection}</b>
                <span className="ms-2">• Click to use. Ctrl/Cmd+Click to multi-select.</span>
              </>
            ) : (
              <>Create mode — items will be attached after you save the {targetType}.</>
            )}
          </div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <MediaBankBrowser
          mode="modal"
          selectable
          multiple={multiple}
          initialType={initialType}
          instantPick={true} // ✅ important for reduced steps
          onConfirmSelect={(ids, items) => attachSelected(ids, items)}
          useAfterUploadEnabled={useAfterUpload}
          onUseAfterUploadChange={setUseAfterUpload}
          onUploaded={handleUploaded}
        />
      </Modal.Body>
    </Modal>
  );
}
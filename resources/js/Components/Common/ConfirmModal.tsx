import React from 'react';
import { Button, Modal } from 'react-bootstrap';

type Props = {
    show: boolean;
    onHide: () => void;
    title?: string;
    message?: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: string; // e.g. "danger"
    busy?: boolean;

    onConfirm: () => void;
};

export default function ConfirmModal({
    show,
    onHide,
    title = 'Confirm',
    message = 'Are you sure?',
    confirmText = 'Yes, delete',
    cancelText = 'Cancel',
    confirmVariant = 'danger',
    busy = false,
    onConfirm,
}: Props) {
    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <h5 className="modal-title">{title}</h5>
            </Modal.Header>

            <Modal.Body>
                <div className="text-muted">{message}</div>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="light" onClick={onHide} disabled={busy}>
                    {cancelText}
                </Button>
                <Button
                    variant={confirmVariant as any}
                    onClick={onConfirm}
                    disabled={busy}
                >
                    {busy ? 'Deleting...' : confirmText}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

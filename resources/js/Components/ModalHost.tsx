import React from 'react';
import Modal from 'react-bootstrap/Modal';

type Props = {
    title: string;
    open: boolean;
    onClosed?: () => void;
    children: React.ReactNode;
    size?: 'sm' | 'lg' | 'xl';
};

export default function ModalHost({
    title,
    open,
    onClosed,
    children,
    size,
}: Props) {
    return (
        <Modal
            show={open}
            onHide={onClosed}
            centered
            backdrop="static"
            size={size}
        >
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>{children}</Modal.Body>
        </Modal>
    );
}

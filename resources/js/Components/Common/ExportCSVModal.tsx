import PropTypes from 'prop-types';
import { Modal } from 'react-bootstrap';
import { CSVLink } from 'react-csv';

interface ExportCSVModalProps {
    show: boolean;
    onCloseClick: () => void;
    data: any;
}

const ExportCSVModal = ({ show, onCloseClick, data }: ExportCSVModalProps) => {
    return (
        <Modal show={show} onHide={onCloseClick} centered={true}>
            <Modal.Header closeButton></Modal.Header>
            <Modal.Body className="px-5 py-3">
                <div className="mt-2 text-center">
                    <i className="ri-file-text-line display-5 text-success"></i>

                    <div className="fs-15 mx-sm-5 mx-4 mt-4 pt-2">
                        <h4>Are you sure ?</h4>
                        <p className="mx-4 mb-0 text-muted">
                            Are you sure you want to export CSV file?
                        </p>
                    </div>
                </div>
                <div className="d-flex justify-content-center mt-4 mb-2 gap-2">
                    <button
                        type="button"
                        className="btn btn-light w-sm"
                        data-bs-dismiss="modal"
                        onClick={onCloseClick}
                    >
                        Close
                    </button>
                    <CSVLink
                        data={data}
                        type="button"
                        onClick={onCloseClick}
                        className="btn btn-success w-sm"
                        id="delete-record"
                    >
                        Download
                    </CSVLink>
                </div>
            </Modal.Body>
        </Modal>
    );
};

ExportCSVModal.propTypes = {
    onCloseClick: PropTypes.func,
    data: PropTypes.any,
    show: PropTypes.any,
};

export default ExportCSVModal;

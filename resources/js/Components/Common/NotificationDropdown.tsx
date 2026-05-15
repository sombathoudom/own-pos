import React, { useState } from 'react';
import { Button, Col, Dropdown, Nav, NavLink, Row, Tab } from 'react-bootstrap';

//import images
import avatar2 from '../../../images/users/avatar-2.jpg';
import avatar8 from '../../../images/users/avatar-8.jpg';
import avatar3 from '../../../images/users/avatar-3.jpg';
import avatar6 from '../../../images/users/avatar-6.jpg';
import bell from '../../../images/svg/bell.svg';

//SimpleBar
import SimpleBar from 'simplebar-react';

const NotificationDropdown = () => {
    //Dropdown Toggle
    const [isNotificationDropdown, setIsNotificationDropdown] = useState(false);

    const toggleNotificationDropdown = () => {
        setIsNotificationDropdown(!isNotificationDropdown);
    };

    return (
        <React.Fragment>
            <Dropdown
                show={isNotificationDropdown}
                onClick={toggleNotificationDropdown}
                className="topbar-head-dropdown header-item ms-1"
            >
                <Dropdown.Toggle
                    type="button"
                    as={Button}
                    className="arrow-none btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
                >
                    <i className="bx bx-bell fs-22"></i>
                    <span className="position-absolute topbar-badge fs-10 translate-middle badge rounded-pill bg-danger">
                        3
                        <span className="visually-hidden">unread messages</span>
                    </span>
                </Dropdown.Toggle>
                <Dropdown.Menu className="dropdown-menu-lg dropdown-menu-end p-0">
                    <div className="bg-pattern rounded-top bg-primary p-3">
                        <Row className="align-items-center">
                            <Col>
                                <h6 className="fs-16 fw-semibold m-0 text-white">
                                    {' '}
                                    Notifications{' '}
                                </h6>
                            </Col>
                            <div className="dropdown-tabs col-auto">
                                <span className="badge bg-light-subtle fs-13 text-body">
                                    {' '}
                                    4 New
                                </span>
                            </div>
                        </Row>
                    </div>

                    <Tab.Container defaultActiveKey="all">
                        <div className="bg-pattern bg-primary px-2 pt-2">
                            <Nav
                                className="nav-tabs nav-tabs-custom"
                                role="tablist"
                            >
                                <Nav.Item className="waves-effect waves-light">
                                    <NavLink eventKey="all"> All (4) </NavLink>
                                </Nav.Item>
                                <Nav.Item className="waves-effect waves-light">
                                    <NavLink eventKey="messages">
                                        {' '}
                                        Meassages{' '}
                                    </NavLink>
                                </Nav.Item>
                                <Nav.Item className="waves-effect waves-light">
                                    <NavLink eventKey="alerts">
                                        {' '}
                                        Alerts{' '}
                                    </NavLink>
                                </Nav.Item>
                            </Nav>
                        </div>

                        {/* </div> */}

                        <Tab.Content>
                            <Tab.Pane
                                id="all"
                                eventKey="all"
                                className="py-2 ps-2"
                            >
                                <SimpleBar
                                    style={{ maxHeight: '300px' }}
                                    className="pe-2"
                                >
                                    <div className="text-reset notification-item d-block dropdown-item position-relative">
                                        <div className="d-flex">
                                            <div className="avatar-xs me-3 flex-shrink-0">
                                                <span className="avatar-title bg-info-subtle text-info rounded-circle fs-16">
                                                    <i className="bx bx-badge-check"></i>
                                                </span>
                                            </div>
                                            <div className="flex-grow-1">
                                                <a
                                                    href="#"
                                                    className="stretched-link"
                                                >
                                                    <h6 className="lh-base mt-0 mb-2">
                                                        Your <b>Elite</b> author
                                                        Graphic Optimization{' '}
                                                        <span className="text-secondary">
                                                            reward
                                                        </span>{' '}
                                                        is ready!
                                                    </h6>
                                                </a>
                                                <p className="fs-11 fw-medium text-uppercase mb-0 text-muted">
                                                    <span>
                                                        <i className="mdi mdi-clock-outline"></i>{' '}
                                                        Just 30 sec ago
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="fs-15 px-2">
                                                <div className="form-check notification-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        value=""
                                                        id="all-notification-check01"
                                                    />
                                                    <label
                                                        className="form-check-label"
                                                        htmlFor="all-notification-check01"
                                                    ></label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-reset notification-item d-block dropdown-item position-relative active">
                                        <div className="d-flex">
                                            <img
                                                src={avatar2}
                                                className="rounded-circle avatar-xs me-3"
                                                alt="user-pic"
                                            />
                                            <div className="flex-grow-1">
                                                <Button
                                                    variant="link"
                                                    href="#"
                                                    className="stretched-link p-0"
                                                >
                                                    <h6 className="fs-13 fw-semibold mt-0 mb-1">
                                                        Angela Bernier
                                                    </h6>
                                                </Button>
                                                <div className="fs-13 text-muted">
                                                    <p className="mb-1">
                                                        Answered to your comment
                                                        on the cash flow
                                                        forecast's graph 🔔.
                                                    </p>
                                                </div>
                                                <p className="fs-11 fw-medium text-uppercase mb-0 text-muted">
                                                    <span>
                                                        <i className="mdi mdi-clock-outline"></i>{' '}
                                                        48 min ago
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="fs-15 px-2">
                                                <div className="form-check notification-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        value=""
                                                        id="all-notification-check02"
                                                    />
                                                    <label
                                                        className="form-check-label"
                                                        htmlFor="all-notification-check02"
                                                    ></label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-reset notification-item d-block dropdown-item position-relative">
                                        <div className="d-flex">
                                            <div className="avatar-xs me-3 flex-shrink-0">
                                                <span className="avatar-title bg-danger-subtle text-danger rounded-circle fs-16">
                                                    <i className="bx bx-message-square-dots"></i>
                                                </span>
                                            </div>
                                            <div className="flex-grow-1">
                                                <Button
                                                    variant="link"
                                                    href="#"
                                                    className="stretched-link p-0"
                                                >
                                                    <h6 className="fs-13 lh-base mt-0 mb-2">
                                                        You have received{' '}
                                                        <b className="text-success">
                                                            20
                                                        </b>{' '}
                                                        new messages in the
                                                        conversation
                                                    </h6>
                                                </Button>
                                                <p className="fs-11 fw-medium text-uppercase mb-0 text-muted">
                                                    <span>
                                                        <i className="mdi mdi-clock-outline"></i>{' '}
                                                        2 hrs ago
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="fs-15 px-2">
                                                <div className="form-check notification-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        value=""
                                                        id="all-notification-check03"
                                                    />
                                                    <label
                                                        className="form-check-label"
                                                        htmlFor="all-notification-check03"
                                                    ></label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-reset notification-item d-block dropdown-item position-relative">
                                        <div className="d-flex">
                                            <img
                                                src={avatar8}
                                                className="rounded-circle avatar-xs me-3"
                                                alt="user-pic"
                                            />
                                            <div className="flex-grow-1">
                                                <Button
                                                    variant="link"
                                                    href="#"
                                                    className="stretched-link p-0"
                                                >
                                                    <h6 className="fs-13 fw-semibold mt-0 mb-1">
                                                        Maureen Gibson
                                                    </h6>
                                                </Button>
                                                <div className="fs-13 text-muted">
                                                    <p className="mb-1">
                                                        We talked about a
                                                        project on linkedin.
                                                    </p>
                                                </div>
                                                <p className="fs-11 fw-medium text-uppercase mb-0 text-muted">
                                                    <span>
                                                        <i className="mdi mdi-clock-outline"></i>{' '}
                                                        4 hrs ago
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="fs-15 px-2">
                                                <div className="form-check notification-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        value=""
                                                        id="all-notification-check04"
                                                    />
                                                    <label
                                                        className="form-check-label"
                                                        htmlFor="all-notification-check04"
                                                    ></label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="my-3 text-center">
                                        <button
                                            type="button"
                                            className="btn btn-soft-success waves-effect waves-light"
                                        >
                                            View All Notifications{' '}
                                            <i className="ri-arrow-right-line align-middle"></i>
                                        </button>
                                    </div>
                                </SimpleBar>
                            </Tab.Pane>

                            <Tab.Pane
                                id="messages"
                                eventKey="messages"
                                className="py-2 ps-2"
                            >
                                <SimpleBar
                                    style={{ maxHeight: '300px' }}
                                    className="pe-2"
                                >
                                    <div className="text-reset notification-item d-block dropdown-item">
                                        <div className="d-flex">
                                            <img
                                                src={avatar3}
                                                className="rounded-circle avatar-xs me-3"
                                                alt="user-pic"
                                            />
                                            <div className="flex-grow-1">
                                                <Button
                                                    variant="link"
                                                    href="#"
                                                    className="stretched-link p-0"
                                                >
                                                    <h6 className="fs-13 fw-semibold mt-0 mb-1">
                                                        James Lemire
                                                    </h6>
                                                </Button>
                                                <div className="fs-13 text-muted">
                                                    <p className="mb-1">
                                                        We talked about a
                                                        project on linkedin.
                                                    </p>
                                                </div>
                                                <p className="fs-11 fw-medium text-uppercase mb-0 text-muted">
                                                    <span>
                                                        <i className="mdi mdi-clock-outline"></i>{' '}
                                                        30 min ago
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="fs-15 px-2">
                                                <div className="form-check notification-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        value=""
                                                        id="messages-notification-check01"
                                                    />
                                                    <label
                                                        className="form-check-label"
                                                        htmlFor="messages-notification-check01"
                                                    ></label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-reset notification-item d-block dropdown-item">
                                        <div className="d-flex">
                                            <img
                                                src={avatar2}
                                                className="rounded-circle avatar-xs me-3"
                                                alt="user-pic"
                                            />
                                            <div className="flex-grow-1">
                                                <Button
                                                    variant="link"
                                                    href="#"
                                                    className="stretched-link p-0"
                                                >
                                                    <h6 className="fs-13 fw-semibold mt-0 mb-1">
                                                        Angela Bernier
                                                    </h6>
                                                </Button>
                                                <div className="fs-13 text-muted">
                                                    <p className="mb-1">
                                                        Answered to your comment
                                                        on the cash flow
                                                        forecast's graph 🔔.
                                                    </p>
                                                </div>
                                                <p className="fs-11 fw-medium text-uppercase mb-0 text-muted">
                                                    <span>
                                                        <i className="mdi mdi-clock-outline"></i>{' '}
                                                        2 hrs ago
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="fs-15 px-2">
                                                <div className="form-check notification-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        value=""
                                                        id="messages-notification-check02"
                                                    />
                                                    <label
                                                        className="form-check-label"
                                                        htmlFor="messages-notification-check02"
                                                    ></label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-reset notification-item d-block dropdown-item">
                                        <div className="d-flex">
                                            <img
                                                src={avatar6}
                                                className="rounded-circle avatar-xs me-3"
                                                alt="user-pic"
                                            />
                                            <div className="flex-grow-1">
                                                <Button
                                                    variant="link"
                                                    href="#"
                                                    className="stretched-link p-0"
                                                >
                                                    <h6 className="fs-13 fw-semibold mt-0 mb-1">
                                                        Kenneth Brown
                                                    </h6>
                                                </Button>
                                                <div className="fs-13 text-muted">
                                                    <p className="mb-1">
                                                        Mentionned you in his
                                                        comment on 📃 invoice
                                                        #12501.{' '}
                                                    </p>
                                                </div>
                                                <p className="fs-11 fw-medium text-uppercase mb-0 text-muted">
                                                    <span>
                                                        <i className="mdi mdi-clock-outline"></i>{' '}
                                                        10 hrs ago
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="fs-15 px-2">
                                                <div className="form-check notification-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        value=""
                                                        id="messages-notification-check03"
                                                    />
                                                    <label
                                                        className="form-check-label"
                                                        htmlFor="messages-notification-check03"
                                                    ></label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-reset notification-item d-block dropdown-item">
                                        <div className="d-flex">
                                            <img
                                                src={avatar8}
                                                className="rounded-circle avatar-xs me-3"
                                                alt="user-pic"
                                            />
                                            <div className="flex-grow-1">
                                                <Button
                                                    variant="link"
                                                    href="#"
                                                    className="stretched-link p-0"
                                                >
                                                    <h6 className="fs-13 fw-semibold mt-0 mb-1">
                                                        Maureen Gibson
                                                    </h6>
                                                </Button>
                                                <div className="fs-13 text-muted">
                                                    <p className="mb-1">
                                                        We talked about a
                                                        project on linkedin.
                                                    </p>
                                                </div>
                                                <p className="fs-11 fw-medium text-uppercase mb-0 text-muted">
                                                    <span>
                                                        <i className="mdi mdi-clock-outline"></i>{' '}
                                                        3 days ago
                                                    </span>
                                                </p>
                                            </div>
                                            <div className="fs-15 px-2">
                                                <div className="form-check notification-check">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        value=""
                                                        id="messages-notification-check04"
                                                    />
                                                    <label
                                                        className="form-check-label"
                                                        htmlFor="messages-notification-check04"
                                                    ></label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="my-3 text-center">
                                        <button
                                            type="button"
                                            className="btn btn-soft-success waves-effect waves-light"
                                        >
                                            View All Messages{' '}
                                            <i className="ri-arrow-right-line align-middle"></i>
                                        </button>
                                    </div>
                                </SimpleBar>
                            </Tab.Pane>

                            <Tab.Pane
                                id="alerts"
                                eventKey="alerts"
                                className="p-4"
                            >
                                <div className="w-sm-50 mx-auto w-25 pt-3">
                                    <img
                                        src={bell}
                                        className="img-fluid"
                                        alt="user-pic"
                                    />
                                </div>
                                <div className="mt-2 pb-5 text-center">
                                    <h6 className="fs-18 fw-semibold lh-base">
                                        Hey! You have no any notifications{' '}
                                    </h6>
                                </div>
                            </Tab.Pane>
                        </Tab.Content>
                    </Tab.Container>
                </Dropdown.Menu>
            </Dropdown>
        </React.Fragment>
    );
};

export default NotificationDropdown;

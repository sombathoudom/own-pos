import React, { useEffect, useState } from 'react';
import { Offcanvas, Collapse, Form } from 'react-bootstrap';

//redux
import {
    changeLayout,
    changeSidebarTheme,
    changeLayoutMode,
    changeLayoutWidth,
    changeLayoutPosition,
    changeTopbarTheme,
    changeLeftsidebarSizeType,
    changeLeftsidebarViewType,
    changeSidebarImageType,
    changePreLoader,
    changeSidebarVisibility,
    // resetValue
} from '../../slices/thunk';

//import Constant
import {
    LAYOUT_TYPES,
    LAYOUT_SIDEBAR_TYPES,
    LAYOUT_MODE_TYPES,
    LAYOUT_WIDTH_TYPES,
    LAYOUT_POSITION_TYPES,
    LAYOUT_TOPBAR_THEME_TYPES,
    LEFT_SIDEBAR_SIZE_TYPES,
    LEFT_SIDEBAR_VIEW_TYPES,
    LEFT_SIDEBAR_IMAGE_TYPES,
    PERLOADER_TYPES,
    SIDEBAR_VISIBILITY_TYPES,
} from '../constants/layout';

//SimpleBar
import SimpleBar from 'simplebar-react';
import classnames from 'classnames';
import { useShallow } from 'zustand/react/shallow';

//import Images
import img01 from '../../scss/images/sidebar/img-1.jpg';
import img02 from '../../scss/images/sidebar/img-2.jpg';
import img03 from '../../scss/images/sidebar/img-3.jpg';
import img04 from '../../scss/images/sidebar/img-4.jpg';
import { useLayoutStore } from '../../stores/layout-store';

const RightSidebar = (props: any) => {
    const dispatch = (action: unknown) => action;

    const [show, setShow] = useState<boolean>(false);

    function tog_show() {
        setShow(!show);
        dispatch(changeSidebarTheme('gradient'));
    }

    useEffect(() => {
        const sidebarColorDark = document.getElementById(
            'sidebar-color-dark',
        ) as HTMLInputElement;
        const sidebarColorLight = document.getElementById(
            'sidebar-color-light',
        ) as HTMLInputElement;

        if (show && sidebarColorDark && sidebarColorLight) {
            sidebarColorDark.checked = false;
            sidebarColorLight.checked = false;
        }
    }, [show]);

    const {
        layoutType,
        leftSidebarType,
        layoutModeType,
        layoutWidthType,
        layoutPositionType,
        topbarThemeType,
        leftsidbarSizeType,
        leftSidebarViewType,
        leftSidebarImageType,
        preloader,
        sidebarVisibilitytype,
    } = useLayoutStore(
        useShallow((state) => ({
            layoutType: state.layoutType,
            leftSidebarType: state.leftSidebarType,
            layoutModeType: state.layoutModeType,
            layoutWidthType: state.layoutWidthType,
            layoutPositionType: state.layoutPositionType,
            topbarThemeType: state.topbarThemeType,
            leftsidbarSizeType: state.leftsidbarSizeType,
            leftSidebarViewType: state.leftSidebarViewType,
            leftSidebarImageType: state.leftSidebarImageType,
            preloader: state.preloader,
            sidebarVisibilitytype: state.sidebarVisibilitytype,
        })),
    );

    // open offcanvas
    const [open, setOpen] = useState<boolean>(false);
    const toggleLeftCanvas = () => {
        setOpen(!open);
    };

    const scrollFunction = () => {
        const element = document.getElementById('back-to-top');
        if (element) {
            if (
                document.body.scrollTop > 100 ||
                document.documentElement.scrollTop > 100
            ) {
                element.style.display = 'block';
            } else {
                element.style.display = 'none';
            }
        }
    };

    const toTop = () => {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    };

    const pathName = window.location.pathname;

    useEffect(() => {
        const onScroll = () => {
            scrollFunction();
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        return () => {
            window.removeEventListener('scroll', onScroll);
        };
    }, []);

    useEffect(() => {
        const preloader = document.getElementById('preloader') as HTMLElement;

        if (preloader) {
            preloader.style.opacity = '1';
            preloader.style.visibility = 'visible';

            setTimeout(function () {
                preloader.style.opacity = '0';
                preloader.style.visibility = 'hidden';
            }, 1000);
        }
    }, [pathName]);

    return (
        <React.Fragment>
            <button
                onClick={() => toTop()}
                className="btn btn-danger btn-icon"
                id="back-to-top"
            >
                <i className="ri-arrow-up-line"></i>
            </button>

            {preloader === 'enable' && (
                <div id="preloader">
                    <div id="status">
                        <div
                            className="spinner-border avatar-sm text-primary"
                            role="status"
                        >
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <div className="customizer-setting d-none d-md-block">
                    <div
                        onClick={toggleLeftCanvas}
                        className="btn-info rounded-pill btn btn-icon btn-lg rounded-pill p-2 shadow-lg"
                    >
                        <i className="mdi mdi-spin mdi-cog-outline fs-22"></i>
                    </div>
                </div>
                <Offcanvas
                    show={open}
                    onHide={toggleLeftCanvas}
                    placement="end"
                    className="offcanvas-end border-0"
                >
                    <Offcanvas.Header
                        className="d-flex align-items-center bg-gradient offcanvas-header-dark bg-primary p-3"
                        closeButton
                    >
                        <span className="m-0 me-2 text-white">
                            Theme Customizer
                        </span>
                    </Offcanvas.Header>
                    <Offcanvas.Body className="p-0">
                        <SimpleBar className="h-100">
                            <div className="p-4">
                                <h6 className="fw-semibold text-uppercase mb-0">
                                    Layout
                                </h6>
                                <p className="text-muted">
                                    Vertical layout is locked for this app.
                                </p>

                                <div className="row gy-3">
                                    <div className="col-12">
                                        <div className="form-check card-radio">
                                            <input
                                                id="customizer-layout01"
                                                name="data-layout"
                                                type="radio"
                                                value={LAYOUT_TYPES.VERTICAL}
                                                checked={
                                                    layoutType ===
                                                    LAYOUT_TYPES.VERTICAL
                                                }
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        dispatch(
                                                            changeLayout(
                                                                e.target.value,
                                                            ),
                                                        );
                                                    }
                                                }}
                                                className="form-check-input"
                                            />
                                            <label
                                                className="form-check-label avatar-md w-100 p-0"
                                                htmlFor="customizer-layout01"
                                            >
                                                <span className="d-flex h-100 gap-1">
                                                    <span className="flex-shrink-0">
                                                        <span className="bg-light d-flex flex-column h-100 gap-1 p-1">
                                                            <span className="d-block bg-primary-subtle mb-2 rounded p-1 px-2"></span>
                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                        </span>
                                                    </span>
                                                    <span className="flex-grow-1">
                                                        <span className="d-flex flex-column h-100">
                                                            <span className="bg-light d-block p-1"></span>
                                                            <span className="bg-light d-block mt-auto p-1"></span>
                                                        </span>
                                                    </span>
                                                </span>
                                            </label>
                                        </div>
                                        <h5 className="fs-13 mt-2 text-center">
                                            Vertical
                                        </h5>
                                    </div>
                                    <div className="d-none col-4">
                                        <div className="form-check card-radio">
                                            <input
                                                id="customizer-layout02"
                                                name="data-layout"
                                                type="radio"
                                                value={LAYOUT_TYPES.HORIZONTAL}
                                                checked={
                                                    layoutType ===
                                                    LAYOUT_TYPES.HORIZONTAL
                                                }
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        dispatch(
                                                            changeLayout(
                                                                e.target.value,
                                                            ),
                                                        );
                                                    }
                                                }}
                                                className="form-check-input"
                                            />
                                            <label
                                                className="form-check-label avatar-md w-100 p-0"
                                                htmlFor="customizer-layout02"
                                            >
                                                <span className="d-flex flex-column h-100 gap-1">
                                                    <span className="bg-light d-flex align-items-center gap-1 p-1">
                                                        <span className="d-block bg-primary-subtle me-1 rounded p-1"></span>
                                                        <span className="d-block bg-primary-subtle ms-auto p-1 px-2 pb-0"></span>
                                                        <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                    </span>
                                                    <span className="bg-light d-block p-1"></span>
                                                    <span className="bg-light d-block mt-auto p-1"></span>
                                                </span>
                                            </label>
                                        </div>
                                        <h5 className="fs-13 mt-2 text-center">
                                            Horizontal
                                        </h5>
                                    </div>
                                    <div className="d-none col-4">
                                        <div className="form-check card-radio">
                                            <input
                                                id="customizer-layout03"
                                                name="data-layout"
                                                type="radio"
                                                value={LAYOUT_TYPES.TWOCOLUMN}
                                                checked={
                                                    layoutType ===
                                                    LAYOUT_TYPES.TWOCOLUMN
                                                }
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        dispatch(
                                                            changeLayout(
                                                                e.target.value,
                                                            ),
                                                        );
                                                    }
                                                }}
                                                className="form-check-input"
                                            />
                                            <label
                                                className="form-check-label avatar-md w-100 p-0"
                                                htmlFor="customizer-layout03"
                                            >
                                                <span className="d-flex h-100 gap-1">
                                                    <span className="flex-shrink-0">
                                                        <span className="bg-light d-flex flex-column h-100 gap-1">
                                                            <span className="d-block bg-primary-subtle mb-2 p-1"></span>
                                                            <span className="d-block bg-primary-subtle p-1 pb-0"></span>
                                                            <span className="d-block bg-primary-subtle p-1 pb-0"></span>
                                                            <span className="d-block bg-primary-subtle p-1 pb-0"></span>
                                                        </span>
                                                    </span>
                                                    <span className="flex-shrink-0">
                                                        <span className="bg-light d-flex flex-column h-100 gap-1 p-1">
                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                        </span>
                                                    </span>
                                                    <span className="flex-grow-1">
                                                        <span className="d-flex flex-column h-100">
                                                            <span className="bg-light d-block p-1"></span>
                                                            <span className="bg-light d-block mt-auto p-1"></span>
                                                        </span>
                                                    </span>
                                                </span>
                                            </label>
                                        </div>
                                        <h5 className="fs-13 mt-2 text-center">
                                            Two Column
                                        </h5>
                                    </div>
                                    <div className="d-none col-4">
                                        <div className="form-check card-radio">
                                            <input
                                                id="customizer-layout04"
                                                name="data-layout"
                                                type="radio"
                                                className="form-check-input"
                                                value={LAYOUT_TYPES.SEMIBOX}
                                                checked={
                                                    layoutType ===
                                                    LAYOUT_TYPES.SEMIBOX
                                                }
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        dispatch(
                                                            changeLayout(
                                                                e.target.value,
                                                            ),
                                                        );
                                                    }
                                                }}
                                            />
                                            <label
                                                className="form-check-label avatar-md w-100 p-0"
                                                htmlFor="customizer-layout04"
                                            >
                                                <span className="d-flex h-100 gap-1">
                                                    <span className="flex-shrink-0 p-1">
                                                        <span className="bg-light d-flex flex-column h-100 gap-1 p-1">
                                                            <span className="d-block bg-primary-subtle mb-2 rounded p-1 px-2"></span>
                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                        </span>
                                                    </span>
                                                    <span className="flex-grow-1">
                                                        <span className="d-flex flex-column h-100 pe-2 pt-1">
                                                            <span className="bg-light d-block p-1"></span>
                                                            <span className="bg-light d-block mt-auto p-1"></span>
                                                        </span>
                                                    </span>
                                                </span>
                                            </label>
                                        </div>
                                        <h5 className="fs-13 mt-2 text-center">
                                            Semi Box
                                        </h5>
                                    </div>
                                </div>

                                <h6 className="fw-semibold text-uppercase mt-4 mb-0">
                                    Color Scheme
                                </h6>
                                <p className="text-muted">
                                    Choose Light or Dark Scheme.
                                </p>

                                <div className="colorscheme-cardradio">
                                    <div className="row">
                                        <div className="col-4">
                                            <div className="form-check card-radio">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="data-bs-theme"
                                                    id="layout-mode-light"
                                                    value={
                                                        LAYOUT_MODE_TYPES.LIGHTMODE
                                                    }
                                                    checked={
                                                        layoutModeType ===
                                                        LAYOUT_MODE_TYPES.LIGHTMODE
                                                    }
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            dispatch(
                                                                changeLayoutMode(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            );
                                                        }
                                                    }}
                                                />
                                                <label
                                                    className="form-check-label avatar-md w-100 p-0"
                                                    htmlFor="layout-mode-light"
                                                >
                                                    <span className="d-flex h-100 gap-1">
                                                        <span className="flex-shrink-0">
                                                            <span className="bg-light d-flex flex-column h-100 gap-1 p-1">
                                                                <span className="d-block bg-primary-subtle mb-2 rounded p-1 px-2"></span>
                                                                <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                            </span>
                                                        </span>
                                                        <span className="flex-grow-1">
                                                            <span className="d-flex flex-column h-100">
                                                                <span className="bg-light d-block p-1"></span>
                                                                <span className="bg-light d-block mt-auto p-1"></span>
                                                            </span>
                                                        </span>
                                                    </span>
                                                </label>
                                            </div>
                                            <h5 className="fs-13 mt-2 text-center">
                                                Light
                                            </h5>
                                        </div>

                                        <div className="col-4">
                                            <div className="form-check card-radio dark">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="data-bs-theme"
                                                    id="layout-mode-dark"
                                                    value={
                                                        LAYOUT_MODE_TYPES.DARKMODE
                                                    }
                                                    checked={
                                                        layoutModeType ===
                                                        LAYOUT_MODE_TYPES.DARKMODE
                                                    }
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            dispatch(
                                                                changeLayoutMode(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            );
                                                        }
                                                    }}
                                                />
                                                <label
                                                    className="form-check-label avatar-md bg-dark w-100 p-0"
                                                    htmlFor="layout-mode-dark"
                                                >
                                                    <span className="d-flex h-100 gap-1">
                                                        <span className="flex-shrink-0">
                                                            <span className="bg-opacity-10 d-flex flex-column h-100 gap-1 bg-white p-1">
                                                                <span className="d-block bg-opacity-10 mb-2 rounded bg-white p-1 px-2"></span>
                                                                <span className="d-block bg-opacity-10 bg-white p-1 px-2 pb-0"></span>
                                                                <span className="d-block bg-opacity-10 bg-white p-1 px-2 pb-0"></span>
                                                                <span className="d-block bg-opacity-10 bg-white p-1 px-2 pb-0"></span>
                                                            </span>
                                                        </span>
                                                        <span className="flex-grow-1">
                                                            <span className="d-flex flex-column h-100">
                                                                <span className="bg-opacity-10 d-block bg-white p-1"></span>
                                                                <span className="bg-opacity-10 d-block mt-auto bg-white p-1"></span>
                                                            </span>
                                                        </span>
                                                    </span>
                                                </label>
                                            </div>
                                            <h5 className="fs-13 mt-2 text-center">
                                                Dark
                                            </h5>
                                        </div>
                                    </div>
                                </div>
                                {layoutType === LAYOUT_TYPES.SEMIBOX && (
                                    <div id="sidebar-visibility">
                                        <h6 className="fw-semibold text-uppercase mt-4 mb-0">
                                            Sidebar Visibility
                                        </h6>
                                        <p className="text-muted">
                                            Choose show or Hidden sidebar.
                                        </p>

                                        <div className="row">
                                            <div className="col-4">
                                                <div className="form-check card-radio">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="data-sidebar-visibility"
                                                        id="sidebar-visibility-show"
                                                        value={
                                                            SIDEBAR_VISIBILITY_TYPES.SHOW
                                                        }
                                                        checked={
                                                            sidebarVisibilitytype ===
                                                            SIDEBAR_VISIBILITY_TYPES.SHOW
                                                        }
                                                        onChange={(e) => {
                                                            if (
                                                                e.target.checked
                                                            ) {
                                                                dispatch(
                                                                    changeSidebarVisibility(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <label
                                                        className="form-check-label avatar-md w-100 p-0"
                                                        htmlFor="sidebar-visibility-show"
                                                    >
                                                        <span className="d-flex h-100 gap-1">
                                                            <span className="flex-shrink-0 p-1">
                                                                <span className="bg-light d-flex flex-column h-100 gap-1 p-1">
                                                                    <span className="d-block bg-primary-subtle mb-2 rounded p-1 px-2"></span>
                                                                    <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                    <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                    <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                </span>
                                                            </span>
                                                            <span className="flex-grow-1">
                                                                <span className="d-flex flex-column h-100 pe-2 pt-1">
                                                                    <span className="bg-light d-block p-1"></span>
                                                                    <span className="bg-light d-block mt-auto p-1"></span>
                                                                </span>
                                                            </span>
                                                        </span>
                                                    </label>
                                                </div>
                                                <h5 className="fs-13 mt-2 text-center">
                                                    Show
                                                </h5>
                                            </div>
                                            <div className="col-4">
                                                <div className="form-check card-radio">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="data-sidebar-visibility"
                                                        id="sidebar-visibility-hidden"
                                                        value={
                                                            SIDEBAR_VISIBILITY_TYPES.HIDDEN
                                                        }
                                                        checked={
                                                            sidebarVisibilitytype ===
                                                            SIDEBAR_VISIBILITY_TYPES.HIDDEN
                                                        }
                                                        onChange={(e) => {
                                                            if (
                                                                e.target.checked
                                                            ) {
                                                                dispatch(
                                                                    changeSidebarVisibility(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <label
                                                        className="form-check-label avatar-md w-100 p-0 px-2"
                                                        htmlFor="sidebar-visibility-hidden"
                                                    >
                                                        <span className="d-flex h-100 gap-1">
                                                            <span className="flex-grow-1">
                                                                <span className="d-flex flex-column h-100 px-2 pt-1">
                                                                    <span className="bg-light d-block p-1"></span>
                                                                    <span className="bg-light d-block mt-auto p-1"></span>
                                                                </span>
                                                            </span>
                                                        </span>
                                                    </label>
                                                </div>
                                                <h5 className="fs-13 mt-2 text-center">
                                                    Hidden
                                                </h5>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {layoutType !== LAYOUT_TYPES.TWOCOLUMN && (
                                    <React.Fragment>
                                        {(layoutType ===
                                            LAYOUT_TYPES.VERTICAL ||
                                            layoutType ===
                                                LAYOUT_TYPES.HORIZONTAL) && (
                                            <div id="layout-width">
                                                <h6 className="fw-semibold text-uppercase mt-4 mb-0">
                                                    Layout Width
                                                </h6>
                                                <p className="text-muted">
                                                    Choose Fluid or Boxed
                                                    layout.
                                                </p>

                                                <div className="row">
                                                    <div className="col-4">
                                                        <div className="form-check card-radio">
                                                            <input
                                                                className="form-check-input"
                                                                type="radio"
                                                                name="data-layout-width"
                                                                id="layout-width-fluid"
                                                                value={
                                                                    LAYOUT_WIDTH_TYPES.FLUID
                                                                }
                                                                checked={
                                                                    layoutWidthType ===
                                                                    LAYOUT_WIDTH_TYPES.FLUID
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.target
                                                                            .checked
                                                                    ) {
                                                                        dispatch(
                                                                            changeLayoutWidth(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                        );
                                                                        dispatch(
                                                                            changeLeftsidebarSizeType(
                                                                                'lg',
                                                                            ),
                                                                        );
                                                                    }
                                                                }}
                                                            />
                                                            <label
                                                                className="form-check-label avatar-md w-100 p-0"
                                                                htmlFor="layout-width-fluid"
                                                            >
                                                                <span className="d-flex h-100 gap-1">
                                                                    <span className="flex-shrink-0">
                                                                        <span className="bg-light d-flex flex-column h-100 gap-1 p-1">
                                                                            <span className="d-block bg-primary-subtle mb-2 rounded p-1 px-2"></span>
                                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                        </span>
                                                                    </span>
                                                                    <span className="flex-grow-1">
                                                                        <span className="d-flex flex-column h-100">
                                                                            <span className="bg-light d-block p-1"></span>
                                                                            <span className="bg-light d-block mt-auto p-1"></span>
                                                                        </span>
                                                                    </span>
                                                                </span>
                                                            </label>
                                                        </div>
                                                        <h5 className="fs-13 mt-2 text-center">
                                                            Fluid
                                                        </h5>
                                                    </div>
                                                    <div className="col-4">
                                                        <div className="form-check card-radio">
                                                            <input
                                                                className="form-check-input"
                                                                type="radio"
                                                                name="data-layout-width"
                                                                id="layout-width-boxed"
                                                                value={
                                                                    LAYOUT_WIDTH_TYPES.BOXED
                                                                }
                                                                checked={
                                                                    layoutWidthType ===
                                                                    LAYOUT_WIDTH_TYPES.BOXED
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.target
                                                                            .checked
                                                                    ) {
                                                                        dispatch(
                                                                            changeLayoutWidth(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                        );
                                                                        dispatch(
                                                                            changeLeftsidebarSizeType(
                                                                                'sm-hover',
                                                                            ),
                                                                        );
                                                                    }
                                                                }}
                                                            />
                                                            <label
                                                                className="form-check-label avatar-md w-100 p-0 px-2"
                                                                htmlFor="layout-width-boxed"
                                                            >
                                                                <span className="d-flex border-start border-end h-100 gap-1">
                                                                    <span className="flex-shrink-0">
                                                                        <span className="bg-light d-flex flex-column h-100 gap-1 p-1">
                                                                            <span className="d-block bg-primary-subtle mb-2 rounded p-1 px-2"></span>
                                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                        </span>
                                                                    </span>
                                                                    <span className="flex-grow-1">
                                                                        <span className="d-flex flex-column h-100">
                                                                            <span className="bg-light d-block p-1"></span>
                                                                            <span className="bg-light d-block mt-auto p-1"></span>
                                                                        </span>
                                                                    </span>
                                                                </span>
                                                            </label>
                                                        </div>
                                                        <h5 className="fs-13 mt-2 text-center">
                                                            Boxed
                                                        </h5>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div id="layout-position">
                                            <h6 className="fw-semibold text-uppercase mt-4 mb-0">
                                                Layout Position
                                            </h6>
                                            <p className="text-muted">
                                                Choose Fixed or Scrollable
                                                Layout Position.
                                            </p>

                                            <div
                                                className="btn-group radio"
                                                role="group"
                                            >
                                                <input
                                                    type="radio"
                                                    className="btn-check"
                                                    name="data-layout-position"
                                                    id="layout-position-fixed"
                                                    value={
                                                        LAYOUT_POSITION_TYPES.FIXED
                                                    }
                                                    checked={
                                                        layoutPositionType ===
                                                        LAYOUT_POSITION_TYPES.FIXED
                                                    }
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            dispatch(
                                                                changeLayoutPosition(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            );
                                                        }
                                                    }}
                                                />
                                                <label
                                                    className="btn btn-light w-sm"
                                                    htmlFor="layout-position-fixed"
                                                >
                                                    Fixed
                                                </label>

                                                <input
                                                    type="radio"
                                                    className="btn-check"
                                                    name="data-layout-position"
                                                    id="layout-position-scrollable"
                                                    value={
                                                        LAYOUT_POSITION_TYPES.SCROLLABLE
                                                    }
                                                    checked={
                                                        layoutPositionType ===
                                                        LAYOUT_POSITION_TYPES.SCROLLABLE
                                                    }
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            dispatch(
                                                                changeLayoutPosition(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            );
                                                        }
                                                    }}
                                                />
                                                <label
                                                    className="btn btn-light ms-0 w-sm"
                                                    htmlFor="layout-position-scrollable"
                                                >
                                                    Scrollable
                                                </label>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                )}

                                <h6 className="fw-semibold text-uppercase mt-4 mb-0">
                                    Topbar Color
                                </h6>
                                <p className="text-muted">
                                    Choose Light or Dark Topbar Color.
                                </p>

                                <div className="row">
                                    <div className="col-4">
                                        <div className="form-check card-radio">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="data-topbar"
                                                id="topbar-color-light"
                                                value={
                                                    LAYOUT_TOPBAR_THEME_TYPES.LIGHT
                                                }
                                                checked={
                                                    topbarThemeType ===
                                                    LAYOUT_TOPBAR_THEME_TYPES.LIGHT
                                                }
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        dispatch(
                                                            changeTopbarTheme(
                                                                e.target.value,
                                                            ),
                                                        );
                                                    }
                                                }}
                                            />
                                            <label
                                                className="form-check-label avatar-md w-100 p-0"
                                                htmlFor="topbar-color-light"
                                            >
                                                <span className="d-flex h-100 gap-1">
                                                    <span className="flex-shrink-0">
                                                        <span className="bg-light d-flex flex-column h-100 gap-1 p-1">
                                                            <span className="d-block bg-primary-subtle mb-2 rounded p-1 px-2"></span>
                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                        </span>
                                                    </span>
                                                    <span className="flex-grow-1">
                                                        <span className="d-flex flex-column h-100">
                                                            <span className="bg-light d-block p-1"></span>
                                                            <span className="bg-light d-block mt-auto p-1"></span>
                                                        </span>
                                                    </span>
                                                </span>
                                            </label>
                                        </div>
                                        <h5 className="fs-13 mt-2 text-center">
                                            Light
                                        </h5>
                                    </div>
                                    <div className="col-4">
                                        <div className="form-check card-radio">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="data-topbar"
                                                id="topbar-color-dark"
                                                value={
                                                    LAYOUT_TOPBAR_THEME_TYPES.DARK
                                                }
                                                checked={
                                                    topbarThemeType ===
                                                    LAYOUT_TOPBAR_THEME_TYPES.DARK
                                                }
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        dispatch(
                                                            changeTopbarTheme(
                                                                e.target.value,
                                                            ),
                                                        );
                                                    }
                                                }}
                                            />
                                            <label
                                                className="form-check-label avatar-md w-100 p-0"
                                                htmlFor="topbar-color-dark"
                                            >
                                                <span className="d-flex h-100 gap-1">
                                                    <span className="flex-shrink-0">
                                                        <span className="bg-light d-flex flex-column h-100 gap-1 p-1">
                                                            <span className="d-block bg-primary-subtle mb-2 rounded p-1 px-2"></span>
                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                        </span>
                                                    </span>
                                                    <span className="flex-grow-1">
                                                        <span className="d-flex flex-column h-100">
                                                            <span className="d-block bg-primary p-1"></span>
                                                            <span className="bg-light d-block mt-auto p-1"></span>
                                                        </span>
                                                    </span>
                                                </span>
                                            </label>
                                        </div>
                                        <h5 className="fs-13 mt-2 text-center">
                                            Dark
                                        </h5>
                                    </div>
                                </div>

                                {(layoutType === 'vertical' ||
                                    (layoutType === 'semibox' &&
                                        sidebarVisibilitytype === 'show')) && (
                                    <React.Fragment>
                                        <div id="sidebar-size">
                                            <h6 className="fw-semibold text-uppercase mt-4 mb-0">
                                                Sidebar Size
                                            </h6>
                                            <p className="text-muted">
                                                Choose a size of Sidebar.
                                            </p>

                                            <div className="row">
                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar-size"
                                                            id="sidebar-size-default"
                                                            value={
                                                                LEFT_SIDEBAR_SIZE_TYPES.DEFAULT
                                                            }
                                                            checked={
                                                                leftsidbarSizeType ===
                                                                LEFT_SIDEBAR_SIZE_TYPES.DEFAULT
                                                            }
                                                            onChange={(e) => {
                                                                if (
                                                                    e.target
                                                                        .checked
                                                                ) {
                                                                    dispatch(
                                                                        changeLeftsidebarSizeType(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        <label
                                                            className="form-check-label avatar-md w-100 p-0"
                                                            htmlFor="sidebar-size-default"
                                                        >
                                                            <span className="d-flex h-100 gap-1">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-light d-flex flex-column h-100 gap-1 p-1">
                                                                        <span className="d-block bg-primary-subtle mb-2 rounded p-1 px-2"></span>
                                                                        <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                        <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                        <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex flex-column h-100">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block mt-auto p-1"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <h5 className="fs-13 mt-2 text-center">
                                                        Default
                                                    </h5>
                                                </div>

                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar-size"
                                                            id="sidebar-size-compact"
                                                            value={
                                                                LEFT_SIDEBAR_SIZE_TYPES.COMPACT
                                                            }
                                                            checked={
                                                                leftsidbarSizeType ===
                                                                LEFT_SIDEBAR_SIZE_TYPES.COMPACT
                                                            }
                                                            onChange={(e) => {
                                                                if (
                                                                    e.target
                                                                        .checked
                                                                ) {
                                                                    dispatch(
                                                                        changeLeftsidebarSizeType(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        <label
                                                            className="form-check-label avatar-md w-100 p-0"
                                                            htmlFor="sidebar-size-compact"
                                                        >
                                                            <span className="d-flex h-100 gap-1">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-light d-flex flex-column h-100 gap-1 p-1">
                                                                        <span className="d-block bg-primary-subtle mb-2 rounded p-1"></span>
                                                                        <span className="d-block bg-primary-subtle p-1 pb-0"></span>
                                                                        <span className="d-block bg-primary-subtle p-1 pb-0"></span>
                                                                        <span className="d-block bg-primary-subtle p-1 pb-0"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex flex-column h-100">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block mt-auto p-1"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <h5 className="fs-13 mt-2 text-center">
                                                        Compact
                                                    </h5>
                                                </div>

                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar-size"
                                                            id="sidebar-size-small"
                                                            value={
                                                                LEFT_SIDEBAR_SIZE_TYPES.SMALLICON
                                                            }
                                                            checked={
                                                                leftsidbarSizeType ===
                                                                LEFT_SIDEBAR_SIZE_TYPES.SMALLICON
                                                            }
                                                            onChange={(e) => {
                                                                if (
                                                                    e.target
                                                                        .checked
                                                                ) {
                                                                    dispatch(
                                                                        changeLeftsidebarSizeType(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        <label
                                                            className="form-check-label avatar-md w-100 p-0"
                                                            htmlFor="sidebar-size-small"
                                                        >
                                                            <span className="d-flex h-100 gap-1">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-light d-flex flex-column h-100 gap-1">
                                                                        <span className="d-block bg-primary-subtle mb-2 p-1"></span>
                                                                        <span className="d-block bg-primary-subtle p-1 pb-0"></span>
                                                                        <span className="d-block bg-primary-subtle p-1 pb-0"></span>
                                                                        <span className="d-block bg-primary-subtle p-1 pb-0"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex flex-column h-100">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block mt-auto p-1"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <h5 className="fs-13 mt-2 text-center">
                                                        Small (Icon View)
                                                    </h5>
                                                </div>

                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar-size"
                                                            id="sidebar-size-small-hover"
                                                            value={
                                                                LEFT_SIDEBAR_SIZE_TYPES.SMALLHOVER
                                                            }
                                                            checked={
                                                                leftsidbarSizeType ===
                                                                LEFT_SIDEBAR_SIZE_TYPES.SMALLHOVER
                                                            }
                                                            onChange={(e) => {
                                                                if (
                                                                    e.target
                                                                        .checked
                                                                ) {
                                                                    dispatch(
                                                                        changeLeftsidebarSizeType(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        <label
                                                            className="form-check-label avatar-md w-100 p-0"
                                                            htmlFor="sidebar-size-small-hover"
                                                        >
                                                            <span className="d-flex h-100 gap-1">
                                                                <span className="flex-shrink-0">
                                                                    <span className="bg-light d-flex flex-column h-100 gap-1">
                                                                        <span className="d-block bg-primary-subtle mb-2 p-1"></span>
                                                                        <span className="d-block bg-primary-subtle p-1 pb-0"></span>
                                                                        <span className="d-block bg-primary-subtle p-1 pb-0"></span>
                                                                        <span className="d-block bg-primary-subtle p-1 pb-0"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex flex-column h-100">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block mt-auto p-1"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <h5 className="fs-13 mt-2 text-center">
                                                        Small Hover View
                                                    </h5>
                                                </div>
                                            </div>
                                        </div>

                                        {layoutType !== 'semibox' && (
                                            <div id="sidebar-view">
                                                <h6 className="fw-semibold text-uppercase mt-4 mb-0">
                                                    Sidebar View
                                                </h6>
                                                <p className="text-muted">
                                                    Choose Default or Detached
                                                    Sidebar view.
                                                </p>

                                                <div className="row">
                                                    <div className="col-4">
                                                        <div className="form-check sidebar-setting card-radio">
                                                            <input
                                                                className="form-check-input"
                                                                type="radio"
                                                                name="data-layout-style"
                                                                id="sidebar-view-default"
                                                                value={
                                                                    LEFT_SIDEBAR_VIEW_TYPES.DEFAULT
                                                                }
                                                                checked={
                                                                    leftSidebarViewType ===
                                                                    LEFT_SIDEBAR_VIEW_TYPES.DEFAULT
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.target
                                                                            .checked
                                                                    ) {
                                                                        dispatch(
                                                                            changeLeftsidebarViewType(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                        );
                                                                    }
                                                                }}
                                                            />
                                                            <label
                                                                className="form-check-label avatar-md w-100 p-0"
                                                                htmlFor="sidebar-view-default"
                                                            >
                                                                <span className="d-flex h-100 gap-1">
                                                                    <span className="flex-shrink-0">
                                                                        <span className="bg-light d-flex flex-column h-100 gap-1 p-1">
                                                                            <span className="d-block bg-primary-subtle mb-2 rounded p-1 px-2"></span>
                                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                            <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                        </span>
                                                                    </span>
                                                                    <span className="flex-grow-1">
                                                                        <span className="d-flex flex-column h-100">
                                                                            <span className="bg-light d-block p-1"></span>
                                                                            <span className="bg-light d-block mt-auto p-1"></span>
                                                                        </span>
                                                                    </span>
                                                                </span>
                                                            </label>
                                                        </div>
                                                        <h5 className="fs-13 mt-2 text-center">
                                                            Default
                                                        </h5>
                                                    </div>
                                                    <div className="col-4">
                                                        <div className="form-check sidebar-setting card-radio">
                                                            <input
                                                                className="form-check-input"
                                                                type="radio"
                                                                name="data-layout-style"
                                                                id="sidebar-view-detached"
                                                                value={
                                                                    LEFT_SIDEBAR_VIEW_TYPES.DETACHED
                                                                }
                                                                checked={
                                                                    leftSidebarViewType ===
                                                                    LEFT_SIDEBAR_VIEW_TYPES.DETACHED
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.target
                                                                            .checked
                                                                    ) {
                                                                        dispatch(
                                                                            changeLeftsidebarViewType(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                        );
                                                                    }
                                                                }}
                                                            />
                                                            <label
                                                                className="form-check-label avatar-md w-100 p-0"
                                                                htmlFor="sidebar-view-detached"
                                                            >
                                                                <span className="d-flex flex-column h-100">
                                                                    <span className="bg-light d-flex align-items-center gap-1 p-1 px-2">
                                                                        <span className="d-block bg-primary-subtle me-1 rounded p-1"></span>
                                                                        <span className="d-block bg-primary-subtle ms-auto p-1 px-2 pb-0"></span>
                                                                        <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                    </span>
                                                                    <span className="d-flex h-100 gap-1 p-1 px-2">
                                                                        <span className="flex-shrink-0">
                                                                            <span className="bg-light d-flex flex-column h-100 gap-1 p-1">
                                                                                <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                                <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                                <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                            </span>
                                                                        </span>
                                                                    </span>
                                                                    <span className="bg-light d-block mt-auto p-1 px-2"></span>
                                                                </span>
                                                            </label>
                                                        </div>
                                                        <h5 className="fs-13 mt-2 text-center">
                                                            Detached
                                                        </h5>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                )}

                                {(layoutType === 'vertical' ||
                                    layoutType === 'twocolumn' ||
                                    (layoutType === 'semibox' &&
                                        sidebarVisibilitytype === 'show')) && (
                                    <React.Fragment>
                                        <div id="sidebar-color">
                                            <h6 className="fw-semibold text-uppercase mt-4 mb-0">
                                                Sidebar Color
                                            </h6>
                                            <p className="text-muted">
                                                Choose Ligth or Dark Sidebar
                                                Color.
                                            </p>

                                            <div className="row">
                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar"
                                                            id="sidebar-color-light"
                                                            value={
                                                                LAYOUT_SIDEBAR_TYPES.LIGHT
                                                            }
                                                            checked={
                                                                leftSidebarType ===
                                                                LAYOUT_SIDEBAR_TYPES.LIGHT
                                                            }
                                                            onChange={(e) => {
                                                                setShow(false);
                                                                if (
                                                                    e.target
                                                                        .checked
                                                                ) {
                                                                    dispatch(
                                                                        changeSidebarTheme(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        <label
                                                            className="form-check-label avatar-md w-100 p-0"
                                                            htmlFor="sidebar-color-light"
                                                        >
                                                            <span className="d-flex h-100 gap-1">
                                                                <span className="flex-shrink-0">
                                                                    <span className="border-end d-flex flex-column h-100 gap-1 bg-white p-1">
                                                                        <span className="d-block bg-primary-subtle mb-2 rounded p-1 px-2"></span>
                                                                        <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                        <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                        <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex flex-column h-100">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block mt-auto p-1"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <h5 className="fs-13 mt-2 text-center">
                                                        Light
                                                    </h5>
                                                </div>
                                                <div className="col-4">
                                                    <div className="form-check sidebar-setting card-radio">
                                                        <input
                                                            className="form-check-input"
                                                            type="radio"
                                                            name="data-sidebar"
                                                            id="sidebar-color-dark"
                                                            value={
                                                                LAYOUT_SIDEBAR_TYPES.DARK
                                                            }
                                                            checked={
                                                                leftSidebarType ===
                                                                LAYOUT_SIDEBAR_TYPES.DARK
                                                            }
                                                            onChange={(e) => {
                                                                setShow(false);
                                                                if (
                                                                    e.target
                                                                        .checked
                                                                ) {
                                                                    dispatch(
                                                                        changeSidebarTheme(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        <label
                                                            className="form-check-label avatar-md w-100 p-0"
                                                            htmlFor="sidebar-color-dark"
                                                        >
                                                            <span className="d-flex h-100 gap-1">
                                                                <span className="flex-shrink-0">
                                                                    <span className="d-flex flex-column h-100 gap-1 bg-primary p-1">
                                                                        <span className="d-block bg-opacity-10 mb-2 rounded bg-white p-1 px-2"></span>
                                                                        <span className="d-block bg-opacity-10 bg-white p-1 px-2 pb-0"></span>
                                                                        <span className="d-block bg-opacity-10 bg-white p-1 px-2 pb-0"></span>
                                                                        <span className="d-block bg-opacity-10 bg-white p-1 px-2 pb-0"></span>
                                                                    </span>
                                                                </span>
                                                                <span className="flex-grow-1">
                                                                    <span className="d-flex flex-column h-100">
                                                                        <span className="bg-light d-block p-1"></span>
                                                                        <span className="bg-light d-block mt-auto p-1"></span>
                                                                    </span>
                                                                </span>
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <h5 className="fs-13 mt-2 text-center">
                                                        Dark
                                                    </h5>
                                                </div>

                                                <div className="col-4">
                                                    <button
                                                        className={classnames(
                                                            'btn btn-link avatar-md w-100 overflow-hidden border p-0',
                                                            {
                                                                collapsed:
                                                                    !show,
                                                                active:
                                                                    show ===
                                                                    true,
                                                            },
                                                        )}
                                                        type="button"
                                                        data-bs-target="#collapseBgGradient"
                                                        data-bs-toggle="collapse"
                                                        aria-controls="collapseBgGradient"
                                                        onClick={tog_show}
                                                    >
                                                        <span className="d-flex h-100 gap-1">
                                                            <span className="flex-shrink-0">
                                                                <span className="bg-vertical-gradient d-flex flex-column h-100 gap-1 p-1">
                                                                    <span className="d-block bg-opacity-10 mb-2 rounded bg-white p-1 px-2"></span>
                                                                    <span className="d-block bg-opacity-10 bg-white p-1 px-2 pb-0"></span>
                                                                    <span className="d-block bg-opacity-10 bg-white p-1 px-2 pb-0"></span>
                                                                    <span className="d-block bg-opacity-10 bg-white p-1 px-2 pb-0"></span>
                                                                </span>
                                                            </span>
                                                            <span className="flex-grow-1">
                                                                <span className="d-flex flex-column h-100">
                                                                    <span className="bg-light d-block p-1"></span>
                                                                    <span className="bg-light d-block mt-auto p-1"></span>
                                                                </span>
                                                            </span>
                                                        </span>
                                                    </button>
                                                    <h5 className="fs-13 mt-2 text-center">
                                                        Gradient
                                                    </h5>
                                                </div>
                                            </div>
                                            <Collapse
                                                in={show}
                                                className="collapse"
                                            >
                                                <div id="collapseBgGradient">
                                                    <div className="d-flex img-switch bg-light flex-wrap gap-2 rounded p-2 px-3">
                                                        <div className="form-check sidebar-setting card-radio">
                                                            <Form.Check.Input
                                                                className="form-check-input"
                                                                type="radio"
                                                                name="data-sidebar"
                                                                id="sidebar-color-gradient"
                                                                value={
                                                                    LAYOUT_SIDEBAR_TYPES.GRADIENT
                                                                }
                                                                checked={
                                                                    leftSidebarType ===
                                                                    LAYOUT_SIDEBAR_TYPES.GRADIENT
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.target
                                                                            .checked
                                                                    ) {
                                                                        dispatch(
                                                                            changeSidebarTheme(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                        );
                                                                    }
                                                                }}
                                                            />
                                                            <Form.Check.Label
                                                                className="form-check-label avatar-xs rounded-circle p-0"
                                                                htmlFor="sidebar-color-gradient"
                                                            >
                                                                <span className="avatar-title rounded-circle bg-vertical-gradient"></span>
                                                            </Form.Check.Label>
                                                        </div>
                                                        <div className="form-check sidebar-setting card-radio">
                                                            <input
                                                                className="form-check-input"
                                                                type="radio"
                                                                name="data-sidebar"
                                                                id="sidebar-color-gradient-2"
                                                                value={
                                                                    LAYOUT_SIDEBAR_TYPES.GRADIENT_2
                                                                }
                                                                checked={
                                                                    leftSidebarType ===
                                                                    LAYOUT_SIDEBAR_TYPES.GRADIENT_2
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.target
                                                                            .checked
                                                                    ) {
                                                                        dispatch(
                                                                            changeSidebarTheme(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                        );
                                                                    }
                                                                }}
                                                            />
                                                            <label
                                                                className="form-check-label avatar-xs rounded-circle p-0"
                                                                htmlFor="sidebar-color-gradient-2"
                                                            >
                                                                <span className="avatar-title rounded-circle bg-vertical-gradient-2"></span>
                                                            </label>
                                                        </div>
                                                        <div className="form-check sidebar-setting card-radio">
                                                            <input
                                                                className="form-check-input"
                                                                type="radio"
                                                                name="data-sidebar"
                                                                id="sidebar-color-gradient-3"
                                                                value={
                                                                    LAYOUT_SIDEBAR_TYPES.GRADIENT_3
                                                                }
                                                                checked={
                                                                    leftSidebarType ===
                                                                    LAYOUT_SIDEBAR_TYPES.GRADIENT_3
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.target
                                                                            .checked
                                                                    ) {
                                                                        dispatch(
                                                                            changeSidebarTheme(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                        );
                                                                    }
                                                                }}
                                                            />
                                                            <label
                                                                className="form-check-label avatar-xs rounded-circle p-0"
                                                                htmlFor="sidebar-color-gradient-3"
                                                            >
                                                                <span className="avatar-title rounded-circle bg-vertical-gradient-3"></span>
                                                            </label>
                                                        </div>
                                                        <div className="form-check sidebar-setting card-radio">
                                                            <input
                                                                className="form-check-input"
                                                                type="radio"
                                                                name="data-sidebar"
                                                                id="sidebar-color-gradient-4"
                                                                value={
                                                                    LAYOUT_SIDEBAR_TYPES.GRADIENT_4
                                                                }
                                                                checked={
                                                                    leftSidebarType ===
                                                                    LAYOUT_SIDEBAR_TYPES.GRADIENT_4
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.target
                                                                            .checked
                                                                    ) {
                                                                        dispatch(
                                                                            changeSidebarTheme(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ),
                                                                        );
                                                                    }
                                                                }}
                                                            />
                                                            <label
                                                                className="form-check-label avatar-xs rounded-circle p-0"
                                                                htmlFor="sidebar-color-gradient-4"
                                                            >
                                                                <span className="avatar-title rounded-circle bg-vertical-gradient-4"></span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Collapse>
                                        </div>
                                        <div id="sidebar-img">
                                            <h6 className="fw-semibold text-uppercase mt-4 mb-0">
                                                Sidebar Images
                                            </h6>
                                            <p className="text-muted">
                                                Choose a image of Sidebar.
                                            </p>

                                            <div className="d-flex img-switch flex-wrap gap-2">
                                                <div className="form-check sidebar-setting card-radio">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="data-sidebar-image"
                                                        id="sidebarimg-none"
                                                        value={
                                                            LEFT_SIDEBAR_IMAGE_TYPES.NONE
                                                        }
                                                        checked={
                                                            leftSidebarImageType ===
                                                            LEFT_SIDEBAR_IMAGE_TYPES.NONE
                                                        }
                                                        onChange={(e) => {
                                                            if (
                                                                e.target.checked
                                                            ) {
                                                                dispatch(
                                                                    changeSidebarImageType(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <label
                                                        className="form-check-label avatar-sm h-auto p-0"
                                                        htmlFor="sidebarimg-none"
                                                    >
                                                        <span className="avatar-md bg-light d-flex align-items-center justify-content-center w-auto">
                                                            <i className="ri-close-fill fs-20"></i>
                                                        </span>
                                                    </label>
                                                </div>

                                                <div className="form-check sidebar-setting card-radio">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="data-sidebar-image"
                                                        id="sidebarimg-01"
                                                        value={
                                                            LEFT_SIDEBAR_IMAGE_TYPES.IMG1
                                                        }
                                                        checked={
                                                            leftSidebarImageType ===
                                                            LEFT_SIDEBAR_IMAGE_TYPES.IMG1
                                                        }
                                                        onChange={(e) => {
                                                            if (
                                                                e.target.checked
                                                            ) {
                                                                dispatch(
                                                                    changeSidebarImageType(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <label
                                                        className="form-check-label avatar-sm h-auto p-0"
                                                        htmlFor="sidebarimg-01"
                                                    >
                                                        <img
                                                            src={img01}
                                                            alt=""
                                                            className="avatar-md object-fit-cover w-auto"
                                                        />
                                                    </label>
                                                </div>

                                                <div className="form-check sidebar-setting card-radio">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="data-sidebar-image"
                                                        id="sidebarimg-02"
                                                        value={
                                                            LEFT_SIDEBAR_IMAGE_TYPES.IMG2
                                                        }
                                                        checked={
                                                            leftSidebarImageType ===
                                                            LEFT_SIDEBAR_IMAGE_TYPES.IMG2
                                                        }
                                                        onChange={(e) => {
                                                            if (
                                                                e.target.checked
                                                            ) {
                                                                dispatch(
                                                                    changeSidebarImageType(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <label
                                                        className="form-check-label avatar-sm h-auto p-0"
                                                        htmlFor="sidebarimg-02"
                                                    >
                                                        <img
                                                            src={img02}
                                                            alt=""
                                                            className="avatar-md object-fit-cover w-auto"
                                                        />
                                                    </label>
                                                </div>
                                                <div className="form-check sidebar-setting card-radio">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="data-sidebar-image"
                                                        id="sidebarimg-03"
                                                        value={
                                                            LEFT_SIDEBAR_IMAGE_TYPES.IMG3
                                                        }
                                                        checked={
                                                            leftSidebarImageType ===
                                                            LEFT_SIDEBAR_IMAGE_TYPES.IMG3
                                                        }
                                                        onChange={(e) => {
                                                            if (
                                                                e.target.checked
                                                            ) {
                                                                dispatch(
                                                                    changeSidebarImageType(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <label
                                                        className="form-check-label avatar-sm h-auto p-0"
                                                        htmlFor="sidebarimg-03"
                                                    >
                                                        <img
                                                            src={img03}
                                                            alt=""
                                                            className="avatar-md object-fit-cover w-auto"
                                                        />
                                                    </label>
                                                </div>
                                                <div className="form-check sidebar-setting card-radio">
                                                    <input
                                                        className="form-check-input"
                                                        type="radio"
                                                        name="data-sidebar-image"
                                                        id="sidebarimg-04"
                                                        value={
                                                            LEFT_SIDEBAR_IMAGE_TYPES.IMG4
                                                        }
                                                        checked={
                                                            leftSidebarImageType ===
                                                            LEFT_SIDEBAR_IMAGE_TYPES.IMG4
                                                        }
                                                        onChange={(e) => {
                                                            if (
                                                                e.target.checked
                                                            ) {
                                                                dispatch(
                                                                    changeSidebarImageType(
                                                                        e.target
                                                                            .value,
                                                                    ),
                                                                );
                                                            }
                                                        }}
                                                    />
                                                    <label
                                                        className="form-check-label avatar-sm h-auto p-0"
                                                        htmlFor="sidebarimg-04"
                                                    >
                                                        <img
                                                            src={img04}
                                                            alt=""
                                                            className="avatar-md object-fit-cover w-auto"
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                )}

                                <div id="preloader-menu">
                                    <h6 className="fw-semibold text-uppercase mt-4 mb-0">
                                        Preloader
                                    </h6>
                                    <p className="text-muted">
                                        Choose a preloader.
                                    </p>

                                    <div className="row">
                                        <div className="col-4">
                                            <div className="form-check sidebar-setting card-radio">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="data-preloader"
                                                    id="preloader-view-custom"
                                                    value={
                                                        PERLOADER_TYPES.ENABLE
                                                    }
                                                    checked={
                                                        preloader ===
                                                        PERLOADER_TYPES.ENABLE
                                                    }
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            dispatch(
                                                                changePreLoader(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            );
                                                        }
                                                    }}
                                                />

                                                <label
                                                    className="form-check-label avatar-md w-100 p-0"
                                                    htmlFor="preloader-view-custom"
                                                >
                                                    <span className="d-flex h-100 gap-1">
                                                        <span className="flex-shrink-0">
                                                            <span className="bg-light d-flex flex-column h-100 gap-1 p-1">
                                                                <span className="d-block bg-primary-subtle mb-2 rounded p-1 px-2"></span>
                                                                <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                            </span>
                                                        </span>
                                                        <span className="flex-grow-1">
                                                            <span className="d-flex flex-column h-100">
                                                                <span className="bg-light d-block p-1"></span>
                                                                <span className="bg-light d-block mt-auto p-1"></span>
                                                            </span>
                                                        </span>
                                                    </span>
                                                    {/* <!-- <div id="preloader"> --> */}
                                                    <div
                                                        id="status"
                                                        className="d-flex align-items-center justify-content-center"
                                                    >
                                                        <div
                                                            className="spinner-border avatar-xxs m-auto text-primary"
                                                            role="status"
                                                        >
                                                            <span className="visually-hidden">
                                                                Loading...
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {/* <!-- </div> --> */}
                                                </label>
                                            </div>
                                            <h5 className="fs-13 mt-2 text-center">
                                                Enable
                                            </h5>
                                        </div>
                                        <div className="col-4">
                                            <div className="form-check sidebar-setting card-radio">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="data-preloader"
                                                    id="preloader-view-none"
                                                    value={
                                                        PERLOADER_TYPES.DISABLE
                                                    }
                                                    checked={
                                                        preloader ===
                                                        PERLOADER_TYPES.DISABLE
                                                    }
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            dispatch(
                                                                changePreLoader(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            );
                                                        }
                                                    }}
                                                />
                                                <label
                                                    className="form-check-label avatar-md w-100 p-0"
                                                    htmlFor="preloader-view-none"
                                                >
                                                    <span className="d-flex h-100 gap-1">
                                                        <span className="flex-shrink-0">
                                                            <span className="bg-light d-flex flex-column h-100 gap-1 p-1">
                                                                <span className="d-block bg-primary-subtle mb-2 rounded p-1 px-2"></span>
                                                                <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                                <span className="d-block bg-primary-subtle p-1 px-2 pb-0"></span>
                                                            </span>
                                                        </span>
                                                        <span className="flex-grow-1">
                                                            <span className="d-flex flex-column h-100">
                                                                <span className="bg-light d-block p-1"></span>
                                                                <span className="bg-light d-block mt-auto p-1"></span>
                                                            </span>
                                                        </span>
                                                    </span>
                                                </label>
                                            </div>
                                            <h5 className="fs-13 mt-2 text-center">
                                                Disable
                                            </h5>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SimpleBar>
                    </Offcanvas.Body>
                </Offcanvas>
            </div>
        </React.Fragment>
    );
};

export default RightSidebar;

import { Link } from '@inertiajs/react';
import React, { useState } from 'react';
import { Dropdown, Form } from 'react-bootstrap';

import LightDark from '../Components/Common/LightDark';
import { home, logout } from '../routes';
import { changeSidebarVisibility } from '../slices/thunk';
import { useLayoutStore } from '../stores/layout-store';

const Header = ({ onChangeLayoutMode, layoutModeType, headerClass }: any) => {
    const dispatch = (action: unknown) => action;
    const sidebarVisibilitytype = useLayoutStore(
        (state) => state.sidebarVisibilitytype,
    );

    const [search, setSearch] = useState<boolean>(false);
    const toogleSearch = () => {
        setSearch(!search);
    };

    const toogleMenuBtn = () => {
        var windowSize = document.documentElement.clientWidth;
        const humberIcon = document.querySelector(
            '.hamburger-icon',
        ) as HTMLElement;
        dispatch(changeSidebarVisibility('show'));

        if (windowSize > 767) humberIcon.classList.toggle('open');

        //For collapse horizontal menu
        if (
            document.documentElement.getAttribute('data-layout') ===
            'horizontal'
        ) {
            document.body.classList.contains('menu')
                ? document.body.classList.remove('menu')
                : document.body.classList.add('menu');
        }

        //For collapse vertical and semibox menu
        if (
            sidebarVisibilitytype === 'show' &&
            (document.documentElement.getAttribute('data-layout') ===
                'vertical' ||
                document.documentElement.getAttribute('data-layout') ===
                    'semibox')
        ) {
            if (windowSize < 1025 && windowSize > 767) {
                document.body.classList.remove('vertical-sidebar-enable');
                document.documentElement.getAttribute('data-sidebar-size') ===
                'sm'
                    ? document.documentElement.setAttribute(
                          'data-sidebar-size',
                          '',
                      )
                    : document.documentElement.setAttribute(
                          'data-sidebar-size',
                          'sm',
                      );
            } else if (windowSize > 1025) {
                document.body.classList.remove('vertical-sidebar-enable');
                document.documentElement.getAttribute('data-sidebar-size') ===
                'lg'
                    ? document.documentElement.setAttribute(
                          'data-sidebar-size',
                          'sm',
                      )
                    : document.documentElement.setAttribute(
                          'data-sidebar-size',
                          'lg',
                      );
            } else if (windowSize <= 767) {
                document.body.classList.add('vertical-sidebar-enable');
                document.documentElement.setAttribute(
                    'data-sidebar-size',
                    'lg',
                );
            }
        }

        //Two column menu
        if (
            document.documentElement.getAttribute('data-layout') === 'twocolumn'
        ) {
            document.body.classList.contains('twocolumn-panel')
                ? document.body.classList.remove('twocolumn-panel')
                : document.body.classList.add('twocolumn-panel');
        }
    };
    return (
        <React.Fragment>
            <header id="page-topbar" className={headerClass}>
                <div className="layout-width">
                    <div className="navbar-header">
                        <div className="d-flex">
                            <div className="navbar-brand-box horizontal-logo">
                                <Link href={home()} className="logo logo-dark">
                                    <span className="logo-sm fw-bold text-uppercase">
                                        WP
                                    </span>
                                    <span className="logo-lg fw-semibold">
                                        Wifey POS
                                    </span>
                                </Link>

                                <Link href={home()} className="logo logo-light">
                                    <span className="logo-sm fw-bold text-uppercase text-white">
                                        WP
                                    </span>
                                    <span className="logo-lg fw-semibold text-white">
                                        Wifey POS
                                    </span>
                                </Link>
                            </div>

                            <button
                                onClick={toogleMenuBtn}
                                type="button"
                                className="btn btn-sm fs-16 header-item vertical-menu-btn topnav-hamburger px-3"
                                id="topnav-hamburger-icon"
                            >
                                <span className="hamburger-icon">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </span>
                            </button>
                        </div>

                        <div className="d-flex align-items-center">
                            <Dropdown
                                show={search}
                                onClick={toogleSearch}
                                className="d-md-none topbar-head-dropdown header-item"
                            >
                                <Dropdown.Toggle
                                    type="button"
                                    as="button"
                                    className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
                                >
                                    <i className="bx bx-search fs-22"></i>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="dropdown-menu-lg dropdown-menu-end p-0">
                                    <Form className="p-3">
                                        <div className="form-group m-0">
                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Search ..."
                                                    aria-label="Recipient's username"
                                                />
                                                <button
                                                    className="btn btn-primary"
                                                    type="submit"
                                                >
                                                    <i className="mdi mdi-magnify"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </Form>
                                </Dropdown.Menu>
                            </Dropdown>

                            <LightDark
                                layoutMode={layoutModeType}
                                onChangeLayoutMode={onChangeLayoutMode}
                            />

                            <div className="d-none d-md-flex align-items-center fw-medium ms-2 text-muted">
                                Admin Workspace
                            </div>

                            <Link
                                href={logout()}
                                method="post"
                                as="button"
                                className="btn btn-ghost-secondary ms-3"
                            >
                                <i className="ri-logout-box-r-line me-1 align-middle"></i>
                                Logout
                            </Link>
                        </div>
                    </div>
                </div>
            </header>
        </React.Fragment>
    );
};
export default Header;

import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

//import Components
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import RightSidebar from '../Components/Common/RightSidebar';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import FlashToastBridge from '../Components/FlashToastBridge';
import BootTranslations from '../Components/BootTranslations';
import { useLayoutStore } from '../stores/layout-store';
import { changeHTMLAttribute } from '../slices/layouts/utils';
import { useShallow } from 'zustand/react/shallow';

//import actions
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
    changeSidebarVisibility,
} from '../slices/thunk';

const Layout = ({ children, props }: any) => {
    const [headerClass, setHeaderClass] = useState('');

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
            sidebarVisibilitytype: state.sidebarVisibilitytype,
        })),
    );

    /*
    layout settings
    */

    useEffect(() => {
        if (layoutType === 'twocolumn') {
            document.documentElement.removeAttribute('data-layout-width');
        } else if (layoutType === 'horizontal') {
            document.documentElement.removeAttribute('data-sidebar-size');
        } else if (layoutType === 'semibox') {
            changeHTMLAttribute('data-layout-width', 'fluid');
            changeHTMLAttribute('data-layout-style', 'default');
        }

        changeHTMLAttribute('data-layout-style', leftSidebarViewType);
        changeHTMLAttribute('data-sidebar-size', leftsidbarSizeType);
        changeHTMLAttribute('data-sidebar', leftSidebarType);
        changeHTMLAttribute('data-bs-theme', layoutModeType);
        changeHTMLAttribute(
            'data-layout-width',
            layoutWidthType === 'lg' ? 'fluid' : 'boxed',
        );
        changeHTMLAttribute('data-layout-position', layoutPositionType);
        changeHTMLAttribute('data-topbar', topbarThemeType);
        changeHTMLAttribute('data-layout', layoutType);
        changeHTMLAttribute('data-sidebar-image', leftSidebarImageType);
        changeHTMLAttribute('data-sidebar-visibility', sidebarVisibilitytype);

        window.dispatchEvent(new Event('resize'));
    }, [
        layoutType,
        leftSidebarType,
        layoutModeType,
        layoutWidthType,
        layoutPositionType,
        topbarThemeType,
        leftsidbarSizeType,
        leftSidebarViewType,
        leftSidebarImageType,
        sidebarVisibilitytype,
    ]);
    /*
    call dark/light mode
    */
    const onChangeLayoutMode = (value: any) => {
        if (changeLayoutMode) {
            changeLayoutMode(value);
        }
    };

    // class add remove in header
    useEffect(() => {
        window.addEventListener('scroll', scrollNavigation, true);

        return () => {
            window.removeEventListener('scroll', scrollNavigation, true);
        };
    }, []);

    function scrollNavigation() {
        var scrollup = document.documentElement.scrollTop;
        if (scrollup > 50) {
            setHeaderClass('topbar-shadow');
        } else {
            setHeaderClass('');
        }
    }

    useEffect(() => {
        const humberIcon = document.querySelector(
            '.hamburger-icon',
        ) as HTMLElement;
        if (
            sidebarVisibilitytype === 'show' ||
            layoutType === 'vertical' ||
            layoutType === 'twocolumn'
        ) {
            humberIcon?.classList.remove('open');
        } else {
            humberIcon && humberIcon.classList.add('open');
        }
    }, [sidebarVisibilitytype, layoutType]);

    return (
        <React.Fragment>
            <BootTranslations />
            <ToastContainer
                position="top-right"
                hideProgressBar
                newestOnTop
                closeOnClick
                pauseOnHover
                draggable
                theme="light"
            />

            <FlashToastBridge />

            <div id="layout-wrapper" className="d-flex min-vh-100 flex-column">
                <Header
                    headerClass={headerClass}
                    layoutModeType={layoutModeType}
                    onChangeLayoutMode={onChangeLayoutMode}
                />
                <Sidebar layoutType={layoutType} />
                <div className="main-content d-flex min-vh-100 flex-column">
                    <div className="flex-grow-1">{children}</div>
                    <Footer />
                </div>
            </div>
            <RightSidebar />
        </React.Fragment>
    );
};

Layout.propTypes = {
    children: PropTypes.object,
};

export default Layout;

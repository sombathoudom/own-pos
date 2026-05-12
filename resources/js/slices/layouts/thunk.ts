import { changeHTMLAttribute } from './utils';
import { updateLayoutState } from '@/stores/layout-store';

/**
 * Changes the layout type
 * @param {*} param0
 */
export const changeLayout = (layout: string): void => {
    const resolvedLayout = layout === 'vertical' ? 'vertical' : 'vertical';

    changeHTMLAttribute('data-layout', resolvedLayout);
    updateLayoutState({ layoutType: resolvedLayout as never });
};

/**
 * Changes the layout mode
 * @param {*} param0
 */
export const changeLayoutMode = (layoutMode: string): void => {
    changeHTMLAttribute('data-bs-theme', layoutMode);
    updateLayoutState({ layoutModeType: layoutMode as never });
};

/**
 * Changes the left sidebar theme
 * @param {*} param0
 */
export const changeSidebarTheme = (theme: string): void => {
    changeHTMLAttribute('data-sidebar', theme);
    updateLayoutState({ leftSidebarType: theme as never });
};

/**
 * Changes the layout width
 * @param {*} param0
 */
export const changeLayoutWidth = (layoutWidth: string): void => {
    if (layoutWidth === 'lg') {
        changeHTMLAttribute('data-layout-width', 'fluid');
    } else {
        changeHTMLAttribute('data-layout-width', 'boxed');
    }

    updateLayoutState({ layoutWidthType: layoutWidth as never });
};

/**
 * Changes the layout position
 * @param {*} param0
 */
export const changeLayoutPosition = (layoutPosition: string): void => {
    changeHTMLAttribute('data-layout-position', layoutPosition);
    updateLayoutState({ layoutPositionType: layoutPosition as never });
};

/**
 * Changes the topbar themes
 * @param {*} param0
 */
export const changeTopbarTheme = (topbarTheme: string): void => {
    changeHTMLAttribute('data-topbar', topbarTheme);
    updateLayoutState({ topbarThemeType: topbarTheme as never });
};

/**
 * Changes the topbar themes
 * @param {*} param0
 */
export const changeSidebarImageType = (leftSidebarImageType: string): void => {
    changeHTMLAttribute('data-sidebar-image', leftSidebarImageType);
    updateLayoutState({ leftSidebarImageType: leftSidebarImageType as never });
};

/**
 * Changes the Preloader
 * @param {*} param0
 */
export const changePreLoader = (preloaderType: string): void => {
    changeHTMLAttribute('data-preloader', preloaderType);
    updateLayoutState({ preloader: preloaderType as never });
};

/**
 * Changes the topbar themes
 * @param {*} param0
 */
export const changeLeftsidebarSizeType = (
    leftSidebarSizeType: string,
): void => {
    switch (leftSidebarSizeType) {
        case 'lg':
            changeHTMLAttribute('data-sidebar-size', 'lg');
            break;
        case 'md':
            changeHTMLAttribute('data-sidebar-size', 'md');
            break;
        case 'sm':
            changeHTMLAttribute('data-sidebar-size', 'sm');
            break;
        case 'sm-hover':
            changeHTMLAttribute('data-sidebar-size', 'sm-hover');
            break;
        default:
            changeHTMLAttribute('data-sidebar-size', 'lg');
    }

    updateLayoutState({ leftsidbarSizeType: leftSidebarSizeType as never });
};

/**
 * Changes the topbar themes
 * @param {*} param0
 */
export const changeLeftsidebarViewType = (
    leftSidebarViewType: string,
): void => {
    changeHTMLAttribute('data-layout-style', leftSidebarViewType);
    updateLayoutState({ leftSidebarViewType: leftSidebarViewType as never });
};

/**
 * Changes the sidebar visibility
 * @param {*} param0
 */
export const changeSidebarVisibility = (
    sidebarVisibilityType: string,
): void => {
    changeHTMLAttribute('data-sidebar-visibility', sidebarVisibilityType);
    updateLayoutState({
        sidebarVisibilitytype: sidebarVisibilityType as never,
    });
};

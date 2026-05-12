import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { LAYOUT_TYPES } from '@/Components/constants/layout';
import { initialState, type LayoutState } from '@/slices/layouts/reducer';

const layoutStorageKey = 'velzon-layout-settings';

export const useLayoutStore = create<LayoutState>()(
    persist(() => ({ ...initialState }), {
        name: layoutStorageKey,
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
            layoutModeType: state.layoutModeType,
            leftSidebarType: state.leftSidebarType,
            layoutWidthType: state.layoutWidthType,
            layoutPositionType: state.layoutPositionType,
            topbarThemeType: state.topbarThemeType,
            leftsidbarSizeType: state.leftsidbarSizeType,
            leftSidebarViewType: state.leftSidebarViewType,
            leftSidebarImageType: state.leftSidebarImageType,
            preloader: state.preloader,
        }),
        merge: (persistedState, currentState) => ({
            ...currentState,
            ...(persistedState as Partial<LayoutState>),
            layoutType: LAYOUT_TYPES.VERTICAL,
        }),
    }),
);

export const updateLayoutState = (updates: Partial<LayoutState>): void => {
    const currentState = useLayoutStore.getState();
    const hasChanges = Object.entries(updates).some(
        ([key, value]) => currentState[key as keyof LayoutState] !== value,
    );

    if (!hasChanges) {
        return;
    }

    useLayoutStore.setState(updates);
};

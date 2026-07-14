import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface UIState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  headerTitleOverride: string | null;
}

const initialState: UIState = {
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  headerTitleOverride: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    setMobileSidebarOpen(state, action: PayloadAction<boolean>) {
      state.mobileSidebarOpen = action.payload;
    },
    setHeaderTitleOverride(state, action: PayloadAction<string | null>) {
      state.headerTitleOverride = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarCollapsed,
  setMobileSidebarOpen,
  setHeaderTitleOverride,
} = uiSlice.actions;
export const uiReducer = uiSlice.reducer;

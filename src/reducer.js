import { createSlice, createSelector } from '@reduxjs/toolkit';


// Reducers
const initialState = {
    selected: 0,
    data: {}
};

const universesSlice = createSlice({
  name: 'universes',
  initialState,
  reducers: {
    selectUniverse(state, action) {
        state.selected = action.payload;
    },
    updateUniverseData(state, action) {
        const {id, data} = action.payload;
        state.data[id] = data;
    },
  },
});


export const { selectUniverse, updateUniverseData } = universesSlice.actions;
export default universesSlice.reducer;

// Selectors
export const getSelectedUniverse = (state) => state.universes.selected;
export const getUniverses = (state) => state.universes.data;
export const getSelectedUniverseData = createSelector(
    getSelectedUniverse,
    getUniverses,
    (id, data) => data[id],
);
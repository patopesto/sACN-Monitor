import { createSlice, createSelector } from '@reduxjs/toolkit';


// Reducers
const initialState = {
    selected_universe: 0,
    selected_channel: 0,
    data: {},
};

const universesSlice = createSlice({
  name: 'universes',
  initialState,
  reducers: {
    selectUniverse(state, action) {
        state.selected_universe = action.payload;
    },
    updateUniverseData(state, action) {
        const {id, data} = action.payload;
        state.data[id] = data;
    },
    selectChannel(state, action) {
        if (state.selected_universe > 0) {
            state.selected_channel = action.payload;
        }
    }
  },
});


export const { selectUniverse, updateUniverseData, selectChannel } = universesSlice.actions;
export default universesSlice.reducer;

// Selectors
export const getSelectedUniverse = (state) => state.universes.selected_universe;
export const getUniverses = (state) => state.universes.data;
export const getSelectedUniverseData = createSelector(
    getSelectedUniverse,
    getUniverses,
    (id, data) => data[id],
);
export const getSelectedChannel = (state) => state.universes.selected_channel;
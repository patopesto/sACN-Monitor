import { configureStore } from '@reduxjs/toolkit';
import reducer from './reducer';


const store = configureStore({
    reducer: {
        universes: reducer,
    }
})

export default store;
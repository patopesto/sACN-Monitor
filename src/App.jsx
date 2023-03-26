import { useDispatch } from 'react-redux';
import './App.css';
import { DMXUniverse, DMXData, DMXStats } from './components';
import { updateUniverseData } from './reducer';


function App() {
    const dispatch = useDispatch();
    console.log("Hello from Renderer");

    window.api.receive('dmx-data', (data) => {
        // Remapping properties for Redux Store
        let payload = {
            id: data.universe,
            data: {
                dmx: data.dmx,
                node: data.sourceAddress,
                priority: data.priority,
            } 
        };
        dispatch(updateUniverseData(payload));
    });

    return (
        <div className="App">
            <div className="Columns">
                <DMXUniverse />
                <DMXData />
                <DMXStats />
            </div>
        </div>
    );
}

export default App;

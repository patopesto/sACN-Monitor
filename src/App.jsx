import { useDispatch } from 'react-redux';
import './App.css';
import { DMXUniverse, DMXData } from './components';
import { updateUniverseData } from './reducer';


function App() {
    const dispatch = useDispatch();
    console.log("Hello from Renderer");

    window.api.receive('dmx-data', (data) => {
        let payload = {
            id: data.universe,
            data: {
                dmx: JSON.parse(JSON.stringify(data.privatePayload)),
                node: data.sourceAddress,
            } 
        };
        dispatch(updateUniverseData(payload));
    });

    return (
        <div className="App">
            <div className="Columns">
                <DMXUniverse />
                <DMXData />
            </div>
        </div>
    );
}

export default App;

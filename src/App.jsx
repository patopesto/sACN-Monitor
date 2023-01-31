import './App.css';
import { DMXUniverse, DMXData } from './textbox';


function App() {
  console.log("Hello from Renderer");

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

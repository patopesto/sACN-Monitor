import { render } from "solid-js/web";
import './app.css';
import { DMX } from './views/dmx.jsx';
import { UniversesActions } from './models/universes';
import { SettingsActions } from './models/settings';

// Initialize stores/listeners
UniversesActions.init();
SettingsActions.init();

render(() => <DMX />, document.getElementById('app'));

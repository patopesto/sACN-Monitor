import { useSelector, useDispatch } from 'react-redux';
import { selectUniverse, getSelectedUniverse, getUniverses, getSelectedUniverseData } from './reducer';

const NUM_CHANNELS = 512;

function DMXData() {
    const data = useSelector(getSelectedUniverseData);
    var dmx = []
    if (data !== undefined) {
        dmx = data.dmx;
    }
    const channels = [];

    for (let i = 0; i < NUM_CHANNELS; i++) {
        channels.push(<ChannelBox key={i} channel={i+1} value={dmx[i]} />);
    }

    return (
        <div className="Column DMXColumn">
            <div className="Column-header">DMX</div>
            <div className="DMXChannels">{channels}</div>
        </div>
    );
}

function ChannelBox(props) {

    const percentage = props.value * 100 / 255;
    const fillerStyles = {
        height: `${percentage}%`,
        // height: "1%",
        width: "100%",
    }

    return (
        <div className="ChannelBox">
            <div className="ChannelBoxBackground" style={fillerStyles} />
            <div className="ChannelBoxValue">{props.channel}</div>
        </div>
    );
}

function DMXUniverse() {

    const selected = useSelector(getSelectedUniverse);
    const dispatch = useDispatch();
    const recv_universes = useSelector(getUniverses);

    const handleClick = function(id) {
        dispatch(selectUniverse(id));
    }

    const universes = [];
    for (let i in recv_universes) {
        universes.push(
            <UniverseBox
                key={i}
                universe={i}
                node={recv_universes[i].node}
                selected={i === selected}
                onToggle={handleClick.bind(this, i)}
            />
        );
    }

    return (
        <div className="Column UniverseColumn">
            <div className="Column-header">UNIVERSES</div>
            <div className="DMXUniverses">{universes}</div>
        </div>
    );
}


function UniverseBox(props) {
    
    const styleValueDefault = {
        color: 'white',
        backgroundColor: 'var(--default-bg-color)',
    };
    const styleValueSelected = {
        color: 'black',
        backgroundColor: 'var(--default-highlight-color)',
    };

    const styleNodeDefault = {
        backgroundColor: 'var(--default-bg-color)',
    };
    const styleNodeSelected = {
        backgroundColor: 'rgb(12, 88, 127)',
    };

    return (
        <div className="UniverseBox" onClick={props.onToggle}>
            <div className="UniverseBoxValue" style={props.selected ? styleValueSelected : styleValueDefault}>
                {props.universe}
            </div>
            <div className="UniverseBoxNode" style={props.selected ? styleNodeSelected : styleNodeDefault}>
                {props.node}
            </div>
        </div>
    );
}

export { DMXUniverse, DMXData };
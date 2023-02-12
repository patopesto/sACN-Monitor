import { useSelector, useDispatch } from 'react-redux';
import { 
    selectUniverse,
    selectChannel,
    getUniverses,
    getSelectedUniverse,
    getSelectedUniverseData ,
    getSelectedChannel,
} from './reducer';

const NUM_CHANNELS = 512;

function DMXData() {
    const data = useSelector(getSelectedUniverseData);
    var dmx = []
    if (data !== undefined) {
        dmx = data.dmx;
    }

    const selected = useSelector(getSelectedChannel);
    const channels = [];

    for (let i = 0; i < NUM_CHANNELS; i++) {
        channels.push(
            <ChannelBox 
                key={i}
                channel={i+1}
                value={dmx[i]}
                selected={i+1 === selected}
            />
        );
    }

    return (
        <div className="Column DMXColumn">
            <div className="Column-header">DMX</div>
            <div className="DMXChannels">{channels}</div>
        </div>
    );
}

function ChannelBox(props) {

    const dispatch = useDispatch();
    const percentage = props.value * 100 / 255;
    const styleBackground = {
        height: `${percentage}%`,
        // height: "1%",
        width: "100%",
    }

    const handleClick = function() {
        dispatch(selectChannel(props.channel));
    }

    const styleValue = {
        opacity: props.value > 0 ? 1 : 0.5,
    }

    const styleBox = {
        borderStyle: props.selected === true ? 'solid' : 'none' 
    }

    return (
        <div className="ChannelBox"  style={styleBox} onClick={handleClick}>
            <div className="ChannelBoxBackground" style={styleBackground} />
            <div className="ChannelBoxValue" style={styleValue}>{props.channel}</div>
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

function DMXStats() {

    var sel_universe = useSelector(getSelectedUniverse);
    const data = useSelector(getSelectedUniverseData);
    var sel_channel = useSelector(getSelectedChannel);

    var universe, universe_hex, node, channel, channel_data = "";

    if (sel_universe > 0) {
        universe = sel_universe
        universe_hex = Number(universe).toString(16).toUpperCase();
    }

    if (data !== undefined) {
        node = data.node;
        let dmx = data.dmx;
        if (sel_channel > 0) {
            channel = sel_channel;
            let value = dmx[channel-1];
            let value_percent = (value * 100 / 255).toFixed(1);
            channel_data = value + " (" + value_percent + "%)";
        }
    }
    
    return (
        <div className="Column StatsColumn">
            <div className="Column-header">STATISTICS</div>
            <div className="DMXStats">
                <StatsBox name="Universe" value={universe} />
                <StatsBox name="Universe Hex" value={universe_hex} />
                <StatsBox name="Node" value={node} />
                <StatsBox name="Selected Channel" value={channel} />
                <StatsBox name="Selected Value" value={channel_data} />
            </div>
        </div>
    );
}

function StatsBox(props) {

    return (
        <div className="StatsBox">
            <div className="StatsBoxName">{props.name}</div>
            <div className="StatsBoxValue">{props.value}</div>
        </div>
    );

}

export { DMXUniverse, DMXData, DMXStats};
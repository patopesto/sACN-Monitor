import { Component } from 'react';

const NUM_CHANNELS = 512;

class DMXData extends Component {
    constructor(props) {
        super(props);
        this.state = {
          dmx: []
        };
    }

    componentDidMount() {
        window.api.receive('dmx-data', this.parseData.bind(this));
    }

    parseData(data) {
        // console.log("received: ", data);
        this.setState({ dmx: data.privatePayload });
    }

    render() {
        const channels = [];
        for (let i = 1; i <= NUM_CHANNELS; i++) {
            channels.push(<ChannelBox key={i} channel={i} value={this.state.dmx[i-1]} />);
        }

        return (
            <div className="Column DMXColumn">
                <div className="Column-header">DMX</div>
                <div className="DMXChannels">{channels}</div>
            </div>
        );
    }
}

class ChannelBox extends Component {

    render() {
        const percentage = this.props.value * 100 / 255;
        const fillerStyles = {
            height: `${percentage}%`,
            // height: "1%",
            width: "100%",
        }

        return (
            <div className="ChannelBox">
                <div className="ChannelBoxBackground" style={fillerStyles} />
                <div className="ChannelBoxValue">{this.props.channel}</div>
            </div>
        );
    }
}

class DMXUniverse extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selected: 1
        }
    }


    handleClick(id) {
        this.setState({ selected: id });
    }

    render() {
        const universes = [];
        for (let i = 1; i <= 3; i++) {
            universes.push(
                <UniverseBox
                    key={i}
                    universe={i}
                    node="127.0.0.1"
                    selected={i === this.state.selected}
                    onToggle={this.handleClick.bind(this, i)}
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
}

class UniverseBox extends Component {

    styleValueDefault = {
        color: 'white',
        backgroundColor: 'var(--default-bg-color)',
    };
    styleValueSelected = {
        color: 'black',
        backgroundColor: 'var(--default-highlight-color)',
    };

    styleNodeDefault = {
        backgroundColor: 'var(--default-bg-color)',
    };
    styleNodeSelected = {
        backgroundColor: 'rgb(12, 88, 127)',
    };

    render() {
        return (
            <div className="UniverseBox" onClick={this.props.onToggle}>
                <div className="UniverseBoxValue" style={this.props.selected ? this.styleValueSelected : this.styleValueDefault}>
                    {this.props.universe}
                </div>
                <div className="UniverseBoxNode" style={this.props.selected ? this.styleNodeSelected : this.styleNodeDefault}>
                    {this.props.node}
                </div>
            </div>
        );
    }
}

export { DMXUniverse, DMXData };
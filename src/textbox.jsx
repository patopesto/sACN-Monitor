import { Component } from 'react';

const NUM_CHANNELS = 512;

class DMXUniverse extends Component {
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
            channels.push(<ChannelBox key={i} channel={i} value={this.state.dmx[i-1]} />)
        }
        return (
            <div className="Column">
                <div className="Column-header">DMX</div>
                <div className="DMXUniverse">{channels}</div>
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

export { DMXUniverse };
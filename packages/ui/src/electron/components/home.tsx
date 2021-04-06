import React, { Component } from 'react';
import { ConnectionStatus, pollConnectionStatus } from '../../ipc/connectionStatus';
import HomeContent from './homeContent';

interface Props {
  readonly onSynchronize: () => void
}
interface State {
  readonly status: ConnectionStatus
  readonly abort?: () => void
}

class Home extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { status: ConnectionStatus.DISCONNECTED_FROM_ALL };
  }

  public async componentDidMount() : Promise<void> {
    const {promise, abort} = pollConnectionStatus();
    this.setState({ abort });
    for await (const item of promise) {
      this.setState({status: item});
    }
  }

  public componentWillUnmount() : void {
    if (this.state.abort) {
      this.state.abort();
    }
  }

  public render() : JSX.Element {
    const { status } = this.state;
    switch (status) {
      case ConnectionStatus.CONNECTED_TO_PUBLIC_GATEWAY:
        return (
          <HomeContent title="connected to public gateway" image="/foo.jpg" >
            <p>foooo</p>
          </HomeContent>
        );
      case ConnectionStatus.CONNECTED_TO_COURIER:
        return (
          <HomeContent title="connected to courier" image="/bar.jpg" >
            <button onClick={this.props.onSynchronize}>Synchronize</button>
          </HomeContent>
        );
      default:
        return (
          <HomeContent title="disconnected" image="/baz.jpg" >
            <p>baaaz</p>
          </HomeContent>
        );
    }
  }
}

export default Home;

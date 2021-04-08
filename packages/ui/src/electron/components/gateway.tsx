import React, { Component } from 'react';

interface Props {
  readonly gateway: string,
  readonly onEdit: () => void
}
class Gateway extends Component<Props> {
  public render() : JSX.Element {
    return (
      <div className='gateway'>
        <label htmlFor='gateway'>Public Gateway</label>
        <input name='gateway' type='text' value={this.props.gateway} disabled={true}/>
        <a onClick={this.props.onEdit} href='#'>Change Public Gateway</a>
      </div>
    );
  }
}

export default Gateway;

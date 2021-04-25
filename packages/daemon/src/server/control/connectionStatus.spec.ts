import { MockClient } from '@relaycorp/ws-mock';
import { Container } from 'typedi';

import { ConnectionStatus, StatusMonitor } from '../../sync/StatusMonitor';
import { useTemporaryAppDirs } from '../../testUtils/appDirs';
import { restoreStatusMonitor } from '../../testUtils/connectionStatus';
import { setUpTestDBConnection } from '../../testUtils/db';
import { makeMockLogging, MockLogging } from '../../testUtils/logging';
import { mockWebsocketStream } from '../../testUtils/websocket';
import makeConnectionStatusServer from './connectionStatus';

setUpTestDBConnection();
useTemporaryAppDirs();

mockWebsocketStream();
restoreStatusMonitor();

let mockLogging: MockLogging;
beforeEach(() => {
  mockLogging = makeMockLogging();
});

beforeEach(async () => {
  const statusMonitor = Container.get(StatusMonitor);
  statusMonitor.setLastStatus(ConnectionStatus.DISCONNECTED);
});

test('Status changes should be streamed', async () => {
  const server = makeConnectionStatusServer(mockLogging.logger);
  const client = new MockClient(server);

  await client.connect();

  await expect(client.receive()).resolves.toEqual(ConnectionStatus.DISCONNECTED);

  const statusMonitor = Container.get(StatusMonitor);
  statusMonitor.setLastStatus(ConnectionStatus.CONNECTED_TO_COURIER);
  await expect(client.receive()).resolves.toEqual(ConnectionStatus.CONNECTED_TO_COURIER);

  client.close();
});

test('The connection should be closed when the client closes it', async () => {
  const server = makeConnectionStatusServer(mockLogging.logger);
  const client = new MockClient(server);

  await client.connect();
  await expect(client.receive()).resolves.toEqual(ConnectionStatus.DISCONNECTED);

  client.close();
  await expect(client.waitForPeerClosure()).resolves.toEqual({ code: 1000 });
});

test('CORS should be allowed', async () => {
  const server = makeConnectionStatusServer(mockLogging.logger);
  const client = new MockClient(server, { origin: 'https://example.com' });

  await client.connect();

  client.close();
  await expect(client.waitForPeerClosure()).resolves.toEqual({ code: 1000 });
});

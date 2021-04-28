import abortable from 'abortable-iterator';
import { connect } from 'it-ws';
import PrivateGatewayError from '../PrivateGatewayError';

export enum CourierSyncStatus {
  COLLECTING_CARGO,
  WAITING,
  DELIVERING_CARGO,
  COMPLETE,
}

export class CourierSyncError extends PrivateGatewayError {}

export interface CourierSync {
  readonly promise: AsyncIterable<CourierSyncStatus>;
  readonly abort: () => void;
}

/**
 * Wrapper for synchronization that exposes an abort method
 *
 */
export function synchronizeWithCourier(token: string): CourierSync {
  const controller = new AbortController();
  const promise = abortable(_synchronizeWithCourier(token), controller.signal, {
    returnOnAbort: true,
  });
  return {
    abort: () => {
      controller.abort();
    },
    promise,
  };
}

/**
 * Initialize synchronization with courier and wait until it completes.
 *
 * This method will stream the current status of the synchronization.
 *
 * @throws CourierSyncError if the synchronization fails at any point
 */
async function* _synchronizeWithCourier(token: string): AsyncIterable<CourierSyncStatus> {
  try {
    const WS_URL = 'ws://127.0.0.1:13276/_control/courier-sync?auth=' + token;
    const stream = connect(WS_URL, { binary: true });
    for await (const buffer of stream.source) {
      const name = buffer.toString();
      switch (name) {
        case 'COLLECTING_CARGO':
          yield CourierSyncStatus.COLLECTING_CARGO;
          break;
        case 'WAITING':
          yield CourierSyncStatus.WAITING;
          break;
        case 'DELIVERING_CARGO':
          yield CourierSyncStatus.DELIVERING_CARGO;
          break;
        default:
          throw new CourierSyncError(`Unknown status: ${name}`);
      }
    }
    // Server does not send this one, but the UI is waiting for it
    yield CourierSyncStatus.COMPLETE;
  } catch (err) {
    throw new CourierSyncError(err);
  }
}

/**
 * IWorkerIdentityReader - Application port for worker identity
 *
 * Provides read access to the current worker's identity.
 * This port is implemented by infrastructure and consumed by
 * application layer services that need to identify the current worker.
 *
 * Key Design:
 * - Read-only interface for accessing worker identity
 * - WorkerId is resolved once at startup and cached
 * - Same hostSessionKey always maps to same workerId
 */

import { WorkerId } from "./WorkerId.js";

export interface IWorkerIdentityReader {
  /**
   * Gets the unique identifier for the current worker.
   *
   * The workerId is stable for the lifetime of the terminal/IDE session.
   * Multiple invocations within the same session return the same value.
   *
   * @returns The WorkerId for the current worker
   */
  readonly workerId: WorkerId;
}

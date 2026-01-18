/**
 * Port interface for reading CLI version information.
 * Provides access to runtime version information about the CLI itself.
 */

export interface CliVersion {
  version: string;
}

export interface ICliVersionReader {
  /**
   * Retrieves the CLI version at runtime by reading from package.json.
   */
  getVersion(): CliVersion;
}

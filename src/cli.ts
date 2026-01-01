#!/usr/bin/env node

/**
 * Jumbo CLI Entry Point
 *
 * Minimal entry point that delegates to CommandRouter.
 * All routing logic, container lifecycle, and error handling
 * are encapsulated in the routing module.
 */

import { route } from "./presentation/cli/shared/routing/CommandRouter.js";
import { BuildTimeCliMetadataReader } from "./infrastructure/cli-metadata/query/BuildTimeCliMetadataReader.js";

const cliMetadataReader = new BuildTimeCliMetadataReader();
const cliVersion = cliMetadataReader.getMetadata().version;

route(cliVersion);

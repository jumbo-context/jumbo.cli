#!/usr/bin/env node

/**
 * Jumbo CLI Entry Point
 *
 * Minimal entry point that delegates to CommandRouter.
 * All routing logic, container lifecycle, and error handling
 * are encapsulated in the routing module.
 */

import { route } from "./presentation/cli/shared/routing/CommandRouter.js";
import { getCliVersionReader } from "./presentation/cli/composition/bootstrap.js";

const versionReader = getCliVersionReader();
const cliVersion = versionReader.getVersion().version;

route(cliVersion);

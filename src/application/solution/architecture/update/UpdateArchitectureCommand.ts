import { DataStore } from "../../../../domain/solution/architecture/EventIndex.js";

export interface UpdateArchitectureCommand {
  description?: string;
  organization?: string;
  patterns?: string[];
  principles?: string[];
  dataFlow?: string | null;
  dataStores?: DataStore[];
  stack?: string[];
}

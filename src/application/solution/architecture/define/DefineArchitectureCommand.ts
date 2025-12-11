import { DataStore } from "../../../../domain/solution/architecture/EventIndex.js";

export interface DefineArchitectureCommand {
  description: string;
  organization: string;
  patterns?: string[];
  principles?: string[];
  dataStores?: DataStore[];
  stack?: string[];
}

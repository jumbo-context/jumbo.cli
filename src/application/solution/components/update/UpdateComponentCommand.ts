import { ComponentTypeValue } from "../../../../domain/solution/components/Constants.js";

export interface UpdateComponentCommand {
  componentId: string;
  description?: string;
  responsibility?: string;
  path?: string;
  type?: ComponentTypeValue;
}

import { ShowDecisionRequest } from "./ShowDecisionRequest.js";
import { ShowDecisionResponse } from "./ShowDecisionResponse.js";

export interface IShowDecisionGateway {
  showDecision(request: ShowDecisionRequest): Promise<ShowDecisionResponse>;
}

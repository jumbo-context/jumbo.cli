import { IShowDecisionGateway } from "./IShowDecisionGateway.js";
import { ShowDecisionRequest } from "./ShowDecisionRequest.js";
import { ShowDecisionResponse } from "./ShowDecisionResponse.js";

export class ShowDecisionController {
  constructor(private readonly gateway: IShowDecisionGateway) {}

  async handle(request: ShowDecisionRequest): Promise<ShowDecisionResponse> {
    return this.gateway.showDecision(request);
  }
}

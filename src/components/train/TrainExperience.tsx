"use client";

import { InvitationExperience } from "../shared/InvitationExperience";
import { TrainGate } from "./TrainGate";
import { TrainInvitation } from "./TrainInvitation";
import { TrainOpening } from "./TrainOpening";

export function TrainExperience() {
  return <InvitationExperience template="train" Gate={TrainGate} Opening={TrainOpening} Invitation={TrainInvitation} />;
}

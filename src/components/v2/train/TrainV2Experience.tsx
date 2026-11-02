"use client";

import { InvitationExperience } from "../../shared/InvitationExperience";
import { TrainV2Gate } from "./TrainV2Gate";
import { TrainV2Invitation } from "./TrainV2Invitation";
import { TrainV2Opening } from "./TrainV2Opening";

export function TrainV2Experience() {
  return <InvitationExperience template="train2" Gate={TrainV2Gate} Opening={TrainV2Opening} Invitation={TrainV2Invitation} />;
}

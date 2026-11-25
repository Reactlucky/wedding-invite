"use client";

import { TRAIN2_CUES } from "@/lib/cues";
import { InvitationExperience } from "../../shared/InvitationExperience";
import { TrainV2Gate } from "./TrainV2Gate";
import { TrainV2Invitation } from "./TrainV2Invitation";
import { TrainV2Opening } from "./TrainV2Opening";

/** Doors are about to open. The arrival plays up to here, then waits for a tap. */
const BOARD_AT = TRAIN2_CUES.doorOpen - 0.05;

export function TrainV2Experience() {
  return <InvitationExperience template="train2" Gate={TrainV2Gate} Opening={TrainV2Opening} Invitation={TrainV2Invitation} holdAt={BOARD_AT} />;
}

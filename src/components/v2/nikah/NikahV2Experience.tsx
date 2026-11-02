"use client";

import { InvitationExperience } from "../../shared/InvitationExperience";
import { NikahV2Gate } from "./NikahV2Gate";
import { NikahV2Invitation } from "./NikahV2Invitation";
import { NikahV2Opening } from "./NikahV2Opening";

export function NikahV2Experience() {
  return <InvitationExperience template="nikah2" Gate={NikahV2Gate} Opening={NikahV2Opening} Invitation={NikahV2Invitation} />;
}

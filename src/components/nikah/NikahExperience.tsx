"use client";

import { InvitationExperience } from "../shared/InvitationExperience";
import { NikahGate } from "./NikahGate";
import { NikahInvitation } from "./NikahInvitation";
import { NikahOpening } from "./NikahOpening";

export function NikahExperience() {
  return <InvitationExperience template="nikah" Gate={NikahGate} Opening={NikahOpening} Invitation={NikahInvitation} />;
}

import type { Metadata } from "next";
import { NikahV2Experience } from "@/components/v2/nikah/NikahV2Experience";

export const metadata: Metadata = {
  title: "Nikah Invitation",
  description: "With the blessings of Allah, you are invited to our Nikah.",
};

export default function NikahV2Page() {
  return <NikahV2Experience />;
}

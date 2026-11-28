import type { Metadata } from "next";
import { V2Fonts } from "@/components/v2/V2Fonts";
import { NikahV2Experience } from "@/components/v2/nikah/NikahV2Experience";

export const metadata: Metadata = {
  title: "Nikah Invitation",
  description: "With the blessings of Allah, you are invited to our Nikah.",
};

export default function Home() {
  return (
    <V2Fonts>
      <NikahV2Experience />
    </V2Fonts>
  );
}

import type { Metadata } from "next";
import { V2Fonts } from "@/components/v2/V2Fonts";
import { TrainV2Experience } from "@/components/v2/train/TrainV2Experience";

export const metadata: Metadata = {
  title: "Wedding Express — Invitation",
  description: "Kind attention please: you're invited aboard our Wedding Express.",
};

export default function Home() {
  return (
    <V2Fonts>
      <TrainV2Experience />
    </V2Fonts>
  );
}

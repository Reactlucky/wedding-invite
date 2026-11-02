import type { Metadata } from "next";
import { TrainV2Experience } from "@/components/v2/train/TrainV2Experience";

export const metadata: Metadata = {
  title: "Wedding Express — Invitation",
  description: "Kind attention please: you're invited aboard our Wedding Express.",
};

export default function TrainV2Page() {
  return <TrainV2Experience />;
}

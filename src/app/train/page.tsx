import type { Metadata } from "next";
import { TrainExperience } from "@/components/train/TrainExperience";

export const metadata: Metadata = {
  title: "Royal Train Journey — Wedding Invitation",
  description: "All aboard the Royal Express to our wedding.",
};

export default function TrainPage() {
  return <TrainExperience />;
}

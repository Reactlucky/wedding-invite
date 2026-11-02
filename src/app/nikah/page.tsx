import type { Metadata } from "next";
import { NikahExperience } from "@/components/nikah/NikahExperience";

export const metadata: Metadata = {
  title: "Luxury Nikah — Wedding Invitation",
  description: "You are invited to our Nikah.",
};

export default function NikahPage() {
  return <NikahExperience />;
}

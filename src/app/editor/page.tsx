import type { Metadata } from "next";
import { Editor } from "@/components/editor/Editor";

export const metadata: Metadata = {
  title: "Studio — Edit your invitation",
  robots: { index: false },
};

export default function EditorPage() {
  return <Editor />;
}

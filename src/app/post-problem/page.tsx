export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { PlatformApp } from "@/components/platform-app";
export const metadata: Metadata = { title: "Post a problem — ReSolv" };
export default function Page() {
  return <PlatformApp />;
}

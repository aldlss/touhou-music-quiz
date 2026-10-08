import { notFound } from "next/navigation";
import { checkEnv, getSortedDefaultMusicCollection } from "../_server/musicData";
import AudioWindowTest from "./audioWindowTest.client";

export default async function AudioWindowTestPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  checkEnv();
  const musicCollection = await getSortedDefaultMusicCollection("zh-CN");
  return <AudioWindowTest musicCollection={musicCollection} />;
}

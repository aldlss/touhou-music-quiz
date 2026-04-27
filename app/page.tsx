import type { Metadata } from "next";
import { QuizMain } from "./clientComponent";
import { TouhouMusicQuizContainer } from "./serverComponent";
import { checkEnv, getSortedDefaultMusicCollection } from "./tools";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  checkEnv();
  const musicCollection = await getSortedDefaultMusicCollection();
  return (
    <TouhouMusicQuizContainer>
      <QuizMain musicCollection={musicCollection} />
    </TouhouMusicQuizContainer>
  );
}

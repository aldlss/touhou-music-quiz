import { QuizMain } from "./clientComponent";
import { TouhouMusicQuizContainer } from "./serverComponent";
import { checkEnv, getSortedDefaultMusicCollection } from "./tools";

export default async function Home() {
  checkEnv();
  const musicCollection = await getSortedDefaultMusicCollection();
  return (
    <TouhouMusicQuizContainer>
      <QuizMain musicCollection={musicCollection} />
    </TouhouMusicQuizContainer>
  );
}

import { QuizMain } from "./clientComponent";
import { TouhouMusicQuizContainer } from "./serverComponent";
import { checkEnv, getSortedDefaultMusicMap } from "./tools";

export default async function Home() {
    checkEnv();
    const musicMap = await getSortedDefaultMusicMap();
    return (
        <TouhouMusicQuizContainer>
            <QuizMain musicMap={musicMap} />
        </TouhouMusicQuizContainer>
    );
}

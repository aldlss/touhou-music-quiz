import { QuizMain } from "./clientComponent";
import { TouhouMusicQuizContainer } from "./serverComponent";
import { getSortedDefaultMusicMap } from "./tools";

export default async function Home() {
    const musicMap = await getSortedDefaultMusicMap();
    return (
        <TouhouMusicQuizContainer>
            <QuizMain musicMap={musicMap} />
        </TouhouMusicQuizContainer>
    );
}

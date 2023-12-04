import { useState } from "react";
import { difficultyColorAndText } from "../constant";
import { GetLocalStorageValue, SetLocalStorageValue } from "../tools";
import { RankType, PageType } from "../types";

export function EndPage({
    setPageState,
    nowQuizCount,
    rightAnswerCount,
    rank,
}: {
    setPageState: Function;
    nowQuizCount: number;
    rightAnswerCount: number;
    rank: RankType;
}) {
    const [nickname, setNickname] = useState(() => {
        return GetLocalStorageValue("nickname", "");
    });
    const [editNickName, setEditNickName] = useState(true);
    const [difficultyColor, difficultyText] = difficultyColorAndText[rank];
    return (
        <div className="h-full bg-container">
            <main className="h-full w-full flex flex-col animate-fade-in-up-fast items-center justify-center gap-1">
                <h1 className="font-extrabold text-pure-red text-h1 dark:text-red">
                    喜报
                </h1>
                {editNickName ? (
                    <>
                        <input
                            name="nickname"
                            placeholder="Player"
                            autoComplete="off"
                            className="max-w-90% border-2 rounded-lg bg-gray-3 p-1 text-center font-bold border-tab-color hover:border-blue dark:bg-material-dark-8 text-h2 dark:hover:border-cyan"
                            type="text"
                            value={nickname}
                            onChange={(e) => {
                                setNickname(e.target.value);
                            }}
                        />
                        <button
                            type="button"
                            disabled={nickname.length === 0}
                            className="w-30% p-2 secondary-button"
                            onClick={() => {
                                setEditNickName(false);
                                SetLocalStorageValue("nickname", nickname);
                            }}>
                            确认
                        </button>
                    </>
                ) : (
                    <h2 className="font-bold text-h2">{nickname}</h2>
                )}
                <h3 className="text-center text-h3">
                    在东方原曲认知测验无尽版
                    <br />
                    <span className={difficultyColor}>{difficultyText}</span>
                    &nbsp;难度获得
                </h3>
                <h3 className="font-600 text-rose text-h2">{`${rightAnswerCount}/${nowQuizCount}`}</h3>
                <h3 className="text-h3">的好成绩</h3>
                <h2 className="text-h2">可喜可贺，可喜可贺</h2>
                <button
                    type="button"
                    className="p-y-2 main-button"
                    onClick={() => {
                        setPageState(PageType.start);
                    }}>
                    重来
                </button>
            </main>
        </div>
    );
}

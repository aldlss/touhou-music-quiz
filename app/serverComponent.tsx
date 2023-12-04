export function AdaptiveMainContain({
    children,
}: {
    children: React.JSX.Element;
}) {
    return (
        <div className="m-x-auto aspect-[2/3] h-95% max-w-95% w-auto flex items-center">
            <div className="aspect-[2/3] h-auto max-h-full w-full">
                {children}
            </div>
        </div>
    );
}

export function TouhouMusicQuizContainer({
    children,
}: {
    children: React.JSX.Element;
}) {
    return (
        <main className="h-screen max-h-screen min-h-408px min-w-272px w-full flex items-center justify-center">
            <AdaptiveMainContain>{children}</AdaptiveMainContain>
        </main>
    );
}

import { Suspense, memo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Loader3FillSvg } from "./svg";

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

export const LoadingPage = memo(function LoadingPage() {
    return (
        <div className="h-full flex flex-row items-center justify-center">
            <Loader3FillSvg className="w-8 animate-spin" />
            <h1 className="text-center text-h3">少女加载中...</h1>
        </div>
    );
});

export function AsyncBoundary({
    children,
    onRetry,
    resetKeys,
}: {
    children: React.ReactNode;
    onRetry?: () => void;
    resetKeys?: any[];
}) {
    return (
        <Suspense fallback={<LoadingPage />}>
            <ErrorBoundary
                resetKeys={resetKeys}
                onReset={onRetry}
                fallbackRender={({ error, resetErrorBoundary }) => {
                    return (
                        <div className="h-full flex flex-col items-center justify-center">
                            <div className="text-center">
                                <h1 className="inline text-p">少女出错了！</h1>
                                <pre className="inline">{error.message}</pre>
                            </div>
                            <button
                                className="p-2 secondary-button"
                                type="button"
                                onClick={() => {
                                    resetErrorBoundary();
                                }}>
                                重试
                            </button>
                        </div>
                    );
                }}>
                {children}
            </ErrorBoundary>
        </Suspense>
    );
}

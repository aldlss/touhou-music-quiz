import { Suspense, memo } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Loader3FillSvg } from "./svg";
import { useTranslations } from "next-intl";

export function AdaptiveMainContain({
  children,
}: {
  children: React.JSX.Element;
}) {
  return (
    <div className="m-x-auto aspect-2/3 h-95% max-w-95% w-auto flex items-center">
      <div className="aspect-2/3 h-auto max-h-full w-full">{children}</div>
    </div>
  );
}

export function TouhouMusicQuizContainer({
  children,
}: {
  children: React.JSX.Element;
}) {
  return (
    <main className="h-screen max-h-screen min-h-480px min-w-320px w-full flex items-center justify-center">
      <AdaptiveMainContain>{children}</AdaptiveMainContain>
    </main>
  );
}

export const LoadingPage = memo(function LoadingPage() {
  const t = useTranslations("Common");

  return (
    <div className="h-full flex flex-row items-center justify-center">
      <Loader3FillSvg className="w-8 animate-spin" />
      <h1 className="text-center text-h3">{t("loading")}</h1>
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
  const t = useTranslations("Common");

  return (
    <Suspense fallback={<LoadingPage />}>
      <ErrorBoundary
        resetKeys={resetKeys}
        onReset={onRetry}
        fallbackRender={({ error, resetErrorBoundary }) => {
          const errorMessage =
            error instanceof Error ? error.message : String(error);

          return (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-center">
                <h1 className="inline text-p">{t("error")}</h1>
                <pre className="inline">{errorMessage}</pre>
              </div>
              <button
                className="secondary-button p-2"
                type="button"
                onClick={() => {
                  resetErrorBoundary();
                }}
              >
                {t("retry")}
              </button>
            </div>
          );
        }}
      >
        {children}
      </ErrorBoundary>
    </Suspense>
  );
}

interface ICommonSecondaryButtonProps {
  children: React.ReactNode;
  onClick: () => void;
}

export function CommonSecondaryButton(props: ICommonSecondaryButtonProps) {
  const { children, onClick } = props;
  return (
    <button
      type="button"
      className="w-fit self-center secondary-button p-x-4 p-y-2"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

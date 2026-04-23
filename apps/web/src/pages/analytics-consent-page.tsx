import { en } from "@ashim/shared";
import { Shield } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalyticsStore } from "@/stores/analytics-store";

const t = en.analytics;

export function AnalyticsConsentPage() {
  const navigate = useNavigate();
  const { config, configLoaded, fetchConfig, acceptAnalytics, remindLater } = useAnalyticsStore();

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (configLoaded && !config?.enabled) {
      navigate("/", { replace: true });
    }
  }, [configLoaded, config, navigate]);

  if (!configLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleAccept = async () => {
    await acceptAnalytics();
    window.location.href = "/";
  };

  const handleDecline = async () => {
    await remindLater();
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg space-y-6 rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-xl font-semibold text-foreground">{t.consentTitle}</h1>
          <p className="text-sm text-muted-foreground">{t.consentDescription}</p>
        </div>

        <p className="text-center text-sm font-medium text-foreground">{t.consentPrivacy}</p>

        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="mb-2 font-medium text-foreground">{t.whatShared}</p>
            <ul className="space-y-1 text-muted-foreground">
              {t.whatSharedItems.map((item) => (
                <li key={item} className="flex items-start gap-1.5">
                  <span className="mt-1 text-xs">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 font-medium text-foreground">{t.whatNever}</p>
            <ul className="space-y-1 text-muted-foreground">
              {t.whatNeverItems.map((item) => (
                <li key={item} className="flex items-start gap-1.5">
                  <span className="mt-1 text-xs">·</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {t.consentProviders}
          <br />
          {t.consentChangeable}
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t.acceptButton}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            {t.declineButton}
          </button>
        </div>
      </div>
    </div>
  );
}

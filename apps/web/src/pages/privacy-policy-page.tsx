import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to app
        </Link>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 29, 2026</p>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Overview</h2>
            <p>
              ashim is a self-hosted, open-source image processing application. Your instance is
              operated and controlled entirely by whoever deployed it. This policy describes how the
              software itself handles your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Local Processing</h2>
            <p>
              All image processing happens entirely on the server where ashim is deployed. Your
              images are never sent to external services or third-party APIs. When you upload an
              image for processing, it is handled in memory or in temporary storage on the host
              machine and is not retained after the operation completes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">No Tracking or Analytics</h2>
            <p>
              ashim does not include any telemetry, analytics, or tracking. No data is collected
              about your usage patterns, and no information is sent to ashim developers or any third
              party. There are no cookies used for tracking purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Data Storage</h2>
            <p>
              If authentication is enabled, the application stores user accounts (usernames and
              hashed passwords) in a local SQLite database on the host machine. If you use the Files
              feature, uploaded files are stored on the server's filesystem. All stored data remains
              entirely under the control of the instance operator.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">No Third-Party Services</h2>
            <p>
              ashim does not integrate with or send data to any external services. AI-powered
              features (background removal, upscaling, OCR) run locally using bundled models. No
              cloud APIs are involved.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Open Source</h2>
            <p>
              ashim is fully open source. You can audit the source code to verify these claims at
              any time. Transparency is a core principle of this project.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-2">Your Control</h2>
            <p>
              Because ashim is self-hosted, the instance operator has full control over all data.
              You can delete your data at any time by removing files from the server or deleting the
              database. No data exists outside of your infrastructure.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

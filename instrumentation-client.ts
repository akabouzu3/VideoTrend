import { init } from "@sentry/nextjs";
import { sentryPrivacyOptions } from "./lib/sentry-options";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    ...sentryPrivacyOptions,
    beforeSend(event) {
      delete event.request;
      delete event.user;
      delete event.breadcrumbs;
      return event;
    },
  });
}

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // Frontend-only: send everyone to /auth; the auth route forwards if a session exists.
    throw redirect({ to: "/auth" });
  },
});

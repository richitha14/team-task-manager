import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PASSWORD_REQUIREMENTS } from "@team-task-manager/shared";
import { SessionExpiredBanner } from "../components/auth/SessionExpiredBanner";
import { Alert } from "../components/ui/Alert";
import { FormField } from "../components/ui/FormField";
import { Spinner } from "../components/ui/Spinner";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function LoginPage() {
  const { login, error, fieldErrors, clearErrors } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearErrors();
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    try {
      await login({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      showToast("Signed in successfully", "success");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Sign in failed. Check your credentials.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <SessionExpiredBanner />

        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          Welcome back
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage team projects and tasks in one place.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          {error ? <Alert>{error}</Alert> : null}

          <FormField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={submitting}
            error={fieldErrors?.email?.[0]}
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={submitting}
            error={fieldErrors?.password?.[0]}
          />

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Spinner className="h-4 w-4 border-white" />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-500">{PASSWORD_REQUIREMENTS}</p>

        <p className="mt-6 text-center text-sm text-slate-600">
          No account?{" "}
          <Link to="/signup" className="font-medium text-brand-600 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

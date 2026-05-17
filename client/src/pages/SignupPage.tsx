import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PASSWORD_REQUIREMENTS } from "@team-task-manager/shared";
import { Alert } from "../components/ui/Alert";
import { FormField } from "../components/ui/FormField";
import { Spinner } from "../components/ui/Spinner";
import { ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function SignupPage() {
  const { signup, error, fieldErrors, clearErrors } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearErrors();
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    try {
      await signup({
        name: String(form.get("name")),
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      showToast("Account created successfully", "success");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Could not create account. Please review the form.";
      showToast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          Get started
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          Create account
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          The first user becomes an admin automatically.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          {error ? <Alert>{error}</Alert> : null}

          <FormField
            label="Full name"
            name="name"
            autoComplete="name"
            required
            disabled={submitting}
            error={fieldErrors?.name?.[0]}
          />
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
            autoComplete="new-password"
            required
            disabled={submitting}
            error={fieldErrors?.password?.[0]}
          />
          <p className="text-xs text-slate-500">{PASSWORD_REQUIREMENTS}</p>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Spinner className="h-4 w-4 border-white" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

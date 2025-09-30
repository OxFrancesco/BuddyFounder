"use client";
import { useState } from "react";
import { toast } from "sonner";
import { authClient } from "./lib/auth-client";

export function SignInForm() {
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (flow === "signIn") {
        await authClient.signIn.email({
          email,
          password,
        });
        toast.success("Signed in successfully!");
        window.location.href = "https://founder.buddytools.org/app";
      } else {
        await authClient.signUp.email({
          email,
          password,
          name: email.split("@")[0], // Use email prefix as default name
        });
        toast.success("Account created successfully!");
        window.location.href = "https://founder.buddytools.org/app";
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      const errorMessage =
        flow === "signIn"
          ? "Could not sign in. Check your credentials or sign up instead."
          : "Could not sign up. Try signing in instead.";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <form className="flex flex-col gap-form-field" onSubmit={handleSubmit}>
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        <div className="text-center text-sm text-secondary">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
      </form>
    </div>
  );
}
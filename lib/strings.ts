/**
 * Single source of truth for user-facing copy (PRD §16 — "no user-facing
 * string hard-coded in a component... route all copy through a single
 * strings module"). Not required for v1 i18n, but the pattern starts now,
 * with this phase's own screens, rather than as a later find-and-replace
 * across every phase that follows.
 */
export const strings = {
  auth: {
    login: {
      title: "Sign in",
      emailLabel: "Email",
      passwordLabel: "Password",
      totpLabel: "Authenticator code",
      totpHint: "Required for Owner and Accountant accounts.",
      submit: "Sign in",
      submitting: "Signing in…",
      genericError: "Something went wrong. Please try again.",
    },
    acceptInvite: {
      title: "Set up your account",
      passwordLabel: "Choose a password",
      passwordHint: "At least 12 characters.",
      submit: "Activate account",
      submitting: "Activating…",
      mfaTitle: "Set up two-factor authentication",
      mfaHint: "Scan this with your authenticator app, then enter the 6-digit code to confirm.",
      mfaCodeLabel: "6-digit code",
      mfaSubmit: "Confirm and continue",
      missingToken: "This invite link is missing its token.",
    },
    errors: {
      INVALID_CREDENTIALS: "Incorrect email or password.",
      MFA_REQUIRED: "Enter your authenticator code to continue.",
      MFA_INVALID: "That code is incorrect or has expired.",
      ACCOUNT_NOT_ACTIVE: "This account is not active.",
      RATE_LIMITED: "Too many attempts. Please wait a moment and try again.",
      INVALID_TOKEN: "This link is invalid or has expired.",
    },
  },
  shell: {
    signOut: "Sign out",
    roleLabels: {
      OWNER: "Owner",
      ACCOUNTANT: "Accountant",
      BUYER: "Buyer",
    },
    emptyState: {
      title: "Nothing here yet",
      body: "This screen fills in as later phases ship — the DNBP engine, ingestion, and publication flow all land in front of it.",
    },
  },
  theme: {
    toggleLabel: "Theme",
    light: "Light",
    dark: "Dark",
    yard: "Yard",
  },
} as const;

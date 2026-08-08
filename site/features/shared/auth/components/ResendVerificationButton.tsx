import { useState } from "react";
import { createAuthClient } from "@/platform/supabase/client";
import { Button } from "./AuthControls";
import { CircleNotch as Loader2 } from "@phosphor-icons/react";

const supabase = createAuthClient();

export function ResendVerificationButton({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setBusy(true);
    setError(null);
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
    setBusy(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return <p className="text-sm text-success">Verification email sent!</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button
        variant="secondary"
        onClick={handleResend}
        disabled={busy}
        leftIcon={busy ? <Loader2 size={14} className="animate-spin" /> : undefined}
      >
        {busy ? "Sending..." : "Resend email"}
      </Button>
    </div>
  );
}

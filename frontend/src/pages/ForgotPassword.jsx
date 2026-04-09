import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { forgotPassword, verifyOTP } from "../api/client";
import { useTheme } from "../hooks/useTheme";

export default function ForgotPassword() {
  const { C } = useTheme();
  const S = makeStyles(C);

  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── SEND OTP ─────────────────────────────
  const sendOtp = async () => {
    if (!email) {
      setMsg("Please enter email");
      setIsError(true);
      return;
    }

    try {
      setLoading(true);
      setMsg("");

      await forgotPassword(email);

      setMsg("OTP sent to your email");
      setIsError(false);
      setStep(2);

    } catch (error) {
      setMsg(error?.response?.data?.detail || "Failed to send OTP");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  // ── VERIFY OTP ───────────────────────────
  const verifyOtp = async () => {
    if (!otp) {
      setMsg("Enter OTP");
      setIsError(true);
      return;
    }

    try {
      setLoading(true);
      setMsg("");

      await verifyOTP(email, otp);

      setMsg("OTP verified");
      setIsError(false);

      setTimeout(() => {
        navigate("/reset-password", { state: { email, otp } });
      }, 800);

    } catch (error) {
      setMsg(error?.response?.data?.detail || "Invalid OTP");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.root}>
      <div style={S.card}>

        <h2 style={S.heading}>Forgot Password</h2>
        <p style={S.sub}>Reset your account access</p>

        {/* Message */}
        {msg && (
          <div style={isError ? S.errBox : S.successBox}>
            {msg}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={S.input}
            />

            <button
              onClick={sendOtp}
              disabled={loading}
              style={S.primaryBtn}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={S.input}
            />

            <button
              onClick={verifyOtp}
              disabled={loading}
              style={S.primaryBtn}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </>
        )}

        {/* Back */}
        <p style={S.backRow}>
          Remember password?{" "}
          <span style={S.backLink} onClick={() => navigate("/login")}>
            Go to Login
          </span>
        </p>

      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────
function makeStyles(C) {
  return {
    root: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: C.bgPage,
    },

    card: {
      width: 380,
      padding: 30,
      background: C.bgCard,
      border: `1px solid ${C.borderCard}`,
      borderRadius: 12,
    },

    heading: {
      fontSize: 22,
      fontWeight: 700,
      color: C.textPrimary,
      marginBottom: 6,
    },

    sub: {
      fontSize: 13,
      color: C.textSecondary,
      marginBottom: 20,
    },

    input: {
      width: "100%",
      padding: 10,
      marginBottom: 12,
      borderRadius: 8,
      border: `1px solid ${C.borderDefault}`,
      background: C.bgInput,
      color: C.textPrimary,
      outline: "none",
    },

    primaryBtn: {
      width: "100%",
      padding: 12,
      borderRadius: 8,
      border: "none",
      background: C.brandPrimary,
      color: C.textOnBrand,
      fontWeight: 600,
      cursor: "pointer",
    },

    errBox: {
      marginBottom: 12,
      padding: 10,
      background: C.errorBg,
      color: C.errorColor,
      border: `1px solid ${C.errorBorder}`,
      borderRadius: 6,
      fontSize: 13,
    },

    successBox: {
      marginBottom: 12,
      padding: 10,
      background: C.successBg,
      color: C.successColor,
      border: `1px solid ${C.successBorder}`,
      borderRadius: 6,
      fontSize: 13,
    },

    backRow: {
      marginTop: 15,
      textAlign: "center",
      fontSize: 13,
      color: C.textSecondary,
    },

    backLink: {
      color: C.brandPrimary,
      cursor: "pointer",
      fontWeight: 600,
    },
  };
}
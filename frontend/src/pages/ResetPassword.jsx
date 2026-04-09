import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { resetPassword } from "../api/client";
import { useTheme } from "../hooks/useTheme";

// ── Password Strength (theme based) ─────────────────────────
const getStrength = (pw, C) => {
  if (!pw) return { score: 0, label: "", color: "transparent" };

  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1)
    return { score, label: "Weak", color: C.errorColor };

  if (score <= 3)
    return { score, label: "Fair", color: C.brandHover };

  return { score, label: "Strong", color: C.brandPrimary };
};

export default function ResetPassword() {
  const { C } = useTheme();
  const S = makeStyles(C);

  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";
  const otp = location.state?.otp || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = getStrength(password, C);

  // ── Submit ─────────────────────────────────
  const submit = async () => {
    if (!password || !confirmPassword) {
      setMsg("Please fill all fields");
      setIsError(true);
      return;
    }

    if (password !== confirmPassword) {
      setMsg("Passwords do not match");
      setIsError(true);
      return;
    }

    try {
      setLoading(true);
      setMsg("");

      await resetPassword(email, otp, password);

      setMsg("Password reset successful");
      setIsError(false);

      setTimeout(() => navigate("/login"), 1200);

    } catch (error) {
      setMsg(error?.response?.data?.detail || "Reset failed");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.root}>
      <div style={S.card}>

        <h2 style={S.heading}>Reset Password</h2>
        <p style={S.sub}>Create a new secure password</p>

        {/* Message */}
        {msg && (
          <div style={isError ? S.errBox : S.successBox}>
            {msg}
          </div>
        )}

        {/* Password */}
        <div style={S.passWrap}>
          <input
            type={showPass ? "text" : "password"}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={S.input}
          />
          <button onClick={() => setShowPass(v => !v)} style={S.eyeBtn}>
            {showPass ? "Hide" : "Show"}
          </button>
        </div>

        {/* Strength */}
        {password && (
          <div style={S.strengthWrap}>
            <div style={S.strengthBar}>
              <div
                style={{
                  ...S.strengthFill,
                  width: `${strength.score * 20}%`,
                  background: strength.color,
                }}
              />
            </div>
            <span style={{ color: strength.color }}>
              {strength.label}
            </span>
          </div>
        )}

        {/* Confirm Password */}
        <div style={S.passWrap}>
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={S.input}
          />
          <button onClick={() => setShowConfirm(v => !v)} style={S.eyeBtn}>
            {showConfirm ? "Hide" : "Show"}
          </button>
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={loading}
          style={S.primaryBtn}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

        {/* Back */}
        <p style={S.backRow}>
          Back to{" "}
          <span style={S.backLink} onClick={() => navigate("/login")}>
            Login
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

    passWrap: {
      position: "relative",
    },

    eyeBtn: {
      position: "absolute",
      right: 10,
      top: 10,
      background: "none",
      border: "none",
      color: C.textMuted,
      cursor: "pointer",
      fontSize: 12,
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

    strengthWrap: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 12,
    },

    strengthBar: {
      flex: 1,
      height: 5,
      background: C.strengthEmpty,
      borderRadius: 5,
    },

    strengthFill: {
      height: "100%",
      borderRadius: 5,
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
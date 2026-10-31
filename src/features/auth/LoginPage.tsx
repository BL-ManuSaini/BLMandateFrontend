import React, { useEffect } from "react";
import { useSnackbar } from "notistack";
import { useLogin, useGoogleAuth } from "../../api/hooks/useAuth";
import { GoogleLogin } from "@react-oauth/google";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import EmailOutlined from "@mui/icons-material/EmailOutlined";
import LockOutlined from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useThemeStore } from "../../store";
import { GOOGLE_CLIENT_ID } from "../../api/client/config";

export const LoginPage: React.FC = () => {
  const login = useLogin();
  const { enqueueSnackbar } = useSnackbar();
  const setMode = useThemeStore((s) => s.setMode);

  useEffect(() => {
    setMode("light");
  }, [setMode]);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const authError = (login.error as any)?.message || null;

  useEffect(() => {
    if (authError) {
      enqueueSnackbar(authError, { variant: "error" });
    }
  }, [authError, enqueueSnackbar]);

  const isLoggingIn = login.isPending;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  const googleAuth = useGoogleAuth();

  const handleGoogleSuccess = (credentialResponse: any) => {
    console.log("Google Response:", credentialResponse);

    if (credentialResponse.credential) {
      console.log("JWT:", credentialResponse.credential);

      googleAuth.mutate(credentialResponse.credential);
    }
  };

  const handleGoogleError = () => {
    console.error("Google Sign-In Failed");
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#f0f4f8",
        padding: "16px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          borderRadius: 10,
          overflow: "hidden",
          border: "1px solid var(--g300)",
          minHeight: 520,
          height: "auto",
          width: "100%",
          maxWidth: 1000,
          background: "#fff",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <div
          className="login-branding-panel"
          style={{
            width: "clamp(260px, 35%, 380px)",
            background: "var(--navy)",
            flexShrink: 0,
            padding: "32px 28px",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: "50%",
              background: "rgba(10,132,208,.15)",
              top: -60,
              right: -60,
            }}
          ></div>

          <div
            style={{
              position: "absolute",
              width: 160,
              height: 160,
              borderRadius: "50%",
              background: "rgba(10,132,208,.1)",
              bottom: 40,
              left: -60,
            }}
          ></div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#fff",
              position: "relative",
            }}
          >
            BLuprint.AI
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#7CA8D4",
              marginTop: 4,
              position: "relative",
            }}
          >
            Fellowship Intelligence Platform
          </div>

          <div
            style={{
              marginTop: 36,
              position: "relative",
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: "#fff",
                lineHeight: 1.4,
              }}
            >
              Architect your
              <br />
              fellowship future
            </div>

            <div
              style={{
                fontSize: 15,
                color: "#7CA8D4",
                marginTop: 10,
                lineHeight: 1.6,
              }}
            >
              AI-powered candidate mapping across 50+ partner COEs for 500+
              corporate mandates.
            </div>
          </div>

          <div
            style={{
              marginTop: 28,
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--blue)",
                }}
              ></div>

              <span
                style={{
                  fontSize: 15,
                  color: "#A8C8E8",
                }}
              >
                Smart AI mapping engine
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--blue)",
                }}
              ></div>

              <span
                style={{
                  fontSize: 15,
                  color: "#A8C8E8",
                }}
              >
                5 role-based portals
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--blue)",
                }}
              ></div>

              <span
                style={{
                  fontSize: 15,
                  color: "#A8C8E8",
                }}
              >
                End-to-End Hiring Workflow
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--blue)",
                }}
              ></div>

              <span
                style={{
                  fontSize: 15,
                  color: "#A8C8E8",
                }}
              >
                Real-time MIS analytics
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: "auto",
              fontSize: 14,
              position: "relative",
              color: "white",
              whiteSpace: "nowrap",
            }}
          >
            © 2026 BridgeLabz Solutions Private Limited
          </div>
        </div>

        <div
          style={{
            flex: 1,
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 32,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 400,
            }}
          >
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "var(--g900)",
                marginBottom: 4,
              }}
            >
              Sign in
            </div>

            <div
              style={{
                fontSize: 16,
                color: "var(--g500)",
                marginBottom: 24,
              }}
            >
              Enter your BridgeLabz credentials to continue
            </div>

            <form onSubmit={handleSignIn}>
              <div style={{ marginBottom: 20 }}>
                <TextField
                  fullWidth
                  label="Email address"
                  placeholder="you@bridgelabz.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoggingIn}
                  variant="outlined"
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <TextField
                  fullWidth
                  label="Password"
                  placeholder="••••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoggingIn}
                  variant="outlined"
                  size="medium"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword((prev) => !prev)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                />
              </div>

              <div
                style={{
                  textAlign: "right",
                  marginBottom: 16,
                  marginTop: -6,
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    color: "var(--blue)",
                    cursor: "pointer",
                  }}
                >
                  Forgot password?
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="btn btn-primary"
                style={{
                  fontWeight: 600,
                  width: "100%",
                  justifyContent: "center",
                  padding: 12,
                }}
              >
                {isLoggingIn ? (
                  <>
                    <CircularProgress size={20} thickness={5} sx={{ color: "#fff", mr: 1 }} />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            {/* {GOOGLE_CLIENT_ID && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    margin: "20px 0",
                  }}
                >
                  <div style={{ flex: 1, height: 1, background: "var(--g200)" }} />
                  <span
                    style={{
                      padding: "0 10px",
                      fontSize: 13,
                      color: "var(--g500)",
                    }}
                  >
                    OR
                  </span>
                  <div style={{ flex: 1, height: 1, background: "var(--g200)" }} />
                </div>

                <div style={{ display: "flex", justifyContent: "center" }}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap
                    theme="outline"
                    size="large"
                    shape="rectangular"
                    width="400"
                    logo_alignment="center"
                  />
                </div>
              </>
            )} */}
            {/* 
            <div
              style={{
                marginTop: 16,
                background: 'var(--blue-light)',
                borderRadius: 6,
                padding: '8px 10px',
                fontSize: 14,
                color: 'var(--navy)'
              }}
            >
              <strong>Demo accounts:</strong> am@bl.com · clh@bl.com ·
              hoe@bl.com · mis@bl.com · coord@bl.com
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

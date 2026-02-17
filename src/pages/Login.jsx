import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { generateOtp, validateOtp } from "../services/authService.js";
import { useAuth } from "../state/auth/AuthContext.jsx";
import toast from "react-hot-toast";

export default function Login() {
  const { setToken, mobileNumber, setMobileNumber } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState("mobile");
  const [isLoading, setIsLoading] = useState(false);
  const activeToastIdRef = useRef(null);

  const dismissActiveToast = () => {
    if (activeToastIdRef.current) {
      toast.dismiss(activeToastIdRef.current);
      activeToastIdRef.current = null;
    }
  };

  useEffect(() => dismissActiveToast, []);

  const from = useMemo(
    () => location.state?.from || "/upload",
    [location.state],
  );

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: { mobile_number: mobileNumber || "", otp: "" },
  });

  const onGenerate = async (values) => {
    const mobile = values?.mobile_number?.trim?.() || values?.mobile_number;
    if (!mobile) {
      dismissActiveToast();
      toast.error("Mobile number is required");
      return;
    }

    setIsLoading(true);
    dismissActiveToast();
    activeToastIdRef.current = toast.loading("Generating OTP...");
    try {
      setMobileNumber(mobile);
      await generateOtp(mobile);
      toast.success("OTP generated successfully", { id: activeToastIdRef.current });
      setStep("otp");
    } catch {
      toast.error("Failed to generate OTP. Please try again.", {
        id: activeToastIdRef.current,
      });
    } finally {
      setIsLoading(false);
      activeToastIdRef.current = null;
    }
  };

  const onValidate = async (values) => {
    setIsLoading(true);
    dismissActiveToast();
    activeToastIdRef.current = toast.loading("Validating OTP...");
    try {
      const res = await validateOtp({
        mobile_number: values.mobile_number,
        otp: values.otp,
      });
      if (!res.token) {
        toast.error("OTP validated but token was not found in response.", {
          id: activeToastIdRef.current,
        });
        return;
      }
      setToken(res.token);
      toast.success("Logged in. Redirecting...", { id: activeToastIdRef.current });
      navigate(from, { replace: true });
    } catch {
      toast.error("Invalid OTP or request failed.", { id: activeToastIdRef.current });
    } finally {
      setIsLoading(false);
      activeToastIdRef.current = null;
    }
  };

  return (
    <div className="min-h-dvh bg-slate-50">
      <div className="mx-auto flex min-h-dvh max-w-md items-center p-4">
        <div className="w-full border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-2">
            <div className="text-xl font-semibold text-slate-900">
              Login with OTP
            </div>
            <div className="text-sm text-slate-600">
              Generate OTP using your mobile number, then validate to receive a
              token.
            </div>
          </div>

          <form
            onSubmit={handleSubmit(step === "mobile" ? onGenerate : onValidate)}
            className="mt-6 space-y-4"
          >
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-800">
                Mobile Number
              </label>
              <input
                inputMode="numeric"
                autoComplete="tel"
                disabled={step === "otp"}
                className="w-full border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-100"
                {...register("mobile_number", {
                  required: "Mobile number is required",
                  minLength: {
                    value: 8,
                    message: "Mobile number looks too short",
                  },
                })}
                placeholder="Enter your mobile number"
              />
              {errors.mobile_number ? (
                <div className="text-xs font-medium text-red-600">
                  {errors.mobile_number.message}
                </div>
              ) : null}
            </div>

            {step === "otp" ? (
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-slate-800">
                  OTP
                </label>
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="w-full border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                  {...register("otp", { required: "OTP is required" })}
                />
                {errors.otp ? (
                  <div className="text-xs font-medium text-red-600">
                    {errors.otp.message}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 cursor-pointer  bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading
                  ? "Loading..."
                  : step === "mobile"
                    ? "Generate OTP"
                    : "Validate OTP"}
              </button>
              {step === "otp" ? (
                <button
                  type="button"
                  onClick={() => {
                    setStep("mobile");
                    dismissActiveToast();
                  }}
                  className="cursor-pointer border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Edit"}
                </button>
              ) : null}
            </div>

            {step === "otp" ? (
              <button
                type="button"
                onClick={() =>
                  onGenerate({ mobile_number: getValues("mobile_number") })
                }
                className="w-full cursor-pointer border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Resend OTP"}
              </button>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}

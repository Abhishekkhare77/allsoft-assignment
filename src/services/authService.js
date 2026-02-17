import apiClient from "./apiClient.js";

function extractToken(payload) {
  if (!payload) return null;
  const direct = payload.token || payload.Token;
  if (direct) return direct;
  const nested =
    payload.data?.token ||
    payload.data?.Token ||
    payload.result?.token ||
    payload.result?.Token ||
    payload.response?.token ||
    payload.response?.Token;
  return nested || null;
}

export async function generateOtp(mobile_number) {
  const res = await apiClient.post("/generateOTP", { mobile_number });
  return res.data;
}

export async function validateOtp({ mobile_number, otp }) {
  const res = await apiClient.post("/validateOTP", { mobile_number, otp });
  const token = extractToken(res.data);
  return { raw: res.data, token };
}


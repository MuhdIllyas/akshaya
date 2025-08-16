import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Create a new wallet
export const createWallet = async (walletData) => {
  const response = await axios.post(`${API_URL}/api/wallet/create`, walletData);
  return response;
};

// Update a wallet
export const updateWallet = async (walletId, walletData) => {
  const response = await axios.put(`${API_URL}/api/wallet/${walletId}`, walletData);
  return response;
};

// Delete a wallet
export const deleteWallet = async (walletId, walletData) => {
  return response;
};

// audits log
export const getAuditLogs = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }
  try {
    const response = await axios.get(`${API_URL}/api/wallet/audit-logs`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("getAuditLogs response:", response.data);
    return response; // Return full response, let fetchAuditLogs handle data.data
  } catch (error) {
    console.error("getAuditLogs Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// Get all wallets (used by WalletManagement)
export const getWallets = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/wallet/wallets`);
    console.log("getWallets response:", response.data);
    return response;
  } catch (error) {
    console.error("getWallets Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// Get a single wallet by ID (for WalletActivity)
export const getWalletById = async (walletId) => {
  if (!walletId) {
    console.error("getWalletById: No walletId provided");
    throw new Error("Wallet ID is required");
  }
  const token = localStorage.getItem("token");
  console.log("getWalletById: Requesting walletId:", walletId, "Token:", token ? "Present" : "Missing");
  if (!token) {
    throw new Error("No authentication token found");
  }
  try {
    const response = await axios.get(`${API_URL}/api/wallet/wallets/${walletId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("getWalletById response:", response.data);
    return response;
  } catch (error) {
    console.error("getWalletById Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      walletId,
    });
    throw error;
  }
};

// Get transactions for a specific wallet (for WalletActivity)
export const getWalletTransactions = async (walletId) => {
  if (!walletId) {
    console.error("getWalletTransactions: No walletId provided");
    throw new Error("Wallet ID is required");
  }
  const token = localStorage.getItem("token");
  console.log("getWalletTransactions: Requesting walletId:", walletId, "Token:", token ? "Present" : "Missing");
  if (!token) {
    throw new Error("No authentication token found");
  }
  try {
    const response = await axios.get(`${API_URL}/api/wallet/transactions/${walletId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("getWalletTransactions response:", response.data);
    console.log("Calling getWalletTransactions for walletId:", walletId);
    return response;
  } catch (error) {
    console.error("getWalletTransactions Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      walletId,
    });
    throw error;
  }
};

// Get all transactions (used by WalletManagement)
export const getTransactions = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/wallet/transactions`);
    console.log("getTransactions response:", response.data);
    return response;
  } catch (error) {
    console.error("getTransactions Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// Get all staff
export const getStaff = async () => {
  const token = localStorage.getItem("token");
  console.log("getStaff: Requesting:", `${API_URL}/api/staff/all`, "Token:", token ? "Present" : "Missing");
  if (!token) {
    throw new Error("No authentication token found");
  }
  try {
    const response = await axios.get(`${API_URL}/api/staff/all`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("getStaff response:", response.data);
    return response.data;
  } catch (error) {
    console.error("getStaff Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// Recharge wallet
export const rechargeWallet = async (rechargeData) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }
  try {
    const transactionData = {
      wallet_id: rechargeData.wallet_id,
      amount: rechargeData.amount,
      type: "credit",
      description: rechargeData.description,
      category: rechargeData.category,
      staff_id: rechargeData.staff_id,
    };
    const response = await axios.post(
      `${API_URL}/api/wallet/transactions`,
      transactionData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log("rechargeWallet response:", response.data);
    return response;
  } catch (error) {
    console.error("rechargeWallet Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// Transfer wallet
export const transferWallet = async (transferData) => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }
  try {
    console.log("transferWallet: Sending payload:", transferData);
    const response = await axios.post(
      `${API_URL}/api/wallet/transfer`,
      transferData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("transferWallet response:", response.data);
    return response;
  } catch (error) {
    console.error("transferWallet Error:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    if (error.response?.status === 401) {
      alert("Session expired. Please log in again.");
      window.location.href = "/login";
    }
    throw error;
  }
};


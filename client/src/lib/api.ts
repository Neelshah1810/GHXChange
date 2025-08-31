import { apiRequest } from "./queryClient";
import { LoginData, RegisterData, IssueCreditsData, TransferCreditsData, PurchaseCreditsData, RoleSwitchData } from "@shared/schema";

export const api = {
  auth: {
    login: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/login", data);
      return response.json();
    },
    register: async (data: RegisterData) => {
      const response = await apiRequest("POST", "/api/register", data);
      return response.json();
    }
  },

  wallet: {
    getBalance: async (address: string) => {
      const response = await apiRequest("GET", `/api/balance/${address}`);
      return response.json();
    }
  },

  transactions: {
    getByAddress: async (address: string) => {
      const response = await apiRequest("GET", `/api/transactions/${address}`);
      return response.json();
    },
    getAll: async () => {
      const response = await apiRequest("GET", "/api/transactions");
      return response.json();
    }
  },

  credits: {
    issue: async (data: IssueCreditsData & { producerAddress: string }) => {
      const response = await apiRequest("POST", "/api/issue", data);
      return response.json();
    },
    purchase: async (data: PurchaseCreditsData & { buyerAddress: string }) => {
      const response = await apiRequest("POST", "/api/purchase", data);
      return response.json();
    },
    retire: async (data: { address: string; amount: number; purpose?: string }) => {
      const response = await apiRequest("POST", "/api/retire", data);
      return response.json();
    }
  },

  certificates: {
    getAll: async () => {
      const response = await apiRequest("GET", "/api/certificates");
      return response.json();
    },
    getByProducer: async (address: string) => {
      const response = await apiRequest("GET", `/api/certificates/${address}`);
      return response.json();
    },
    verify: async (certificateId: string) => {
      const response = await apiRequest("POST", `/api/certificates/${certificateId}/verify`);
      return response.json();
    },
    flag: async (certificateId: string, reason?: string) => {
      const response = await apiRequest("POST", `/api/certificates/${certificateId}/flag`, { reason });
      return response.json();
    }
  },

  system: {
    getStats: async () => {
      const response = await apiRequest("GET", "/api/stats");
      return response.json();
    },
    getProducers: async () => {
      const response = await apiRequest("GET", "/api/producers");
      return response.json();
    }
  },

  user: {
    getRoles: async (walletAddress: string) => {
      const response = await apiRequest("GET", `/api/users/${walletAddress}/roles`);
      return response.json();
    },
    switchRole: async (data: RoleSwitchData) => {
      const response = await apiRequest("POST", "/api/users/switch-role", data);
      return response.json();
    }
  }
};

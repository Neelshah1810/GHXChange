import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, issueCreditsSchema, transferCreditsSchema, purchaseCreditsSchema } from "@shared/schema";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password, role } = loginSchema.parse(req.body);
      const user = await storage.authenticateUser(username, password, role);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const wallet = await storage.getWallet(user.walletAddress!);
      res.json({ 
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          walletAddress: user.walletAddress
        },
        wallet: wallet ? {
          address: wallet.address,
          balance: wallet.balance,
          type: wallet.type,
          name: wallet.name
        } : null
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Get current user balance
  app.get("/api/balance/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const wallet = await storage.getWallet(address);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      res.json({ balance: wallet.balance });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get transactions for an address
  app.get("/api/transactions/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const transactions = await storage.getTransactionsByAddress(address);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get all transactions (for auditors)
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getAllTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Issue credits (for producers)
  app.post("/api/issue", async (req, res) => {
    try {
      const { hydrogenKg, energySource, location } = issueCreditsSchema.parse(req.body);
      const { producerAddress } = req.body;

      if (!producerAddress) {
        return res.status(400).json({ message: "Producer address is required" });
      }

      const producer = await storage.getWallet(producerAddress);
      if (!producer) {
        return res.status(404).json({ message: "Producer wallet not found" });
      }

      // Create certificate
      const certificateId = `cert_${randomUUID().substring(0, 8)}`;
      const certificate = await storage.createCertificate({
        certificateId,
        producerAddress,
        hydrogenKg,
        energySource,
        location,
        productionDate: new Date(),
        certifierName: "Energy Regulatory Authority",
        signature: `0x${Math.random().toString(16).substring(2).padStart(130, '0')}`
      });

      // Create transaction
      const txHash = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`;
      const transaction = await storage.createTransaction({
        txHash,
        fromAddress: "SYSTEM",
        toAddress: producerAddress,
        amount: hydrogenKg,
        txType: "issue",
        signature: `0x${Math.random().toString(16).substring(2).padStart(130, '0')}`,
        data: { certificateId }
      });

      // Update balance
      await storage.updateWalletBalance(producerAddress, producer.balance! + hydrogenKg);

      res.json({ 
        transaction,
        certificate,
        message: `Successfully issued ${hydrogenKg} GHC credits` 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Purchase credits (for buyers)
  app.post("/api/purchase", async (req, res) => {
    try {
      const { producerAddress, amount } = purchaseCreditsSchema.parse(req.body);
      const { buyerAddress } = req.body;

      if (!buyerAddress) {
        return res.status(400).json({ message: "Buyer address is required" });
      }

      const producer = await storage.getWallet(producerAddress);
      const buyer = await storage.getWallet(buyerAddress);

      if (!producer || !buyer) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      if (producer.balance! < amount) {
        return res.status(400).json({ message: "Insufficient credits available" });
      }

      // Create transaction
      const txHash = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`;
      const transaction = await storage.createTransaction({
        txHash,
        fromAddress: producerAddress,
        toAddress: buyerAddress,
        amount,
        txType: "transfer",
        signature: `0x${Math.random().toString(16).substring(2).padStart(130, '0')}`,
        data: { type: "purchase", price: amount * 32.5 }
      });

      // Update balances
      await storage.updateWalletBalance(producerAddress, producer.balance! - amount);
      await storage.updateWalletBalance(buyerAddress, buyer.balance! + amount);

      res.json({ 
        transaction,
        message: `Successfully purchased ${amount} GHC credits` 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Retire credits
  app.post("/api/retire", async (req, res) => {
    try {
      const { address, amount, purpose } = req.body;

      if (!address || !amount) {
        return res.status(400).json({ message: "Address and amount are required" });
      }

      const wallet = await storage.getWallet(address);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      if (wallet.balance! < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Create transaction
      const txHash = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`;
      const transaction = await storage.createTransaction({
        txHash,
        fromAddress: address,
        toAddress: "0x000000000000000000000000000000000000dEaD",
        amount,
        txType: "retire",
        signature: `0x${Math.random().toString(16).substring(2).padStart(130, '0')}`,
        data: { purpose }
      });

      // Update balance
      await storage.updateWalletBalance(address, wallet.balance! - amount);

      res.json({ 
        transaction,
        message: `Successfully retired ${amount} GHC credits` 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Get all certificates
  app.get("/api/certificates", async (req, res) => {
    try {
      const certificates = await storage.getAllCertificates();
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get certificates by producer
  app.get("/api/certificates/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const certificates = await storage.getCertificatesByProducer(address);
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get system stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get producers list (for buyers)
  app.get("/api/producers", async (req, res) => {
    try {
      const producers = await storage.getWalletsByType("producer");
      res.json(producers.map(p => ({
        address: p.address,
        name: p.name,
        balance: p.balance
      })));
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

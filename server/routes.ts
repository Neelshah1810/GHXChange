import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { DatabaseStorage } from "./database-storage";
import { db } from "./db";
import { loginSchema, registerSchema, issueCreditsSchema, transferCreditsSchema, purchaseCreditsSchema, roleSwitchSchema } from "@shared/schema";
import { randomUUID } from "crypto";

// Use database storage if available, fallback to memory storage
const storageInstance = db ? new DatabaseStorage() : storage;

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = registerSchema.parse(req.body);
      
      // Check if storage supports registration
      if (!storageInstance.registerUser) {
        return res.status(503).json({ message: "Registration not available" });
      }
      
      // Check if user already exists
      const existingUser = await storageInstance.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const result = await storageInstance.registerUser(userData);
      console.log('Registration result:', JSON.stringify(result, null, 2));
      
      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: result.user.id,
          username: result.user.username,
          role: result.user.role,
          name: result.user.name,
          walletAddress: result.user.walletAddress
        },
        wallet: {
          address: result.wallet.address,
          balance: result.wallet.balance,
          type: result.wallet.type,
          name: result.wallet.name
        }
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.message?.includes("already exists")) {
        return res.status(400).json({ message: "Username already exists" });
      }
      res.status(400).json({ message: "Registration failed", error: error.message });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      // First validate the request schema
      const { username, password, role } = loginSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storageInstance.getUserByUsername(username);
      if (!existingUser) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Check role before attempting password verification
      if (existingUser.role !== role) {
        return res.status(401).json({ 
          message: `You are registered as a ${existingUser.role}, not as a ${role}` 
        });
      }

      // Attempt authentication with password
      const user = await storageInstance.authenticateUser(username, password, role);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Get associated wallet
      const wallet = await storageInstance.getWallet(user.walletAddress!);
      if (!wallet) {
        return res.status(500).json({ message: "User wallet not found" });
      }
      
      // Return successful login response
      res.json({ 
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          walletAddress: user.walletAddress
        },
        wallet: {
          address: wallet.address,
          balance: wallet.balance,
          type: wallet.type,
          name: wallet.name
        }
      });
    } catch (error) {
      if (error?.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  // Get current user balance
  app.get("/api/balance/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const wallet = await storageInstance.getWallet(address);
      
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
      const transactions = await storageInstance.getTransactionsByAddress(address);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get all transactions (for auditors)
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storageInstance.getAllTransactions();
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

      const producer = await storageInstance.getWallet(producerAddress);
      if (!producer) {
        return res.status(404).json({ message: "Producer wallet not found" });
      }

      // Create certificate (pending verification)
      const certificateId = `cert_${randomUUID().substring(0, 8)}`;
      const certificate = await storageInstance.createCertificate({
        certificateId,
        producerAddress,
        hydrogenKg,
        energySource,
        location,
        productionDate: new Date(),
        certifierName: "Energy Regulatory Authority",
        signature: `0x${Math.random().toString(16).substring(2).padStart(130, '0')}`
      });

      // Create transaction (don't issue credits yet, wait for verification)
      const txHash = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`;
      const transaction = await storageInstance.createTransaction({
        txHash,
        fromAddress: "SYSTEM",
        toAddress: producerAddress,
        amount: hydrogenKg,
        txType: "issue",
        signature: `0x${Math.random().toString(16).substring(2).padStart(130, '0')}`,
        data: { certificateId }
      });

      // Don't update balance yet - wait for auditor verification
      // await storageInstance.updateWalletBalance(producerAddress, producer.balance! + hydrogenKg);

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

      const producer = await storageInstance.getWallet(producerAddress);
      const buyer = await storageInstance.getWallet(buyerAddress);

      if (!producer || !buyer) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      if (producer.balance! < amount) {
        return res.status(400).json({ message: "Insufficient credits available" });
      }

      // Create transaction
      const txHash = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`;
      const transaction = await storageInstance.createTransaction({
        txHash,
        fromAddress: producerAddress,
        toAddress: buyerAddress,
        amount,
        txType: "transfer",
        signature: `0x${Math.random().toString(16).substring(2).padStart(130, '0')}`,
        data: { type: "purchase", price: amount * 2700 }
      });

      // Update balances
      await storageInstance.updateWalletBalance(producerAddress, producer.balance! - amount);
      await storageInstance.updateWalletBalance(buyerAddress, buyer.balance! + amount);

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

      const wallet = await storageInstance.getWallet(address);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      if (wallet.balance! < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Create transaction
      const txHash = `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`;
      const transaction = await storageInstance.createTransaction({
        txHash,
        fromAddress: address,
        toAddress: "0x000000000000000000000000000000000000dEaD",
        amount,
        txType: "retire",
        signature: `0x${Math.random().toString(16).substring(2).padStart(130, '0')}`,
        data: { purpose }
      });

      // Update balance
      await storageInstance.updateWalletBalance(address, wallet.balance! - amount);

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
      const certificates = await storageInstance.getAllCertificates();
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get certificates by producer
  app.get("/api/certificates/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const certificates = await storageInstance.getCertificatesByProducer(address);
      res.json(certificates);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Switch user role
  app.post("/api/users/switch-role", async (req, res) => {
    try {
      const { walletAddress, newRole } = roleSwitchSchema.parse(req.body);

      // Get wallet and user
      const wallet = await storageInstance.getWallet(walletAddress);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      const user = await storageInstance.getUserByWalletAddress(walletAddress);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check criteria: require 1000 GHC to become a producer
      if (newRole === 'producer') {
        if ((wallet.balance || 0) < 1000) {
          return res.status(400).json({ 
            message: 'Insufficient balance. Need at least 1000 GHC to become a producer.'
          });
        }

        // Update user role and wallet type
        await storageInstance.updateUserRole(user.id, 'producer');
        await storageInstance.updateWalletType(wallet.address, 'producer');

        res.json({ 
          message: "Successfully switched to producer role",
          newRole: 'producer',
          wallet: {
            ...wallet,
            type: 'producer'
          }
        });
      } else if (newRole === 'buyer') {
        // Update user role and wallet type
        await storageInstance.updateUserRole(user.id, 'buyer');
        await storageInstance.updateWalletType(wallet.address, 'buyer');

        res.json({ 
          message: "Successfully switched to buyer role",
          newRole: 'buyer',
          wallet: {
            ...wallet,
            type: 'buyer'
          }
        });
      }
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Get user roles
  app.get("/api/users/:walletAddress/roles", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      const wallet = await storageInstance.getWallet(walletAddress);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      // For now, return the primary role from the user record
      const user = await storageInstance.getUserByWalletAddress(walletAddress);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json([
        { id: 'primary', role: user.role, isActive: true }
      ]);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get system stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storageInstance.getSystemStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get producers list (for buyers)
  app.get("/api/producers", async (req, res) => {
    try {
      const producers = await storageInstance.getWalletsByType("producer");
      res.json(producers.map(p => ({
        address: p.address,
        name: p.name,
        balance: p.balance
      })));
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Verify certificate (for auditors)
  app.post("/api/certificates/:certificateId/verify", async (req, res) => {
    try {
      const { certificateId } = req.params;
      const certificate = await storageInstance.getCertificate(certificateId);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }

      if (certificate.status !== 'pending') {
        return res.status(400).json({ message: "Certificate is not pending verification" });
      }

      // Update certificate status to verified
      await storageInstance.updateCertificateStatus(certificateId, "valid");
      
      // Now issue the credits by updating producer balance
      const producer = await storageInstance.getWallet(certificate.producerAddress!);
      if (producer) {
        await storageInstance.updateWalletBalance(
          certificate.producerAddress!, 
          producer.balance! + certificate.hydrogenKg!
        );
      }
      
      res.json({ 
        message: `Certificate ${certificateId} has been verified and ${certificate.hydrogenKg} GHC credits have been issued`,
        certificate: { ...certificate, status: "valid" }
      });
    } catch (error) {
      console.error('Certificate verification error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Flag certificate (for auditors)
  app.post("/api/certificates/:certificateId/flag", async (req, res) => {
    try {
      const { certificateId } = req.params;
      const { reason } = req.body;
      const certificate = await storageInstance.getCertificate(certificateId);
      
      if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
      }

      // Update certificate status to flagged
      await storageInstance.updateCertificateStatus(certificateId, "flagged");
      
      res.json({ 
        message: `Certificate ${certificateId} has been flagged`,
        certificate: { ...certificate, status: "flagged" },
        reason
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import { type User, type InsertUser, type Wallet, type InsertWallet, type Transaction, type InsertTransaction, type Certificate, type InsertCertificate, type RegisterData } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(address: string): Promise<User | undefined>;
  updateUserRole(userId: string, role: string): Promise<void>;
  createUser(user: InsertUser): Promise<User>;
  authenticateUser(username: string, password: string, role: string): Promise<User | null>;
  registerUser?(userData: RegisterData): Promise<{ user: User; wallet: Wallet }>;

  // Wallet operations
  getWallet(address: string): Promise<Wallet | undefined>;
  getWalletsByType(type: string): Promise<Wallet[]>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;
  updateWalletBalance(address: string, balance: number): Promise<void>;
  updateWalletType(address: string, type: string): Promise<void>;
  getAllWallets(): Promise<Wallet[]>;

  // Transaction operations
  getTransaction(txHash: string): Promise<Transaction | undefined>;
  getTransactionsByAddress(address: string): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // Certificate operations
  getCertificate(certificateId: string): Promise<Certificate | undefined>;
  getCertificatesByProducer(producerAddress: string): Promise<Certificate[]>;
  getAllCertificates(): Promise<Certificate[]>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;
  updateCertificateStatus(certificateId: string, status: string): Promise<void>;

  // System stats
  getSystemStats(): Promise<{
    totalIssued: number;
    totalRetired: number;
    activeCredits: number;
    totalProducers: number;
    totalBuyers: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private wallets: Map<string, Wallet>;
  private transactions: Map<string, Transaction>;
  private certificates: Map<string, Certificate>;

  constructor() {
    this.users = new Map();
    this.wallets = new Map();
    this.transactions = new Map();
    this.certificates = new Map();
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Create demo users
    const demoUsers = [
      { username: "producer1", password: "password", role: "producer", name: "GreenEnergy Corp" },
      { username: "buyer1", password: "password", role: "buyer", name: "Steel Industries Ltd" },
      { username: "auditor1", password: "password", role: "auditor", name: "Regulatory Authority" },
    ];

    demoUsers.forEach(userData => {
      const user: User = {
        id: randomUUID(),
        username: userData.username,
        password: userData.password,
        role: userData.role,
        name: userData.name,
        walletAddress: `0x${Math.random().toString(16).substring(2, 42).padStart(40, '0')}`
      };
      this.users.set(user.id, user);

      // Create corresponding wallet
      const wallet: Wallet = {
        id: randomUUID(),
        address: user.walletAddress!,
        privateKey: `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`,
        name: userData.name,
        type: userData.role,
        balance: userData.role === "producer" ? 1247 : userData.role === "buyer" ? 573 : 0
      };
      this.wallets.set(wallet.address, wallet);
    });

    // Create demo transactions
    const walletAddresses = Array.from(this.wallets.keys());
    if (walletAddresses.length >= 2) {
      const demoTransactions = [
        {
          txHash: `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`,
          fromAddress: "SYSTEM",
          toAddress: walletAddresses[0],
          amount: 150,
          txType: "issue",
          signature: `0x${Math.random().toString(16).substring(2).padStart(130, '0')}`,
          data: { certificateId: "cert_001" },
          status: "confirmed"
        },
        {
          txHash: `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`,
          fromAddress: walletAddresses[0],
          toAddress: walletAddresses[1],
          amount: 75,
          txType: "transfer",
          signature: `0x${Math.random().toString(16).substring(2).padStart(130, '0')}`,
          data: {},
          status: "confirmed"
        }
      ];

      demoTransactions.forEach(txData => {
        const transaction: Transaction = {
          id: randomUUID(),
          ...txData,
          timestamp: new Date()
        };
        this.transactions.set(transaction.txHash, transaction);
      });
    }

    // Create demo certificates
    if (walletAddresses.length > 0) {
      const certificate: Certificate = {
        id: randomUUID(),
        certificateId: "cert_001",
        producerAddress: walletAddresses[0],
        hydrogenKg: 150,
        energySource: "Solar PV",
        location: "Gujarat, India",
        productionDate: new Date(),
        issueDate: new Date(),
        certifierName: "Energy Regulatory Authority",
        signature: `0x${Math.random().toString(16).substring(2).padStart(130, '0')}`,
        status: "valid"
      };
      this.certificates.set(certificate.certificateId, certificate);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByWalletAddress(address: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.walletAddress === address);
  }

  async updateUserRole(userId: string, role: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.role = role as any;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      walletAddress: `0x${Math.random().toString(16).substring(2, 42).padStart(40, '0')}`,
      name: insertUser.name || null
    };
    this.users.set(id, user);
    return user;
  }

  async authenticateUser(username: string, password: string, role: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (user && user.password === password && user.role === role) {
      return user;
    }
    return null;
  }

  async registerUser(userData: RegisterData): Promise<{ user: User; wallet: Wallet }> {
    // Check if user already exists
    const existingUser = await this.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Generate wallet address
    const walletAddress = `0x${Math.random().toString(16).substring(2, 42).padStart(40, '0')}`;
    
    // Create user
    const user: User = {
      id: randomUUID(),
      username: userData.username,
      password: userData.password, // In memory storage doesn't hash passwords
      role: userData.role,
      name: userData.name,
      walletAddress
    };
    this.users.set(user.id, user);

    // Create wallet
    const wallet: Wallet = {
      id: randomUUID(),
      address: walletAddress,
      privateKey: `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`,
      name: userData.name,
      type: userData.role,
      balance: 0
    };
    this.wallets.set(wallet.address, wallet);

    return { user, wallet };
  }

  async getWallet(address: string): Promise<Wallet | undefined> {
    return this.wallets.get(address);
  }

  async getWalletsByType(type: string): Promise<Wallet[]> {
    return Array.from(this.wallets.values()).filter(wallet => wallet.type === type);
  }

  async createWallet(insertWallet: InsertWallet): Promise<Wallet> {
    const id = randomUUID();
    const wallet: Wallet = { ...insertWallet, id, balance: 0 };
    this.wallets.set(wallet.address, wallet);
    return wallet;
  }

  async updateWalletBalance(address: string, balance: number): Promise<void> {
    const wallet = this.wallets.get(address);
    if (wallet) {
      wallet.balance = balance;
    }
  }

  async updateWalletType(address: string, type: string): Promise<void> {
    const wallet = this.wallets.get(address);
    if (wallet) {
      wallet.type = type as any;
    }
  }

  async getAllWallets(): Promise<Wallet[]> {
    return Array.from(this.wallets.values());
  }

  async getTransaction(txHash: string): Promise<Transaction | undefined> {
    return this.transactions.get(txHash);
  }

  async getTransactionsByAddress(address: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      tx => tx.fromAddress === address || tx.toAddress === address
    );
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort(
      (a, b) => b.timestamp!.getTime() - a.timestamp!.getTime()
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      timestamp: new Date(),
      status: "confirmed",
      data: insertTransaction.data || null
    };
    this.transactions.set(transaction.txHash, transaction);
    return transaction;
  }

  async getCertificate(certificateId: string): Promise<Certificate | undefined> {
    return this.certificates.get(certificateId);
  }

  async getCertificatesByProducer(producerAddress: string): Promise<Certificate[]> {
    return Array.from(this.certificates.values()).filter(
      cert => cert.producerAddress === producerAddress
    );
  }

  async getAllCertificates(): Promise<Certificate[]> {
    return Array.from(this.certificates.values()).sort(
      (a, b) => b.issueDate!.getTime() - a.issueDate!.getTime()
    );
  }

  async createCertificate(insertCertificate: InsertCertificate): Promise<Certificate> {
    const id = randomUUID();
    const certificate: Certificate = {
      ...insertCertificate,
      id,
      issueDate: new Date(),
      status: "valid"
    };
    this.certificates.set(certificate.certificateId, certificate);
    return certificate;
  }

  async updateCertificateStatus(certificateId: string, status: string): Promise<void> {
    const certificate = this.certificates.get(certificateId);
    if (certificate) {
      certificate.status = status;
    }
  }

  async getSystemStats(): Promise<{
    totalIssued: number;
    totalRetired: number;
    activeCredits: number;
    totalProducers: number;
    totalBuyers: number;
  }> {
    const transactions = Array.from(this.transactions.values());
    const wallets = Array.from(this.wallets.values());

    const totalIssued = transactions
      .filter(tx => tx.txType === "issue")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalRetired = transactions
      .filter(tx => tx.txType === "retire")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const activeCredits = totalIssued - totalRetired;
    const totalProducers = wallets.filter(w => w.type === "producer").length;
    const totalBuyers = wallets.filter(w => w.type === "buyer").length;

    return {
      totalIssued,
      totalRetired,
      activeCredits,
      totalProducers,
      totalBuyers
    };
  }
}

export const storage = new MemStorage();

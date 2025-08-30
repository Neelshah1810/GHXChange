import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { db, users, wallets, transactions, certificates } from './db';
import { IStorage } from './storage';
import { type User, type InsertUser, type Wallet, type InsertWallet, type Transaction, type InsertTransaction, type Certificate, type InsertCertificate, type RegisterData } from '@shared/schema';

export class DatabaseStorage implements IStorage {
  // Helper method to generate wallet address
  private generateWalletAddress(): string {
    return `0x${Math.random().toString(16).substring(2, 42).padStart(40, '0')}`;
  }

  // Helper method to generate private key
  private generatePrivateKey(): string {
    return `0x${Math.random().toString(16).substring(2).padStart(64, '0')}`;
  }

  // User registration
  async registerUser(userData: RegisterData): Promise<{ user: User; wallet: Wallet }> {
    try {
      console.log('🔄 Starting user registration for:', userData.username);
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      console.log('✅ Password hashed');
      
      // Generate wallet
      const walletAddress = this.generateWalletAddress();
      const privateKey = this.generatePrivateKey();
      console.log('✅ Wallet generated:', walletAddress);
      
      // Create user
      const newUser: InsertUser = {
        username: userData.username,
        password: hashedPassword,
        role: userData.role,
        name: userData.name,
        walletAddress
      };
      console.log('🔄 Inserting user into database...');
      
      const [user] = await db.insert(users).values(newUser).returning();
      console.log('✅ User created:', user.id);
      
      // Create wallet
      const newWallet: InsertWallet = {
        address: walletAddress,
        privateKey,
        name: userData.name,
        type: userData.role,
      };
      console.log('🔄 Inserting wallet into database...');
      
      const [wallet] = await db.insert(wallets).values(newWallet).returning();
      console.log('✅ Wallet created:', wallet.id);
      
      return { user, wallet };
    } catch (error) {
      console.error('❌ Registration error details:', error);
      console.error('Error stack:', error.stack);
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id));
      return result[0];
    } catch (error) {
      console.error('Get user error:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username));
      return result[0];
    } catch (error) {
      console.error('Get user by username error:', error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [newUser] = await db.insert(users).values(user).returning();
      return newUser;
    } catch (error) {
      console.error('Create user error:', error);
      throw new Error('Failed to create user');
    }
  }

  async authenticateUser(username: string, password: string, role: string): Promise<User | null> {
    try {
      const user = await this.getUserByUsername(username);
      if (!user || user.role !== role) {
        return null;
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  // Wallet operations
  async getWallet(address: string): Promise<Wallet | undefined> {
    try {
      const result = await db.select().from(wallets).where(eq(wallets.address, address));
      return result[0];
    } catch (error) {
      console.error('Get wallet error:', error);
      return undefined;
    }
  }

  async getWalletsByType(type: string): Promise<Wallet[]> {
    try {
      return await db.select().from(wallets).where(eq(wallets.type, type));
    } catch (error) {
      console.error('Get wallets by type error:', error);
      return [];
    }
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    try {
      const [newWallet] = await db.insert(wallets).values(wallet).returning();
      return newWallet;
    } catch (error) {
      console.error('Create wallet error:', error);
      throw new Error('Failed to create wallet');
    }
  }

  async updateWalletBalance(address: string, balance: number): Promise<void> {
    try {
      await db.update(wallets).set({ balance }).where(eq(wallets.address, address));
    } catch (error) {
      console.error('Update wallet balance error:', error);
      throw new Error('Failed to update wallet balance');
    }
  }

  async getAllWallets(): Promise<Wallet[]> {
    try {
      return await db.select().from(wallets);
    } catch (error) {
      console.error('Get all wallets error:', error);
      return [];
    }
  }

  // Transaction operations
  async getTransaction(txHash: string): Promise<Transaction | undefined> {
    try {
      const result = await db.select().from(transactions).where(eq(transactions.txHash, txHash));
      return result[0];
    } catch (error) {
      console.error('Get transaction error:', error);
      return undefined;
    }
  }

  async getTransactionsByAddress(address: string): Promise<Transaction[]> {
    try {
      return await db.select().from(transactions)
        .where(eq(transactions.fromAddress, address))
        .union(db.select().from(transactions).where(eq(transactions.toAddress, address)));
    } catch (error) {
      console.error('Get transactions by address error:', error);
      return [];
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      return await db.select().from(transactions);
    } catch (error) {
      console.error('Get all transactions error:', error);
      return [];
    }
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    try {
      const [newTransaction] = await db.insert(transactions).values({
        ...transaction,
        id: randomUUID(),
        status: 'confirmed',
      }).returning();
      return newTransaction;
    } catch (error) {
      console.error('Create transaction error:', error);
      throw new Error('Failed to create transaction');
    }
  }

  // Certificate operations
  async getCertificate(certificateId: string): Promise<Certificate | undefined> {
    try {
      const result = await db.select().from(certificates)
        .where(eq(certificates.certificateId, certificateId));
      return result[0];
    } catch (error) {
      console.error('Get certificate error:', error);
      return undefined;
    }
  }

  async getCertificatesByProducer(producerAddress: string): Promise<Certificate[]> {
    try {
      return await db.select().from(certificates)
        .where(eq(certificates.producerAddress, producerAddress));
    } catch (error) {
      console.error('Get certificates by producer error:', error);
      return [];
    }
  }

  async getAllCertificates(): Promise<Certificate[]> {
    try {
      return await db.select().from(certificates);
    } catch (error) {
      console.error('Get all certificates error:', error);
      return [];
    }
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    try {
      const [newCertificate] = await db.insert(certificates).values({
        ...certificate,
        id: randomUUID(),
        status: 'pending',
      }).returning();
      return newCertificate;
    } catch (error) {
      console.error('Create certificate error:', error);
      throw new Error('Failed to create certificate');
    }
  }

  async updateCertificateStatus(certificateId: string, status: string): Promise<void> {
    try {
      await db.update(certificates)
        .set({ status })
        .where(eq(certificates.certificateId, certificateId));
    } catch (error) {
      console.error('Update certificate status error:', error);
      throw new Error('Failed to update certificate status');
    }
  }

  // System stats
  async getSystemStats(): Promise<{
    totalIssued: number;
    totalRetired: number;
    activeCredits: number;
    totalProducers: number;
    totalBuyers: number;
  }> {
    try {
      const allTransactions = await this.getAllTransactions();
      const allWallets = await this.getAllWallets();

      const totalIssued = allTransactions
        .filter(tx => tx.txType === 'issue')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const totalRetired = allTransactions
        .filter(tx => tx.txType === 'retire')
        .reduce((sum, tx) => sum + tx.amount, 0);

      const activeCredits = totalIssued - totalRetired;
      const totalProducers = allWallets.filter(w => w.type === 'producer').length;
      const totalBuyers = allWallets.filter(w => w.type === 'buyer').length;

      return {
        totalIssued,
        totalRetired,
        activeCredits,
        totalProducers,
        totalBuyers
      };
    } catch (error) {
      console.error('Get system stats error:', error);
      return {
        totalIssued: 0,
        totalRetired: 0,
        activeCredits: 0,
        totalProducers: 0,
        totalBuyers: 0
      };
    }
  }
}

# 🌱 GreenHydrogenChain

> **A blockchain-based platform for tracking, trading, and auditing green hydrogen credits with government-grade certification**

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Compatible-purple)](https://ethereum.org/)

## 🚀 Overview

GreenHydrogenChain is a comprehensive blockchain-based system designed to bring transparency, trust, and efficiency to the green hydrogen credit market. Our platform addresses the critical challenges of verification, double counting prevention, and regulatory compliance in the rapidly growing $12 billion green hydrogen industry.

### 🎯 Key Features

- **🏛️ Government Certification**: RSA-signed digital certificates for production verification
- **⛓️ Blockchain Integration**: Real Ethereum-compatible wallet and transaction system
- **👥 Multi-Stakeholder Platform**: Dedicated dashboards for producers, buyers, and auditors
- **🔒 Fraud Prevention**: Immutable transaction records with cryptographic verification
- **📊 Real-time Trading**: Instant credit transfers with live balance updates
- **🌍 Environmental Impact**: Complete lifecycle tracking from production to retirement
- **🔍 Full Transparency**: Blockchain explorer for system-wide auditability

## 🏗️ Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Blockchain    │
│   (React)       │◄──►│  (Express.js)   │◄──►│  (Ethereum)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI/UX Layer   │    │   Database      │    │   Wallet Mgmt   │
│  (Tailwind CSS) │    │ (PostgreSQL)    │    │   (Web3.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Tech Stack

#### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for fast builds and hot module replacement
- **shadcn/ui** components built on Radix UI primitives
- **TailwindCSS** for responsive, utility-first styling
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management

#### Backend
- **Express.js** with TypeScript for REST API
- **PostgreSQL** with Drizzle ORM for type-safe database operations
- **bcrypt** for secure password hashing
- **Express Session** for authentication management

#### Blockchain & Security
- **Web3.js** for Ethereum blockchain interaction
- **eth-account** for wallet management and signatures
- **RSA Cryptography** for government certificate signing
- **Zod** for runtime type validation

## 🚦 Getting Started

### Prerequisites

- **Node.js** 16+ 
- **PostgreSQL** database
- **npm** or **yarn** package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Neelshah1810/GHXChange.git
   cd GreenHydrogenChain
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file
   DATABASE_URL="postgresql://user:password@localhost:5432/ghc_db"
   NODE_ENV="development"
   SESSION_SECRET="your-secret-key"
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## 📱 User Roles & Features

### 🏭 Producer Dashboard
- **Production Records**: Create verified hydrogen production entries
- **Certificate Management**: Government-issued digital certificates
- **Credit Issuance**: Automatic GHC credit generation upon verification
- **Transaction History**: Complete audit trail of all activities

### 💼 Buyer Dashboard  
- **Credit Marketplace**: Browse and purchase verified green hydrogen credits
- **Compliance Tracking**: Monitor purchased credits for regulatory reporting
- **Wallet Management**: Ethereum-compatible wallet integration
- **Certificate Verification**: Real-time authenticity checking

### 🔍 Auditor Dashboard
- **System Oversight**: System-wide transaction monitoring
- **Fraud Prevention**: Double counting detection and prevention
- **Reporting Tools**: Comprehensive audit reports and analytics
- **Certificate Validation**: Government signature verification

## 🔧 API Endpoints

### Authentication
```http
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/me
POST /api/auth/logout
```

### Transactions
```http
GET  /api/transactions
POST /api/transactions/transfer
POST /api/transactions/issue
POST /api/transactions/retire
```

### Certificates
```http
GET  /api/certificates
POST /api/certificates
GET  /api/certificates/:id/verify
```

### Wallets
```http
GET  /api/wallets
POST /api/wallets
GET  /api/wallets/:address/balance
```

## 🧪 Testing

### Run the test suite
```bash
npm test
```

### Manual Testing
1. **Create Producer Account**: Register as a hydrogen producer
2. **Generate Production Record**: Add hydrogen production data
3. **Government Certification**: Automatic certificate issuance
4. **Credit Transfer**: Transfer credits between wallets
5. **Credit Retirement**: Retire credits for compliance

## 🌟 Demo Scenario

The system includes a demo data loader for quick testing:

1. **Demo Wallets**: 
   - Solar Hydrogen Inc (Producer)
   - Green Steel Corp (Buyer)

2. **Sample Production**: 500kg hydrogen from solar PV in Gujarat
3. **Government Certificate**: Automatically issued and verified
4. **Credit Trading**: Live transfer demonstration
5. **Environmental Impact**: Retirement tracking

## 📊 Database Schema

### Core Tables

```sql
-- Users with role-based access
Users: id, email, password_hash, role, wallet_address, created_at

-- Blockchain wallet management
Wallets: id, address, private_key, balance, owner_id

-- Immutable transaction records
Transactions: id, from_address, to_address, amount, tx_type, tx_hash, timestamp

-- Government certificates
Certificates: id, production_record, certifier_signature, issue_date, status
```

## 🔐 Security Features

- **Government-Grade Certificates**: RSA-2048 digital signatures
- **Blockchain Verification**: Ethereum-compatible transaction signing
- **Role-Based Access Control**: Producer, Buyer, Auditor permissions
- **Immutable Records**: Tamper-proof blockchain storage
- **Secure Authentication**: Bcrypt password hashing + session management

## 🌍 Environmental Impact

### Green Hydrogen Benefits
- **Zero Emissions**: Produced using renewable energy sources
- **Industrial Decarbonization**: Enables clean steel, cement, and chemical production
- **Energy Storage**: Stores renewable energy for later use
- **Transport Fuel**: Clean alternative for heavy-duty vehicles

### Platform Benefits
- **Transparency**: Full lifecycle tracking reduces greenwashing
- **Efficiency**: Automated verification reduces administrative overhead
- **Trust**: Cryptographic proof eliminates fraud
- **Compliance**: Built-in regulatory reporting capabilities


## 🤖 Future Improvements (AI/ML & System Enhancements)

### AIML Approach

1. **Green Hydrogen Score Prediction (Regression)**
   - Use regression models to predict a "Green Score" for hydrogen production based on energy source mix, CO₂ emissions, renewable intensity, and electrolyzer efficiency.

   **Example Dataset:**
   | Producer_ID | Energy_Source (%)     | CO₂_Emissions (kg/kg H₂) | Renewable_Intensity (kWh/kg H₂) | Electrolyzer_Efficiency (%) | Region  | Green_Score |
   |-------------|-----------------------|---------------------------|---------------------------------|------------------------------|---------|-------------|
   | P001        | Solar: 90, Grid: 10  | 0.5                       | 52                              | 72                           | India   | 85          |
   | P002        | Grid: 100            | 9.0                       | 58                              | 65                           | EU      | 20          |
   | P003        | Wind: 70, Hydro: 30  | 0.2                       | 49                              | 75                           | Brazil  | 92          |
   | P004        | Coal: 80, Solar: 20  | 8.5                       | 60                              | 60                           | China   | 10          |

2. **Anomaly Detection (Isolation Forest)**
   - Detect fraudulent or unrealistic hydrogen production claims using anomaly detection.

   **Example Dataset:**
   | Index | Renewable % | CO₂ Emissions (kg/kg H₂) | Efficiency (%) | Claimed H₂ (kg) | Anomaly  |
   |-------|-------------|---------------------------|----------------|-----------------|----------|
   | 0     | 90          | 0.5                       | 72             | 950             | Normal   |
   | 1     | 10          | 8.5                       | 40             | 2000            | Anomaly  |
   | 2     | 70          | 0.3                       | 78             | 870             | Normal   |
   | 3     | 85          | 0.6                       | 75             | 910             | Normal   |
   | 4     | 95          | 0.4                       | 80             | 940             | Normal   |
   | 5     | 5           | 9.0                       | 35             | 2500            | Anomaly  |

3. **RAG (Retrieval Augmented Generation) for Analytics**
   - Enable natural language queries for stakeholders:
     - *“How many credits has Producer X retired this month?”*
     - *“Which buyers purchased credits above Green Score 80?”*

---

### System Enhancements

1. **KYB/Verification** of production for trusted onboarding  
2. **Advanced Blockchain** integration with higher scalability and interoperability  
3. **Full Block Tracking**: Create and track all blocks for the entire GHC lifecycle  
4. **Producer Ranking** on the marketplace based on Green Score and transaction history  



## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Configuration
```bash
# Production environment variables
NODE_ENV=production
DATABASE_URL=your-production-db-url
SESSION_SECRET=secure-production-secret
```

### Recommended Infrastructure
- **Frontend**: Vercel, Netlify, or AWS S3 + CloudFront
- **Backend**: Railway, Heroku, or AWS EC2
- **Database**: Neon, Supabase, or AWS RDS PostgreSQL
- **Monitoring**: Sentry for error tracking

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 Hackathon Achievements

This project was developed for hackathons focusing on:
- **🌱 Sustainability**: Enabling green hydrogen market transparency
- **⛓️ Blockchain**: Real-world Web3 application with Ethereum integration  
- **🏛️ RegTech**: Government compliance and certification
- **💡 Innovation**: Novel approach to carbon credit verification

## 🔗 Links

- **Live Demo**: https://ghxchange.onrender.com
- **GitHub Repository**: https://github.com/Neelshah1810/GHXChange

## 📞 Contact

- **Neel Shah**  
  📧 Email:  neelshah18102004@gmail.com 
  🔗 LinkedIn:  www.linkedin.com/in/neel-shah-077128300  

- **Tirth Shah**  
  📧 Email:  tirthshah151004@gmail.com
  🔗 LinkedIn:  http://linkedin.com/in/tirth-shah-533517216

- **Viranch Patel**  
  📧 Email:  viranchvishalpatel@gmail.com
  🔗 LinkedIn:   http://linkedin.com/in/viranch-patel-430391315

- **Yashvi Patel**  
  📧 Email:  patelyashvi1311@gmail.com  🔗 LinkedIn:  https://www.linkedin.com/in/yashvi-patel-b17294300/ 

---

---

<div align="center">

**⭐ Star this repository if you find it useful!**

*Built with ❤️ for a sustainable future*

</div>

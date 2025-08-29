#!/usr/bin/env python3

# claude ghc_v6 which fix "Transfer failed: 'LocalAccount' object has no attribute 'signHash'" error.
"""
Green Hydrogen Credit (GHC) System with Real Ethereum Integration and Streamlit UI
A blockchain-based system for tracking green hydrogen credits with government verification.
"""

import streamlit as st
import hashlib
import json
import time
from datetime import datetime
from web3 import Web3
from eth_account import Account
import secrets
import pandas as pd
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

# Configure Streamlit page
st.set_page_config(
    page_title="Green Hydrogen Credit System",
    page_icon="🌱",
    layout="wide"
)

class EthereumWallet:
    """Real Ethereum wallet functionality"""
    
    def __init__(self, name=None):
        # Generate new account or use existing
        self.account = Account.create()
        self.address = self.account.address
        self.private_key = self.account.key.hex()
        self.name = name or f"User_{self.address[:6]}"
    
    @classmethod
    def from_private_key(cls, private_key_hex, name=None):
        """Create wallet from existing private key"""
        wallet = cls.__new__(cls)
        wallet.account = Account.from_key(private_key_hex)
        wallet.address = wallet.account.address
        wallet.private_key = private_key_hex
        wallet.name = name or f"User_{wallet.address[:6]}"
        return wallet
    
    def sign_message(self, message):
        """Sign a message with the wallet's private key"""
        from eth_account.messages import encode_defunct
        message_hash = encode_defunct(text=message)
        signature = self.account.sign_message(message_hash)
        return signature.signature.hex()
    
    def verify_signature(self, message, signature_hex, address):
        """Verify a signature"""
        try:
            from eth_account.messages import encode_defunct
            message_hash = encode_defunct(text=message)
            signature_bytes = bytes.fromhex(signature_hex[2:] if signature_hex.startswith('0x') else signature_hex)
            recovered_address = Account.recover_message(message_hash, signature=signature_bytes)
            return recovered_address.lower() == address.lower()
        except Exception as e:
            print(f"Signature verification error: {e}")
            return False

class DigitalCertifier:
    """Government digital certifier with RSA signatures"""
    
    def __init__(self, name):
        self.name = name
        self.wallet = EthereumWallet(name)
        # RSA keys for official government certification
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )
        self.public_key = self.private_key.public_key()
    
    def sign_certificate(self, data):
        """Sign certificate data with RSA key"""
        data_bytes = json.dumps(data, sort_keys=True).encode('utf-8')
        signature = self.private_key.sign(
            data_bytes,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return signature.hex()
    
    def verify_certificate_signature(self, data, signature_hex):
        """Verify certificate signature"""
        try:
            data_bytes = json.dumps(data, sort_keys=True).encode('utf-8')
            signature = bytes.fromhex(signature_hex)
            self.public_key.verify(
                signature,
                data_bytes,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True
        except:
            return False

class ProductionRecord:
    """Green hydrogen production record"""
    
    def __init__(self, producer_address, hydrogen_kg, energy_source, location, production_date=None):
        self.producer_address = producer_address
        self.hydrogen_kg = hydrogen_kg
        self.energy_source = energy_source
        self.location = location
        self.production_date = production_date or datetime.now().isoformat()
        self.record_id = hashlib.sha256(
            f"{producer_address}{hydrogen_kg}{energy_source}{location}{self.production_date}".encode()
        ).hexdigest()[:16]
    
    def to_dict(self):
        return {
            "record_id": self.record_id,
            "producer_address": self.producer_address,
            "hydrogen_kg": self.hydrogen_kg,
            "energy_source": self.energy_source,
            "location": self.location,
            "production_date": self.production_date
        }

class ECertificate:
    """Government e-certificate for green hydrogen production"""
    
    def __init__(self, production_record, certifier):
        self.production_record = production_record
        self.certifier_address = certifier.wallet.address
        self.certifier_name = certifier.name
        self.issue_date = datetime.now().isoformat()
        self.certificate_id = hashlib.sha256(
            f"{production_record.record_id}{self.certifier_address}{self.issue_date}".encode()
        ).hexdigest()[:16]
        
        # Create certificate data and sign it
        self.cert_data = {
            "certificate_id": self.certificate_id,
            "production_record": production_record.to_dict(),
            "certifier_address": self.certifier_address,
            "certifier_name": self.certifier_name,
            "issue_date": self.issue_date,
            "status": "valid"
        }
        self.signature = certifier.sign_certificate(self.cert_data)
        self.certifier = certifier
    
    def is_valid(self):
        """Verify if the e-certificate is valid"""
        return self.certifier.verify_certificate_signature(self.cert_data, self.signature)

class Transaction:
    """Blockchain transaction with Ethereum-style structure"""
    
    def __init__(self, from_address, to_address, amount, tx_type, data=None, wallet=None):
        self.from_address = from_address
        self.to_address = to_address
        self.amount = amount
        self.tx_type = tx_type
        self.data = data or {}
        self.timestamp = datetime.now().isoformat()
        self.nonce = secrets.randbelow(1000000)
        
        # Create transaction hash
        tx_string = f"{from_address}{to_address}{amount}{tx_type}{self.timestamp}{self.nonce}"
        self.tx_hash = "0x" + hashlib.sha256(tx_string.encode()).hexdigest()
        
        # Sign transaction if wallet provided
        self.signature = None
        if wallet and from_address != "SYSTEM":
            self.signature = wallet.sign_message(tx_string)

class Block:
    """Ethereum-style block"""
    
    def __init__(self, transactions, previous_hash="0x0"):
        self.transactions = transactions
        self.timestamp = datetime.now().isoformat()
        self.previous_hash = previous_hash
        self.block_number = 0
        self.nonce = 0
        self.hash = self.calculate_hash()
    
    def calculate_hash(self):
        """Calculate block hash"""
        block_string = json.dumps({
            "transactions": [tx.__dict__ for tx in self.transactions],
            "timestamp": self.timestamp,
            "previous_hash": self.previous_hash,
            "nonce": self.nonce
        }, sort_keys=True)
        return "0x" + hashlib.sha256(block_string.encode()).hexdigest()

class GreenHydrogenBlockchain:
    """Ethereum-compatible Green Hydrogen Credit blockchain"""
    
    def __init__(self):
        self.chain = [self.create_genesis_block()]
        self.balances = {}
        self.pending_transactions = []
        self.certificates = {}
        self.total_issued = 0
        self.total_retired = 0
    
    def create_genesis_block(self):
        """Create the first block"""
        genesis = Block([], "0x0")
        genesis.block_number = 0
        return genesis
    
    def get_latest_block(self):
        return self.chain[-1]
    
    def add_certificate(self, certificate):
        """Add verified e-certificate"""
        self.certificates[certificate.certificate_id] = certificate
    
    def issue_credits(self, certificate, wallet=None):
        """Issue GHC credits based on valid e-certificate"""
        if not certificate.is_valid():
            raise ValueError("Invalid e-certificate")
        
        producer_address = certificate.production_record.producer_address
        amount = certificate.production_record.hydrogen_kg
        
        tx = Transaction(
            from_address="SYSTEM",
            to_address=producer_address,
            amount=amount,
            tx_type="issue",
            data={"certificate_id": certificate.certificate_id}
        )
        
        self.pending_transactions.append(tx)
        self.mine_pending_transactions()
        
        if producer_address not in self.balances:
            self.balances[producer_address] = 0
        self.balances[producer_address] += amount
        self.total_issued += amount
        
        return tx.tx_hash
    
    def transfer_credits(self, from_address, to_address, amount, wallet):
        """Transfer GHC credits"""
        if self.balances.get(from_address, 0) < amount:
            raise ValueError("Insufficient balance")
        
        tx = Transaction(from_address, to_address, amount, "transfer", wallet=wallet)
        self.pending_transactions.append(tx)
        self.mine_pending_transactions()
        
        self.balances[from_address] -= amount
        if to_address not in self.balances:
            self.balances[to_address] = 0
        self.balances[to_address] += amount
        
        return tx.tx_hash
    
    def retire_credits(self, address, amount, wallet):
        """Retire GHC credits"""
        if self.balances.get(address, 0) < amount:
            raise ValueError("Insufficient balance")
        
        tx = Transaction(address, "0x000000000000000000000000000000000000dEaD", amount, "retire", wallet=wallet)
        self.pending_transactions.append(tx)
        self.mine_pending_transactions()
        
        self.balances[address] -= amount
        self.total_retired += amount
        
        return tx.tx_hash
    
    def mine_pending_transactions(self):
        """Mine pending transactions into a block"""
        if not self.pending_transactions:
            return
        
        block = Block(self.pending_transactions, self.get_latest_block().hash)
        block.block_number = len(self.chain)
        self.chain.append(block)
        self.pending_transactions = []
    
    def get_balance(self, address):
        return self.balances.get(address, 0)

# Initialize session state
if 'blockchain' not in st.session_state:
    st.session_state.blockchain = GreenHydrogenBlockchain()

if 'wallets' not in st.session_state:
    st.session_state.wallets = {}

if 'government_certifier' not in st.session_state:
    st.session_state.government_certifier = DigitalCertifier("Energy Regulatory Authority")

# Main Streamlit App
def main():
    st.title("🌱 Green Hydrogen Credit System")
    st.markdown("**Blockchain-based certification and trading of green hydrogen credits**")
    
    # Sidebar for wallet management
    with st.sidebar:
        st.header("🔐 Wallet Management")
        
        # Create new wallet
        wallet_name = st.text_input("Wallet Name", placeholder="e.g., GreenEnergy Corp")
        wallet_type = st.selectbox("Actor Type", ["Producer", "Buyer", "Auditor"])
        
        if st.button("Create New Wallet"):
            if wallet_name:
                wallet = EthereumWallet(wallet_name)
                st.session_state.wallets[wallet_name] = {
                    'wallet': wallet,
                    'type': wallet_type
                }
                st.success(f"Created wallet: {wallet.address}")
                st.rerun()
        
        # Display existing wallets
        if st.session_state.wallets:
            st.subheader("Active Wallets")
            for name, wallet_info in st.session_state.wallets.items():
                balance = st.session_state.blockchain.get_balance(wallet_info['wallet'].address)
                st.write(f"**{name}** ({wallet_info['type']})")
                st.write(f"`{wallet_info['wallet'].address[:10]}...`")
                st.write(f"Balance: {balance} GHC")
                st.divider()
    
    # Main tabs
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "📊 Dashboard", 
        "🏭 Production & Certification", 
        "💱 Transfer Credits", 
        "🔥 Retire Credits", 
        "🔍 Blockchain Explorer"
    ])
    
    with tab1:
        st.header("System Dashboard")
        
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Total Wallets", len(st.session_state.wallets))
        with col2:
            st.metric("Total Issued", f"{st.session_state.blockchain.total_issued} GHC")
        with col3:
            st.metric("Total Retired", f"{st.session_state.blockchain.total_retired} GHC")
        with col4:
            active_credits = st.session_state.blockchain.total_issued - st.session_state.blockchain.total_retired
            st.metric("Active Credits", f"{active_credits} GHC")
        
        # Government Certifier Info
        st.subheader("🏛️ Government Certifier")
        gov = st.session_state.government_certifier
        st.write(f"**Name:** {gov.name}")
        st.write(f"**Address:** `{gov.wallet.address}`")
        st.write(f"**Certificates Issued:** {len(st.session_state.blockchain.certificates)}")
        
        # Balances Chart
        if st.session_state.wallets:
            st.subheader("💰 Current Balances")
            balance_data = []
            for name, wallet_info in st.session_state.wallets.items():
                balance = st.session_state.blockchain.get_balance(wallet_info['wallet'].address)
                if balance > 0:
                    balance_data.append({
                        'Wallet': name,
                        'Type': wallet_info['type'],
                        'Balance (GHC)': balance
                    })
            
            if balance_data:
                df = pd.DataFrame(balance_data)
                st.bar_chart(df.set_index('Wallet')['Balance (GHC)'])
                st.dataframe(df, use_container_width=True)
            else:
                st.info("No active balances to display")
    
    with tab2:
        st.header("🏭 Production & Certification")
        
        if not st.session_state.wallets:
            st.warning("Please create at least one Producer wallet first")
            return
        
        producers = [name for name, info in st.session_state.wallets.items() if info['type'] == 'Producer']
        
        if not producers:
            st.warning("Please create a Producer wallet first")
        else:
            col1, col2 = st.columns(2)
            
            with col1:
                st.subheader("📋 Create Production Record")
                
                selected_producer = st.selectbox("Select Producer", producers)
                hydrogen_amount = st.number_input("Hydrogen Produced (kg)", min_value=1, value=1000)
                energy_source = st.selectbox("Energy Source", [
                    "Solar PV", "Wind", "Hydroelectric", "Geothermal", "Green Grid"
                ])
                location = st.text_input("Production Location", placeholder="e.g., Gujarat, India")
                
                if st.button("Create Production Record"):
                    if selected_producer and location:
                        producer_wallet = st.session_state.wallets[selected_producer]['wallet']
                        
                        # Create production record
                        record = ProductionRecord(
                            producer_address=producer_wallet.address,
                            hydrogen_kg=hydrogen_amount,
                            energy_source=energy_source,
                            location=location
                        )
                        
                        # Government certification
                        certificate = ECertificate(record, st.session_state.government_certifier)
                        st.session_state.blockchain.add_certificate(certificate)
                        
                        # Issue credits
                        try:
                            tx_hash = st.session_state.blockchain.issue_credits(certificate)
                            st.success(f"✅ Production certified and {hydrogen_amount} GHC issued!")
                            st.write(f"**Transaction Hash:** `{tx_hash}`")
                            st.write(f"**Certificate ID:** `{certificate.certificate_id}`")
                            st.rerun()
                        except Exception as e:
                            st.error(f"Error issuing credits: {e}")
            
            with col2:
                st.subheader("📜 Recent Certificates")
                
                if st.session_state.blockchain.certificates:
                    for cert_id, cert in list(st.session_state.blockchain.certificates.items())[-3:]:
                        with st.expander(f"Certificate {cert_id}"):
                            st.write(f"**Producer:** `{cert.production_record.producer_address[:10]}...`")
                            st.write(f"**Amount:** {cert.production_record.hydrogen_kg} kg")
                            st.write(f"**Source:** {cert.production_record.energy_source}")
                            st.write(f"**Location:** {cert.production_record.location}")
                            st.write(f"**Valid:** {'✅ Yes' if cert.is_valid() else '❌ No'}")
                            st.write(f"**Issue Date:** {cert.issue_date[:19]}")
                else:
                    st.info("No certificates issued yet")
    
    with tab3:
        st.header("💱 Transfer Credits")
        
        if len(st.session_state.wallets) < 2:
            st.warning("Please create at least 2 wallets to enable transfers")
        else:
            col1, col2 = st.columns(2)
            
            with col1:
                wallet_names = list(st.session_state.wallets.keys())
                from_wallet = st.selectbox("From Wallet", wallet_names, key="transfer_from")
                to_wallet = st.selectbox("To Wallet", wallet_names, key="transfer_to")
                
                if from_wallet:
                    from_balance = st.session_state.blockchain.get_balance(
                        st.session_state.wallets[from_wallet]['wallet'].address
                    )
                    st.write(f"Available Balance: {from_balance} GHC")
                    
                    transfer_amount = st.number_input(
                        "Transfer Amount (GHC)", 
                        min_value=1, 
                        max_value=from_balance if from_balance > 0 else 1,
                        value=min(100, from_balance) if from_balance > 0 else 1
                    )
                
                if st.button("Transfer Credits"):
                    if from_wallet != to_wallet and from_wallet and to_wallet:
                        try:
                            from_wallet_obj = st.session_state.wallets[from_wallet]['wallet']
                            to_wallet_obj = st.session_state.wallets[to_wallet]['wallet']
                            
                            tx_hash = st.session_state.blockchain.transfer_credits(
                                from_wallet_obj.address,
                                to_wallet_obj.address,
                                transfer_amount,
                                from_wallet_obj
                            )
                            
                            st.success(f"✅ Transferred {transfer_amount} GHC!")
                            st.write(f"**Transaction Hash:** `{tx_hash}`")
                            st.rerun()
                        except Exception as e:
                            st.error(f"Transfer failed: {e}")
                    else:
                        st.error("Please select different wallets")
            
            with col2:
                st.subheader("📊 Transfer History")
                transfer_txs = []
                for block in st.session_state.blockchain.chain[1:]:
                    for tx in block.transactions:
                        if tx.tx_type == "transfer":
                            transfer_txs.append({
                                'From': f"{tx.from_address[:10]}...",
                                'To': f"{tx.to_address[:10]}...",
                                'Amount': f"{tx.amount} GHC",
                                'Time': tx.timestamp[:19]
                            })
                
                if transfer_txs:
                    df = pd.DataFrame(transfer_txs[-5:])  # Show last 5
                    st.dataframe(df, use_container_width=True)
                else:
                    st.info("No transfers yet")
    
    with tab4:
        st.header("🔥 Retire Credits")
        st.markdown("*Retire credits to prove green hydrogen consumption and remove them from circulation*")
        
        if not st.session_state.wallets:
            st.warning("Please create a wallet first")
        else:
            col1, col2 = st.columns(2)
            
            with col1:
                # Filter wallets with balance > 0
                wallets_with_balance = {
                    name: info for name, info in st.session_state.wallets.items()
                    if st.session_state.blockchain.get_balance(info['wallet'].address) > 0
                }
                
                if not wallets_with_balance:
                    st.warning("No wallets have credits to retire")
                else:
                    selected_wallet = st.selectbox("Select Wallet", list(wallets_with_balance.keys()))
                    
                    wallet_obj = wallets_with_balance[selected_wallet]['wallet']
                    current_balance = st.session_state.blockchain.get_balance(wallet_obj.address)
                    st.write(f"Current Balance: {current_balance} GHC")
                    
                    retire_amount = st.number_input(
                        "Amount to Retire (GHC)", 
                        min_value=1, 
                        max_value=current_balance,
                        value=min(50, current_balance)
                    )
                    
                    purpose = st.text_area("Purpose of Retirement", 
                        placeholder="e.g., Steel production batch #12345, Carbon offset for shipping")
                    
                    if st.button("Retire Credits"):
                        try:
                            tx_hash = st.session_state.blockchain.retire_credits(
                                wallet_obj.address, retire_amount, wallet_obj
                            )
                            st.success(f"✅ Retired {retire_amount} GHC!")
                            st.write(f"**Transaction Hash:** `{tx_hash}`")
                            if purpose:
                                st.write(f"**Purpose:** {purpose}")
                            st.balloons()
                            st.rerun()
                        except Exception as e:
                            st.error(f"Retirement failed: {e}")
            
            with col2:
                st.subheader("🗂️ Retirement History")
                retirement_txs = []
                for block in st.session_state.blockchain.chain[1:]:
                    for tx in block.transactions:
                        if tx.tx_type == "retire":
                            retirement_txs.append({
                                'Wallet': f"{tx.from_address[:10]}...",
                                'Amount': f"{tx.amount} GHC",
                                'Time': tx.timestamp[:19]
                            })
                
                if retirement_txs:
                    df = pd.DataFrame(retirement_txs[-5:])
                    st.dataframe(df, use_container_width=True)
                    
                    # Environmental impact
                    total_retired = sum(int(tx['Amount'].split()[0]) for tx in retirement_txs)
                    st.info(f"🌍 Total Environmental Impact: {total_retired} kg of verified green hydrogen consumed")
                else:
                    st.info("No retirements yet")
    
    with tab5:
        st.header("🔍 Blockchain Explorer")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("⛓️ Blocks")
            for i, block in enumerate(reversed(st.session_state.blockchain.chain[-5:])):
                block_num = len(st.session_state.blockchain.chain) - 1 - i
                with st.expander(f"Block #{block_num} - {len(block.transactions)} transactions"):
                    st.write(f"**Hash:** `{block.hash[:20]}...`")
                    st.write(f"**Previous Hash:** `{block.previous_hash[:20]}...`")
                    st.write(f"**Timestamp:** {block.timestamp[:19]}")
                    
                    if block.transactions:
                        st.write("**Transactions:**")
                        for tx in block.transactions:
                            st.write(f"- {tx.tx_type.upper()}: {tx.amount} GHC")
        
        with col2:
            st.subheader("📋 Certificates")
            if st.session_state.blockchain.certificates:
                for cert_id, cert in st.session_state.blockchain.certificates.items():
                    with st.expander(f"Certificate {cert_id}"):
                        st.write(f"**Producer:** `{cert.production_record.producer_address[:10]}...`")
                        st.write(f"**Amount:** {cert.production_record.hydrogen_kg} kg")
                        st.write(f"**Energy Source:** {cert.production_record.energy_source}")
                        st.write(f"**Location:** {cert.production_record.location}")
                        st.write(f"**Certifier:** {cert.certifier_name}")
                        st.write(f"**Status:** {'✅ Valid' if cert.is_valid() else '❌ Invalid'}")
                        
                        # Show signature verification
                        if st.button(f"Verify Certificate {cert_id}", key=f"verify_{cert_id}"):
                            is_valid = cert.is_valid()
                            if is_valid:
                                st.success("Certificate signature is valid!")
                            else:
                                st.error("Certificate signature is invalid!")
            else:
                st.info("No certificates issued yet")
    
    # Footer with system info
    st.markdown("---")
    col1, col2, col3 = st.columns(3)
    with col1:
        st.write(f"**Blocks:** {len(st.session_state.blockchain.chain)}")
    with col2:
        st.write(f"**Government:** {st.session_state.government_certifier.wallet.address[:10]}...")
    with col3:
        if st.button("🔄 Reset System"):
            st.session_state.clear()
            st.rerun()

# Demo data button
with st.sidebar:
    st.markdown("---")
    if st.button("🎯 Load Demo Data"):
        # Create demo wallets
        producer_wallet = EthereumWallet("Solar Hydrogen Inc")
        buyer_wallet = EthereumWallet("Green Steel Corp")
        
        st.session_state.wallets = {
            "Solar Hydrogen Inc": {'wallet': producer_wallet, 'type': 'Producer'},
            "Green Steel Corp": {'wallet': buyer_wallet, 'type': 'Buyer'}
        }
        
        # Create demo production and certificate
        record = ProductionRecord(
            producer_address=producer_wallet.address,
            hydrogen_kg=500,
            energy_source="Solar PV",
            location="Rajkot, Gujarat"
        )
        
        certificate = ECertificate(record, st.session_state.government_certifier)
        st.session_state.blockchain.add_certificate(certificate)
        st.session_state.blockchain.issue_credits(certificate)
        
        st.success("Demo data loaded!")
        st.rerun()

if __name__ == "__main__":
    main()

# Installation requirements (add this as a comment at the top of your file):
"""
Required packages:
pip install streamlit web3 eth-account cryptography pandas

To run:
streamlit run green_hydrogen_blockchain.py
"""
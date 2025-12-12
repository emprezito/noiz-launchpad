# Audio Token Platform - Anchor Program

A Solana program built with Anchor 0.30.1 for creating and trading audio tokens with a bonding curve.

## Program ID
```
9m8ApaLxscUk6VhsuN12imf6ZvuCqPt42uDJMA1eRe7Y
```

## Features

- **Create Audio Tokens**: Mint new SPL tokens with metadata and automatic bonding curve
- **Bonding Curve Trading**: Buy and sell tokens using constant product formula (x * y = k)
- **Platform Fees**: 0.25% fee on all trades sent to platform wallet
- **LP System**: Liquidity provider shares for token creators

## Account Seeds

- TokenConfig PDA: `["token_config", mint.key()]`
- LpAccount PDA: `["lp_account", mint.key()]`

## Instructions

### 1. `create_audio_token`
Creates a new audio token with bonding curve.

**Arguments:**
- `name`: String (max 32 chars)
- `symbol`: String (max 10 chars)
- `metadata_uri`: String (max 200 chars) - IPFS URI
- `total_supply`: u64 - Total token supply with 9 decimals

**Accounts:**
- `token_config`: PDA for token state (mut, init)
- `lp_account`: PDA for LP state (mut, init)
- `mint`: New token mint (mut, signer)
- `reserve_token_account`: ATA for token reserves
- `metadata_account`: Metaplex metadata account
- `creator`: Transaction payer (mut, signer)
- `token_metadata_program`: Metaplex program
- `platform_fee_account`: Fee recipient
- `system_program`, `token_program`, `associated_token_program`, `rent`

### 2. `buy_tokens`
Buy tokens from the bonding curve.

**Arguments:**
- `sol_amount`: u64 - SOL to spend (lamports)
- `min_tokens_out`: u64 - Minimum tokens (slippage protection)

**Accounts:**
- `token_config`: Token state PDA (mut)
- `mint`: Token mint (mut)
- `reserve_token_account`: Reserve ATA (mut)
- `buyer_token_account`: Buyer's ATA (init_if_needed)
- `buyer`: Transaction payer (mut, signer)
- `platform_fee_account`: Fee recipient (mut)
- `system_program`, `token_program`, `associated_token_program`

### 3. `sell_tokens`
Sell tokens back to the bonding curve.

**Arguments:**
- `token_amount`: u64 - Tokens to sell
- `min_sol_out`: u64 - Minimum SOL (slippage protection)

**Accounts:**
- `token_config`: Token state PDA (mut)
- `lp_account`: LP state PDA
- `mint`: Token mint (mut)
- `reserve_token_account`: Reserve ATA (mut)
- `seller_token_account`: Seller's ATA (mut)
- `seller`: Transaction payer (mut, signer)
- `platform_fee_account`: Fee recipient (mut)
- `token_program`

### 4. `add_liquidity`
Add liquidity to the bonding curve.

### 5. `remove_liquidity`
Remove liquidity from the bonding curve.

## Building

```bash
# Install Anchor 0.30.1
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.1
avm use 0.30.1

# Build
cd anchor-program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## Platform Fee Account
```
GVHjPM3DfTnSFLMx72RcCCAViqWWsJ6ENKXRq7nWedEp
```

## Constants

- Platform Fee: 0.25% (25 basis points)
- Initial SOL Reserve: 0.01 SOL (10,000,000 lamports)
- Initial Token Reserve: 10% of total supply
- Token Decimals: 9
- Creation Fee: 0.02 SOL

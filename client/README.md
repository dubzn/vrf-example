# Dojo Starter - VRF Test Client

A simple Vite + React frontend to test Cartridge's Verifiable Random Number Generator (vRNG).

## Features

- Connect wallet using Cartridge Controller
- Generate verifiable random numbers (1-100) using vRNG
- Simple, clean UI

## Setup

1. Install dependencies:
```bash
npm install
```

2. (Optional) Create a `.env` file with your RPC URL:
```bash
cp .env.example .env
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `https://localhost:3000` (HTTPS is required for WebAuthn)

## HTTPS Setup

This app requires HTTPS because Cartridge Controller uses WebAuthn for authentication.

### Option 1: Auto-generated certificates (default)
Vite will automatically generate self-signed certificates. Your browser will show a security warning - click "Advanced" and "Proceed to localhost" to continue.

### Option 2: Trusted certificates with mkcert (recommended)

1. Install mkcert:
```bash
# macOS
brew install mkcert

# Linux
# Follow instructions at https://github.com/FiloSottile/mkcert
```

2. Install the local CA:
```bash
mkcert -install
```

3. Generate certificates:
```bash
cd client
mkcert localhost 127.0.0.1 ::1
```

4. Update `vite.config.ts` to use the certificates (uncomment the https section)

## How It Works

1. Click "Connect Wallet" to connect using Cartridge Controller
2. Click "Generate VRF number" to generate a verifiable random number
3. The app calls the VRF provider using the pattern:
   - `request_random` (first call in multicall)
   - `get_random_number()` on your deployed contract (second call in multicall)
   - The Cartridge Paymaster wraps it with `submit_random` and `assert_consumed`

## VRF Provider

The VRF provider address is configured in `src/config.ts`:
- Address: `0x051fea4450da9d6aee758bdeba88b2f665bcbf549d2c61421aa724e9ac0ced8f`
- Works on both Sepolia and Mainnet

## Random Contract

The random number contract address is configured in `src/config.ts`:
- Address: Set in `RANDOM_CONTRACT_ADDRESS`

## Notes

- The random number is generated on-chain and is cryptographically verifiable
- HTTPS is required for WebAuthn authentication
- The actual random value from `get_random_number()` is in the transaction but requires events or a contract to read directly
- For this demo, a pseudo-random number is derived from the transaction hash for display purposes

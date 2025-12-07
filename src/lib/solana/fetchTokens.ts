import { Connection, PublicKey, GetProgramAccountsFilter } from "@solana/web3.js";
import { PROGRAM_ID, AUDIO_TOKEN_SEED, BONDING_CURVE_SEED } from "./idl";

const programId = new PublicKey(PROGRAM_ID);

export interface AudioTokenAccount {
  pubkey: string;
  authority: string;
  name: string;
  symbol: string;
  audioUri: string;
  mint: string;
  totalSupply: number;
  createdAt: number;
  bump: number;
}

export interface BondingCurveAccount {
  pubkey: string;
  mint: string;
  creator: string;
  solReserves: number;
  tokenReserves: number;
  initialPrice: number;
  tokensSold: number;
  bump: number;
}

export interface TokenWithCurve {
  audioToken: AudioTokenAccount;
  bondingCurve: BondingCurveAccount | null;
  currentPrice: number;
}

// Parse AudioToken account data
function parseAudioTokenAccount(pubkey: PublicKey, data: Buffer): AudioTokenAccount | null {
  try {
    if (data.length < 100) return null;
    
    let offset = 8; // Skip discriminator
    
    const authority = new PublicKey(data.slice(offset, offset + 32)).toString();
    offset += 32;

    // Read name
    const nameLen = data.readUInt32LE(offset);
    offset += 4;
    if (offset + nameLen > data.length) return null;
    const name = data.slice(offset, offset + nameLen).toString("utf-8");
    offset += nameLen;

    // Read symbol
    const symbolLen = data.readUInt32LE(offset);
    offset += 4;
    if (offset + symbolLen > data.length) return null;
    const symbol = data.slice(offset, offset + symbolLen).toString("utf-8");
    offset += symbolLen;

    // Read audio URI
    const audioUriLen = data.readUInt32LE(offset);
    offset += 4;
    if (offset + audioUriLen > data.length) return null;
    const audioUri = data.slice(offset, offset + audioUriLen).toString("utf-8");
    offset += audioUriLen;

    if (offset + 32 + 8 + 8 + 1 > data.length) return null;

    const mint = new PublicKey(data.slice(offset, offset + 32)).toString();
    offset += 32;

    const totalSupply = Number(data.readBigUInt64LE(offset)) / 1e9;
    offset += 8;

    const createdAt = Number(data.readBigInt64LE(offset)) * 1000;
    offset += 8;

    const bump = data.readUInt8(offset);

    return {
      pubkey: pubkey.toString(),
      authority,
      name,
      symbol,
      audioUri,
      mint,
      totalSupply,
      createdAt,
      bump,
    };
  } catch (error) {
    console.error("Error parsing AudioToken:", error);
    return null;
  }
}

// Parse BondingCurve account data
function parseBondingCurveAccount(pubkey: PublicKey, data: Buffer): BondingCurveAccount | null {
  try {
    if (data.length < 89) return null;
    
    let offset = 8; // Skip discriminator
    
    const mint = new PublicKey(data.slice(offset, offset + 32)).toString();
    offset += 32;
    
    const creator = new PublicKey(data.slice(offset, offset + 32)).toString();
    offset += 32;
    
    const solReserves = Number(data.readBigUInt64LE(offset)) / 1e9;
    offset += 8;
    
    const tokenReserves = Number(data.readBigUInt64LE(offset)) / 1e9;
    offset += 8;
    
    const initialPrice = Number(data.readBigUInt64LE(offset)) / 1e9;
    offset += 8;
    
    const tokensSold = Number(data.readBigUInt64LE(offset)) / 1e9;
    offset += 8;
    
    const bump = data.readUInt8(offset);

    return {
      pubkey: pubkey.toString(),
      mint,
      creator,
      solReserves,
      tokenReserves,
      initialPrice,
      tokensSold,
      bump,
    };
  } catch (error) {
    console.error("Error parsing BondingCurve:", error);
    return null;
  }
}

// Fetch all audio tokens from the program
export async function fetchAllAudioTokens(connection: Connection): Promise<AudioTokenAccount[]> {
  try {
    const accounts = await connection.getProgramAccounts(programId, {
      filters: [
        { dataSize: 339 }, // Approximate size of AudioToken account
      ],
    });

    const tokens: AudioTokenAccount[] = [];
    
    for (const { pubkey, account } of accounts) {
      const parsed = parseAudioTokenAccount(pubkey, account.data);
      if (parsed) {
        tokens.push(parsed);
      }
    }

    return tokens;
  } catch (error) {
    console.error("Error fetching audio tokens:", error);
    return [];
  }
}

// Fetch all bonding curves from the program
export async function fetchAllBondingCurves(connection: Connection): Promise<BondingCurveAccount[]> {
  try {
    const accounts = await connection.getProgramAccounts(programId, {
      filters: [
        { dataSize: 89 }, // Size of BondingCurve account
      ],
    });

    const curves: BondingCurveAccount[] = [];
    
    for (const { pubkey, account } of accounts) {
      const parsed = parseBondingCurveAccount(pubkey, account.data);
      if (parsed) {
        curves.push(parsed);
      }
    }

    return curves;
  } catch (error) {
    console.error("Error fetching bonding curves:", error);
    return [];
  }
}

// Fetch all tokens with their bonding curve data
export async function fetchAllTokensWithCurves(connection: Connection): Promise<TokenWithCurve[]> {
  const [tokens, curves] = await Promise.all([
    fetchAllAudioTokens(connection),
    fetchAllBondingCurves(connection),
  ]);

  const curvesByMint = new Map<string, BondingCurveAccount>();
  curves.forEach((curve) => {
    curvesByMint.set(curve.mint, curve);
  });

  return tokens.map((token) => {
    const curve = curvesByMint.get(token.mint) || null;
    const currentPrice = curve && curve.tokenReserves > 0 
      ? curve.solReserves / curve.tokenReserves 
      : 0;

    return {
      audioToken: token,
      bondingCurve: curve,
      currentPrice,
    };
  });
}

// Get bonding curve PDA for a mint
export function getBondingCurvePDA(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(BONDING_CURVE_SEED), mint.toBuffer()],
    programId
  );
}

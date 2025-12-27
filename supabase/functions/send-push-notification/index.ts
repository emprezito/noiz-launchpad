import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to convert base64url to ArrayBuffer
function base64UrlToArrayBuffer(base64: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Padded = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64Padded);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return buffer;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function createVapidJwt(endpoint: string, subject: string, privateKeyBase64: string): Promise<string> {
  const url = new URL(endpoint);
  const aud = `${url.protocol}//${url.host}`;
  
  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { aud, exp: now + 12 * 60 * 60, sub: subject };
  
  const textEncoder = new TextEncoder();
  const headerB64 = arrayBufferToBase64Url(textEncoder.encode(JSON.stringify(header)).buffer);
  const payloadB64 = arrayBufferToBase64Url(textEncoder.encode(JSON.stringify(payload)).buffer);
  const unsignedToken = `${headerB64}.${payloadB64}`;
  
  const privateKeyBuffer = base64UrlToArrayBuffer(privateKeyBase64);
  
  const key = await crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    textEncoder.encode(unsignedToken)
  );
  
  const signatureB64 = arrayBufferToBase64Url(signature);
  return `${unsignedToken}.${signatureB64}`;
}

async function encryptPayload(
  payloadText: string,
  p256dhBase64: string,
  authBase64: string
): Promise<ArrayBuffer> {
  const textEncoder = new TextEncoder();
  const payloadBytes = textEncoder.encode(payloadText);
  
  // Generate random salt
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  
  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );
  
  // Export local public key
  const localPublicKeyBuffer = await crypto.subtle.exportKey("raw", localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyBuffer);
  
  // Import subscriber's public key
  const subscriberKeyBuffer = base64UrlToArrayBuffer(p256dhBase64);
  const subscriberPublicKey = await crypto.subtle.importKey(
    "raw",
    subscriberKeyBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );
  
  // Derive shared secret
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberPublicKey },
    localKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);
  
  // Auth secret and subscriber key bytes
  const authSecretBuffer = base64UrlToArrayBuffer(authBase64);
  const authSecret = new Uint8Array(authSecretBuffer);
  const subscriberKeyBytes = new Uint8Array(subscriberKeyBuffer);
  
  // Create info for IKM derivation
  const webPushInfo = new Uint8Array([
    ...textEncoder.encode("WebPush: info\0"),
    ...subscriberKeyBytes,
    ...localPublicKey,
  ]);
  
  // HKDF Extract and Expand for IKM
  const prkAuth = await hkdfExtract(authSecret.buffer, sharedSecret.buffer);
  const ikm = await hkdfExpand(prkAuth, webPushInfo.buffer, 32);
  
  // HKDF for content encryption key and nonce
  const prk = await hkdfExtract(salt.buffer, ikm);
  const cekInfo = textEncoder.encode("Content-Encoding: aes128gcm\0");
  const nonceInfo = textEncoder.encode("Content-Encoding: nonce\0");
  
  const contentEncryptionKey = await hkdfExpand(prk, cekInfo.buffer, 16);
  const nonce = await hkdfExpand(prk, nonceInfo.buffer, 12);
  
  // Add padding delimiter (0x02)
  const paddedPayload = new Uint8Array([...payloadBytes, 2]);
  
  // Encrypt with AES-GCM
  const aesKey = await crypto.subtle.importKey(
    "raw",
    contentEncryptionKey,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
  
  const encryptedContent = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    aesKey,
    paddedPayload
  );
  
  const encrypted = new Uint8Array(encryptedContent);
  
  // Build aes128gcm body: salt (16) + rs (4) + idlen (1) + keyid (65) + encrypted
  const recordSize = 4096;
  const headerSize = 16 + 4 + 1 + localPublicKey.length;
  const header = new ArrayBuffer(headerSize);
  const headerView = new DataView(header);
  const headerBytes = new Uint8Array(header);
  
  // Copy salt
  headerBytes.set(salt, 0);
  // Record size (big endian)
  headerView.setUint32(16, recordSize, false);
  // Key ID length
  headerBytes[20] = localPublicKey.length;
  // Key ID (local public key)
  headerBytes.set(localPublicKey, 21);
  
  // Combine header and encrypted content
  const body = new Uint8Array(headerSize + encrypted.length);
  body.set(headerBytes, 0);
  body.set(encrypted, headerSize);
  
  return body.buffer;
}

async function hkdfExtract(salt: ArrayBuffer, ikm: ArrayBuffer): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    salt,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return await crypto.subtle.sign("HMAC", key, ikm);
}

async function hkdfExpand(prk: ArrayBuffer, info: ArrayBuffer, length: number): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    prk,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const result = new Uint8Array(length);
  let t = new Uint8Array(0);
  let offset = 0;
  let counter = 1;
  
  while (offset < length) {
    const input = new Uint8Array(t.length + new Uint8Array(info).length + 1);
    input.set(t, 0);
    input.set(new Uint8Array(info), t.length);
    input[input.length - 1] = counter;
    
    const outputBuffer = await crypto.subtle.sign("HMAC", key, input.buffer);
    t = new Uint8Array(outputBuffer);
    const toCopy = Math.min(32, length - offset);
    result.set(t.subarray(0, toCopy), offset);
    offset += toCopy;
    counter++;
  }
  
  return result.buffer;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress, title, body, url, tokenMint } = await req.json();

    if (!walletAddress || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error("VAPID keys not configured");
      return new Response(
        JSON.stringify({ error: "Push notifications not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("wallet_address", walletAddress);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found for wallet:", walletAddress);
      return new Response(
        JSON.stringify({ message: "No subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payloadJson = JSON.stringify({ title, body, url, tokenMint });
    const vapidSubject = "mailto:notifications@noizlabs.com";

    let successCount = 0;
    let failCount = 0;

    for (const sub of subscriptions) {
      try {
        console.log("Sending push to:", sub.endpoint.substring(0, 60));
        
        // Create JWT for VAPID
        const jwt = await createVapidJwt(sub.endpoint, vapidSubject, vapidPrivateKey);
        
        // Encrypt payload
        const encryptedBody = await encryptPayload(payloadJson, sub.p256dh, sub.auth);
        
        // Send push notification
        const response = await fetch(sub.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "Content-Encoding": "aes128gcm",
            "TTL": "86400",
            "Authorization": `vapid t=${jwt}, k=${vapidPublicKey}`,
          },
          body: encryptedBody,
        });

        if (response.ok || response.status === 201) {
          successCount++;
          console.log("Push sent successfully!");
        } else if (response.status === 410 || response.status === 404) {
          console.log("Subscription expired, removing:", sub.id);
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
          failCount++;
        } else {
          const errorText = await response.text();
          console.error("Push failed:", response.status, errorText);
          failCount++;
        }
      } catch (err) {
        console.error("Error sending push:", err);
        failCount++;
      }
    }

    console.log(`Push results: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({ success: successCount, failed: failCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Error in send-push-notification:", err);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import {Wallet, loadKeypair, DriftClient} from "@drift-labs/sdk";
import {Connection} from "@solana/web3.js";

const keyPairFile = `${process.env.HOME}/.config/solana/my-keypair.json`;
const wallet = new Wallet(loadKeypair(keyPairFile));

const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

const driftClient = new DriftClient({
  connection,
  wallet,
  env: 'mainnet-beta',
});

await driftClient.subscribe();
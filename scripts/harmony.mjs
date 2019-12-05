import fs from 'fs';
import core from '@harmony-js/core';

const Harmony = core.Harmony;

// loading setting
const config = JSON.parse(fs.readFileSync('config.json'))

// loading setting from local json file
export const harmony = new Harmony(config.url, {
  chainType: config.chainType,
  chainId: config.chainId,
  shardID: config.shardID
});

const accountImported = harmony.wallet.addByPrivateKey(config.privateKey.trim());

// add the phrase and index to Wallet, we get the account,
// and we export it for further usage
export const myAccount = accountImported

export const { contracts } = config;
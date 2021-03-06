import { harmony, contracts, myAccount } from './harmony';
import crypto from '@harmony-js/crypto';
import network from '@harmony-js/network';
import PassportLogic from '../build/contracts/PassportLogic.json';
import PassportLogicRegistry from '../build/contracts/PassportLogicRegistry.json';
import PassportFactory from '../build/contracts/PassportFactory.json';
import elliptic from 'elliptic';

const secp256k1 = elliptic.ec('secp256k1');
const BN = crypto.BN;

(async () => {
  // Create passport
  const passReceipt = await write(PassportFactory.abi, contracts.passportFactory, 'createPassport');
  const passAddr = getPassportAddress(passReceipt);
  console.log(`> Created passport address ${passAddr}`);

  // Claim ownership
  const claimOwnReceipt = await write(PassportLogic.abi, passAddr, 'claimOwnership');
  console.log('> Ownership claimed.')

  // Write string fact
  const factKey = '0x1234567891234567891234567891234567891234567891234567891234567891';
  const factValue = 'This is a test string';
  await write(PassportLogic.abi, passAddr, 'setString', factKey, factValue);
  console.log(`> Written a string fact "${factValue}"`);

  // Read string fact
  const readStringResult = await read(PassportLogic.abi, passAddr, 'getString', myAccount.address, factKey);
  const readFactValue = readStringResult.callResult.value;
  console.log(`> Read fact value: "${readFactValue}"`);

  // Write private data hash fact
  const dataIpfsHash = 'FAKE_IPFS_HASH';
  const dataKeyHash = '0x46414b455f4b45595f4841534800000000000000000000000000000000000000';
  await write(PassportLogic.abi, passAddr, 'setPrivateDataHashes', factKey, dataIpfsHash, dataKeyHash);
  console.log(`> Written a private data hash fact "${dataIpfsHash}, ${dataKeyHash}"`);

  // Read private data hash fact
  const readPrivateDataHashResult = await read(PassportLogic.abi, passAddr, 'getPrivateDataHashes', myAccount.address, factKey);
  console.log(`> Read fact value: "${JSON.stringify(readPrivateDataHashResult.callResult)}"`);

  // Get pass ownership transfer event
  // getEvents(PassportLogic.abi, passAddr, 'OwnershipTransferred');
  const claimOwnTxHash = claimOwnReceipt.transactionHash;

  const tx = await getTxByHash(claimOwnTxHash);
  const publicKey = getTxSenderPublicKey(tx);
  console.log(`> Tx sender public key: ${publicKey}`);

  console.log('DONE!');
})().catch(e => {
  console.error(e);
});

// #region -------------- Call read-only contract method -------------------------------------------------------------------

async function read(abi, contractAddress, method, ...args) {
  const deployedContract = harmony.contracts.createContract(
    abi,
    contractAddress
  );

  const methodConfig = deployedContract.methods[method].apply(null, args)

  const callResult = await methodConfig.call({
    gasLimit: new BN('210000'),
    gasPrice: new BN('100000000000')
  })

  return {
    callResult,
    callResponseHex: methodConfig.callResponse.result,
    callPayload: methodConfig.callPayload
  }
}

// #endregion

// #region -------------- Call writing contract method -------------------------------------------------------------------

async function write(abi, contractAddress, method, ...args) {
  const deployedContract = harmony.contracts.createContract(
    abi,
    contractAddress
  );

  const methodConfig = deployedContract.methods[method].apply(null, args)

  return new Promise(async (resolve, reject) => {
    try {
      await methodConfig
        .send({
          gasLimit: new BN('5100000'),
          gasPrice: new BN('10000000000'),
        })
        .on('receipt', receipt => {
          resolve(receipt);
        })
        .on('error', error => {
          reject(error);
        });
    } catch (err) {
      reject(err);
    }
  });
}

// #endregion

// #region -------------- Event fetching -------------------------------------------------------------------

async function getEvents(abi, contractAddress, event, ...args) {
  const deployedContract = harmony.contracts.createContract(
    abi,
    contractAddress,
  );

  console.log(deployedContract.events[event]());

  // const methodConfig = deployedContract.events[event].apply(null, args)
}

// #endregion

// #region -------------- TX fetching -------------------------------------------------------------------

async function getTxByHash(txHash) {
  const rpc = new network.JsonRpc();
  const request = rpc.toPayload(network.RPCMethod.GetTransactionByHash, [txHash]);

  return (await harmony.provider.send(request)).result;
}

function getTxSenderPublicKey(tx) {
  const signature = {
    r: tx.r,
    v: tx.v,
    s: tx.s,
  };

  const hmyTx = harmony.transactions.newTx({
    from: tx.from,
    nonce: tx.nonce,
    gasPrice: tx.gasPrice,
    gasLimit: tx.gas,
    shardID: tx.shardID,
    to: tx.to,
    value: tx.value,
    data: tx.input,
    signature,
  });

  const [_, unsignedArr] = hmyTx.getRLPUnsigned();

  // Strip r, s, v
  const rawTxNoSig = unsignedArr.slice(0, 8);

  let recoveryParam = hmyTx.signature.v - 27;

  if (hmyTx.chainId !== 0) {
    rawTxNoSig.push(crypto.hexlify(hmyTx.chainId));
    rawTxNoSig.push('0x');
    rawTxNoSig.push('0x');
    recoveryParam -= hmyTx.chainId * 2 +8
  }

  const digest = crypto.keccak256(crypto.encode(rawTxNoSig));

  const splittedSig = crypto.splitSignature({
    r: signature.r,
    s: signature.s,
    recoveryParam,
  });
  const rs = { r: crypto.arrayify(splittedSig.r), s: crypto.arrayify(splittedSig.s) };
  const recovered = secp256k1.recoverPubKey(crypto.arrayify(digest), rs, splittedSig.recoveryParam);

  const key = recovered.encode('hex', false);
  const ecKey = secp256k1.keyFromPublic(key, 'hex');
  const publicKey = '0x' + ecKey.getPublic(false, 'hex');

  return publicKey;
}

// #endregion

// #region -------------- Passport properties -------------------------------------------------------------------

function getPassportAddress(receipt) {
  if (!receipt || !receipt.logs || receipt.logs.length === 0) {
    throw new Error('createPassport receipt or its logs are empty');
  }

  const { topics } = receipt.logs[0];
  if (!topics || topics.length < 2) {
    throw new Error('createPassport receipt log topics are invalid')
  }

  return `0x${topics[1].slice(26)}`;
}

// #endregion
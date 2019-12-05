import { harmony, contracts } from './harmony';
import crypto from '@harmony-js/crypto';
import PassportLogicRegistry from '../build/contracts/PassportLogicRegistry.json';
import PassportFactory from '../build/contracts/PassportFactory.json';

const BN = crypto.BN;

(async () => {
  console.log('Testing: getCurrentPassportLogicVersion');
  let result = await call(PassportLogicRegistry.abi, contracts.passportRegistry, 'getCurrentPassportLogicVersion');
  console.log(result.callResult);

  console.log('Testing: getRegistry');
  result = await call(PassportFactory.abi, contracts.passportFactory, 'getRegistry');
  console.log(result.callResult);

  console.log('Testing: createPassport');
  result = await send(PassportFactory.abi, contracts.passportFactory, 'createPassport');
  console.log(result);

})().catch(e => {
  console.error(e);
});

// #region -------------- Call contract method -------------------------------------------------------------------

async function call(abi, contractAddress, method, ...args) {
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

// #region -------------- Deploy contract -------------------------------------------------------------------

async function send(abi, contractAddress, method, ...args) {
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
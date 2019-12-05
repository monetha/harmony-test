const crypto = require('@harmony-js/crypto');
const core = require('@harmony-js/core');
const BN = crypto.BN;
const Harmony = core.Harmony;

const CompiledContract = require('../build/contracts/PassportLogicRegistry.json');

const privateKey = '01f903ce0c960ff3a9e68e80ff5ffc344358d80ce1c221c3f9711af07f83a3bd';
const contractAddress = '0x89581592e0881E278D32d287bFDe44B283070494';

const harmony = new Harmony('https://api.s0.b.hmny.io', {
  chainType: 'hmy',
  chainId: 2,
  shardID: 0
});

harmony.wallet.addByPrivateKey(privateKey);

const deployedContract = harmony.contracts.createContract(
  CompiledContract.abi,
  contractAddress
);

const methodConfig = deployedContract.methods['getCurrentPassportLogicVersion'].apply(null)

// The call below throws an error `TypeError: Object prototype may only be an Object or null: undefined` in v 0.1.31
methodConfig.call({
  gasLimit: new BN('210000'),
  gasPrice: new BN('100000000000')
})
  .then(result => console.log(result));

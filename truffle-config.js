
const { TruffleProvider } = require('@harmony-js/core');

const phrase = 'urge clog right example dish drill card maximum mix bachelor section select';
const private_key = '01F903CE0C960FF3A9E68E80FF5FFC344358D80CE1C221C3F9711AF07F83A3BD';
const url = 'http://localhost:9500';

const beta_phrase = 'urge clog right example dish drill card maximum mix bachelor section select'
const beta_url = 'https://api.s1.b.hmny.io'
const beta_private_key = '01F903CE0C960FF3A9E68E80FF5FFC344358D80CE1C221C3F9711AF07F83A3BD'

module.exports = {
  networks: {
    development: {
      network_id: '2', // Any network (default: none)
      provider: () => {
        const truffleProvider = new TruffleProvider(
          url,
          { memonic: phrase },
          { shardID: 0, chainId: 2 },
          { gasLimit: '936475', gasPrice: '1000000000' },
        );
        const newAcc = truffleProvider.addByPrivateKey(private_key);
        truffleProvider.setSigner(newAcc);
        return truffleProvider;
      },
    },
    testnet: {
      network_id: '2', // Any network (default: none)
      provider: () => {
        const truffleProvider = new TruffleProvider(
          beta_url,
          { memonic: beta_phrase },
          { shardID: 1, chainId: 2 },
          { gasLimit: '7000000', gasPrice: '1000000000' },
        );
        const newAcc = truffleProvider.addByPrivateKey(beta_private_key);
        truffleProvider.setSigner(newAcc);
        return truffleProvider;
      },
    },
  },
  mocha: {
    // timeout: 100000
  },
  compilers: {
    solc: {
    }
  }
}

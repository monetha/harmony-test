const PassportLogic = artifacts.require('PassportLogic');
const PassportLogicRegistry = artifacts.require('PassportLogicRegistry');
const PassportFactory = artifacts.require('PassportFactory');

module.exports = (deployer, _, accounts) => {

  const ownerAddress = accounts[0];
  console.log(ownerAddress);
  deployer.deploy(PassportLogic, { from: ownerAddress })
    .then(() => deployer.deploy(PassportLogicRegistry, '0.1', PassportLogic.address, { from: ownerAddress }))
    .then(() => deployer.deploy(PassportFactory, PassportLogicRegistry.address, { from: ownerAddress }));
}

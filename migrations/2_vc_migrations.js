var Migrations = artifacts.require("vc");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
};
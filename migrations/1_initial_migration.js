const Migrations = artifacts.require("Migrations");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
  console.log("YourContract deployed to:", YourContract.address);

};

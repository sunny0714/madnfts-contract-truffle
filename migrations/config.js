async function getProxyImplementation(proxy, ProxyAdmin) {
  // let json = require(`../.openzeppelin/rinkeby.json`);
  let json = require(`../.openzeppelin/unknown-1337.json`);
  const c = await ProxyAdmin.at(json.admin.address)
  const deployed = await proxy.deployed()
  return c.getProxyImplementation(deployed.address)
}


module.exports = { getProxyImplementation };
// MUMBAI TEST NET CONTRACT ADDRESS: 0x7007e7ee40eacac601b0db307f9724ee9d5503e9

const hre = require('hardhat')
const main = async () => {
  const [owner, randomPerson] = await hre.ethers.getSigners()
  const domainContractFactory = await hre.ethers.getContractFactory('Domains')
  const domainContract = await domainContractFactory.deploy('hello')
  await domainContract.deployed()

  console.log(`Domain Contract Deployed to : ${domainContract.address}`)
  console.log(`Contract Deployed By: ${owner.address}`)

  const txn = await domainContract.register('awesomeworld', {
    value: hre.ethers.utils.parseEther('0.1'),
  })
  await txn.wait()
  console.log(`Minted domain awesomeworld.hello`)

  const domainOwner = await domainContract.getOwner('awesomeworld')
  console.log(`Owner of the domain awesomeworld.hello is ${domainOwner}`)

  // txn = await domainContract
  //   .connect(randomPerson)
  //   .setRecord('hello', 'I am a hacker and i set your domain record')
  // await txn.wait()

  const balance = await hre.ethers.provider.getBalance(domainContract.address)
  console.log(`Contract balance: ${hre.ethers.utils.formatEther(balance)}`)
}

const runMain = async () => {
  try {
    await main()
    process.exit(0)
  } catch (error) {
    console.log(`Error while deploying the contract : ${error}`)
    process.exit(1)
  }
}

runMain()

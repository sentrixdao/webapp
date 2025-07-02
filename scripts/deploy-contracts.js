const { ethers } = require("hardhat")

async function main() {
  console.log("Deploying SentrixBank contract...")

  // Get the ContractFactory and Signers
  const [deployer] = await ethers.getSigners()
  console.log("Deploying contracts with the account:", deployer.address)
  console.log("Account balance:", (await deployer.getBalance()).toString())

  // Deploy SentrixBank
  const SentrixBank = await ethers.getContractFactory("SentrixBank")
  const sentrixBank = await SentrixBank.deploy()

  await sentrixBank.deployed()

  console.log("SentrixBank deployed to:", sentrixBank.address)

  // Verify deployment
  const owner = await sentrixBank.owner()
  console.log("Contract owner:", owner)

  // Add some supported tokens using addresses from environment variables
  const USDC_ADDRESS = process.env.USDC_TOKEN_ADDRESS || "0xA0b86a33E6417c8f4c8B4B8c8B4B8c8B4B8c8B4B" // Fallback example
  const USDT_ADDRESS = process.env.USDT_TOKEN_ADDRESS || "0xB0b86a33E6417c8f4c8B4B8c8B4B8c8B4B8c8B4B" // Fallback example

  try {
    await sentrixBank.addSupportedToken(USDC_ADDRESS, ethers.utils.parseEther("10000"))
    console.log("Added USDC as supported token")

    await sentrixBank.addSupportedToken(USDT_ADDRESS, ethers.utils.parseEther("10000"))
    console.log("Added USDT as supported token")
  } catch (error) {
    console.log("Note: Token addresses are examples, update with real addresses")
  }

  console.log("Deployment completed!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

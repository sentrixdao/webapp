const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("SentrixBank", () => {
  let SentrixBank
  let sentrixBank
  let owner
  let user1
  let user2

  beforeEach(async () => {
    ;[owner, user1, user2] = await ethers.getSigners()

    SentrixBank = await ethers.getContractFactory("SentrixBank")
    sentrixBank = await SentrixBank.deploy()
    await sentrixBank.deployed()
  })

  describe("Account Management", () => {
    it("Should create a new account", async () => {
      await sentrixBank.connect(user1).createAccount()

      const userInfo = await sentrixBank.getUserInfo(user1.address)
      expect(userInfo.isActive).to.be.true
    })

    it("Should not allow duplicate accounts", async () => {
      await sentrixBank.connect(user1).createAccount()

      await expect(sentrixBank.connect(user1).createAccount()).to.be.revertedWith("Account already exists")
    })
  })

  describe("ETH Deposits and Withdrawals", () => {
    beforeEach(async () => {
      await sentrixBank.connect(user1).createAccount()
    })

    it("Should allow ETH deposits", async () => {
      const depositAmount = ethers.utils.parseEther("1.0")

      await sentrixBank.connect(user1).depositETH({ value: depositAmount })

      const balance = await sentrixBank.getBalance(user1.address, ethers.constants.AddressZero)
      expect(balance).to.equal(depositAmount)
    })

    it("Should allow ETH withdrawals", async () => {
      const depositAmount = ethers.utils.parseEther("1.0")
      const withdrawAmount = ethers.utils.parseEther("0.5")

      await sentrixBank.connect(user1).depositETH({ value: depositAmount })
      await sentrixBank.connect(user1).withdrawETH(withdrawAmount)

      const balance = await sentrixBank.getBalance(user1.address, ethers.constants.AddressZero)
      expect(balance).to.equal(depositAmount.sub(withdrawAmount))
    })

    it("Should enforce minimum deposit", async () => {
      const smallAmount = ethers.utils.parseEther("0.0001")

      await expect(sentrixBank.connect(user1).depositETH({ value: smallAmount })).to.be.revertedWith(
        "Deposit too small",
      )
    })

    it("Should prevent withdrawal of more than balance", async () => {
      const depositAmount = ethers.utils.parseEther("1.0")
      const withdrawAmount = ethers.utils.parseEther("2.0")

      await sentrixBank.connect(user1).depositETH({ value: depositAmount })

      await expect(sentrixBank.connect(user1).withdrawETH(withdrawAmount)).to.be.revertedWith("Insufficient balance")
    })
  })

  describe("Transfers", () => {
    beforeEach(async () => {
      await sentrixBank.connect(user1).createAccount()
      await sentrixBank.connect(user2).createAccount()

      const depositAmount = ethers.utils.parseEther("2.0")
      await sentrixBank.connect(user1).depositETH({ value: depositAmount })
    })

    it("Should allow transfers between users", async () => {
      const transferAmount = ethers.utils.parseEther("0.5")

      await sentrixBank.connect(user1).transfer(user2.address, ethers.constants.AddressZero, transferAmount)

      const user1Balance = await sentrixBank.getBalance(user1.address, ethers.constants.AddressZero)
      const user2Balance = await sentrixBank.getBalance(user2.address, ethers.constants.AddressZero)

      expect(user1Balance).to.equal(ethers.utils.parseEther("1.5"))
      expect(user2Balance).to.equal(transferAmount)
    })

    it("Should prevent transfers to inactive accounts", async () => {
      const transferAmount = ethers.utils.parseEther("0.5")
      const [, , user3] = await ethers.getSigners()

      await expect(
        sentrixBank.connect(user1).transfer(user3.address, ethers.constants.AddressZero, transferAmount),
      ).to.be.revertedWith("Recipient account not active")
    })

    it("Should prevent self transfers", async () => {
      const transferAmount = ethers.utils.parseEther("0.5")

      await expect(
        sentrixBank.connect(user1).transfer(user1.address, ethers.constants.AddressZero, transferAmount),
      ).to.be.revertedWith("Cannot transfer to self")
    })
  })

  describe("Daily Limits", () => {
    beforeEach(async () => {
      await sentrixBank.connect(user1).createAccount()

      const depositAmount = ethers.utils.parseEther("2000")
      await sentrixBank.connect(user1).depositETH({ value: depositAmount })
    })

    it("Should enforce daily withdrawal limits", async () => {
      const maxLimit = ethers.utils.parseEther("1000")
      const overLimit = ethers.utils.parseEther("1001")

      await expect(sentrixBank.connect(user1).withdrawETH(overLimit)).to.be.revertedWith("Daily limit exceeded")
    })

    it("Should allow withdrawals within daily limit", async () => {
      const withinLimit = ethers.utils.parseEther("500")

      await expect(sentrixBank.connect(user1).withdrawETH(withinLimit)).to.not.be.reverted
    })
  })

  describe("Admin Functions", () => {
    it("Should allow owner to pause contract", async () => {
      await sentrixBank.pause()

      await sentrixBank.connect(user1).createAccount()

      await expect(sentrixBank.connect(user1).depositETH({ value: ethers.utils.parseEther("1") })).to.be.revertedWith(
        "Pausable: paused",
      )
    })

    it("Should allow owner to add supported tokens", async () => {
      const tokenAddress = "0x1234567890123456789012345678901234567890"
      const dailyLimit = ethers.utils.parseEther("5000")

      await sentrixBank.addSupportedToken(tokenAddress, dailyLimit)

      const isSupported = await sentrixBank.supportedTokens(tokenAddress)
      expect(isSupported).to.be.true
    })

    it("Should prevent non-owner from admin functions", async () => {
      await expect(sentrixBank.connect(user1).pause()).to.be.revertedWith("Ownable: caller is not the owner")
    })
  })

  describe("Emergency Withdrawals", () => {
    beforeEach(async () => {
      await sentrixBank.connect(user1).createAccount()

      const depositAmount = ethers.utils.parseEther("1.0")
      await sentrixBank.connect(user1).depositETH({ value: depositAmount })

      await sentrixBank.pause()
    })

    it("Should allow emergency withdrawals when paused", async () => {
      const initialBalance = await user1.getBalance()

      await sentrixBank.connect(user1).emergencyWithdraw(ethers.constants.AddressZero)

      const finalBalance = await user1.getBalance()
      expect(finalBalance).to.be.gt(initialBalance)
    })

    it("Should charge emergency withdrawal fee", async () => {
      const contractBalanceBefore = await ethers.provider.getBalance(sentrixBank.address)

      await sentrixBank.connect(user1).emergencyWithdraw(ethers.constants.AddressZero)

      const contractBalanceAfter = await ethers.provider.getBalance(sentrixBank.address)
      expect(contractBalanceAfter).to.be.lt(contractBalanceBefore)
    })
  })
})

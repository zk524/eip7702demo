const { ethers } = require("hardhat")
const rlp = require("@ethereumjs/rlp")

const sendEIP7702Tx = async (target, sender, delegateAddress, txData = "0x") => {
    const chainId = Number((await ethers.provider.getNetwork()).chainId)
    const authNonce = await ethers.provider.getTransactionCount(target.address).then((n) => target.address === sender.address ? n + 1 : n)
    const authTuple = rlp.encode([ethers.toBeArray(chainId), ethers.getBytes(delegateAddress), ethers.toBeArray(authNonce)])
    const authSig = target.signingKey.sign(ethers.keccak256(ethers.concat([new Uint8Array([0x05]), authTuple])))
    const authList = [[ethers.toBeArray(chainId), ethers.getBytes(delegateAddress), ethers.toBeArray(authNonce), authSig.yParity, authSig.r, authSig.s]]
    const txNonce = await ethers.provider.getTransactionCount(sender.address)
    const txPayload = [ethers.toBeArray(chainId), ethers.toBeArray(txNonce), ethers.toBeArray(ethers.parseUnits("1", "gwei")), ethers.toBeArray(ethers.parseUnits("3", "gwei")), ethers.toBeArray(100000), target.address, ethers.toBeArray(0), txData, [], authList]
    const txSig = sender.signingKey.sign(ethers.keccak256(ethers.concat([new Uint8Array([0x04]), rlp.encode(txPayload)])))
    const signedTxRlp = ethers.concat([new Uint8Array([0x04]), rlp.encode([...txPayload, txSig.yParity, txSig.r, txSig.s])])
    await (await ethers.provider.broadcastTransaction(signedTxRlp)).wait()
    if (delegateAddress === ethers.ZeroAddress) console.log("Revoked delegation.")
    else console.log("Delegated.")
}

const revokeDelegation = async (a, b) => {
    await sendEIP7702Tx(a, b, ethers.ZeroAddress)
}

Promise.resolve(true).then(async () => {
    // accountA: delegated account
    // accountB: transaction executor and gas payer account
    // accountC: recipient account
    const [accountA, accountB, accountC] = await ethers.getSigners()
    const accountAwallet = new ethers.Wallet(hre.config.networks.hardhat.accounts[0].privateKey)
    const accountBwallet = new ethers.Wallet(hre.config.networks.hardhat.accounts[1].privateKey)

    // Delegate.sol:
    const Delegate = await ethers.getContractFactory("Delegate")
    const delegate = await Delegate.deploy()
    await delegate.waitForDeployment()
    const delegateAddress = await delegate.getAddress()
    console.log(`delegateAddress: ${delegateAddress}`)

    console.log(`accountA balance: ${ethers.formatEther(await ethers.provider.getBalance(accountA.address))}`)
    console.log(`accountB balance: ${ethers.formatEther(await ethers.provider.getBalance(accountB.address))}`)
    console.log(`accountC balance: ${ethers.formatEther(await ethers.provider.getBalance(accountC.address))}`)
    await sendEIP7702Tx(
        accountAwallet,
        accountBwallet,
        delegateAddress,
        delegate.interface.encodeFunctionData("setTarget", [accountC.address])
    )
    await accountB.sendTransaction({ to: accountA.address, value: ethers.parseEther("1000") });
    console.log(`accountA balance: ${ethers.formatEther(await ethers.provider.getBalance(accountA.address))}`)
    console.log(`accountB balance: ${ethers.formatEther(await ethers.provider.getBalance(accountB.address))}`)
    console.log(`accountC balance: ${ethers.formatEther(await ethers.provider.getBalance(accountC.address))}`)

    // RescueDelegate.sol
    const RescueDelegate = await ethers.getContractFactory("RescueDelegate")
    const rescueDelegate = await RescueDelegate.deploy()
    await rescueDelegate.waitForDeployment()
    const rescueAddress = await rescueDelegate.getAddress()
    console.log(`rescueAddress: ${rescueAddress}`)

    // Swap for some test USDT
    const WBNBAddress = "0xae13d989dac2f0debff460ac112a837c89baa7cd" //testnet WBNB
    const USDTAddress = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd" //testnet USDT
    const pancakeRouterAddress = "0x9ac64cc6e4415144c455bd8e4837fea55603e5c3" //testnet pancakeRouter
    const token = new ethers.Contract(USDTAddress, ["function balanceOf(address) view returns (uint256)", "function transfer(address,uint256) returns (bool)"], ethers.provider)
    const router = new ethers.Contract(pancakeRouterAddress, ["function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)"], accountA)
    console.log(`Swapping 1 BNB for tokens...`)
    await router.swapExactETHForTokens(0, [WBNBAddress, USDTAddress], accountA.address, Math.floor(Date.now() / 1000) + 60 * 5, { value: ethers.parseEther("1") }).then(_ => _.wait())
    console.log(`balance A: ${ethers.formatEther(await token.balanceOf(accountA.address))}`)
    console.log(`balance C: ${ethers.formatEther(await token.balanceOf(accountC.address))}`)

    // Rescue
    await sendEIP7702Tx(
        accountAwallet,
        accountBwallet,
        rescueAddress,
        rescueDelegate.interface.encodeFunctionData("rescueToken", [USDTAddress, accountC.address, await token.balanceOf(accountA.address)])
    )
    console.log(`balance A: ${ethers.formatEther(await token.balanceOf(accountA.address))}`)
    console.log(`balance C: ${ethers.formatEther(await token.balanceOf(accountC.address))}`)

    // Revoke
    await revokeDelegation(
        accountAwallet,
        accountBwallet,
    )
}).catch((e) => {
    console.log(e)
    process.exit(0)
})

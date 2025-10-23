require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.24",
    networks: {
        hardhat: {
            initialBaseFeePerGas: 0,
            forking: {
                url: "https://bnb-testnet.g.alchemy.com/v2/", // replace your rpc URL
                blockNumber: 69810520, // replace if needed
            },
            accounts: [
                {
                    privateKey: "0xa056740b5d95e24ceeb7b50eb036cf04cb23c8ed5bcfe4c47267fe2a50997b9b", //randomkey
                    balance: "10000000000000000000000",
                },
                {
                    privateKey: "0x3bc2da4f9ce59d7548fe6ea44c985a9b56e71c9330218e632126e9ae5bf49bd4", //randomkey
                    balance: "10000000000000000000000",
                },
                {
                    privateKey: "0x8fdcadb2e6cac70e48845a08c8c7bd07365586c22d0ce3815135b47ba517b2e6", //randomkey
                    balance: "10000000000000000000000",
                },
            ]
        },
    }
};

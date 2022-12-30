import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";
import * as dotenv from 'dotenv' ;
dotenv.config()

const QUICKNODE_HTTP_URL = process.env.QUICKNODE_HTTP_URL;
const QUICKNODE_HTTP_URL_1= process.env.QUICKNODE_HTTP_URL_1;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ALCHEMY_API_KEY = process.env.KEY;

if (!PRIVATE_KEY) throw new Error();

module.exports = {
  solidity: "0.8.17",
  defaultNetwork: "hardhat",
  networks: {
    goerli: {
      url: QUICKNODE_HTTP_URL,
      chainId: 5,
      accounts: [PRIVATE_KEY]
    }
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: ALCHEMY_API_KEY
  }
}
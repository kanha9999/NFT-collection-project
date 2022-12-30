import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import {abi, NFT_CONTRACT_ADDRESS} from "../constants";
import { useEffect, useRef, useState } from 'react';
import { providers , Contract, Signer, utils } from 'ethers';
import Web3Modal from "web3modal";


export default function Home() {
    // walletConnected kepp track of whether the user's wallet is connected or not
    const [walletConnected, setWalletConnected] = useState(false);
    // presaleStarted keeps track of whether the presale has started or not 
    const [presaleStarted, setPresaleStarted] = useState(false);
    // presaleEnded keeps track of wherther the presale ended
    const [presaleEnded, setPresalesEndend] = useState(false);
    // loading is set to true when we are waiting for transaction to get mined
    const [loading, setLoading] = useState(false);
    // checks if the currently connected MetaMask wallets is the owner of the contract
    const [isOwner, setIsOwner] = useState(false);
    // tokenIdsMinted keeps track of the number of tokenIDs tha have been minted
    const [tokenIdsMinted,setTokendIdsMinted] = useState("0");
    // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as as the page is open 
    const web3ModalRef : any = useRef;

    // presaleMint: Mint an NFT the durrung the presale
  const presaleMint =async () => {
    try {
    // We need a Signer here since this is a 'write' transaction
    const signer = await getProviderorSigner(true);
    // Create a new instance of the Contract with a signer, which allows 
    // update a methods
    const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi , signer);
    // call the presaleMint From the conract, only whitelisted addresses would be able to be minted
    const tx = await nftContract.presaleMint({
     // value signifies the cost of one crypto dev which is "0.01" eth.
     // We are parsing `0.01` string to ether using the utils library from ethers.js
      value: utils.parseEther("0.02"),
    })
    setLoading(true);
    // wait for the transaction to get mined

    await tx.wait();
    setLoading(false);
    
    window.alert("You successfully minted a Crypto Dev!")
    } catch (err) {
    console.error(err);
    } 
  }
  const publicMint = async () => {
    try {
      // We need a Signer here since is a 'Write' transaction.
      const signer = await getProviderorSigner(true);
      //Create a new intance of the Contract with Signer, Which allows
      //update methods
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // call the mint from the contract to mint the Crypto Dev
      const tx = await nftContract.mint({
        // value signifies the cost of one crypto dev which is "0.01" eth.
        // We are parsing `0.01` string to ether using the utils library from ethers.js
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a IG NFT-Collection!");
    } catch (err) {
      console.error(err);
    }
    }

  const ConnectWallet = async () => {
      try {
        // Get the provider from the web#Modal, which in our case is MetaMask
        // When used fot he first time, it prompts the user to connect their wallet
  
        await getProviderorSigner();
        setWalletConnected(true);
      } catch(err) {
        console.error(err)
      }
    }
  
  const startPresale = async () => {
      try {
        // We need a Signer here since this is a 'write' transaction.
        const signer = await getProviderorSigner(true);
        // Create a new instance of the Contract with a Signer, which allows
        // update methods
        const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
        // call the startPresale from the contract
        const tx = await nftContract.startPresale();
        setLoading(true);
        // wait for the transaction to get mined
        await tx.wait();
        setLoading(false);
        // set the presale started to true
        await checkIfPresaleStarted();
      } catch (err) {
        console.error(err);
      }
    };

  // CheckIfPresaleStarted: checks if the presale has started by quering the 'presale'
  // varriable in the contact
  const checkIfPresaleStarted = async () => {
    try {
      // Get the provider the web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchian
      const provider = await getProviderorSigner();
      // We connect to the Contract using Provider, so we will only
      // have read-only access to the Contact
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the prasaleStarted from the Contract 
      const _presaleStarted = await nftContract.presaleStarted();
      if(!_presaleStarted) {
        await getOwner();

      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;


    } catch (err) {
      console.error(err);
      return false;
    }
  }

  const checkIfPresaleEnded = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderorSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the presaleEnded from the contract
      const _presaleEnded = await nftContract.presaleEnded();
      // _presaleEnded is a Big Number, so we are using the lt(less than function) instead of `<`
      // Date.now()/1000 returns the current time in seconds
      // We compare if the _presaleEnded timestamp is less than the current time
      // which means presale has ended
      const hasEnded  = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresalesEndend(true);
      } else {
        setPresalesEndend(false);
      }
      return hasEnded;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

    // getOwner: calls the Contract to retrve the owner
    const getOwner =async () => {
      try {
        // GEt the provider from Web3Modal, Which in our case is MetaMask
        // No need for the Signer here, as we are only reading state from the block chain
        const provider = await getProviderorSigner();
        // We Connect the Contract using a Provider, so we will only have a readonly access the contract
        const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi ,provider);
        // Call the owner function from the Contract
        const _owner = await nftContract.owner();
        // We will get the signer now to extract the address of the currently connected MetaMask account
        const signer: providers.JsonRpcSigner = await getSigner();
        // Get the address asscociated to the signer which is connected to metaMask
        const address  = await signer.getAddress();
        if (address.toLowerCase() === _owner.toLowerCase()) {
          setIsOwner(true);
        }
  
      }catch (err:any)  {
        console.error(err.message);
      }
      
    }

  const getTokenIdsMinted = async () => {
      try {
        // Get the provider from web3Modal, Which in our case is MetaMask
        // No need for the Signer here, as we are only reading state from blockchain
        const provider = await getProviderorSigner();
        // We connect to the Contract using Provider, so we will only
        // have read-only access to Contract
        const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
        // call the TokenIds from the contract
        const _tokenIds = await nftContract.tokenIds();
        //_tokenIds is a `Big Number` We need to convert the BigNUmber to a String
        setTokendIdsMinted(_tokenIds.toString());
      } catch (err) {
        console.error(err)
      }
    }

    const getProviderorSigner = async (needSigner = false) => {
      //Connect to Metamask
      //Since we store ' Web3Modal' as a reference, we need to access the 'current' value to get access to underlying object
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);
  
      // if user is not connect to the Goerli network, let them know and throw an error
      const { chainId } = await web3Provider.getNetwork();
      if (chainId !== 5) {
        window.alert("Change the network to Goerli");
        throw new Error ("Change network to Goerli");
      }
  
      if(needSigner) {
        const signer = web3Provider.getSigner();
        return signer;
      }
      return web3Provider;
    }

    const getSigner = async () => {
      //Connect to Metamask
      //Since we store ' Web3Modal' as a reference, we need to access the 'current' value to get access to underlying object
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);
  
      // if user is not connect to the Goerli network, let them know and throw an error
      const { chainId } = await web3Provider.getNetwork();
      if (chainId !== 5) {
        window.alert("Change the network to Goerli");
        throw new Error ("Change network to Goerli");
      }
  
      const signer = web3Provider.getSigner();
      return signer;
    }

  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if ( !walletConnected ) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      ConnectWallet();

      // Check if presale has started and ended
      const _presaleStarted : any = checkIfPresaleStarted();
      if (_presaleStarted) {
        checkIfPresaleEnded();
      }

      getTokenIdsMinted();

      // Set an interval which gets called every 5 seconds to check presale has ended
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded();
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000);

      // set an interval to get the number of token Ids minted every 5 seconds
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);

  const renderButton = () => {
    // If wallet is not connected, return a button which allows them to connect their wllet
    if (!walletConnected) {
      return (
        <button onClick={ConnectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }

    // If we are currently waiting for something, return a loading button
    if (loading) {
      return <button className={styles.button}>Loading...</button>;
    }

    // If connected user is the owner, and presale hasnt started yet, allow them to start the presale
    if (isOwner && !presaleStarted) {
      return (
        <button className={styles.button} onClick={startPresale}>
          Start Presale!
        </button>
      );
    }

    // If connected user is not the owner but presale hasn't started yet, tell them that
    if (!presaleStarted) {
      return (
        <div>
          <div className={styles.description}>Presale hasnt started!</div>
        </div>
      );
    }

    // If presale started, but hasn't ended yet, allow for minting during the presale period
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <div className={styles.description}>
            Presale has started!!! If your address is whitelisted, Mint a Crypto
            Dev 🥳
          </div>
          <button className={styles.button} onClick={presaleMint}>
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    // If presale started and has ended, its time for public minting
    if (presaleStarted && presaleEnded) {
      return (
        <button className={styles.button} onClick={publicMint}>
          Public Mint 🚀
        </button>
      );
    }
  };

  return (
    <div>
    <Head>
      <title>IG NFT-Collection</title>
      <meta name="description" content="Whitelist-Dapp" />
      <link rel="icon" href="/favicon.ico" />
    </Head>
    <div className={styles.main}>
      <div>
        <h1 className={styles.title}>Welcome to IG NFT-Collection! </h1>
        <div className={styles.description}>
          Its an NFT collection for IG Community in Crypto.
        </div>
        <div className={styles.description}>
          {tokenIdsMinted}/10 have been minted
        </div>
        {renderButton()}
      </div>
      <div>
        <img className={styles.image} src="./0.svg" />
      </div>
    </div>

    <footer className={styles.footer}>
      Made with &#10084; by Web3.0 Team
    </footer>
  </div>
  );
}

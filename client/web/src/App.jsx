import React,{useEffect, useState} from 'react';
import './styles/App.css';
import twitterLogo from './assets/twitter-logo.svg';
import { ethers } from 'ethers';
import contractAbi from './utils/contractABI.json'
import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';
import { networks } from './utils/networks';
// Constants
const TWITTER_HANDLE = 'iamthulasiramp';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

// Contract details
const tld = '.hello'
const CONTRACT_ADDRESS = '0xDEf9544c3f77D4463CcD8D612FB09D38A322475C'

// Main App
const App = () => {
const [currentAccount, setCurrentAccount] = useState('')
// Add some state data propertie
const [domain, setDomain] = useState('');
const [record, setRecord] = useState('');
const [network, setNetwork] = useState('');
const [loading, setLoading] = useState(false)
const [editing, setEditing] = useState(false);
const [mints, setMints] = useState([]);


	useEffect(() => {
		console.log(`abi, ${contractAbi}`);
		checkIfWalletIsConnected()
		if (network === 'Polygon Mumbai Testnet') {
			fetchMints();
		}
		
	}, [currentAccount, network])
	

	const checkIfWalletIsConnected = async() => {
		const {ethereum} = window;
		if(ethereum){
			 console.log('Make sure you have metamask')
		}else{
			 console.log('WooW We have metamask installed already')
		}
    // check if the app having the access to get accounts
		const accounts = await ethereum.request({method: 'eth_accounts'})
		if(accounts.length !== 0){
			const account = accounts[0]
			console.log(`Found an autharized account ${account}`)
			setCurrentAccount(account)
		}else{
			console.log('No autharized account found')
		}

		const chainId = await ethereum.request({method: 'eth_chainId'})
		setNetwork(networks[chainId])
		ethereum.on('chainChanged', handleChainChanged);

		// Refreshes the page when chain id changed
		function handleChainChanged (_chainId){
			window.location.reload()
		}
	}



	const connectWallet = async() => {
		try {
			const {ethereum} = window;
		if(!ethereum){
			alert('Get Metamask To connect with the blockchain => https://metamask.io/')
			return ;
		}
		// Request wallet accounts access 
		const accounts = await ethereum.request({method: 'eth_requestAccounts'})

		//If we got the access we will get this line printed
		console.log(`Connected : ${accounts[0]}`)
		return setCurrentAccount(accounts[0])
		} catch (error) {
		  return alert(`Error connecting to metamask, \n Error: ${error}`)
		}
		
	}

	const switchNetwork = async () => {
		if (window.ethereum) {
			try {
				// Try to switch to the Mumbai testnet
				await window.ethereum.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: '0x13881' }], // Check networks.js for hexadecimal network ids
				});
			} catch (error) {
				// This error code means that the chain we want has not been added to MetaMask
				// In this case we ask the user to add it to their MetaMask
				if (error.code === 4902) {
					try {
						await window.ethereum.request({
							method: 'wallet_addEthereumChain',
							params: [
								{	
									chainId: '0x13881',
									chainName: 'Polygon Mumbai Testnet',
									rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
									nativeCurrency: {
											name: "Mumbai Matic",
											symbol: "MATIC",
											decimals: 18
									},
									blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
								},
							],
						});
					} catch (error) {
						console.log(error);
					}
				}
				console.log(error);
			}
		} else {
			// If window.ethereum is not found then MetaMask is not installed
			alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
		} 
	}

	const mintDomain = async() => {
		if(!domain){
			return 
		}
		if(domain.length < 3){
			return alert('Domain must be atleast 3 charactors')
		}
    // Calculate price based on length of domain
		const price = domain.length === 3 ? '0.5' : domain.length === 4 ? '0.3': '0.1'
		console.log(`Mining doamin ${domain}, with price ${price}`)
		try {
			const { ethereum } = window;
			if(ethereum){
				const provider = new ethers.providers.Web3Provider(ethereum)
				const signer = provider.getSigner()
				console.log(`contract address ${CONTRACT_ADDRESS} , abi ${contractAbi.abi}, signer ${signer}`);
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
				console.log('Poping the wallet for paying the gas')
				let tx = await contract.register(domain, {value: ethers.utils.parseEther(price)})
				const receipt = await tx.wait()
        console.log('registerd!');
				if(receipt.status === 1){
					console.log(`Domain minted! https://mumbai.polygonscan.com/tx/`+tx.hash)

					tx = await contract.setRecord(domain, record)
					await tx.wait()
					console.log(` Record set! https://mumbai.polygonscan.com/tx/`+tx.hash)
					// Call fetchMints after 2 seconds
				setTimeout(() => {
					fetchMints();
				}, 2000)
					setRecord('')
					setDomain('')
				}else{
					return alert('Transaction failed! Please try again')
				}
			}
			
		} catch (error) {
			console.log(error)
		}

	}

	const fetchMints = async () => {
		try {
			const { ethereum } = window;
			if (ethereum) {
				// You know all this
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
					
				// Get all the domain names from our contract
				const names = await contract.getAllNames();
				
					
				// For each name, get the record and the address
				const mintRecords = await Promise.all(names.map(async (name) => {
					console.log(`Name is ${name}`);
				const mintRecord = await contract.getRecord(name);
				const owner = await contract.domains(name);
				return {
					id: names.indexOf(name),
					name: name,
					record: mintRecord,
					owner: owner,
				};
			}));
	
			console.log("MINTS FETCHED ", mintRecords);
			setMints(mintRecords);
			}
		} catch(error){
			console.log(error);
		}
	}


	const updateDomain = async () => {
		if (!record || !domain) { return }
		setLoading(true);
		console.log("Updating domain", domain, "with record", record);
			try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, contractAbi.abi, signer);
	
				let tx = await contract.setRecord(domain, record);
				await tx.wait();
				console.log("Record set https://mumbai.polygonscan.com/tx/"+tx.hash);
	
				fetchMints();
				setRecord('');
				setDomain('');
			}
			} catch(error) {
				console.log(error);
			}
		setLoading(false);
	}
	// This will take us into edit mode and show us the edit buttons!
const editRecord = (name) => {
	console.log("Editing record for", name);
	setEditing(true);
	setDomain(name);
}

	const renderNoWalletConnected = () => {
		return(
			<div className="connect-wallet-container">
			<img src="https://media.giphy.com/media/iAenpzAjyj4MEHgUHy/giphy.gif" alt="Wallet not connected gif" />
			<button className="cta-button connect-wallet-button" onClick={connectWallet}>
				Connect Wallet
			</button>
		</div>
		)
	
	}	


const renderInputForm = () =>{
	if (network !== 'Polygon Mumbai Testnet') {
		return (
			<div className="connect-wallet-container">
				<h2>Please switch to Polygon Mumbai Testnet</h2>
				{/* This button will call our switch network function */}
				<button className='cta-button mint-button' onClick={switchNetwork}>Click here to switch</button>
			</div>
		);
	}
		return (
			<div className="form-container">
				<div className="first-row">
					<input
						type="text"
						value={domain}
						placeholder='domain'
						onChange={e => setDomain(e.target.value)}
					/>
					<p className='tld'> {tld} </p>
				</div>

				<input
					type="text"
					value={record}
					placeholder='whats ur ninja power?'
					onChange={e => setRecord(e.target.value)}
				/>
					{/* If the editing variable is true, return the "Set record" and "Cancel" button */}
					{editing ? (
						<div className="button-container">
						
							<button className='cta-button mint-button' disabled={loading} onClick={updateDomain}>
								Set record
							</button>  
							
							<button className='cta-button mint-button' onClick={() => {setEditing(false)}}>
								Cancel
							</button>  
						</div>
					) : (
						// If editing is not true, the mint button will be returned instead
						<button className='cta-button mint-button' disabled={loading} onClick={mintDomain}>
							Mint
						</button>  
					)}
			</div>
		);
}

const renderMints = () => {
	
	if (currentAccount && mints.length > 0) {
		return (
			<div className="mint-container">
				<p className="subtitle"> Recently minted domains!</p>
				<div className="mint-list">
					{ mints.map((mint, index) => {
						return (
							<div className="mint-item" key={index}>
								<div className='mint-row'>
									<a className="link" href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}`} target="_blank" rel="noopener noreferrer">
										<p className="underlined">{' '}{mint.name}{tld}{' '}</p>
									</a>
									{/* If mint.owner is currentAccount, add an "edit" button*/}
									{ mint.owner.toLowerCase() === currentAccount.toLowerCase() ?
										<button className="edit-button" onClick={() => editRecord(mint.name)}>
											<img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
										</button>
										:
										null
									}
								</div>
					<p> {mint.record} </p>
				</div>)
				})}
			</div>
		</div>);
	}
};

return (
		<div className="App">
			<div className="container">

				<div className="header-container">
					<header>
            <div className="left">
              <p className="title">🐱‍👤 META Name Service</p>
              <p className="subtitle">Your immortal Domain on the Blockchain!</p>
            </div>
						<div className="right">
			<img alt="Network logo" className="logo" src={ network.includes("Polygon") ? polygonLogo : ethLogo} />
			{ currentAccount ? <p> Wallet: {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)} </p> : <p> Not connected </p> }
		</div>
					</header>
				</div>
				{/* If not connected to the wallet render wallet connet button  */}
				{!currentAccount &&  renderNoWalletConnected()}
				{/* Render domain name input if wallet has been connected */}
				{currentAccount && renderInputForm()}
				 {/* Render previously minted domains */}
				{mints && renderMints()}
        <div className="footer-container">
					<img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
					<a
						className="footer-text"
						href={TWITTER_LINK}
						target="_blank"
						rel="noreferrer"
					>{`built BY @${TWITTER_HANDLE}`}</a>
				</div>
			</div>
		</div>
	);
}

export default App;

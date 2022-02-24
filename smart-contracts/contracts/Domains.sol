// SPDX-License-Identifier: MIT

pragma solidity ^0.8.10;

// We first import some OpenZeppelin Contracts.
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import { StringUtils } from "./libraries/StringUtils.sol";
import {Base64} from "./libraries/Base64.sol";
import "hardhat/console.sol";

contract Domains is ERC721URIStorage{
//By OpenZeppelin used to token ids.
 using Counters for Counters.Counter;
Counters.Counter private _tokenIds;
// Owner of the contract
address payable public owner;
//TDL Ex: com/in/co
string public tld;

// We'll be storing our NFT images on chain as SVGs.
string svgPartOne = '<svg xmlns="http://www.w3.org/2000/svg" width="270" height="270" fill="none"><path fill="url(#B)" d="M0 0h270v270H0z"/><defs><filter id="A" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="270" width="270"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity=".225" width="200%" height="200%"/></filter></defs><path d="M72.863 42.949c-.668-.387-1.426-.59-2.197-.59s-1.529.204-2.197.59l-10.081 6.032-6.85 3.934-10.081 6.032c-.668.387-1.426.59-2.197.59s-1.529-.204-2.197-.59l-8.013-4.721a4.52 4.52 0 0 1-1.589-1.616c-.384-.665-.594-1.418-.608-2.187v-9.31c-.013-.775.185-1.538.572-2.208a4.25 4.25 0 0 1 1.625-1.595l7.884-4.59c.668-.387 1.426-.59 2.197-.59s1.529.204 2.197.59l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616c.384.665.594 1.418.608 2.187v6.032l6.85-4.065v-6.032c.013-.775-.185-1.538-.572-2.208a4.25 4.25 0 0 0-1.625-1.595L41.456 24.59c-.668-.387-1.426-.59-2.197-.59s-1.529.204-2.197.59l-14.864 8.655a4.25 4.25 0 0 0-1.625 1.595c-.387.67-.585 1.434-.572 2.208v17.441c-.013.775.185 1.538.572 2.208a4.25 4.25 0 0 0 1.625 1.595l14.864 8.655c.668.387 1.426.59 2.197.59s1.529-.204 2.197-.59l10.081-5.901 6.85-4.065 10.081-5.901c.668-.387 1.426-.59 2.197-.59s1.529.204 2.197.59l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616c.384.665.594 1.418.608 2.187v9.311c.013.775-.185 1.538-.572 2.208a4.25 4.25 0 0 1-1.625 1.595l-7.884 4.721c-.668.387-1.426.59-2.197.59s-1.529-.204-2.197-.59l-7.884-4.59a4.52 4.52 0 0 1-1.589-1.616c-.385-.665-.594-1.418-.608-2.187v-6.032l-6.85 4.065v6.032c-.013.775.185 1.538.572 2.208a4.25 4.25 0 0 0 1.625 1.595l14.864 8.655c.668.387 1.426.59 2.197.59s1.529-.204 2.197-.59l14.864-8.655c.657-.394 1.204-.95 1.589-1.616s.594-1.418.609-2.187V55.538c.013-.775-.185-1.538-.572-2.208a4.25 4.25 0 0 0-1.625-1.595l-14.993-8.786z" fill="#fff"/><defs><linearGradient id="B" x1="0" y1="0" x2="270" y2="270" gradientUnits="userSpaceOnUse"><stop stop-color="#cb5eee"/><stop offset="1" stop-color="#0cd7e4" stop-opacity=".99"/></linearGradient></defs><text x="32.5" y="231" font-size="28" fill="#fff" filter="url(#A)" font-family="Plus Jakarta Sans,DejaVu Sans,Noto Color Emoji,Apple Color Emoji,sans-serif" font-weight="bold">';
string svgPartTwo = '</text></svg>';
// Mapping to store name of the domain to the address of the user
mapping(string => address) public domains;
mapping(string => string) public records;
mapping (uint=>string) names;

error Unautherized();
error AlreadyRegistered();
error InvalidName(string name);

constructor(string memory _tld)  ERC721("Hello Name Service", "HELLO") payable{
  owner = payable(msg.sender);
  tld = _tld;

  console.log("%s name service deployed", _tld);
}

modifier onlyOwner(){
  require(isOwner(), "Only Owner");
  _;
}

function isOwner() public view returns(bool){
  return msg.sender == owner;
}

// Return true if the domain name is more then 3 letters and lessthen 10 letters
// to make sure the domain is not too long and too shot.
function valid(string calldata _name) public pure returns(bool){
  return StringUtils.strlen(_name) >=3 && StringUtils.strlen(_name) <= 10;
}

function getAllNames() public view returns (string [] memory){
  console.log("Getting all names from contract");
  string[] memory allNames = new string[](_tokenIds.current());
  for(uint i = 0; i < _tokenIds.current(); i++){
    allNames[i] = names[i];
    console.log("Name for token %d is %s", i, allNames[i]);
  }
  return allNames;
}
function withdraw() public onlyOwner(){
  uint amount = address(this).balance;
  (bool success,) = msg.sender.call{value: amount}("");
  require(success, "Failed to withdraw Matic");
}

 //This function will give the price of the domain depends upon the.
 //length of the domain
  function getPrice(string calldata _name) public pure returns(uint){
    uint len = StringUtils.strlen(_name);
    require(len > 0,"Lenght of the name should be >1");
    if(len == 2){
      return 8 * 10 ** 17; // 0.8 Matic. NOTE: change it to 10 ** 18  while deploying.
    }else if(len == 3){
      return 5 * 10 ** 17; // 0.5 Matic. NOTE: change it to 10 ** 18 for 5 Matic while deploying.
    }else if(len == 4){
      return 3 * 10 ** 17; // 0.3 Matic. NOTE: change it to 10 ** 18  while deploying.
    }else{
      return 1 * 10 ** 17;   // NOTE: change it to 10 ** 18  while deploying.
    }
  }
 // For adding domain to the mapping
  function register(string calldata _name) public payable{
    // Revert if name already taken
    if(domains[_name] != address(0)) revert AlreadyRegistered();
    // Revert if the length of the domain is < 3 or >10
    if(!valid(_name)) revert InvalidName(_name);

   
    uint price = getPrice(_name);
    require(msg.value >= price, 'Not enough matic paid');
    
    // We combine the string with the tld and with dot(.com).
    string memory domainName = string(abi.encodePacked(_name,'.', tld));
    string memory finalSVG = string(abi.encodePacked(svgPartOne, domainName, svgPartTwo));
    uint256 newRecordId = _tokenIds.current();
    uint256 length = StringUtils.strlen(_name);
    string memory strLen = Strings.toString(length);

    console.log("Registering %s  on the contract with tokenId %d", _name,  newRecordId);

    // Creates the JSON meta data of our nft.
    // We do this by combining strings and encoding as base64.
    string memory json = Base64.encode(
      bytes(
        string(
          abi.encodePacked(
            '{"name": "',
            domainName,
            '", "description": "A domain on the Ninja name service", "image": "data:image/svg+xml;base64,',
            Base64.encode(bytes(finalSVG)),
            '","length":"',
            strLen,
            '"}'
          )
        )
      )
    );

    string memory finalTokenUri = string(abi.encodePacked("data:application/json;base64,",json));
    console.log("\n--------------------------------------------------------");
	  console.log("Final tokenURI", finalTokenUri);
	  console.log("--------------------------------------------------------\n");
    _safeMint(msg.sender, newRecordId);
    _setTokenURI(newRecordId, finalTokenUri);

    domains[_name] = msg.sender;
    console.log("%s has registered a domain", msg.sender);
    names[newRecordId];
    _tokenIds.increment();
  }

  // For showing the owner of the given domain
  function getOwner(string calldata _name) public view returns(address){
    return domains[_name];
  }

  // For storing the record
  function setRecord(string calldata _name, string calldata _record) public  {
    if(domains[_name] != msg.sender) revert Unautherized();
    records[_name] = _record;
  }

  // For getting the records for the domain

  function getRecord(string calldata _name) public view returns(string memory){
    return records[_name];
  }
}
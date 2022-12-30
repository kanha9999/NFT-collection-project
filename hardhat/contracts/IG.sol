// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract IG is ERC721Enumerable, ERC2981, Ownable {
    using Strings for uint256;
    
    // string _baseTokenURI;
    string baseURI;

    address public artist;
    uint96 public royalityFee;

    event Sale(address from, address to, uint256 value);

    //  _price is the price of one Crypto Dev NFT
    uint256 public _price = 0.02 ether;
    uint256 public _presaleprice= 0.01 ether;

    // _paused is used to pause the contract in case of an emergency
    bool public _paused;

    // max number of CryptoDevs
    uint256 public maxTokenIds = 10;

    // total number of tokenIds minted
    uint256 public tokenIds;

    // Whitelist contract instance
    IWhitelist whitelist;

    // boolean to keep track of whether presale started or not
    bool public presaleStarted;

    // timestamp for when presale would end
    uint256 public presaleEnded;

    modifier onlyWhenNotPaused {
        require(!_paused, "Contract currently paused");
        _;
    }
    // constructor (string memory baseURI, address whitelistContract) ERC721("Crypto Devs", "CD") {
    //     _baseTokenURI = baseURI;
    //     whitelist = IWhitelist(whitelistContract);
    // }

     constructor(
        string memory _initBaseURI,
        uint96 _royalityFee,
        address _artist,
        address whitelistContract

    ) ERC721("IG", "IGCollection") {
        setBaseURI(_initBaseURI);
        royalityFee = _royalityFee;
        artist = _artist;
        _setDefaultRoyalty(_artist, _royalityFee);
        whitelist = IWhitelist(whitelistContract);
    }

    function startPresale() public onlyOwner {
        presaleStarted = true;
        presaleEnded = block.timestamp + 5 minutes;
    }

    function presaleMint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp < presaleEnded, "Presale is not running");
        require(whitelist.whitelistedAddresses(msg.sender), "You are not whitelisted");
        require(tokenIds < maxTokenIds, "Exceeded maximum Crypto Devs supply");
        require(msg.value >= _presaleprice, "Ether sent is not correct");
        tokenIds += 1;

        if (msg.sender != owner()) {
            require(msg.value >= _presaleprice);

            // Pay royality to artist, and remaining to deployer of contract

            uint256 royality = (msg.value * royalityFee) / 100;
            _payRoyality(royality);

            (bool success2, ) = payable(owner()).call{
                value: (msg.
                value - royality)
            }("");
            require(success2);
        }

        _safeMint(msg.sender, tokenIds);
        _setTokenRoyalty(tokenIds, msg.sender, royalityFee);
    }

    /**
    * @dev mint allows a user to mint 1 NFT per transaction after the presale has ended.
    */
    function mint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp >=  presaleEnded, "Presale has not ended yet");
        require(tokenIds < maxTokenIds, "Exceed maximum Crypto Devs supply");
        require(msg.value >= _price, "Ether sent is not correct");
        tokenIds += 1;


        if (msg.sender != owner()) {
            require(msg.value >= _price);

            // Pay royality to artist, and remaining to deployer of contract

            uint256 royality = (msg.value * royalityFee) / 100;
            _payRoyality(royality);

            (bool success2, ) = payable(owner()).call{
                value: (msg.value - royality)
            }("");
            require(success2);
        }
        _safeMint(msg.sender, tokenIds);
        _setTokenRoyalty(tokenIds, msg.sender, royalityFee);
    }

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721, IERC721) {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "ERC721: transfer caller is not owner nor approved"
        );

        super._transfer(from, to, tokenId);
    }
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721, IERC721) {

        super.safeTransferFrom(from, to, tokenId, "");
    }
    // function _baseURI() internal view virtual override returns (string memory) {
    //     return _baseTokenURI;
    // }

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public override(ERC721, IERC721) {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "ERC721: transfer caller is not owner nor approved"
        );

        _safeTransfer(from, to, tokenId, _data);
    }

    function contractURI() public pure returns (string memory) {
        return "ipfs://QmUZrvqRNqHdDEM7eLPhK1DS9q42zSR63gqnjpzC5ASHuz/";
    }

    // Internal functions
    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    // Owner functions
    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    function setRoyalityFee(uint96 _royalityFee) public onlyOwner {
        royalityFee = _royalityFee;
    }
    
    function _payRoyality(uint256 _royalityFee) internal {
        (bool success1, ) = payable(artist).call{value: _royalityFee}("");
        require(success1);
    }

    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }


    function withdraw() public onlyOwner  {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) =  _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    function supportsInterface(bytes4 interfaceId)
        public view virtual override(ERC721Enumerable, ERC2981)
        returns (bool) {
        return super.supportsInterface(interfaceId);
    }

      // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}
}

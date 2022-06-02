const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const ERC1155 = artifacts.require("ERC1155MadNft.sol");
const ERC1271 = artifacts.require("TestERC1271.sol");
const UpgradeableBeacon = artifacts.require("UpgradeableBeacon.sol");
const ERC1155MadNftFactory = artifacts.require("ERC1155MadNftFactory.sol");
const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
const ERC1155LazyMintTransferProxy = artifacts.require("ERC1155LazyMintTransferProxyTest.sol");
const truffleAssert = require('truffle-assertions');
const { expectThrow } = require("@daonomic/tests-common");
const { sign } = require("./mint");

contract("ERC1155MadNft", accounts => {

  let token;
  let tokenOwner = accounts[9];
  let erc1271;
  let beacon;
  let proxy;
  let proxyLazy;
  let whiteListProxy = accounts[5];
  
  const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const name = 'FreeMintable';
  const ZERO = "0x0000000000000000000000000000000000000000";

  before(async () => {
    proxyLazy = await ERC1155LazyMintTransferProxy.new();
    erc1271 = await ERC1271.new();
  })

  beforeEach(async () => {
    token = await deployProxy(ERC1155, [name, "MAD", "https://ipfs.madnfts.com", "https://ipfs.madnfts.com", whiteListProxy, proxyLazy.address], { initializer: "__ERC1155MadNft_init" });
    await token.transferOwnership(tokenOwner);
  });

  describe("burnBatch  ()", () => {
    it("BurnBatch before, ok", async () => {
      let minter = accounts[1];
      let anotherUser = accounts[6];
      let transferTo = accounts[2];

      const tokenId4 = minter + "b00000000000000000000004"; //save token creator
      const tokenId5 = transferTo + "b00000000000000000000005"; //save token creator
      const tokenURI = "/uri";
      let supply = 5;
      let mintValue = 5;
      await expectThrow(  //throw transferTo not owner for tokenId4
        token.burnBatch(transferTo, [tokenId4, tokenId5], [2, 2], {from: transferTo})
      );
      await token.burnBatch(transferTo, [tokenId5], [2], {from: transferTo});
      await token.burnBatch(minter, [tokenId4], [2], {from: minter});
      await expectThrow( //can`t mint 5, 2 already burned
        token.mintAndTransfer([tokenId4, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, 5, {from: minter})
      );
      await token.mintAndTransfer([tokenId5, tokenURI, supply, creators([transferTo]), [], [zeroWord]], transferTo, 3, {from: transferTo});
      assert.equal(await token.balanceOf(transferTo, tokenId5), 3);
    });

    it("BurnBatch two tokens, ok", async () => {
      let minter = accounts[1];
      let anotherUser = accounts[6];
      let transferTo = accounts[2];

      const tokenId4 = minter + "b00000000000000000000004"; //save token creator
      const tokenId5 = transferTo + "b00000000000000000000005"; //save token creator
      const tokenURI = "/uri";
      let supply = 5;
      let mintValue = 5;
      //mint, after do burnBatch
      await token.mintAndTransfer([tokenId4, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mintValue, {from: minter})
      assert.equal(await token.balanceOf(transferTo, tokenId4), mintValue);
      //combine minted and not yet minted, try to burnBatch
      await token.burnBatch(transferTo, [tokenId4, tokenId5], [mintValue, mintValue], {from: transferTo});
      assert.equal(await token.balanceOf(transferTo, tokenId4), 0);//burn all minted tokenId4, burn all lazy tokenId5
      await expectThrow(  //no lazy tokenId5, throw
        token.mintAndTransfer([tokenId5, tokenURI, supply, creators([minter]), [], [zeroWord]], anotherUser, 1, {from: transferTo})
      );
    });

    it("BurnBatch two tokens, emit events ok", async () => {
      let minter = accounts[1];
      let anotherUser = accounts[6];
      let transferTo = accounts[2];

      const tokenId4 = minter + "b00000000000000000000004"; //save token creator
      const tokenId5 = minter + "b00000000000000000000005"; //save token creator
      const tokenURI = "/uri";
      let supply = 5;
      let mintValue = 2;
      //mint, after do burnBatch
      await token.mintAndTransfer([tokenId4, tokenURI, supply, creators([minter]), [], [zeroWord]], minter, mintValue, {from: minter})
//      assert.equal(await token.balanceOf(transferTo, tokenId4), mintValue);
      let burnResult = await token.burnBatch(minter, [tokenId4, tokenId5], [5, 5], {from: minter});

      let operator;
      let from;
      let to;
      let id;
      let value;
//      event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values);
      truffleAssert.eventEmitted(burnResult, 'TransferBatch', (ev) => {
       	operator = ev.operator;
       	from = ev.from;
       	to = ev.to;
       	id = ev.ids;
       	value = ev.values;
        return true;
      });
      assert.equal(operator, minter);
      assert.equal(from, minter);
      assert.equal(to, 0);
      assert.equal(Number(id[0]), Number(tokenId4));
      assert.equal(Number(id[1]), Number(tokenId5));
      assert.equal(value[0], 2);//burn = 5 (3 Lazy, 2 minted)
      assert.equal(value[1], 0);//burn = 5 (5 Lazy, 0 minted)

//      event BurnLazyBatch(address indexed operator, address indexed account, uint256[] ids, uint256[] amounts);
      truffleAssert.eventEmitted(burnResult, 'BurnLazyBatch', (ev) => {
       	operator = ev.operator;
       	from = ev.account;
       	id = ev.ids;
       	value = ev.amounts;
        return true;
      });
      assert.equal(operator, minter);
      assert.equal(from, minter);
      assert.equal(to, 0);
      assert.equal(Number(id[0]), Number(tokenId4));
      assert.equal(Number(id[1]), Number(tokenId5));
      assert.equal(value[0], 3);//burn = 5 (3 Lazy, 2 minted)
      assert.equal(value[1], 5);//burn = 5 (5 Lazy, 0 minted)
    });

    it("BurnBatch two tokens, check emit event, ok", async () => {
      let minter = accounts[1];
      let anotherUser = accounts[6];
      let transferTo = accounts[2];

      const tokenId4 = minter + "b00000000000000000000004"; //save token creator
      const tokenId5 = transferTo + "b00000000000000000000005"; //save token creator
      const tokenURI = "/uri";
      let supply = 5;
      let mintValue = 5;
      //mint, after do burnBatch
      await token.mintAndTransfer([tokenId4, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mintValue, {from: minter})
      assert.equal(await token.balanceOf(transferTo, tokenId4), mintValue);
      //combine minted and not yet minted, try to burnBatch
      let burnBatchResult = await token.burnBatch(transferTo, [tokenId4, tokenId5], [mintValue, mintValue], {from: transferTo})
      assert.equal(await token.balanceOf(transferTo, tokenId4), 0);//burn all minted tokenId4, burn all lazy tokenId5

      let operator;
      let from;
      let to;
      let ids;
      let values;
      truffleAssert.eventEmitted(burnBatchResult, 'TransferBatch', (ev) => {
       	operator = ev.operator;
       	from = ev.from;
       	to = ev.to;
       	ids = ev.ids;
       	values = ev.values;
        return true;
      });
      assert.equal(operator, transferTo);
      assert.equal(from, transferTo);
      assert.equal(to, 0);
      assert.equal(Number(ids[0]), Number(tokenId4));
      assert.equal(values[0], mintValue);
    });

    it("BurnBatch three tokens, ok", async () => {
      let minter = accounts[1];
      let anotherUser = accounts[6];
      let transferTo = accounts[2];

      const tokenId1 = minter + "b00000000000000000000001"; //save token creator
      const tokenId2 = minter + "b00000000000000000000002"; //save token creator
      const tokenId3 = minter + "b00000000000000000000003"; //save token creator
      const tokenURI = "/uri";
      let supply = 5;
      let burn = 2;
      let mintValue = 5;
      //BurnBatch and after do mint
      await expectThrow(
        token.burnBatch(anotherUser, [tokenId1, tokenId2, tokenId3], [burn, burn, burn], {from: anotherUser})  //token has another creator
      );
      await expectThrow(
        token.burnBatch(minter, [tokenId1, tokenId2, tokenId3], [burn, burn, burn], {from: anotherUser})  //burn not from minter
      );
      await expectThrow(
        token.burnBatch(minter, [tokenId1, tokenId2, tokenId3], [burn, burn, burn], {from: transferTo})  //burn not from minter
      );

      await token.burnBatch(minter, [tokenId1, tokenId2, tokenId3], [burn, burn, burn], {from: minter})  //ok

      await expectThrow(  //supply - burn < mintValue == 5, throw
        token.mintAndTransfer([tokenId1, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mintValue, {from: minter})
      );
      await token.mintAndTransfer([tokenId2, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, 3, {from: minter})
      assert.equal(await token.balanceOf(transferTo, tokenId2), 3);
      await token.mintAndTransfer([tokenId3, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, 2, {from: minter})
      assert.equal(await token.balanceOf(transferTo, tokenId3), 2);
    });

    it("BurnBatch from different _msgFrom, ok", async () => {
      let minter = accounts[1];
      let anotherUser = accounts[6];
      let transferTo = accounts[2];

      const tokenId4 = minter + "b00000000000000000000004"; //save token creator
      const tokenId6 = anotherUser + "b00000000000000000000004"; //save token creator
      const tokenURI = "/uri";
      let supply = 10;
      let burn = 7;
      let mintValue = 5;
      //mint, after do burnBatch
      await token.mintAndTransfer([tokenId4, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mintValue, {from: minter})
      assert.equal(await token.balanceOf(transferTo, tokenId4), mintValue);
      await expectThrow(  //tokenId4 send to transferTo, try to burn from anotherUser, throw
        token.burnBatch(anotherUser, [tokenId4], [mintValue], {from: anotherUser})
      );
      await expectThrow(  //tokenId4 send to transferTo, try to burn from anotherUser, throw
        token.burnBatch(transferTo, [tokenId4], [mintValue], {from: anotherUser})
      );
      assert.equal(await token.balanceOf(transferTo, tokenId4), 5);
      await token.burnBatch(transferTo, [tokenId4], [2], {from: whiteListProxy});//whiteListProxy burn only minted
      assert.equal(await token.balanceOf(transferTo, tokenId4), 3);
      await token.burnBatch(transferTo, [tokenId4], [1], {from: transferTo});//transferTo burn only minted
      assert.equal(await token.balanceOf(transferTo, tokenId4), 2);

      await expectThrow( //minter burn more than lazy
        token.burnBatch(minter, [tokenId4], [burn], {from: minter})
      )

      await token.burnBatch(minter, [tokenId4], [3], {from: minter});//minter burn only lazy
      assert.equal(await token.balanceOf(transferTo, tokenId4), 2);
      await expectThrow( // caller is not owner nor approved, throw
        token.burnBatch(transferTo, [tokenId6], [1], {from: minter})
      );
      assert.equal(await token.balanceOf(transferTo, tokenId4), 2);
    });

    it("Run mintAndTransfer = 5, burnBatch = 7, by minter, ok", async () => {
      let minter = accounts[1];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 10;
      let mint = 5;
      let burn = 7;
      let secondMintValue = 3;
      const tokenId4 = minter + "b00000000000000000000004"; //save token creator
      //mint 5 to minter
      await token.mintAndTransfer([tokenId4, tokenURI, supply, creators([minter]), [], [zeroWord]], minter, mint, {from: minter});
      assert.equal(await token.balanceOf(minter, tokenId4), mint);

      await expectThrow( //burn to much
        token.burnBatch(minter, [tokenId4], [500], {from: minter})
      );
      assert.equal(await token.balanceOf(minter, tokenId4), mint);
      //burn = 7 (5 Lazy, 2 minted)
      await token.burnBatch(minter, [tokenId4], [burn], {from: minter});
      assert.equal(await token.balanceOf(minter, tokenId4), 3);
      await expectThrow( // mint 1, not possible, all Lazy already burned, throw
        token.mintAndTransfer([tokenId4, tokenURI, supply, creators([minter]), [], [zeroWord]], minter, 1, {from: minter})
      );
      await token.burnBatch(minter, [tokenId4], [2], {from: minter}); //burn 2 minted
      assert.equal(await token.balanceOf(minter, tokenId4), 1);
    });
  })

  describe("burn before mint ()", () => {
    it("Test1. Supply = 5, burn = 2 not from minter, throw, mintAndTransfer by the minter = 5, ok", async () => {
      let minter = accounts[1];
      let anotherUser = accounts[5];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001"; //save token creator
      const tokenURI = "/uri";
      let supply = 5;
      let burn = 2;
      let mintValue = 5;

      await expectThrow(
        token.burn(anotherUser, tokenId, burn, {from: anotherUser})  //token has another creator
      );
      await expectThrow(
        token.burn(minter, tokenId, burn, {from: anotherUser})  //burn not from minter
      );
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mintValue, {from: minter});
      assert.equal(await token.balanceOf(transferTo, tokenId), mintValue);
    });

    it("Test2. Supply = 5, burn = 2, mintAndTransfer by the same minter = 3, ok", async () => {
      let minter = accounts[1];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let burn = 2;
      let mintValue = supply - burn;

      await token.burn(minter, tokenId, burn, {from: minter});
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mintValue, {from: minter});
      assert.equal(await token.balanceOf(transferTo, tokenId), mintValue);
    });

    it("Test3.1. Supply = 5, burn = 5, mintAndTransfer by the same minter = 1, burn==supply, throw", async () => {
      let minter = accounts[1];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let burn = 5;
      let mintValue = 1;

      await token.burn(minter, tokenId, burn, {from: minter});
      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mintValue, {from: minter})
      )
      assert.equal(await token.balanceOf(transferTo, tokenId), 0);
    });

    it("Test3.2. Supply = 5, burn = 10, mintAndTransfer by the same minter = 1, burn>supply, throw", async () => {
      let minter = accounts[1];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let burn = 10;
      let mintValue = 1;

      await token.burn(minter, tokenId, burn, {from: minter});
      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mintValue, {from: minter})
      )
      assert.equal(await token.balanceOf(transferTo, tokenId), 0);
    });
    it("Test4. Supply = 5, burn = 1, repeat 3 times, mintAndTransfer by the same minter = 3, more, throw", async () => {
      let minter = accounts[1];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let burn = 1;
      let mintValue = 3;

      await token.burn(minter, tokenId, burn, {from: minter});
      await token.burn(minter, tokenId, burn, {from: minter});
      await token.burn(minter, tokenId, burn, {from: minter});
      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mintValue, {from: minter})
      );
      assert.equal(await token.balanceOf(transferTo, tokenId), 0);
    });
    it("Test5. Supply = 5, burn = 2, mintAndTransfer = 2, burn2, mintAndTransfer = 1, ok", async () => {
      let minter = accounts[1];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let burn = 2;
      let mintValue = 2;

      await token.burn(minter, tokenId, burn, {from: minter});
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mintValue, {from: minter}); // now owner is transferTo
      assert.equal(await token.balanceOf(transferTo, tokenId), mintValue);
      await token.burn(transferTo, tokenId, 1, {from: transferTo}); //owner burn 1
      await token.burn(transferTo, tokenId, 1, {from: transferTo}); //owner burn 1,number of allBurned = 4

      const signature = await getSignature(tokenId, tokenURI, supply, creators([minter]), [], minter);
      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [signature]], transferTo, 2, {from: whiteListProxy})//mint 2 impossible 4+2>supply==5
      );
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [signature]], transferTo, 1, {from: whiteListProxy});//mint 1 possible 4+1<=supply==5
    });
    it("Run burn = 10, mintAndTransfer 1 supply = 10, throw burn+minted > supply,", async () => {
      let minter = accounts[1];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 10;
      let mint = 1;
      let burn = 10;
      await token.burn(minter, tokenId, burn, {from: minter});
      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], minter, mint, {from: minter})
      );
    });
  });

  describe("burn after mint ()", () => {
    it("Run mintAndTransfer = 5, burn = 2, mintAndTransfer by the same minter = 3, ok", async () => {
      let minter = accounts[1];
      let anotherUser = accounts[5];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let mint = 2;
      let secondMintValue = supply - mint;
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});
	  	assert.equal(await token.uri(tokenId), "https://ipfs.madnfts.com" + tokenURI);
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
      assert.equal(await token.balanceOf(minter, tokenId), 0);

      await token.burn(transferTo, tokenId, mint, {from: transferTo});
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, secondMintValue, {from: minter});
      assert.equal(await token.balanceOf(transferTo, tokenId), secondMintValue);
    });

    it("Run mintAndTransfer = 5, burn = 2, mintAndTransfer by the same minter = 4, throw", async () => {
      let minter = accounts[1];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let mint = 2;
      let secondMintValue = 4; //more than tail
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});
	  	assert.equal(await token.uri(tokenId), "https://ipfs.madnfts.com" + tokenURI);
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
      assert.equal(await token.balanceOf(minter, tokenId), 0);

      await token.burn(transferTo, tokenId, mint, {from: transferTo});
      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, secondMintValue, {from: minter})
      )
    });

    it("Run mintAndTransfer = 5, burn = 5, mintAndTransfer by the same minter = 1, throw", async () => {
      let minter = accounts[1];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let mint = 5;
      let secondMintValue = 1;
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});
	  	assert.equal(await token.uri(tokenId), "https://ipfs.madnfts.com" + tokenURI);
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
      assert.equal(await token.balanceOf(minter, tokenId), 0);

      await token.burn(transferTo, tokenId, mint, {from: transferTo});
      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, secondMintValue, {from: minter})
      );
    });

    it("Run mintAndTransfer = 5, burn = 4, mintAndTransfer by the same minter = 1, throw", async () => {
      let minter = accounts[1];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let mint = 5;
      let secondMintValue = 1;
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});
	  	assert.equal(await token.uri(tokenId), "https://ipfs.madnfts.com" + tokenURI);
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
      assert.equal(await token.balanceOf(minter, tokenId), 0);

      await token.burn(transferTo, tokenId, 4, {from: transferTo});
      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, secondMintValue, {from: minter})
      );
      assert.equal(await token.balanceOf(transferTo, tokenId), secondMintValue);
    });

    it("Run mintAndTransfer = 4, burn = 3, mintAndTransfer by the same minter = 1, ok", async () => {
      let minter = accounts[1];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let mint = 4;
      let secondMintValue = 1;
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});
	  	assert.equal(await token.uri(tokenId), "https://ipfs.madnfts.com" + tokenURI);
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
      assert.equal(await token.balanceOf(minter, tokenId), 0);

      await token.burn(transferTo, tokenId, 3, {from: transferTo});
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, secondMintValue, {from: minter})
      assert.equal(await token.balanceOf(transferTo, tokenId), 2);
    });

    it("Run mintAndTransfer = 4, burn = 3, mintAndTransfer by the same minter = 2, throw", async () => {
      let minter = accounts[1];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let mint = 4;
      let secondMintValue = 2;
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});
	  	assert.equal(await token.uri(tokenId), "https://ipfs.madnfts.com" + tokenURI);
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
      assert.equal(await token.balanceOf(minter, tokenId), 0);

      await token.burn(transferTo, tokenId, 3, {from: transferTo});
      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, secondMintValue, {from: minter})
      );
      assert.equal(await token.balanceOf(transferTo, tokenId), 1);
    });

    it("Run mintAndTransfer = 5, burn = 7, mint to new user, ok", async () => {
      let minter = accounts[1];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 10;
      let mint = 5;
      let burn = 7;
      let secondMintValue = 3;
      //mint 5 to anotherUser
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
      assert.equal(await token.balanceOf(minter, tokenId), 0);

      await expectThrow( //burn 7 from new owner more than mint, throw new, because can`t burn lazy
        token.burn(transferTo, tokenId, burn, {from: transferTo})
      );
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);

      await token.burn(transferTo, tokenId, mint, {from: transferTo});//burn 5 real not lazy from new owner, ok
      assert.equal(await token.balanceOf(transferTo, tokenId), 0);
      assert.equal(await token.balanceOf(minter, tokenId), 0);
      await expectThrow( //mint 7, more than possible
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, burn, {from: minter})
      )
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});
      assert.equal(await token.balanceOf(transferTo, tokenId), 5); //only 5 available to mint
    });

    it("Run mintAndTransfer = 5, burn = 7, by minter, ok", async () => {
      let minter = accounts[1];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 10;
      let mint = 5;
      let burn = 7;
      let secondMintValue = 3;
      //mint 5 to minter
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], minter, mint, {from: minter});
      assert.equal(await token.balanceOf(minter, tokenId), mint);

      await expectThrow( //burn to much
        token.burn(minter, tokenId, 500, {from: minter})
      );
      assert.equal(await token.balanceOf(minter, tokenId), mint);
      //burn = 7 (5 Lazy, 2 minted)
      await token.burn(minter, tokenId, burn, {from: minter});
      assert.equal(await token.balanceOf(minter, tokenId), 3);
      await expectThrow( // mint 1, not possible, all Lazy already burned, throw
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], minter, 1, {from: minter})
      );
      await token.burn(minter, tokenId, 2, {from: minter}); //burn 2 minted
      assert.equal(await token.balanceOf(minter, tokenId), 1);
    });

    it("Run mintAndTransfer = 5 minter, mintAndTransfer = 2 transferTo, burn = 7, by minter, ok", async () => {
      let minter = accounts[1];
      let transferTo = accounts[2];
      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 10;
      let mint = 5;
      let burn = 7;
      let secondMintValue = 3;
      //mint 5 to minter, 2 to another
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], minter, mint, {from: minter});
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, 2, {from: minter});
      assert.equal(await token.balanceOf(minter, tokenId), mint);
      assert.equal(await token.balanceOf(transferTo, tokenId), 2);

      //burn = 7 (3 Lazy, 4 minted),
      await token.burn(minter, tokenId, burn, {from: minter});
      assert.equal(await token.balanceOf(minter, tokenId), 1);
      assert.equal(await token.balanceOf(transferTo, tokenId), 2);
      await expectThrow( // burn more than minted
        token.burn(transferTo, tokenId, 3, {from: transferTo})
      );
      await token.burn(transferTo, tokenId, 2, {from: transferTo});
      assert.equal(await token.balanceOf(minter, tokenId), 1);
      assert.equal(await token.balanceOf(transferTo, tokenId), 0);
    });

    it("Run mintAndTransfer = 5 minter, mintAndTransfer = 2 check event emit, ok", async () => {
      let minter = accounts[1];
      let transferTo = accounts[2];
      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 10;
      let mint = 5;
      let burn = 7;
      let secondMintValue = 3;
      //mint 5 to minter, 2 to another
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], minter, mint, {from: minter});
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, 2, {from: minter});
      assert.equal(await token.balanceOf(minter, tokenId), mint);
      assert.equal(await token.balanceOf(transferTo, tokenId), 2);

      //burn = 7 (3 Lazy, 4 minted),
      const burnResult = await token.burn(minter, tokenId, burn, {from: minter});

      let operator;
      let from;
      let to;
      let id;
      let value;
//      event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
      truffleAssert.eventEmitted(burnResult, 'TransferSingle', (ev) => {
       	operator = ev.operator;
       	from = ev.from;
       	to = ev.to;
       	id = ev.id;
       	value = ev.value;
        return true;
      });
      assert.equal(operator, minter);
      assert.equal(from, minter);
      assert.equal(to, 0);
      assert.equal(Number(id), Number(tokenId));
      assert.equal(value, 4);//burn = 7 (3 Lazy, 4 minted)
//      event BurnLazy(address indexed operator, address indexed account, uint256 id, uint256 amount);
      truffleAssert.eventEmitted(burnResult, 'BurnLazy', (ev) => {
       	operator = ev.operator;
       	from = ev.account;
       	id = ev.id;
       	value = ev.amount;
        return true;
      });
      assert.equal(operator, minter);
      assert.equal(from, minter);
      assert.equal(to, 0);
      assert.equal(Number(id), Number(tokenId));
      assert.equal(value, 3);//burn = 7 (3 Lazy, 4 minted)
    });

    it("Run mintAndTransfer = 5, burn = 500, by minter not possible, throw", async () => {
      let minter = accounts[1];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 10;
      let mint = 5;
      let burn = 7;
      let secondMintValue = 3;
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], minter, mint, {from: minter});
	  	assert.equal(await token.uri(tokenId), "https://ipfs.madnfts.com" + tokenURI);
      assert.equal(await token.balanceOf(minter, tokenId), mint);

      await expectThrow( //burn to much
        token.burn(minter, tokenId, 500, {from: minter})
      );
      assert.equal(await token.balanceOf(minter, tokenId), mint);
      //from new owner amount burn == mint
      await token.burn(minter, tokenId, mint, {from: minter});
      assert.equal(await token.balanceOf(minter, tokenId), 5);
      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, 1, {from: minter})
      );
    });

  });

  describe("Mint and transfer  ()", () => {
    it("check for ERC165 interface", async () => {
      assert.equal(await token.supportsInterface("0x01ffc9a7"), true);
    });

    it("check for mintAndTransfer interface", async () => {
      assert.equal(await token.supportsInterface("0x6db15a0f"), true);
    });

    it("check for ERC1155 interfaces", async () => {
      assert.equal(await token.supportsInterface("0xd9b67a26"), true);
      assert.equal(await token.supportsInterface("0x0e89341c"), true);
    });

    it("approve for all", async () => {
      assert.equal(await token.isApprovedForAll(accounts[1], whiteListProxy), true);
      assert.equal(await token.isApprovedForAll(accounts[1], proxyLazy.address), true);
    });

    it("mint and transfer by minter", async () => {
      let minter = accounts[1];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "/uri";
      let supply = 5;
      let mint = 2;

      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});

      assert.equal(await token.uri(tokenId), "https://ipfs.madnfts.com" + tokenURI);
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
      assert.equal(await token.balanceOf(minter, tokenId), 0);
    });

    it("mint and transfer to self by minter", async () => {
      let minter = accounts[1];
      let transferTo = minter;

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "//uri";
      let supply = 5;
      let mint = 2;

      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, mint, {from: minter});

      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
      await checkCreators(tokenId, [minter]);
    });

    it("transferFromOrMint by minter", async () => {
      let minter = accounts[1];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "//uri";
      let supply = 5;
      let mint = 2;

      assert.equal(await token.balanceOf(minter, tokenId), 0);
      await token.transferFromOrMint([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], minter, transferTo, mint, {from: minter});
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
      assert.equal(await token.balanceOf(minter, tokenId), 0);
      await token.transferFromOrMint([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], minter, transferTo, mint, {from: minter});
      await expectThrow(
        token.transferFromOrMint([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], minter, transferTo, mint, {from: minter})
      )

      assert.equal(await token.balanceOf(transferTo, tokenId), mint * 2);
      await checkCreators(tokenId, [minter]);

      await expectThrow(
        token.transferFromOrMint([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, minter, 1, { from: minter })
      )

      await token.transferFromOrMint([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], transferTo, minter, 1, { from: transferTo })
      assert.equal(await token.balanceOf(minter, tokenId), 1);
    });

    it("mint and transfer with signature of not minter", async () => {
      let minter = accounts[1];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "//uri";
      let supply = 5;
      let mint = 2;

      const signature = await getSignature(tokenId, tokenURI, supply, creators([minter]), [], transferTo);

      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [signature]], transferTo, mint, {from: whiteListProxy})
      );
    });

    it("mint and transfer without approval", async () => {
      let minter = accounts[1];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "//uri";
      let supply = 5;
      let mint = 2;

      const signature = await getSignature(tokenId, tokenURI, supply, creators([minter]), [], minter);

      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [signature]], transferTo, mint, {from: accounts[3]})
      );
    });

    it("standard transfer from owner", async () => {
      let minter = accounts[1];
      const tokenId = minter + "b00000000000000000000001";
      let supply = 5;
      await token.mintAndTransfer([tokenId, "//uri", supply, creators([minter]), [],  [zeroWord]], minter, supply, {from: minter});

      assert.equal(await token.balanceOf(minter, tokenId), supply);

      let transferTo = accounts[2];
      await token.safeTransferFrom(minter, transferTo, tokenId, supply, [], {from: minter});

      assert.equal(await token.balanceOf(transferTo, tokenId), supply);
    });

    it("standard transfer by approved contract", async () => {
      let minter = accounts[1];
      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "//uri";
      let supply = 5;
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], minter, supply, {from: minter});

      assert.equal(await token.balanceOf(minter, tokenId), supply);

      let transferTo = accounts[2];
      await token.safeTransferFrom(minter, transferTo, tokenId, supply, [], {from: whiteListProxy});

      assert.equal(await token.balanceOf(transferTo, tokenId), supply);
    });

    it("standard transfer by not approved contract", async () => {
      let minter = accounts[1];
      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "//uri";
      let supply = 5;
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter]), [], [zeroWord]], minter, supply, {from: minter});

      assert.equal(await token.balanceOf(minter, tokenId), supply);

      let transferTo = accounts[2];
      await expectThrow(
        token.safeTransferFrom(minter, transferTo, tokenId, supply, [], {from: accounts[6]})
      );
    });

    it("signature by contract wallet erc1271, with whitelist proxy", async () => {
      const minter = erc1271;
      let transferTo = accounts[2];

      const tokenId = minter.address + "b00000000000000000000001";
      const tokenURI = "//uri";
      let supply = 5;
      let mint = 2;

      await expectThrow(
        token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter.address]), [], [zeroWord]], transferTo, supply, {from: whiteListProxy})
      );

      await erc1271.setReturnSuccessfulValidSignature(true);
      await token.mintAndTransfer([tokenId, tokenURI, supply, creators([minter.address]), [], [zeroWord]], transferTo, mint, {from: whiteListProxy});
      assert.equal(await token.balanceOf(transferTo, tokenId), mint);
    });
  });

  function getSignature(tokenId, tokenURI, supply, creators, fees, account) {
  	return sign(account, tokenId, tokenURI, supply, creators, fees, token.address);
  }

  async function checkCreators(tokenId, exp) {
    const creators = await token.getCreators(tokenId);
    assert.equal(creators.length, exp.length);
    const value = 10000 / exp.length;
    for(let i = 0; i < creators.length; i++) {
      assert.equal(creators[i][0], exp[i]);
      assert.equal(creators[i][1], value);
    }
  }

  function creators(list) {
  	const value = 10000 / list.length
  	return list.map(account => ({ account, value }))
  }

});
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const ERC721MadNft = artifacts.require("ERC721MadNft.sol");
const ERC1271 = artifacts.require("TestERC1271.sol");
const UpgradeableBeacon = artifacts.require("UpgradeableBeacon.sol");
const ERC721Factory = artifacts.require("ERC721MadNftFactory.sol");
const ERC721LazyMintTransferProxy = artifacts.require("ERC721LazyMintTransferProxyTest.sol");
const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
const truffleAssert = require('truffle-assertions');

const { sign } = require("./mint");
const { expectThrow } = require("@daonomic/tests-common");

contract("ERC721MadNft", accounts => {

  let token;
  let tokenOwner = accounts[9];
  let erc1271;
  let beacon;
  let proxy;
  let proxyLazy;
  let whiteListProxy = accounts[5];
  const name = 'FreeMintableMadNft';
  const chainId = 1;
  const zeroWord = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const ZERO = "0x0000000000000000000000000000000000000000";

  function creators(list) {
  	const value = 10000 / list.length
  	return list.map(account => ({ account, value }))
  }

  before(async () => {
    proxyLazy = await ERC721LazyMintTransferProxy.new();
    transferProxy = await TransferProxyTest.new();
    erc1271 = await ERC1271.new();
  })

  beforeEach(async () => {
    token = await deployProxy(ERC721MadNft, [name, "MAD", "https://ipfs.madnfts.com", "https://ipfs.madnfts.com", whiteListProxy, proxyLazy.address], { initializer: "__ERC721MadNft_init" });
    await token.transferOwnership(tokenOwner);
  });

  describe("Burn before ERC721MadNft ()", () => {
    it("Run burn from minter, mintAndTransfer by the same minter not possible, token burned, throw", async () => {
      const minter = accounts[1];
      let transferTo = accounts[4];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "//uri";
      //minter burn item, in tokenId minter address contains, ok
      await token.burn(tokenId, {from: minter});
      await expectThrow( //try to mint and transfer token, throw, because token was burned
        token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter})
      );
    });

    it("Run burn from another, throw, mintAndTransfer by the same minter is possible", async () => {
      const minter = accounts[1];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "//uri";
      await expectThrow( //another burn item, in tokenId minter address contains, throw
        token.burn(tokenId, {from: transferTo})
      );
      //mint and transfer token, ok, because token was not burned, possible to mint to a new user
      await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter});
      assert.equal(await token.ownerOf(tokenId), transferTo);
    });
  });

  describe("Burn after ERC721MadNft ()", () => {
    it("Run mintAndTransfer, burn, mintAndTransfer by the same minter, throw", async () => {
      const minter = accounts[1];
      let transferTo = accounts[2];
      let transferTo2 = accounts[4];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "//uri";

      await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter});
      await token.burn(tokenId, {from: transferTo});
      await expectThrow( //try once more mint and transfer
        token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo2, {from: minter})
      );
    });

    it("Run transferFromOrMint, burn, transferFromOrMint by the same minter, throw", async () => {
      const minter = accounts[1];
      let transferTo = accounts[2];

      const tokenId = minter + "b00000000000000000000001";
      const tokenURI = "//uri";

      await token.transferFromOrMint([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, transferTo, {from: minter});
      assert.equal(await token.ownerOf(tokenId), transferTo);
      await token.burn(tokenId, {from: transferTo});
      await expectThrow(
        token.transferFromOrMint([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, transferTo, {from: minter})
      )
    });

  });

  it("check for ERC165 interface", async () => {
  	assert.equal(await token.supportsInterface("0x01ffc9a7"), true);
  });

  it("check for mintAndTransfer interface", async () => {
  	assert.equal(await token.supportsInterface("0x8486f69f"), true);
  });

  it("check for Roaylties interface", async () => {
  	assert.equal(await token.supportsInterface("0xb7799584"), true);
  });

  it("check for ERC721 interfaces", async () => {
  	assert.equal(await token.supportsInterface("0x80ac58cd"), true);
  	assert.equal(await token.supportsInterface("0x5b5e139f"), true);
  	assert.equal(await token.supportsInterface("0x780e9d63"), true);
  });

  it("approve for all", async () => {
    assert.equal(await token.isApprovedForAll(accounts[1], whiteListProxy), true);
    assert.equal(await token.isApprovedForAll(accounts[1], proxyLazy.address), true);
  });

  it("set new BaseUri, check only owner, check emit event", async () => {
    let olBaseUri = await token.baseURI();
    const newBusaUriSet = "https://ipfs.madnfts-the-best-in-the-World.com"
    await expectThrow(
      token.setBaseURI(newBusaUriSet)//caller is not the owner
    );
    let tx = await token.setBaseURI(newBusaUriSet, { from: tokenOwner })//caller is owner
    let newBaseUri = await token.baseURI();
    assert.equal(newBaseUri, newBusaUriSet);
    assert.notEqual(newBaseUri, olBaseUri);

    let newBaseUriFromEvent;
    truffleAssert.eventEmitted(tx, 'BaseUriChanged', (ev) => {
     	newBaseUriFromEvent = ev.newBaseURI;
      return true;
    });
    assert.equal(newBaseUri, newBaseUriFromEvent);
  });

  it("mint and transfer by whitelist proxy. several creators. minter is not first", async () => {
    const minter = accounts[1];
    const creator2 = accounts[3];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let fees = [];

    const signature1 = await getSignature(tokenId, tokenURI, creators([creator2, minter]), fees, minter);
    const signature2 = await getSignature(tokenId, tokenURI, creators([creator2, minter]), fees, creator2);

    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, creators([creator2, minter]), fees, [signature2, signature1]], transferTo, {from: whiteListProxy})
    );
  });

  it("mint and transfer by whitelist proxy. several creators. wrong order of signatures", async () => {
    const minter = accounts[1];
    const creator2 = accounts[3];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    let fees = [];

    const signature1 = await getSignature(tokenId, tokenURI, creators([minter, creator2]), fees, minter);
    const signature2 = await getSignature(tokenId, tokenURI, creators([minter, creator2]), fees, creator2);

    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, creators([minter, creator2]), fees, [signature2, signature1]], transferTo, {from: whiteListProxy})
    );
  });

  it("mint and transfer by approved proxy for tokenId", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

    const signature = await getSignature(tokenId, tokenURI, creators([minter]), [], minter);

    let proxy = accounts[5];

    // owner query for nonexistent token.
    await expectThrow(
      token.approve(proxy, tokenId, {from: minter})
    );
    // await token.mintAndTransfer(tokenId, [], tokenURI, [minter], [signature], transferTo, {from: proxy});
    // assert.equal(await token.ownerOf(tokenId), transferTo);
  });

  it("mint and transfer by minter", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter});

    assert.equal(await token.ownerOf(tokenId), transferTo);
  });

  it("transferFromOrMint from minter. not yet minted", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

    await token.transferFromOrMint([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, transferTo, {from: minter});

    assert.equal(await token.ownerOf(tokenId), transferTo);
  });

  it("transferFromOrMint from minter. already minted", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

		await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, {from: minter});
    await token.transferFromOrMint([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, transferTo, {from: minter});
    await expectThrow(
    	token.transferFromOrMint([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, transferTo, {from: minter})
    )

    assert.equal(await token.ownerOf(tokenId), transferTo);
  });

  it("transferFromOrMint when not minter. not yet minted", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

		await expectThrow(
			token.transferFromOrMint([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, transferTo, {from: transferTo})
		);
    await token.transferFromOrMint([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, transferTo, {from: minter});
    await token.transferFromOrMint([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, accounts[5], {from: transferTo});

    assert.equal(await token.ownerOf(tokenId), accounts[5]);
  });

  it("mint and transfer to self by minter", async () => {
    const minter = accounts[1];
    let transferTo = minter;

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], transferTo, {from: minter});

    assert.equal(await token.ownerOf(tokenId), transferTo);
  });

  it("mint and transfer with signature of not minter", async () => {
    const minter = accounts[1];
    const transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

    const signature = await getSignature(tokenId, tokenURI, creators([minter]), [], transferTo);

    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [signature]], transferTo, {from: whiteListProxy})
    );
  });

  it("mint and transfer without approval", async () => {
    const minter = accounts[1];
    let transferTo = accounts[2];

    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";

    const signature = await getSignature(tokenId, tokenURI, creators([minter]), [], minter);

    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [signature]], transferTo, {from: accounts[3]})
    );
  });

  it("standard transfer from owner", async () => {
    let minter = accounts[1];
    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, {from: minter});

    assert.equal(await token.ownerOf(tokenId), minter);

    let transferTo = accounts[2];
    await token.transferFrom(minter, transferTo, tokenId, {from: minter});

    assert.equal(await token.ownerOf(tokenId), transferTo);
  });

  it("standard transfer by approved contract", async () => {
    let minter = accounts[1];
    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, {from: minter});

    assert.equal(await token.ownerOf(tokenId), minter);

    let transferTo = accounts[2];
    await token.transferFrom(minter, transferTo, tokenId, {from: whiteListProxy});

    assert.equal(await token.ownerOf(tokenId), transferTo);
  });

  it("standard transfer by not approved contract", async () => {
    let minter = accounts[1];
    const tokenId = minter + "b00000000000000000000001";
    const tokenURI = "//uri";
    await token.mintAndTransfer([tokenId, tokenURI, creators([minter]), [], [zeroWord]], minter, {from: minter});

    assert.equal(await token.ownerOf(tokenId), minter);

    let transferTo = accounts[2];
    await expectThrow(
      token.transferFrom(minter, transferTo, tokenId, {from: accounts[8]})
    );
  });

  it("signature by contract wallet erc1271, with whitelist proxy", async () => {
    const minter = erc1271;
    let transferTo = accounts[2];

    const tokenId = minter.address + "b00000000000000000000001";
    const tokenURI = "//uri";

    await expectThrow(
      token.mintAndTransfer([tokenId, tokenURI, creators([minter.address]), [], [zeroWord]], transferTo, {from: whiteListProxy})
    );

    await erc1271.setReturnSuccessfulValidSignature(true);
    await token.mintAndTransfer([tokenId, tokenURI, creators([minter.address]), [], [zeroWord]], transferTo, {from: whiteListProxy});
    assert.equal(await token.ownerOf(tokenId), transferTo);
  });

  function getSignature(tokenId, tokenURI, creators, fees, account) {
		return sign(account, tokenId, tokenURI, creators, fees, token.address);
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
});
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
const Exchange = artifacts.require("Exchange.sol");
const TestERC20 = artifacts.require("TestERC20.sol");
const TestERC721 = artifacts.require("TestERC721.sol");
const ERC1155_V1 = artifacts.require("TestERC1155WithRoyalties.sol");
const ERC721_V1 = artifacts.require("TestERC721WithRoyalties.sol");
const TransferProxyTest = artifacts.require("TransferProxyTest.sol");
const ERC20TransferProxyTest = artifacts.require("ERC20TransferProxyTest.sol");
const LibOrderTest = artifacts.require("LibOrderTest.sol");
const MadNftTransferManagerTest = artifacts.require("MadNftTransferManagerTest.sol");
const TestRoyaltiesRegistry = artifacts.require("TestRoyaltiesRegistry.sol");

const { Order, Asset, sign } = require("../order");
const EIP712 = require("../EIP712");
const ZERO = "0x0000000000000000000000000000000000000000";
const { expectThrow, verifyBalanceChange } = require("@daonomic/tests-common");
const { ETH, ERC20, ERC721, ORDER_DATA_V1, enc, id } = require("../assets");

contract("Exchange, sellerFee + buyerFee =  6%,", accounts => {
	let testing;
	let transferProxy;
	let erc20TransferProxy;
	let transferManagerTest;
	let t1;
	let t2;
	let libOrder;
	let protocol = accounts[9];
	let community = accounts[8];
	const eth = "0x0000000000000000000000000000000000000000";
  let erc721TokenId1 = 53;
  let royaltiesRegistry;

	beforeEach(async () => {
		libOrder = await LibOrderTest.new();
		transferProxy = await TransferProxyTest.new();
		erc20TransferProxy = await ERC20TransferProxyTest.new();
		royaltiesRegistry = await TestRoyaltiesRegistry.new();
		testing = await deployProxy(Exchange, [transferProxy.address, erc20TransferProxy.address, 300, community, royaltiesRegistry.address], { initializer: "__Exchange_init" });
		transferManagerTest = await MadNftTransferManagerTest.new();
		t1 = await TestERC20.new('TESTERC1', 'TST1');
		t2 = await TestERC20.new('TESTERC2', 'TST2');
    /*ETH*/
    await testing.setFeeReceiver(eth, protocol);
    await testing.setFeeReceiver(t1.address, protocol);
 		/*ERC721 */
 		erc721 = await TestERC721.new("MadNft", "MAD");
		/*ERC1155V2*/
		erc1155_v1 = await ERC1155_V1.new("https://ipfs.madnfts.com");
		erc1155_v1.initialize();
		/*ERC721_V1 */
 		erc721V1 = await ERC721_V1.new("MadNft", "MAD");
    await erc721V1.initialize();

	});
	describe("matchOrders", () => {
		it("eth orders work, expect throw, not enough eth ", async () => {
    	await t1.mint(accounts[1], 100);
    	await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

    	const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
    	const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
    	await expectThrow(
    		testing.matchOrders(left, "0x", right, await getSignature(right, accounts[1]), { from: accounts[2], value: 199 })
    	);
    })

		it("eth orders work, expect throw, unknown Data type of Order ", async () => {
    	await t1.mint(accounts[1], 100);
    	await t1.approve(erc20TransferProxy.address, 10000000, { from: accounts[1] });

    	const right = Order(accounts[1], Asset(ERC20, enc(t1.address), 100), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xfffffffe", "0x");
    	const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC20, enc(t1.address), 100), 1, 0, 0, "0xffffffff", "0x");
    	await expectThrow(
    		testing.matchOrders(left, "0x", right, await getSignature(right, accounts[1]), { from: accounts[2], value: 300 })
    	);
    })

	  it("ERC721 to ETH order maker ETH != who pay, ETH orders have no signature, throw", async () => {
		  await erc721.mint(accounts[1], erc721TokenId1);
		  await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

		  const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, "0xffffffff", "0x");
			const right = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, "0xffffffff", "0x");

    	let signatureLeft = await getSignature(left, accounts[1]);

      await expectThrow(
    			testing.matchOrders(left, signatureLeft, right, "0x", { from: accounts[7], value: 300, gasPrice: 0 })
    	);
    })
  });

	describe("Do matchOrders(), orders dataType == V1", () => {
		it("From ETH(DataV1) to ERC720(DataV1) Protocol, no Royalties, Origin fees comes from OrderETH NB!!! not enough ETH", async () => {
			await erc721.mint(accounts[1], erc721TokenId1);
    	await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});

			let addrOriginLeft = [[accounts[5], 500], [accounts[6], 600], [accounts[7], 700], [accounts[3], 3000]];
			let addrOriginRight = [];

			let encDataLeft = await encDataV1([ [[accounts[2], 10000]], addrOriginLeft ]);
			let encDataRight = await encDataV1([ [[accounts[1], 10000]], addrOriginRight ]);

			const left = Order(accounts[2], Asset(ETH, "0x", 200), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
    	const right = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ETH, "0x", 200), 1, 0, 0, ORDER_DATA_V1, encDataRight);
    	let signatureRight = await getSignature(right, accounts[1]);

    	await expectThrow(
      	testing.matchOrders(left, "0x", right, await getSignature(right, accounts[1]), { from: accounts[2], value: 300, gasPrice: 0 })
      );
    })
	});

	describe("Do matchOrders(), orders dataType == V1, MultipleBeneficiary", () => {

		it("From ERC721(DataV1) to ERC20(NO DataV1) Protocol, Origin fees, no Royalties, payouts: 110%, throw", async () => {
			const { left, right } = await prepare721DV1_20_110CentsOrders()

			await expectThrow(
				testing.matchOrders(left, await getSignature(left, accounts[1]), right, "0x", { from: accounts[2] })
			);

		})

		async function prepare721DV1_20_110CentsOrders(t2Amount = 105) {
			await erc721.mint(accounts[1], erc721TokenId1);
			await t2.mint(accounts[2], t2Amount);
			await erc721.setApprovalForAll(transferProxy.address, true, {from: accounts[1]});
			await t2.approve(erc20TransferProxy.address, 10000000, { from: accounts[2] });
			let addrOriginLeft = [[accounts[3], 100], [accounts[4], 200]];
			let encDataLeft = await encDataV1([ [[accounts[1], 5000], [accounts[5], 6000]], addrOriginLeft ]);
			const left = Order(accounts[1], Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), ZERO, Asset(ERC20, enc(t2.address), 100), 1, 0, 0, ORDER_DATA_V1, encDataLeft);
			const right = Order(accounts[2], Asset(ERC20, enc(t2.address), 100), ZERO, Asset(ERC721, enc(erc721.address, erc721TokenId1), 1), 1, 0, 0,  "0xffffffff", "0x");
			return { left, right }
		}
	})	//Do matchOrders(), orders dataType == V1, MultipleBeneficiary


	function encDataV1(tuple) {
 		return transferManagerTest.encode(tuple);
  }
  
	async function getSignature(order, signer) {
		return sign(order, signer, testing.address);
	}

});

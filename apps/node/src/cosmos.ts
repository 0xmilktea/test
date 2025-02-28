import { fromHex, toHex, type Address, type Hash, type Hex, type TransactionReceipt } from 'viem';
import {
  CosmosChainConfig,
  CWSpokeProvider,
  EvmAssetManagerService,
  EvmHubProvider,
  MoneyMarketConfig,
  MoneyMarketService,
  EvmWalletAbstraction,
  EvmWalletProvider,
  hubChainConfig,
  spokeChainConfig,
  SpokeService,
} from '@new-world/sdk';

// load PK from .env
const privateKey = '0xd17e858c2aca0f31be86c01039dc070123e52df4d418535a9b3c92130d271120';

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const sonicTestnetEvmWallet = new EvmWalletProvider({
  chain: 146,
  privateKey: privateKey as Hex,
  provider: 'https://rpc.blaze.soniclabs.com',
});

const sonicTestnetHubChainConfig = hubChainConfig[146];
const sonicTestnetEvmHubProvider = new EvmHubProvider(sonicTestnetEvmWallet, sonicTestnetHubChainConfig);

const cosmosConfig = spokeChainConfig[1634886504] as CosmosChainConfig;
const cwSpokeProvider = new CWSpokeProvider(cosmosConfig);

const moneyMarketConfig: MoneyMarketConfig = {
  lendingPool: '0xA33E8f7177A070D0162Eea0765d051592D110cDE',
  uiPoolDataProvider: '0x7997C9237D168986110A67C55106C410a2cF9d4f',
  poolAddressesProvider: '0x04b3f588578BF89B1D2af7283762E3375f0340dA',
};

async function depositTo(token: string, amount: bigint, recipient: Address) {
  const data = EvmAssetManagerService.depositToData(
    {
      token,
      to: recipient,
      amount,
    },
    cwSpokeProvider.chainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.deposit(
    {
      from: cwSpokeProvider.chainConfig.wallet_address,
      token,
      amount,
      data,
    },
    cwSpokeProvider,
    sonicTestnetEvmHubProvider,
  );

  console.log('[depositTo] txHash', txHash);
}

async function withdrawAsset(
  token: string,
  amount: bigint,
  recipient: string, // cosmos address
) {
  const data = EvmAssetManagerService.withdrawAssetData(
    {
      token,
      to: toHex(Buffer.from(recipient, 'utf-8')),
      amount,
    },
    sonicTestnetEvmHubProvider,
    cwSpokeProvider.chainConfig.chain.id,
  );
  const txHash: Hash = await SpokeService.callWallet(
    cwSpokeProvider.chainConfig.wallet_address,
    data,
    cwSpokeProvider,
    sonicTestnetEvmHubProvider,
  );

  console.log('[withdrawAsset] txHash', txHash);
}

async function supply(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    BigInt(cwSpokeProvider.chainConfig.chain.id),
    toHex(Buffer.from(cwSpokeProvider.chainConfig.wallet_address, 'utf-8')),
    sonicTestnetEvmHubProvider,
  );

  const data = MoneyMarketService.supplyData(
    token,
    hubWallet,
    amount,
    cwSpokeProvider.chainConfig.chain.id,
    moneyMarketConfig,
  );

  const txHash = await SpokeService.deposit(
    {
      from: cwSpokeProvider.chainConfig.wallet_address,
      token,
      amount,
      data,
    },
    cwSpokeProvider,
    sonicTestnetEvmHubProvider,
  );

  console.log('[supply] txHash', txHash);
}

async function borrow(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    BigInt(cwSpokeProvider.chainConfig.chain.id),
    toHex(Buffer.from(cwSpokeProvider.chainConfig.wallet_address, 'utf-8')),
    sonicTestnetEvmHubProvider,
  );
  console.log(hubWallet);
  const data: Hex = MoneyMarketService.borrowData(
    hubWallet,
    toHex(Buffer.from(cwSpokeProvider.chainConfig.wallet_address, 'utf-8')),
    token,
    amount,
    cwSpokeProvider.chainConfig.chain.id,
    sonicTestnetEvmHubProvider,
    moneyMarketConfig,
  );

  const txHash: Hash = await SpokeService.callWallet(
    cwSpokeProvider.chainConfig.wallet_address,
    data,
    cwSpokeProvider,
    sonicTestnetEvmHubProvider,
  );

  console.log('[borrow] txHash', txHash);
}

async function withdraw(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    BigInt(cwSpokeProvider.chainConfig.chain.id),
    toHex(Buffer.from(cwSpokeProvider.chainConfig.wallet_address, 'utf-8')),
    sonicTestnetEvmHubProvider,
  );

  const data: Hex = MoneyMarketService.withdrawData(
    hubWallet,
    toHex(Buffer.from(cwSpokeProvider.chainConfig.wallet_address, 'utf-8')),
    token,
    amount,
    cwSpokeProvider.chainConfig.chain.id,
    sonicTestnetEvmHubProvider,
    moneyMarketConfig,
  );

  const txHash: Hash = await SpokeService.callWallet(
    cwSpokeProvider.chainConfig.wallet_address,
    data,
    cwSpokeProvider,
    sonicTestnetEvmHubProvider,
  );

  console.log('[withdraw] txHash', txHash);
}

async function repay(token: string, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    BigInt(cwSpokeProvider.chainConfig.chain.id),
    toHex(Buffer.from(cwSpokeProvider.chainConfig.wallet_address, 'utf-8')),
    sonicTestnetEvmHubProvider,
  );
  const data: Hex = MoneyMarketService.repayData(
    token,
    hubWallet,
    amount,
    cwSpokeProvider.chainConfig.chain.id,
    moneyMarketConfig,
  );

  const txHash: Hash = await SpokeService.deposit(
    {
      from: cwSpokeProvider.chainConfig.wallet_address,
      token,
      amount,
      data,
    },
    cwSpokeProvider,
    sonicTestnetEvmHubProvider,
  );

  console.log('[repay] txHash', txHash);
}

// Main function to decide which function to call
async function main() {
  console.log(process.argv);
  const functionName = process.argv[2];
  console.log(fromHex('0x594b477dd2195CCB5Ff43EafC9b8a8de0F4B4fA3', 'bytes')); // Get function name from command line argument

  if (functionName === 'deposit') {
    const token = process.argv[3] as Hex; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    const recipient = process.argv[5] as Hex; // Get recipient address from command line argument
    await depositTo(token, amount, recipient);
  } else if (functionName === 'withdrawAsset') {
    const token = process.argv[3] as Hex; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    const recipient = process.argv[5] as Hex; // Get recipient address from command line argument
    await withdrawAsset(token, amount, recipient);
  } else if (functionName === 'supply') {
    const token = process.argv[3] as Hex; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await supply(token, amount);
  } else if (functionName === 'borrow') {
    const token = process.argv[3] as Hex; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await borrow(token, amount);
  } else if (functionName === 'withdraw') {
    const token = process.argv[3] as Hex; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await withdraw(token, amount);
  } else if (functionName === 'repay') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await repay(token, amount);
  } else {
    console.log('Function not recognized. Please use "deposit" or "anotherFunction".');
  }
}

main();

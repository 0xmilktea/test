import type { Address, Hash, Hex, TransactionReceipt } from 'viem';
import {
  EvmAssetManagerService,
  EvmHubProvider,
  MoneyMarketConfig,
  EvmSpokeChainConfig,
  EvmSpokeProvider,
  EvmWalletAbstraction,
  EvmWalletProvider,
  hubChainConfig,
  MoneyMarketService,
  spokeChainConfig,
  SpokeService,
  waitForTransactionReceipt,
} from '@new-world/sdk';

// load PK from .env
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const sonicTestnetEvmWallet = new EvmWalletProvider({
  chain: 146,
  privateKey: privateKey as Hex,
  provider: 'https://rpc.blaze.soniclabs.com',
});

const avalancheFujiEvmWallet = new EvmWalletProvider({
  chain: 6,
  privateKey: privateKey as Hex,
  provider: 'https://avalanche-fuji.drpc.org',
});

const sonicTestnetHubChainConfig = hubChainConfig[146];
const sonicTestnetEvmHubProvider = new EvmHubProvider(sonicTestnetEvmWallet, sonicTestnetHubChainConfig);

const avalancheFujiSpokeChainConfig = spokeChainConfig[6] as EvmSpokeChainConfig;
const avalancheFujiEvmSpokeProvider = new EvmSpokeProvider(avalancheFujiEvmWallet, avalancheFujiSpokeChainConfig);

const moneyMarketConfig: MoneyMarketConfig = {
  lendingPool: '0xA33E8f7177A070D0162Eea0765d051592D110cDE',
  uiPoolDataProvider: '0x7997C9237D168986110A67C55106C410a2cF9d4f',
  poolAddressesProvider: '0x04b3f588578BF89B1D2af7283762E3375f0340dA',
};

async function depositTo(token: Address, amount: bigint, recipient: Address) {
  const data = EvmAssetManagerService.depositToData(
    {
      token,
      to: recipient,
      amount,
    },
    avalancheFujiEvmSpokeProvider.chainConfig.chain.id,
  );

  const txHash: Hash = await SpokeService.deposit(
    {
      from: avalancheFujiEvmSpokeProvider.walletProvider.walletClient.account.address,
      token,
      amount,
      data,
    },
    avalancheFujiEvmSpokeProvider,
    sonicTestnetEvmHubProvider,
  );

  console.log('[depositTo] txHash', txHash);

  const txReceipt: TransactionReceipt = await waitForTransactionReceipt(
    txHash,
    sonicTestnetEvmHubProvider.walletProvider,
  );

  console.log(txReceipt);
}

async function withdrawAsset(token: Address, amount: bigint, recipient: Address) {
  const data = EvmAssetManagerService.withdrawAssetData(
    {
      token,
      to: recipient,
      amount,
    },
    sonicTestnetEvmHubProvider,
    avalancheFujiEvmSpokeProvider.chainConfig.chain.id,
  );
  const txHash: Hash = await SpokeService.callWallet(
    avalancheFujiEvmSpokeProvider.walletProvider.walletClient.account.address,
    data,
    avalancheFujiEvmSpokeProvider,
    sonicTestnetEvmHubProvider,
  );

  console.log('[withdrawAsset] txHash', txHash);

  const txReceipt: TransactionReceipt = await waitForTransactionReceipt(
    txHash,
    sonicTestnetEvmHubProvider.walletProvider,
  );

  console.log(txReceipt);
}

async function supply(token: Address, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    BigInt(avalancheFujiEvmSpokeProvider.chainConfig.chain.id),
    avalancheFujiEvmSpokeProvider.walletProvider.walletClient.account.address,
    sonicTestnetEvmHubProvider,
  );

  const data = MoneyMarketService.supplyData(
    token,
    hubWallet,
    amount,
    avalancheFujiEvmSpokeProvider.chainConfig.chain.id,
    moneyMarketConfig,
  );

  const txHash = await SpokeService.deposit(
    {
      from: avalancheFujiEvmSpokeProvider.walletProvider.walletClient.account.address,
      token,
      amount,
      data,
    },
    avalancheFujiEvmSpokeProvider,
    sonicTestnetEvmHubProvider,
  );

  console.log('[supply] txHash', txHash);

  const txReceipt: TransactionReceipt = await waitForTransactionReceipt(
    txHash,
    sonicTestnetEvmHubProvider.walletProvider,
  );

  console.log(txReceipt);
}

async function borrow(token: Address, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    BigInt(avalancheFujiEvmSpokeProvider.chainConfig.chain.id),
    avalancheFujiEvmSpokeProvider.walletProvider.walletClient.account.address,
    sonicTestnetEvmHubProvider,
  );
  const data: Hex = MoneyMarketService.borrowData(
    hubWallet,
    avalancheFujiEvmSpokeProvider.walletProvider.walletClient.account.address,
    token,
    amount,
    avalancheFujiEvmSpokeProvider.chainConfig.chain.id,
    sonicTestnetEvmHubProvider,
    moneyMarketConfig,
  );

  const txHash: Hash = await SpokeService.callWallet(
    avalancheFujiEvmSpokeProvider.walletProvider.walletClient.account.address,
    data,
    avalancheFujiEvmSpokeProvider,
    sonicTestnetEvmHubProvider,
  );

  console.log('[borrow] txHash', txHash);

  const txReceipt: TransactionReceipt = await waitForTransactionReceipt(
    txHash,
    sonicTestnetEvmHubProvider.walletProvider,
  );

  console.log(txReceipt);
}

async function withdraw(token: Address, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    BigInt(avalancheFujiEvmSpokeProvider.chainConfig.chain.id),
    avalancheFujiEvmSpokeProvider.walletProvider.walletClient.account.address,
    sonicTestnetEvmHubProvider,
  );

  const data: Hex = MoneyMarketService.withdrawData(
    hubWallet,
    avalancheFujiEvmSpokeProvider.walletProvider.walletClient.account.address,
    token,
    amount,
    avalancheFujiEvmSpokeProvider.chainConfig.chain.id,
    sonicTestnetEvmHubProvider,
    moneyMarketConfig,
  );

  const txHash: Hash = await SpokeService.callWallet(
    avalancheFujiEvmSpokeProvider.walletProvider.walletClient.account.address,
    data,
    avalancheFujiEvmSpokeProvider,
    sonicTestnetEvmHubProvider,
  );

  console.log('[withdraw] txHash', txHash);

  const txReceipt: TransactionReceipt = await waitForTransactionReceipt(
    txHash,
    sonicTestnetEvmHubProvider.walletProvider,
  );

  console.log(txReceipt);
}

async function repay(token: Address, amount: bigint) {
  const hubWallet = await EvmWalletAbstraction.getUserWallet(
    BigInt(avalancheFujiEvmSpokeProvider.chainConfig.chain.id),
    avalancheFujiEvmSpokeProvider.walletProvider.walletClient.account.address,
    sonicTestnetEvmHubProvider,
  );
  const data: Hex = MoneyMarketService.repayData(
    token,
    hubWallet,
    amount,
    avalancheFujiEvmSpokeProvider.chainConfig.chain.id,
    moneyMarketConfig,
  );

  const txHash: Hash = await SpokeService.deposit(
    {
      from: avalancheFujiEvmSpokeProvider.walletProvider.walletClient.account.address,
      token,
      amount,
      data,
    },
    avalancheFujiEvmSpokeProvider,
    sonicTestnetEvmHubProvider,
  );

  console.log('[repay] txHash', txHash);

  const txReceipt: TransactionReceipt = await waitForTransactionReceipt(
    txHash,
    sonicTestnetEvmHubProvider.walletProvider,
  );

  console.log(txReceipt);
}

// Main function to decide which function to call
async function main() {
  const functionName = process.argv[2]; // Get function name from command line argument

  if (functionName === 'deposit') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    const recipient = process.argv[5] as Address; // Get recipient address from command line argument
    await depositTo(token, amount, recipient);
  } else if (functionName === 'withdrawAsset') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    const recipient = process.argv[5] as Address; // Get recipient address from command line argument
    await withdrawAsset(token, amount, recipient);
  } else if (functionName === 'supply') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await supply(token, amount);
  } else if (functionName === 'borrow') {
    const token = process.argv[3] as Address; // Get token address from command line argument
    const amount = BigInt(process.argv[4]); // Get amount from command line argument
    await borrow(token, amount);
  } else if (functionName === 'withdraw') {
    const token = process.argv[3] as Address; // Get token address from command line argument
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

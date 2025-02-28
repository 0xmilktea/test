import type { AnyARecord } from 'dns';
import type { Address, Hex, TransactionReceipt } from 'viem';

export type HubChainId =
  // | 146 // sonic mainnet
  146; // sonic blaze testnet

export type SpokeChainId = 6 | 19 | 1634886504; // avalanche fuji testnet

export type ChainId = HubChainId | SpokeChainId;

export type ChainType = 'evm' | 'cosmos';

export type ChainInfo<T extends ChainType> = {
  name: string;
  id: ChainId;
  type: T;
};

export type Token = {
  symbol: string;
  name: string;
  decimals: number;
  address: string;
};

export type AssetInfo = {
  chainId: bigint;
  spokeAddress: `0x${string}`;
};

export type BaseChainConfig<T extends ChainType> = {
  chain: ChainInfo<T>;
  addresses: { [key: string]: Address | string | Uint8Array };
  supportedTokens: Token[];
  nativeToken: Address | string;
  [key: string]: any;
};

export type EvmHubChainConfig = BaseChainConfig<'evm'> & {
  addresses: {
    assetManager: Address;
    hubWallet: Address;
    xTokenManager: Address;
  };
  nativeToken: Address;
};

export type MoneyMarketConfig = {
  uiPoolDataProvider: Address;
  lendingPool: Address;
  poolAddressesProvider: Address;
};

export type EvmSpokeChainConfig = BaseChainConfig<'evm'> & {
  addresses: {
    assetManager: Address;
    connection: Address;
  };
  nativeToken: Address | string;
};

export type HubChainConfig = EvmHubChainConfig;
export type SpokeChainConfig = BaseChainConfig<ChainType>;

export type EvmContractCall = {
  address: Address; // Target address of the call
  value: bigint; // Ether value to send (in wei as a string for precision)
  data: Hex; // Calldata for the call
};

export type EvmTransferToHubParams = {
  token: Address;
  recipient: Address;
  amount: bigint;
  data: Hex;
};

export type EvmTransferParams = {
  fromToken: Address;
  toToken: Address;
  to: Address;
  amount: bigint;
  data: Hex;
};

export type TokenInfo = {
  decimals: number;
  depositFee: bigint;
  withdrawalFee: bigint;
  maxDeposit: bigint;
  isSupported: boolean;
};

export type VaultReserves = {
  tokens: readonly Address[];
  balances: readonly bigint[];
};

export type EvmTxReturnType<T extends boolean> = T extends true ? TransactionReceipt : Hex;

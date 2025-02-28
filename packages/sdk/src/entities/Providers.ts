import {
  type Account,
  type Address,
  type Chain,
  createPublicClient,
  createWalletClient,
  custom,
  type CustomTransport,
  type Hex,
  http,
  type HttpTransport,
  type PublicClient,
  type WalletClient,
} from 'viem';
import type { EvmHubChainConfig, EvmSpokeChainConfig, ChainId } from '../types.js';
import {
  isEvmUninitializedConfig,
  isEvmInitializedConfig,
  isEvmUninitializedBrowserConfig,
  isEvmUninitializedPrivateKeyConfig,
} from '../guards.js';
import { getEvmViemChain } from '../constants.js';
import { privateKeyToAccount } from 'viem/accounts';
import type { CWSpokeProvider } from './cosmos/CWSpokeProvider.js';

export type CustomProvider = { request(...args: unknown[]): Promise<unknown> };

export type EvmUninitializedBrowserConfig = {
  userAddress: Address;
  chain: ChainId;
  provider: CustomProvider;
};

export type EvmUninitializedPrivateKeyConfig = {
  chain: ChainId;
  privateKey: Hex;
  provider: string; // rpc url
};

export type EvmUninitializedConfig = EvmUninitializedBrowserConfig | EvmUninitializedPrivateKeyConfig;

export type EvmInitializedConfig = {
  walletClient: WalletClient<CustomTransport, Chain, Account>;
  publicClient: PublicClient<CustomTransport>;
};

/**
 * EvmWalletProvider is a class that provides functionalities for dealing with wallet signing and sending transactions
 * in an EVM (Ethereum Virtual Machine) compatible environment. It supports both uninitialized and initialized configurations.
 */
export class EvmWalletProvider {
  public readonly walletClient: WalletClient<CustomTransport | HttpTransport, Chain, Account>;
  public readonly publicClient: PublicClient<CustomTransport | HttpTransport>;

  constructor(payload: EvmUninitializedConfig | EvmInitializedConfig) {
    if (isEvmUninitializedConfig(payload)) {
      if (isEvmUninitializedBrowserConfig(payload)) {
        this.walletClient = createWalletClient({
          account: payload.userAddress,
          transport: custom(payload.provider),
          chain: getEvmViemChain(payload.chain),
        });
        this.publicClient = createPublicClient({
          transport: custom(payload.provider),
          chain: getEvmViemChain(payload.chain),
        });
      } else if (isEvmUninitializedPrivateKeyConfig(payload)) {
        this.walletClient = createWalletClient({
          account: privateKeyToAccount(payload.privateKey),
          transport: http(payload.provider),
          chain: getEvmViemChain(payload.chain),
        });
        this.publicClient = createPublicClient({
          transport: http(payload.provider),
          chain: getEvmViemChain(payload.chain),
        });
      } else {
        throw new Error('Invalid configuration parameters');
      }
    } else if (isEvmInitializedConfig(payload)) {
      this.walletClient = payload.walletClient;
      this.publicClient = payload.publicClient;
    } else {
      throw new Error('Invalid configuration parameters');
    }
  }
}

export class EvmHubProvider {
  public readonly walletProvider: EvmWalletProvider;
  public readonly chainConfig: EvmHubChainConfig;

  constructor(walletProvider: EvmWalletProvider, chainConfig: EvmHubChainConfig) {
    this.walletProvider = walletProvider;
    this.chainConfig = chainConfig;
  }
}

export class EvmSpokeProvider {
  public readonly walletProvider: EvmWalletProvider;
  public readonly chainConfig: EvmSpokeChainConfig;

  constructor(walletProvider: EvmWalletProvider, chainConfig: EvmSpokeChainConfig) {
    this.walletProvider = walletProvider;
    this.chainConfig = chainConfig;
  }
}

export type HubProvider = EvmHubProvider;
export type SpokeProvider = EvmSpokeProvider | CWSpokeProvider;

import { toHex, type Address, type Chain } from 'viem';
import { avalancheFuji, sonicTestnet } from 'viem/chains';
import type {
  HubChainConfig,
  HubChainId,
  EvmHubChainConfig,
  SpokeChainConfig,
  EvmSpokeChainConfig,
  SpokeChainId,
  ChainId,
} from './types.js';
import { NetworkEnv, type CosmosChainConfig } from './entities/cosmos/Configs.js';

export const DEFAULT_MAX_RETRY = 3;
export const DEFAULT_RETRY_DELAY_MS = 2000;
export const ICON_TX_RESULT_WAIT_MAX_RETRY = 10;

export function getEvmViemChain(chainName: ChainId): Chain {
  switch (chainName) {
    case 146:
      return sonicTestnet;
    case 6:
      return avalancheFuji;
    // case 146:
    //   return sonic
    default:
      throw new Error(`Unsupported EVM chain: ${chainName}`);
  }
}

export const hubChainConfig: Record<HubChainId, HubChainConfig> = {
  [146]: {
    chain: {
      name: 'Sonic Blaze Testnet',
      id: 146,
      type: 'evm',
    },
    addresses: {
      assetManager: '0x594b477dd2195CCB5Ff43EafC9b8a8de0F4B4fA3',
      hubWallet: '0xd5CECE180a52e0353654B3337c985E8d5E056344',
      xTokenManager: '0x887C7F93A8466a7b5DEB03C4e05Da2B0Dc5c4e07',
    },
    nativeToken: '0x0000000000000000000000000000000000000000',
    supportedTokens: [
      {
        symbol: 'S',
        name: 'Sonic',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      },
    ],
  } satisfies EvmHubChainConfig,
} as const;

export const spokeChainConfig: Record<SpokeChainId, SpokeChainConfig> = {
  [6]: {
    chain: {
      name: 'Avalanche Fuji Testnet',
      id: 6,
      type: 'evm',
    },
    addresses: {
      assetManager: '0x92971C06586576a14C0Deb583C8299B0B037bdC3',
      connection: '0x4031D470e73b5E72A0879Fc77aBf2F64049CF6BD',
    },
    nativeToken: '0x0000000000000000000000000000000000000000',
    supportedTokens: [
      {
        symbol: 'S',
        name: 'Sonic',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      },
    ],
  } satisfies EvmSpokeChainConfig,
  [19]: {
    addresses: {
      assetManager: 'inj1gru3eu7rmrsynu8ksfgd6tm05dy0ttuwej2nh2',
      connection: 'inj10cnfez7heja2s8kjjcm00quj0rkadknxm03hfa',
      rateLimit: 'inj1rhe9xj9mhwuxkxwqr3x6luq59s79egkjl3xjpp',
      testToken: 'inj172gzzhqxm60yvshmk3un0qcx2j97ezsdzy26ss',
      xTokenManager: '',
    },
    chain: { id: 19, name: 'Injective', type: 'cosmos' },
    nativeToken: 'inj',
    supportedTokens: [],
    gas_price: '0.025inj',
    mnemonics:
      'pave sure inspire crunch reward blush emotion tongue nuclear since arch praise silly believe rapid empower moon trend true kid employ ensure rival scorpion',
    network: NetworkEnv.TestNet,
    prefix: 'inj',
    rpc_url: 'https://injective-testnet-rpc.publicnode.com:443',
    wallet_address: 'inj15slcxnxxtw6jn4chulgw78tdcd8ppgnm2un4ts',
  } satisfies CosmosChainConfig,
  [1634886504]: {
    addresses: {
      assetManager: 'archway1ddsmzctpdszkyuq84cltmh30k86e6y26csray5nwl9l5ydsuad9se3hwhw',
      connection: 'archway1gfsfp5qrrreftfxl32rlyc2gdrm5je62h4kx83tjrxfd5vs63pkqprtclx',
      rateLimit: 'archway1ed6xrxx9g648g4gg4f2f6hf4n2ep4e82qf7gs9lguz2s70jeq3uq0g73h8',
      testToken: '',
      xTokenManager: '',
    },
    chain: { id: 1634886504, name: 'Archway', type: 'cosmos' },
    nativeToken: 'aconst',
    supportedTokens: [],
    gas_price: '500000000000aconst',
    mnemonics:
      'february broom resemble walk sleep lady spray soap brave hope track ticket glad link cousin tool shield body enter resource clay pudding fame income',
    network: NetworkEnv.TestNet,
    prefix: 'archway',
    rpc_url: 'https://rpc.constantine.archway.io:443',
    wallet_address: 'archway1ywtvgurt69ujpd2cpx76ufd9c98rjm8jm6f9mw',
  } satisfies CosmosChainConfig,
} as const;

export const assets: Record<ChainId, Record<Address | string, { asset: Address; decimal: number; vault: Address }>> = {
  [6]: {
    '0x0000000000000000000000000000000000000000': {
      asset: '0x18afE238E6366Bc3834844cC257acF1cfE52D8c5',
      decimal: 18,
      vault: '0xd40AbC1b98746E902Ab4194F1b6e09E8139Ba67c',
    },
  },
  [146]: {},
  [19]: {
    inj172gzzhqxm60yvshmk3un0qcx2j97ezsdzy26ss: {
      asset: '0xBC4BFEcd8067F1c7fbbF17fEcbFCbA56615C3b55',
      decimal: 12,
      vault: '0x0d6eF3889eb9F12423dDB209EC704aBdf614EDcA',
    },
  },
  [1634886504]: {
    aconst: {
      asset: '0xa4e0cbdf9a605ec54fc1d3e3089107fd55c3f064',
      decimal: 18,
      vault: '0xB0189e752973FEaae68BbcEcbdD4514c392D7ca3',
    },
  },
} as const;

export const supportedHubChains: HubChainId[] = Object.keys(hubChainConfig).map(Number) as HubChainId[];
export const supportedSpokeChains: SpokeChainId[] = Object.keys(spokeChainConfig).map(Number) as SpokeChainId[];

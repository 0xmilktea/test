import type { BaseChainConfig } from '../../types.js';

export type CosmosChainConfig = BaseChainConfig<'cosmos'> & {
  rpc_url: string;
  wallet_address: string;
  mnemonics: string;
  addresses: {
    assetManager: string;
    connection: string;
    xTokenManager: string;
    rateLimit: string;
    testToken: string;
  };
  nativeToken: string;
  prefix: string;
  gas_price: string;
  network: NetworkEnv;
};
export enum NetworkEnv {
  TestNet,
  DevNet,
  Mainnet,
}

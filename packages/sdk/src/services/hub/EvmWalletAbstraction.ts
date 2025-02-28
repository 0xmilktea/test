import type { Address, Hex } from 'viem';
import { walletFactoryAbi } from '../../abis/index.js';
import type { EvmHubProvider } from '../../entities/index.js';

export class EvmWalletAbstraction {
  private constructor() {}

  /**
   * Get the derived address of a contract deployed with CREATE3.
   * @param chainId Chain ID of the contract.
   * @param address User's address on the specified chain as hex.
   * @param hubProvider Hub provider
   * @returns The computed contract address as a hex string.
   */
  public static async getUserWallet(chainId: bigint, address: Hex, hubProvider: EvmHubProvider): Promise<Address> {
    return hubProvider.walletProvider.publicClient.readContract({
      address: hubProvider.chainConfig.addresses.hubWallet,
      abi: walletFactoryAbi,
      functionName: 'getDeployedAddress',
      args: [chainId, address],
    });
  }
}

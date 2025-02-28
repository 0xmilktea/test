import { EvmSpokeProvider } from '../../entities/index.js';
import type { Hex, Address, Hash } from 'viem';
import type { HubProvider, SpokeProvider } from '../../entities/index.js';
import { type EvmSpokeDepositParams, EvmSpokeService } from './EvmSpokeService.js';
import { CWSpokeProvider } from '../../entities/cosmos/CWSpokeProvider.js';
import { CWSpokeService, type CWSpokeDepositParams } from './CWSpokeService.js';

export type SpokeDepositParams = EvmSpokeDepositParams | CWSpokeDepositParams;

/**
 * SpokeService is a main class that provides functionalities for dealing with spoke chains.
 * It uses command pattern to execute different spoke chain operations.
 */
export class SpokeService {
  private constructor() {}

  /**
   * Deposit tokens to the spoke chain.
   * @param {EvmSpokeDepositParams} params - The parameters for the deposit, including the user's address, token address, amount, and additional data.
   * @param {EvmSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  public static async deposit<T extends boolean = true>(
    params: SpokeDepositParams,
    spokeProvider: CWSpokeService,
    hubProvider: HubProvider,
  ): Promise<Hash> {
    if (spokeProvider instanceof EvmSpokeProvider) {
      return EvmSpokeService.deposit(params as EvmSpokeDepositParams, spokeProvider, hubProvider);
    }
    if (spokeProvider instanceof CWSpokeProvider) {
      console.log('Using CwSpokesProvider');
      return CWSpokeService.deposit(params as CWSpokeDepositParams, spokeProvider, hubProvider);
    }

    throw new Error('Invalid spoke provider');
  }

  /**
   * Get the balance of the token in the spoke chain.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {SpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The balance of the token.
   */
  async getDeposit(token: Address, spokeProvider: SpokeProvider): Promise<bigint> {
    if (spokeProvider instanceof EvmSpokeProvider) {
      return EvmSpokeService.getDeposit(token, spokeProvider);
    }
    if (spokeProvider instanceof CWSpokeProvider) {
      return CWSpokeService.getDeposit(token, spokeProvider);
    }

    throw new Error('Invalid spoke provider');
  }

  /**
   * Calls a contract on the spoke chain using the user's wallet.
   * @param {Address} from - The address of the user on the spoke chain.
   * @param {Hex} payload - The payload to send to the contract.
   * @param {SpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {HubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  public static async callWallet(
    from: string | Hex,
    payload: Hex,
    spokeProvider: SpokeProvider,
    hubProvider: HubProvider,
  ): Promise<Hash> {
    if (spokeProvider instanceof EvmSpokeProvider) {
      return EvmSpokeService.callWallet(from as Address, payload, spokeProvider, hubProvider);
    }
    if (spokeProvider instanceof CWSpokeProvider) {
      console.log('Using CwSpokesProvider');
      return CWSpokeService.callWallet(from as string, payload, spokeProvider, hubProvider);
    }

    throw new Error('Invalid spoke provider');
  }
}

import type { Address, Hash, Hex } from 'viem';
import { EvmWalletAbstraction } from '../hub/index.js';
import type { EvmHubProvider, EvmSpokeProvider } from '../../entities/index.js';
import type { EvmContractCall, EvmTransferToHubParams } from '../../types.js';
import { spokeAssetManagerAbi } from '../../abis/index.js';
import { erc20Abi } from '../../abis/index.js';
import { assets, connectionAbi } from '../../index.js';
import { encodeContractCalls } from '../../utils/index.js';
import { Erc20Service } from '../shared/index.js';
import { EvmVaultTokenService } from '../hub/index.js';
import { EvmAssetManagerService } from '../hub/index.js';

export type EvmSpokeDepositParams = {
  from: Address; // The address of the user on the spoke chain
  token: Hex; // The address of the token to deposit
  amount: bigint; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit
};

export class EvmSpokeService {
  private constructor() {}

  /**
   * Deposit tokens to the spoke chain.
   * @param {EvmSpokeDepositParams} params - The parameters for the deposit, including the user's address, token address, amount, and additional data.
   * @param {EvmSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  public static async deposit(
    params: EvmSpokeDepositParams,
    spokeProvider: EvmSpokeProvider,
    hubProvider: EvmHubProvider,
  ): Promise<Hash> {
    const userWallet: Address = await EvmWalletAbstraction.getUserWallet(
      BigInt(spokeProvider.chainConfig.chain.id),
      params.from,
      hubProvider,
    );

    return EvmSpokeService.transfer(
      {
        token: params.token,
        recipient: userWallet,
        amount: params.amount,
        data: params.data,
      },
      spokeProvider,
    );
  }

  /**
   * Get the balance of the token in the spoke chain.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {EvmSpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The balance of the token.
   */
  public static async getDeposit(token: Address, spokeProvider: EvmSpokeProvider): Promise<bigint> {
    return spokeProvider.walletProvider.publicClient.readContract({
      address: token,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [token],
    });
  }

  /**
   * Calls a contract on the spoke chain using the user's wallet.
   * @param {Address} from - The address of the user on the spoke chain.
   * @param {Hex} payload - The payload to send to the contract.
   * @param {EvmSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  public static async callWallet(
    from: Address,
    payload: Hex,
    spokeProvider: EvmSpokeProvider,
    hubProvider: EvmHubProvider,
  ): Promise<Hash> {
    const userWallet: Address = await EvmWalletAbstraction.getUserWallet(
      BigInt(spokeProvider.chainConfig.chain.id),
      from,
      hubProvider,
    );

    return EvmSpokeService.call(BigInt(hubProvider.chainConfig.chain.id), userWallet, payload, spokeProvider);
  }

  /**
   * Transfers tokens to the hub chain.
   * @param {EvmTransferToHubParams} params - The parameters for the transfer, including:
   *   - {Address} token: The address of the token to transfer (use address(0) for native token).
   *   - {Address} recipient: The recipient address on the hub chain.
   *   - {bigint} amount: The amount to transfer.
   *   - {Hex} [data="0x"]: Additional data for the transfer.
   * @param {EvmSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  private static async transfer(
    { token, recipient, amount, data = '0x' }: EvmTransferToHubParams,
    spokeProvider: EvmSpokeProvider,
  ): Promise<Hash> {
    return spokeProvider.walletProvider.walletClient.writeContract({
      address: spokeProvider.chainConfig.addresses.assetManager,
      abi: spokeAssetManagerAbi,
      functionName: 'transfer',
      args: [token, recipient, amount, data],
      value: token.toLowerCase() === spokeProvider.chainConfig.nativeToken.toLowerCase() ? amount : undefined,
    });
  }

  /**
   * Sends a message to the hub chain.
   * @param {bigint} dstChainId - The chain ID of the hub chain.
   * @param {Address} dstAddress - The address on the hub chain.
   * @param {Hex} payload - The payload to send.
   * @param {EvmSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  private static async call(
    dstChainId: bigint,
    dstAddress: Address,
    payload: Hex,
    spokeProvider: EvmSpokeProvider,
  ): Promise<Hash> {
    return spokeProvider.walletProvider.walletClient.writeContract({
      address: spokeProvider.chainConfig.addresses.connection,
      abi: connectionAbi,
      functionName: 'sendMessage',
      args: [dstChainId, dstAddress, payload],
    });
  }
}

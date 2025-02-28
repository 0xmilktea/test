import { encodeFunctionData, type Address, type Hash } from 'viem';
import { xtokenAbi } from '../../abis/index.js';
import { xtokenManagerAbi } from '../../abis/index.js';
import type { EvmWalletProvider } from '../../entities/index.js';
import type { EvmContractCall, EvmTransferParams } from '../../types.js';

export class EvmXTokenService {
  private constructor() {}

  /**
   * Get the maximum debit allowed for a token pair
   * @param tokenAddress Address of the XToken contract
   * @param dstChainId Destination chain ID
   * @param dstToken Encoded destination token address
   * @param provider Evm Wallet provider
   * @returns Maximum debit amount
   */
  public static async getMaxDebit(
    tokenAddress: Address,
    dstChainId: bigint,
    dstToken: Address,
    provider: EvmWalletProvider,
  ): Promise<bigint> {
    return provider.publicClient.readContract({
      address: tokenAddress,
      abi: xtokenAbi,
      functionName: 'maxDebit',
      args: [dstChainId, dstToken],
    });
  }

  /**
   * Get the current debit amount for a token pair
   * @param tokenAddress Address of the XToken contract
   * @param dstChainId Destination chain ID
   * @param dstToken Encoded destination token address
   * @param provider EvmWalletProvider
   * @returns Current debit amount
   */
  public static async getCurrentDebit(
    tokenAddress: Address,
    dstChainId: bigint,
    dstToken: Address,
    provider: EvmWalletProvider,
  ): Promise<bigint> {
    return provider.publicClient.readContract({
      address: tokenAddress,
      abi: xtokenAbi,
      functionName: 'currentDebit',
      args: [dstChainId, dstToken],
    });
  }

  /**
   * Initiate a cross-chain token transfer
   * @param {EvmTransferParams}
   * @param xTokenManager
   * @param provider
   * @returns Transaction hash
   */
  public static async transfer(
    { fromToken, toToken, to, amount, data = '0x' }: EvmTransferParams,
    xTokenManager: Address,
    provider: EvmWalletProvider,
  ): Promise<Hash> {
    return provider.walletClient.writeContract({
      address: xTokenManager,
      abi: xtokenManagerAbi,
      functionName: 'transfer',
      args: [fromToken, toToken, to, amount, data],
    });
  }

  /**
   * Create an encoded transfer call for the XTokenManager
   * @param EvmTransferParams params
   * @param xTokenManager XTokenManager contract address
   * @returns ContractCall object with the encoded call

   */
  public static encodeTransfer(
    { fromToken, toToken, to, amount, data = '0x' }: EvmTransferParams,
    xTokenManager: Address,
  ): EvmContractCall {
    return {
      address: xTokenManager,
      value: 0n,
      data: encodeFunctionData({
        abi: xtokenManagerAbi,
        functionName: 'transfer',
        args: [fromToken, toToken, to, amount, data],
      }),
    };
  }
}

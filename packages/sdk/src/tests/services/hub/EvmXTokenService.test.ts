import { describe, it, expect, vi, beforeEach } from 'vitest';
import { decodeFunctionData, type Address, type Hash, type PublicClient, type WalletClient } from 'viem';
import { xtokenAbi } from '../../../abis/index.js';
import { xtokenManagerAbi } from '../../../abis/index.js';
import type { EvmWalletProvider } from '../../../entities/index.js';
import { EvmXTokenService, type EvmTransferParams } from '../../../index.js';

describe('EvmXTokenService', () => {
  const mockToken = '0x1234567890123456789012345678901234567890' as Address;
  const mockDstToken = '0x2222222222222222222222222222222222222222' as Address;
  const mockXTokenManager = '0x3333333333333333333333333333333333333333' as Address;
  const mockRecipient = '0x4444444444444444444444444444444444444444' as Address;
  const mockAmount = 1000000000000000000n; // 1 token with 18 decimals
  const mockChainId = 42n;
  const mockTxHash = '0x123...' as Hash;

  // Mock provider
  const mockPublicClient = {
    readContract: vi.fn(),
  } as unknown as PublicClient;

  const mockWalletClient = {
    writeContract: vi.fn(),
  } as unknown as WalletClient;

  const mockProvider = {
    publicClient: mockPublicClient,
    walletClient: mockWalletClient,
  } as EvmWalletProvider;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getMaxDebit', () => {
    it('should correctly fetch max debit', async () => {
      const expectedDebit = 1000000n;
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(expectedDebit);

      const result = await EvmXTokenService.getMaxDebit(mockToken, mockChainId, mockDstToken, mockProvider);

      expect(mockPublicClient.readContract).toHaveBeenCalledWith({
        address: mockToken,
        abi: xtokenAbi,
        functionName: 'maxDebit',
        args: [mockChainId, mockDstToken],
      });
      expect(result).toBe(expectedDebit);
    });

    it('should handle zero max debit', async () => {
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(0n);

      const result = await EvmXTokenService.getMaxDebit(mockToken, mockChainId, mockDstToken, mockProvider);

      expect(result).toBe(0n);
    });
  });

  describe('getCurrentDebit', () => {
    it('should correctly fetch current debit', async () => {
      const expectedDebit = 500000n;
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(expectedDebit);

      const result = await EvmXTokenService.getCurrentDebit(mockToken, mockChainId, mockDstToken, mockProvider);

      expect(mockPublicClient.readContract).toHaveBeenCalledWith({
        address: mockToken,
        abi: xtokenAbi,
        functionName: 'currentDebit',
        args: [mockChainId, mockDstToken],
      });
      expect(result).toBe(expectedDebit);
    });

    it('should handle zero current debit', async () => {
      vi.mocked(mockPublicClient.readContract).mockResolvedValueOnce(0n);

      const result = await EvmXTokenService.getCurrentDebit(mockToken, mockChainId, mockDstToken, mockProvider);

      expect(result).toBe(0n);
    });
  });

  describe('transfer', () => {
    const transferParams = {
      fromToken: mockToken,
      toToken: mockDstToken,
      to: mockRecipient,
      amount: mockAmount,
      data: '0x',
    } satisfies EvmTransferParams;

    it('should correctly initiate transfer', async () => {
      vi.mocked(mockWalletClient.writeContract).mockResolvedValueOnce(mockTxHash);

      const result = await EvmXTokenService.transfer(transferParams, mockXTokenManager, mockProvider);

      expect(mockWalletClient.writeContract).toHaveBeenCalledWith({
        address: mockXTokenManager,
        abi: xtokenManagerAbi,
        functionName: 'transfer',
        args: [mockToken, mockDstToken, mockRecipient, mockAmount, '0x'],
      });
      expect(result).toBe(mockTxHash);
    });

    it('should handle custom data parameter', async () => {
      const customData = '0x1234';
      vi.mocked(mockWalletClient.writeContract).mockResolvedValueOnce(mockTxHash);

      await EvmXTokenService.transfer({ ...transferParams, data: customData }, mockXTokenManager, mockProvider);

      expect(mockWalletClient.writeContract).toHaveBeenCalledWith({
        address: mockXTokenManager,
        abi: xtokenManagerAbi,
        functionName: 'transfer',
        args: [mockToken, mockDstToken, mockRecipient, mockAmount, customData],
      });
    });
  });

  describe('encodeTransfer', () => {
    const transferParams = {
      fromToken: mockToken,
      toToken: mockDstToken,
      to: mockRecipient,
      amount: mockAmount,
      data: '0x',
    } satisfies EvmTransferParams;

    it('should correctly encode transfer call', () => {
      const encodedCall = EvmXTokenService.encodeTransfer(transferParams, mockXTokenManager);

      expect(encodedCall).toEqual({
        address: mockXTokenManager,
        value: 0n,
        data: expect.any(String),
      });

      const decoded = decodeFunctionData({
        abi: xtokenManagerAbi,
        data: encodedCall.data,
      });

      expect(decoded.functionName).toBe('transfer');
      expect(decoded.args).toEqual([mockToken, mockDstToken, mockRecipient, mockAmount, '0x']);
    });

    it('should handle custom data in encoding', () => {
      const customData = '0x1234';
      const encodedCall = EvmXTokenService.encodeTransfer({ ...transferParams, data: customData }, mockXTokenManager);

      const decoded = decodeFunctionData({
        abi: xtokenManagerAbi,
        data: encodedCall.data,
      });

      expect(decoded.args?.[4]).toBe(customData);
    });

    it('should handle zero amount', () => {
      const encodedCall = EvmXTokenService.encodeTransfer({ ...transferParams, amount: 0n }, mockXTokenManager);

      const decoded = decodeFunctionData({
        abi: xtokenManagerAbi,
        data: encodedCall.data,
      });

      expect(decoded.args?.[3]).toBe(0n);
    });

    it('should handle maximum uint256 amount', () => {
      const maxUint256 = 2n ** 256n - 1n;
      const encodedCall = EvmXTokenService.encodeTransfer({ ...transferParams, amount: maxUint256 }, mockXTokenManager);

      const decoded = decodeFunctionData({
        abi: xtokenManagerAbi,
        data: encodedCall.data,
      });

      expect(decoded.args?.[3]).toBe(maxUint256);
    });

    it('should maintain data precision for large numbers', () => {
      const largeAmount = 2n ** 128n;
      const encodedCall = EvmXTokenService.encodeTransfer(
        { ...transferParams, amount: largeAmount },
        mockXTokenManager,
      );

      const decoded = decodeFunctionData({
        abi: xtokenManagerAbi,
        data: encodedCall.data,
      });

      expect(decoded.args?.[3]).toBe(largeAmount);
    });
  });
});

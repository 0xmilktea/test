import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Address, Hash } from 'viem';
import { connectionAbi } from '../../../abis/index.js';
import { hubChainConfig, spokeChainConfig } from '../../../constants.js';
import type { EvmWalletProvider } from '../../../entities/index.js';
import {
  type EvmSpokeProvider,
  type EvmHubProvider,
  type EvmDepositToDataParams,
  type EvmWithdrawAssetDataParams,
  type EvmSpokeDepositParams,
  EvmSpokeService,
} from '../../../index.js';

// Hoisted mocks must be before any other code
vi.mock('../../../utils/evm-utils.js', () => ({
  encodeContractCalls: () => '0xencoded',
}));

vi.mock('../../../services/hub/EvmWalletAbstraction.js', () => ({
  EvmWalletAbstraction: {
    getUserWallet: () => '0x4444444444444444444444444444444444444444',
  },
}));

// Mock assets configuration
vi.mock('../../../constants.js', async importOriginal => {
  const actual = (await importOriginal()) as object;
  return {
    ...actual,
    assets: {
      6: {
        // Mock token configuration for Avalanche Fuji testnet
        '0x1234567890123456789012345678901234567890': {
          asset: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          vault: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        },
      },
    },
  };
});

describe('EvmSpokeService', () => {
  const mockToken = '0x1234567890123456789012345678901234567890' as Address;
  const mockUser = '0x4444444444444444444444444444444444444444' as Address;
  const mockAmount = 1000000000000000000n; // 1 token with 18 decimals
  const mockChainId = 6; // Avalanche Fuji testnet
  const mockTxHash = '0x123...' as Hash;
  const mockPayload = '0xabcd' as const;

  // Mock providers setup
  const mockSpokeWalletProvider = {
    publicClient: {
      readContract: vi.fn(),
    },
    walletClient: {
      writeContract: vi.fn(),
    },
  } as unknown as EvmWalletProvider;

  const mockSpokeProvider = {
    walletProvider: mockSpokeWalletProvider,
    chainConfig: {
      ...spokeChainConfig[mockChainId],
      chain: {
        id: mockChainId,
        name: 'Avalanche Fuji',
        type: 'evm',
      },
      addresses: {
        assetManager: '0x5555555555555555555555555555555555555555' as Address,
        connection: '0x6666666666666666666666666666666666666666' as Address,
      },
      nativeToken: '0x0000000000000000000000000000000000000000' as Address,
    },
  } satisfies EvmSpokeProvider;

  const mockHubProvider = {
    walletProvider: {
      publicClient: {
        readContract: vi.fn(),
      },
      walletClient: {
        writeContract: vi.fn(),
      },
    } as unknown as EvmWalletProvider,
    chainConfig: hubChainConfig[146],
  } satisfies EvmHubProvider;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('deposit', () => {
    const depositParams = {
      from: mockUser,
      token: mockToken,
      amount: mockAmount,
      data: '0x',
    } satisfies EvmSpokeDepositParams;

    it('should correctly initiate deposit', async () => {
      vi.mocked(mockSpokeWalletProvider.walletClient.writeContract).mockResolvedValueOnce(mockTxHash);

      const result = await EvmSpokeService.deposit(depositParams, mockSpokeProvider, mockHubProvider);

      expect(result).toBe(mockTxHash);
    });

    it('should handle native token deposits', async () => {
      const nativeTokenParams = {
        ...depositParams,
        token: mockSpokeProvider.chainConfig.nativeToken,
      };

      vi.mocked(mockSpokeWalletProvider.walletClient.writeContract).mockResolvedValueOnce(mockTxHash);

      await EvmSpokeService.deposit(nativeTokenParams, mockSpokeProvider, mockHubProvider);

      expect(mockSpokeWalletProvider.walletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          value: mockAmount,
        }),
      );
    });
  });

  describe('getDeposit', () => {
    it('should correctly fetch token balance', async () => {
      const expectedBalance = 1000000n;
      vi.mocked(mockSpokeWalletProvider.publicClient.readContract).mockResolvedValueOnce(expectedBalance);

      const result = await EvmSpokeService.getDeposit(mockToken, mockSpokeProvider);

      expect(result).toBe(expectedBalance);
    });

    it('should handle zero balance', async () => {
      vi.mocked(mockSpokeWalletProvider.publicClient.readContract).mockResolvedValueOnce(0n);

      const result = await EvmSpokeService.getDeposit(mockToken, mockSpokeProvider);

      expect(result).toBe(0n);
    });
  });

  describe('callWallet', () => {
    it('should correctly call wallet with payload', async () => {
      vi.mocked(mockSpokeWalletProvider.walletClient.writeContract).mockResolvedValueOnce(mockTxHash);

      const result = await EvmSpokeService.callWallet(mockUser, mockPayload, mockSpokeProvider, mockHubProvider);

      expect(result).toBe(mockTxHash);
    });

    it('should use correct connection contract address', async () => {
      vi.mocked(mockSpokeWalletProvider.walletClient.writeContract).mockResolvedValueOnce(mockTxHash);

      await EvmSpokeService.callWallet(mockUser, mockPayload, mockSpokeProvider, mockHubProvider);

      expect(mockSpokeWalletProvider.walletClient.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: mockSpokeProvider.chainConfig.addresses.connection,
          abi: connectionAbi,
          functionName: 'sendMessage',
        }),
      );
    });
  });

  describe('edge cases', () => {
    it('should handle maximum uint256 amount', async () => {
      const maxUint256 = 2n ** 256n - 1n;
      const largeAmountParams = {
        from: mockUser,
        token: mockToken,
        amount: maxUint256,
        data: '0x',
      } satisfies EvmSpokeDepositParams;

      vi.mocked(mockSpokeWalletProvider.walletClient.writeContract).mockResolvedValueOnce(mockTxHash);

      const result = await EvmSpokeService.deposit(largeAmountParams, mockSpokeProvider, mockHubProvider);

      expect(result).toBe(mockTxHash);
    });

    it('should handle empty data parameter', async () => {
      const emptyDataParams = {
        from: mockUser,
        token: mockToken,
        amount: mockAmount,
        data: '0x',
      } satisfies EvmSpokeDepositParams;

      vi.mocked(mockSpokeWalletProvider.walletClient.writeContract).mockResolvedValueOnce(mockTxHash);

      const result = await EvmSpokeService.deposit(emptyDataParams, mockSpokeProvider, mockHubProvider);

      expect(result).toBe(mockTxHash);
    });

    it('should handle custom data parameter', async () => {
      const customDataParams = {
        from: mockUser,
        token: mockToken,
        amount: mockAmount,
        data: '0x1234',
      } satisfies EvmSpokeDepositParams;

      vi.mocked(mockSpokeWalletProvider.walletClient.writeContract).mockResolvedValueOnce(mockTxHash);

      const result = await EvmSpokeService.deposit(customDataParams, mockSpokeProvider, mockHubProvider);

      expect(result).toBe(mockTxHash);
    });
  });
});

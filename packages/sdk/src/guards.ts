import type {
  EvmUninitializedConfig,
  EvmInitializedConfig,
  EvmUninitializedPrivateKeyConfig,
  EvmUninitializedBrowserConfig,
} from './entities/index.js';
import type { EvmHubChainConfig, EvmSpokeChainConfig, HubChainConfig, SpokeChainConfig } from './index.js';

export function isEvmHubChainConfig(value: HubChainConfig): value is EvmHubChainConfig {
  return typeof value === 'object' && value.chain.type === 'evm';
}

export function isEvmSpokeChainConfig(value: SpokeChainConfig): value is EvmSpokeChainConfig {
  return typeof value === 'object' && value.chain.type === 'evm';
}

export function isEvmUninitializedConfig(
  value: EvmUninitializedConfig | EvmInitializedConfig,
): value is EvmUninitializedConfig {
  return typeof value === 'object' && 'chain' in value;
}

export function isEvmInitializedConfig(
  value: EvmUninitializedConfig | EvmInitializedConfig,
): value is EvmInitializedConfig {
  return typeof value === 'object' && 'walletClient' in value && 'publicClient' in value;
}

export function isEvmUninitializedBrowserConfig(value: EvmUninitializedConfig): value is EvmUninitializedBrowserConfig {
  return typeof value === 'object' && 'userAddress' in value && 'chain' in value && 'provider' in value;
}

export function isEvmUninitializedPrivateKeyConfig(
  value: EvmUninitializedConfig,
): value is EvmUninitializedPrivateKeyConfig {
  return typeof value === 'object' && 'chain' in value && 'privateKey' in value;
}

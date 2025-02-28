import { argv } from 'node:process';
import {
  type AggregatedReserveData,
  type BaseCurrencyInfo,
  EvmWalletProvider,
  MoneyMarketService,
  type UserReserveData,
} from '@new-world/sdk';
import type { Address, Hex } from 'viem';

const MONEY_MARKET_CONFIG = {
  lendingPool: '0xA33E8f7177A070D0162Eea0765d051592D110cDE',
  uiPoolDataProvider: '0x7997C9237D168986110A67C55106C410a2cF9d4f',
  poolAddressesProvider: '0x04b3f588578BF89B1D2af7283762E3375f0340dA',
};

// load PK from .env
const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is required');
}

const sonicTestnetEvmWallet = new EvmWalletProvider({
  chain: 146,
  privateKey: privateKey as Hex,
  provider: 'https://rpc.blaze.soniclabs.com',
});

// Helper functions to format data
function formatPercentage(value: bigint, decimals = 27): string {
  return `${(Number(value) / 10 ** decimals).toFixed(2)}%`;
}

function formatBasisPoints(value: bigint): string {
  return `${(Number(value) / 100).toFixed(2)}%`;
}

async function displayReserveData(reserve: AggregatedReserveData) {
  console.log(`\n${reserve.name} (${reserve.symbol}):`);

  console.log('Asset Details:');
  console.log('- Underlying Asset:', reserve.underlyingAsset);
  console.log('- Decimals:', reserve.decimals.toString());
  console.log('- aToken Address:', reserve.aTokenAddress);

  console.log('\nLiquidity Info:');
  console.log('- Available Liquidity:', reserve.availableLiquidity.toString());
  console.log('- Total Variable Debt:', reserve.totalScaledVariableDebt.toString());
  console.log('- Supply Cap:', reserve.supplyCap.toString());
  console.log('- Borrow Cap:', reserve.borrowCap.toString());

  console.log('\nRates & Indexes:');
  console.log('- Borrow Rate:', formatPercentage(reserve.variableBorrowRate));
  console.log('- Supply Rate:', formatPercentage(reserve.liquidityRate));
  console.log('- Base Variable Borrow Rate:', formatPercentage(reserve.baseVariableBorrowRate));
  console.log('- Optimal Usage Ratio:', formatPercentage(reserve.optimalUsageRatio));
  console.log('- Variable Rate Slope 1:', formatPercentage(reserve.variableRateSlope1));
  console.log('- Variable Rate Slope 2:', formatPercentage(reserve.variableRateSlope2));

  console.log('\nRisk Parameters:');
  console.log('- Collateral Factor:', formatBasisPoints(reserve.baseLTVasCollateral));
  console.log('- Liquidation Threshold:', formatBasisPoints(reserve.reserveLiquidationThreshold));
  console.log('- Liquidation Bonus:', formatBasisPoints(reserve.reserveLiquidationBonus));
  console.log('- Reserve Factor:', formatBasisPoints(reserve.reserveFactor));
  console.log('- Debt Ceiling:', reserve.debtCeiling.toString());

  console.log('\nStatus:');
  console.log('- Is Active:', reserve.isActive ? 'Yes' : 'No');
  console.log('- Is Frozen:', reserve.isFrozen ? 'Yes' : 'No');
  console.log('- Is Paused:', reserve.isPaused ? 'Yes' : 'No');
  console.log('- Borrowing Enabled:', reserve.borrowingEnabled ? 'Yes' : 'No');
  console.log('- Flash Loans Enabled:', reserve.flashLoanEnabled ? 'Yes' : 'No');
  console.log('- Usage As Collateral:', reserve.usageAsCollateralEnabled ? 'Enabled' : 'Disabled');
  console.log('- Borrowable In Isolation:', reserve.borrowableInIsolation ? 'Yes' : 'No');
  console.log('- Siloed Borrowing:', reserve.isSiloedBorrowing ? 'Yes' : 'No');

  console.log('\nPricing:');
  console.log('- Price Oracle:', reserve.priceOracle);
  console.log('- Price In Market Currency:', reserve.priceInMarketReferenceCurrency.toString());

  console.log('\nVirtual Account Info:');
  console.log('- Virtual Account Active:', reserve.virtualAccActive ? 'Yes' : 'No');
  console.log('- Virtual Balance:', reserve.virtualUnderlyingBalance.toString());
}

function displayBaseCurrencyInfo(info: BaseCurrencyInfo) {
  console.log('\nBase Currency Info:');
  console.log('- Market Reference Price (USD):', info.marketReferenceCurrencyPriceInUsd.toString());
  console.log('- Network Base Token Price (USD):', info.networkBaseTokenPriceInUsd.toString());
  console.log('- Network Base Token Price Decimals:', info.networkBaseTokenPriceDecimals);
}

// Main function to fetch and display pool data
async function main() {
  try {
    const moneyMarket = new MoneyMarketService();

    // Get list of reserves
    console.log('Fetching reserves list...');
    const reserves = await moneyMarket.getReservesList(
      MONEY_MARKET_CONFIG.uiPoolDataProvider as Address,
      MONEY_MARKET_CONFIG.poolAddressesProvider as Address,
      sonicTestnetEvmWallet,
    );
    console.log('Available Reserves:', reserves);

    // Get detailed reserve data
    console.log('\nFetching detailed reserve data...');
    const [reservesData, baseCurrencyInfo] = await moneyMarket.getReservesData(
      MONEY_MARKET_CONFIG.uiPoolDataProvider as Address,
      MONEY_MARKET_CONFIG.poolAddressesProvider as Address,
      sonicTestnetEvmWallet,
    );

    // Display data for each reserve
    for (const reserve of reservesData) {
      await displayReserveData(reserve);
    }

    // Display base currency info
    displayBaseCurrencyInfo(baseCurrencyInfo);

    const userAddress = argv[2] as Address;
    const [userReserves, eModeCategory] = await moneyMarket.getUserReservesData(
      userAddress,
      MONEY_MARKET_CONFIG.uiPoolDataProvider as Address,
      MONEY_MARKET_CONFIG.poolAddressesProvider as Address,
      sonicTestnetEvmWallet,
    );

    console.log('\nUser Position:');
    console.log('E-Mode Category:', eModeCategory);
    userReserves.forEach((reserve: UserReserveData) => {
      if (Number(reserve.scaledATokenBalance) > 0 || Number(reserve.scaledVariableDebt) > 0) {
        console.log(`\nAsset ${reserve.underlyingAsset}:`);
        console.log('- Supplied:', reserve.scaledATokenBalance);
        console.log('- Borrowed:', reserve.scaledVariableDebt);
        console.log('- Used as Collateral:', reserve.usageAsCollateralEnabledOnUser ? 'Yes' : 'No');
      }
    });
  } catch (error) {
    console.error('Error:', error);
  }
}

main();

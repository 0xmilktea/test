import { toHex, type Address, type Hash, type Hex } from 'viem';
import { EvmWalletAbstraction } from '../hub/index.js';
import type { EvmHubProvider } from '../../entities/index.js';
import { CWSpokeProvider } from '../../entities/cosmos/CWSpokeProvider.js';

export type CWSpokeDepositParams = {
  from: string; // The address of the user on the spoke chain
  token: string; // The address of the token to deposit
  amount: bigint; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit
};

export type TransferToHubParams = {
  token: string;
  recipient: Address;
  amount: string;
  data: Hex;
};

export class CWSpokeService {
  private constructor() {}

  /**
   * Deposit tokens to the spoke chain.
   * @param {CWSpokeDepositParams} params - The parameters for the deposit, including the user's address, token address, amount, and additional data.
   * @param {CWSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  public static async deposit(
    params: CWSpokeDepositParams,
    spokeProvider: CWSpokeProvider,
    hubProvider: EvmHubProvider,
  ): Promise<Hash> {
    const userWallet: Address = await EvmWalletAbstraction.getUserWallet(
      BigInt(spokeProvider.chainConfig.chain.id),
      toHex(Buffer.from(params.from, 'utf-8')),
      hubProvider,
    );

    return CWSpokeService.transfer(
      {
        token: params.token,
        recipient: userWallet,
        amount: params.amount.toString(),
        data: params.data,
      },
      spokeProvider,
    );
  }

  /**
   * Get the balance of the token in the spoke chain.
   * @param {Address} token - The address of the token to get the balance of.
   * @param {CWSpokeProvider} spokeProvider - The spoke provider.
   * @returns {Promise<bigint>} The balance of the token.
   */
  public static async getDeposit(token: String, spokeProvider: CWSpokeProvider): Promise<bigint> {
    let bal = await spokeProvider.getBalance(token);
    return BigInt(bal);
  }

  /**
   * Calls a contract on the spoke chain using the user's wallet.
   * @param {string} from - The address of the user on the spoke chain.
   * @param {Hex} payload - The payload to send to the contract.
   * @param {CWSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @param {EvmHubProvider} hubProvider - The provider for the hub chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  public static async callWallet(
    from: string,
    payload: Hex,
    spokeProvider: CWSpokeProvider,
    hubProvider: EvmHubProvider,
  ): Promise<Hash> {
    const userWallet: Address = await EvmWalletAbstraction.getUserWallet(
      BigInt(spokeProvider.chainConfig.chain.id),
      toHex(Buffer.from(from, 'utf-8')),
      hubProvider,
    );

    return CWSpokeService.call(BigInt(hubProvider.chainConfig.chain.id), userWallet, payload, spokeProvider);
  }

  /**
   * Transfers tokens to the hub chain.
   * @param {TransferToHubParams} params - The parameters for the transfer, including:
   *   - {string} token: The address of the token to transfer (use address(0) for native token).
   *   - {Uint8Array} recipient: The recipient address on the hub chain.
   *   - {string} amount: The amount to transfer.
   *   - {Uint8Array} [data=new Uint8Array([])]: Additional data for the transfer.
   * @param {CWSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  private static async transfer(
    { token, recipient, amount, data = `0x` }: TransferToHubParams,
    spokeProvider: CWSpokeProvider,
  ): Promise<Hash> {
    let sender = spokeProvider.chainConfig.wallet_address;
    console.log('Sender Wallet', sender);
    return CWSpokeProvider.deposit(sender, token, recipient, amount, data, spokeProvider);
  }

  /**
   * Sends a message to the hub chain.
   * @param {bigint} dstChainId - The chain ID of the hub chain.
   * @param {Address} dstAddress - The address on the hub chain.
   * @param {Hex} payload - The payload to send.
   * @param {CWSpokeProvider} spokeProvider - The provider for the spoke chain.
   * @returns {Promise<Hash>} A promise that resolves to the transaction hash.
   */
  private static async call(
    dstChainId: bigint,
    dstAddress: Hex,
    payload: Hex,
    spokeProvider: CWSpokeProvider,
  ): Promise<Hash> {
    let sender = spokeProvider.chainConfig.wallet_address;
    return spokeProvider.send_message(sender, dstChainId.toString(), dstAddress, payload);
  }
}

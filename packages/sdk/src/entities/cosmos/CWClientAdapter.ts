import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { NetworkEnv } from './Configs.js';
import { type ExecuteResult, type JsonObject, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { GasPrice, type StdFee } from '@cosmjs/stargate';
import {
  type Coin,
  MsgAuthzExec,
  MsgBroadcasterWithPk,
  MsgExecuteContract,
  MsgExecuteContractCompat,
  msgsOrMsgExecMsgs,
  PrivateKey,
  type TxResponse,
} from '@injectivelabs/sdk-ts';
import { Network } from '@injectivelabs/networks';
import { DEFAULT_GAS_LIMIT, INJ_DENOM } from '@injectivelabs/utils';
import type { CosmosChainConfig } from './Configs.js';

export class ExecuteResponse {
  public height: number | undefined;

  public transactionHash!: string;

  public static fromExecResult(res: ExecuteResult): ExecuteResponse {
    let response = new ExecuteResponse();
    response.height = res.height;
    response.transactionHash = res.transactionHash;
    return response;
  }

  public static fromTxResponse(res: TxResponse): ExecuteResponse {
    let response = new ExecuteResponse();
    response.height = res.height;
    response.transactionHash = res.txHash;
    return response;
  }
}

export class CWClientAdapter {
  private config!: CosmosChainConfig;
  private wallet!: DirectSecp256k1HdWallet;
  private signingClient!: SigningCosmWasmClient;
  private constructor() {}

  static async build(config: CosmosChainConfig): Promise<CWClientAdapter> {
    let adapter = new CWClientAdapter();
    adapter.config = config;
    adapter.wallet = await CWClientAdapter.getWallet(config.prefix, config.mnemonics);
    adapter.signingClient = await CWClientAdapter.getSigningClient(config.rpc_url, adapter.wallet, config.gas_price);
    return adapter;
  }

  static async getWallet(prefix: string, mnemonic: string): Promise<DirectSecp256k1HdWallet> {
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: prefix, // Change this according to your chain
    });
    return wallet;
  }

  static async getSigningClient(rpc_endpoint: string, wallet: DirectSecp256k1HdWallet, gas_price: string) {
    const client = await SigningCosmWasmClient.connectWithSigner(rpc_endpoint, wallet, {
      gasPrice: GasPrice.fromString(gas_price), // Adjust according to your chain
    });
    return client;
  }
  async execute(
    senderAddress: string,
    contractAddress: string,
    msg: JsonObject,
    fee: StdFee | 'auto' | number,
    memo?: string,
    funds: readonly Coin[] = [] as Coin[],
  ): Promise<ExecuteResponse> {
    if (this.config.chain.id == 19) {
      const msg_exec = MsgExecuteContract.fromJSON({
        contractAddress: contractAddress,
        sender: senderAddress,
        msg: msg,
        funds: funds as { amount: string; denom: string }[],
      });
      const privateKey = PrivateKey.fromMnemonic(this.config.mnemonics);
      const txHash = await new MsgBroadcasterWithPk({
        privateKey: privateKey,
        network: this.config.network == NetworkEnv.Mainnet ? Network.Mainnet : Network.Testnet,
      }).broadcast({
        msgs: msg_exec,
        gas: { gas: DEFAULT_GAS_LIMIT },
      });
      console.log('Sending via injective');
      return ExecuteResponse.fromTxResponse(txHash);
    } else {
      let res = await this.signingClient.execute(senderAddress, contractAddress, msg, fee, memo, funds);
      return ExecuteResponse.fromExecResult(res);
    }
  }

  async queryContractSmart(address: string, queryMsg: JsonObject): Promise<JsonObject> {
    return this.signingClient.queryContractSmart(address, queryMsg);
  }
}

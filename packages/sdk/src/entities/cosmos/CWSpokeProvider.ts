import { SigningCosmWasmClient, CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { coins, type Coin } from '@cosmjs/stargate';
import { CWClientAdapter } from './CWClientAdapter.js';
import type { CosmosChainConfig } from './Configs.js';
import { CW20Token } from './CW20Token.js';
import { fromHex, type Hex, type Hash, type ByteArray, type Address } from 'viem';

export type CWSpokeDepositParams = {
  from: string; // The address of the user on the spoke chain
  token: string; // The address of the token to deposit
  amount: string; // The amount of tokens to deposit
  data: Hex; // The data to send with the deposit
};

export interface Transfer {
  token: Uint8Array;
  from: Uint8Array;
  to: Uint8Array;
  amount: string; // u128 as string
  data: Uint8Array;
}

export interface InstantiateMsg {
  connection: string;
  rate_limit: string;
  hub_chain_id: string; // u128 as string
  hub_asset_manager: Uint8Array;
}

export interface ConnMsg {
  send_message?: {
    dst_chain_id: number;
    dst_address: Array<Number>;
    payload: Array<Number>;
  };
}

export interface ExecuteMsg {
  transfer?: {
    token: string;
    to: Array<Number>;
    amount: Number; // should be string for u128 , but in injective it fails in type conversion.
    data: Array<Number>;
  };
  recv_message?: {
    src_chain_id: string; // u128 as string
    src_address: Uint8Array;
    conn_sn: string; // u128 as string
    payload: Uint8Array;
    signatures: Uint8Array[];
  };
  set_rate_limit?: {
    rate_limit: string;
  };
  set_connection?: {
    connection: string;
  };
  set_owner?: {
    owner: string;
  };
}

export interface QueryMsg {
  get_state: {};
}

export interface State {
  connection: string;
  rate_limit: string;
  hub_asset_manager: Uint8Array;
  hub_chain_id: string; // u128 as string
  owner: string;
}

export class CWSpokeProvider {
  private walletProvider: CWClientAdapter | undefined;
  public chainConfig: CosmosChainConfig;

  constructor(conf: CosmosChainConfig) {
    this.chainConfig = conf;
  }

  async getAdapter(): Promise<CWClientAdapter> {
    if (this.walletProvider == undefined) {
      this.walletProvider = await CWClientAdapter.build(this.chainConfig);
    }
    return this.walletProvider;
  }

  // Query Methods
  async getState(): Promise<State> {
    let client_adapter = await this.getAdapter();
    return await client_adapter.queryContractSmart(this.chainConfig.addresses.assetManager, {
      get_state: {},
    });
  }

  async getBalance(token: String): Promise<number> {
    let client_adapter = await this.getAdapter();
    return await client_adapter.queryContractSmart(this.chainConfig.addresses.assetManager, {
      get_balance: { denom: token },
    });
  }

  // Execute Methods (requires SigningCosmWasmClient)

  private async transfer(
    senderAddress: string,
    token: string,
    to: Uint8Array,
    amount: string,
    data: Uint8Array = new Uint8Array(),
    funds: Coin[] = [],
  ): Promise<Hash> {
    const msg: ExecuteMsg = {
      transfer: {
        token,
        to: Array.from(to),
        amount: Number.parseInt(amount),
        data: Array.from(data),
      },
    };
    let client_adapter = await this.getAdapter();
    let res = await client_adapter.execute(
      senderAddress,
      this.chainConfig.addresses.assetManager,
      msg,
      'auto',
      undefined,
      funds,
    );
    return `0x${res.transactionHash}`;
  }

  async deposit_token(
    sender: string,
    token_address: string,
    to: Uint8Array,
    amount: string,
    data: Uint8Array = new Uint8Array(),
  ) {
    let adapter = await this.getAdapter();
    console.log('Transferring CW20 Token', token_address);
    let cw20_token = new CW20Token(adapter, token_address);
    await cw20_token.increaseAllowance(sender, this.chainConfig.addresses.assetManager, amount);
    return this.transfer(sender, token_address, to, amount, data);
  }

  static async deposit(
    sender: string,
    token_address: string,
    to: Address,
    amount: string,
    data: Hex = `0x`,
    provider: CWSpokeProvider,
  ): Promise<Hash> {
    let is_native = await provider.is_native(token_address);
    console.log(`${token_address} is Native ${is_native}`);
    let to_bytes = fromHex(to, 'bytes');
    let data_bytes = fromHex(data, 'bytes');

    if (is_native) {
      console.log('trying native deposit');
      return provider.deposit_native(sender, token_address, to_bytes, amount, data_bytes);
    } else {
      console.log('trying cw20 deposit');
      return provider.deposit_token(sender, token_address, to_bytes, amount, data_bytes);
    }
  }

  async deposit_native(
    sender: string,
    token: string,
    to: Uint8Array,
    amount: string,
    data: Uint8Array = new Uint8Array([2, 2, 2]),
  ) {
    let funds = coins(amount, token);
    return this.transfer(sender, token, to, amount, data, funds);
  }

  async is_native(token: string): Promise<boolean> {
    let is_native = true;
    let adapter = await this.getAdapter();
    let cw20_token = new CW20Token(adapter, token);
    try {
      let info = await cw20_token.getTokenInfo();
      is_native = false;
    } catch (err) {}
    return is_native;
  }

  async receiveMessage(
    senderAddress: string,
    srcChainId: string,
    srcAddress: Uint8Array,
    connSn: string,
    payload: Uint8Array,
    signatures: Uint8Array[],
  ): Promise<any> {
    const msg: ExecuteMsg = {
      recv_message: {
        src_chain_id: srcChainId,
        src_address: srcAddress,
        conn_sn: connSn,
        payload,
        signatures,
      },
    };
    let client_adapter = await this.getAdapter();
    return await client_adapter.execute(senderAddress, this.chainConfig.addresses.assetManager, msg, 'auto');
  }

  async setRateLimit(senderAddress: string, rateLimit: string): Promise<any> {
    const msg: ExecuteMsg = {
      set_rate_limit: {
        rate_limit: rateLimit,
      },
    };
    let client_adapter = await this.getAdapter();
    return await client_adapter.execute(senderAddress, this.chainConfig.addresses.assetManager, msg, 'auto');
  }

  async setConnection(senderAddress: string, connection: string): Promise<any> {
    const msg: ExecuteMsg = {
      set_connection: {
        connection,
      },
    };
    let client_adapter = await this.getAdapter();
    return await client_adapter.execute(senderAddress, this.chainConfig.addresses.assetManager, msg, 'auto');
  }

  async setOwner(senderAddress: string, owner: string): Promise<any> {
    const msg: ExecuteMsg = {
      set_owner: {
        owner,
      },
    };
    let client_adapter = await this.getAdapter();
    return await client_adapter.execute(senderAddress, this.chainConfig.addresses.assetManager, msg, 'auto');
  }

  async send_message(sender: string, dst_chain_id: string, dst_address: Hex, payload: Hex): Promise<Hash> {
    const msg: ConnMsg = {
      send_message: {
        dst_chain_id: Number.parseInt(dst_chain_id),
        dst_address: Array.from(fromHex(dst_address, 'bytes')),
        payload: Array.from(fromHex(payload, 'bytes')),
      },
    };
    console.log(`Sending Message: ${JSON.stringify(msg)}`);

    let client_adapter = await this.getAdapter();
    let res = await client_adapter.execute(sender, this.chainConfig.addresses.connection, msg, 'auto');
    return `0x${res.transactionHash}`;
  }

  // Helper Methods
  static stringToUint8Array(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  static uint8ArrayToString(arr: Uint8Array): string {
    return new TextDecoder().decode(arr);
  }

  static toBigIntString(num: number | bigint): string {
    return num.toString();
  }
}

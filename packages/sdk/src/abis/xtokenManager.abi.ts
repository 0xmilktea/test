export const xtokenManagerAbi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'fromToken',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: 'toToken',
        type: 'bytes',
      },
      {
        internalType: 'bytes',
        name: 'to',
        type: 'bytes',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'transfer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

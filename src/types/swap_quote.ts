export type SwapQuote = {
  inAmount: string;
  outAmount: string;
  coupon: {
    chainId: number;
    account: string;
    raw: {
      executionInformation: {
        trade: {
          data: string;
          value: string;
          to: string;
          chainId: number;
        };
        approvals: {
          approvee: string;
          amount: string;
          chainId: number;
          address: string;
        }[];
      };
      quote: {
        sellAmount: string;
        buyAmount: string;
        estimatedGas: string;
        gasPrice: string;
        priceImpact: number;
        trade: {
          to: string;
          data: string;
          value: string;
        };
        permit2: {
          types: {
            PermitSingle: {
              name: string;
              type: string;
            }[];
            PermitDetails: {
              name: string;
              type: string;
            }[];
          };
          domain: {
            name: string;
            chainId: number;
            verifyingContract: string;
          };
          message: {
            details: {
              token: string;
              amount: string;
              expiration: string;
              nonce: string;
            };
            spender: string;
            sigDeadline: string;
          };
          primaryType: string;
        };
      };
    };
  };
  candidateTrade: {
    data: string;
    value: string;
    to: string;
    chainId: number;
  };
  slippage: number;
  fees: {
    gas: string;
  };
  chainId: number;
  market: string;
  isExactIn: boolean;
  inToken: {
    chainId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    tags: unknown[];
    logoURI: string;
  };
  outToken: {
    chainId: number;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    tags: unknown[];
    logoURI: string;
  };
  amountRatio: number;
  tokenInUsdValue: number;
  gasInUsdValue: number;
  inUsdValue: number;
  tokenOutUsdValue: number;
  outUsdValue: number;
  timestamp: number;
};
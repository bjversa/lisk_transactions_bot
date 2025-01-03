export type PoolAsset = {
  cToken: string;
  underlyingToken: string;
  underlyingName: string;
  underlyingSymbol: string;
  underlyingDecimals: bigint;
  underlyingBalance: number;
  supplyRatePerBlock: number;
  borrowRatePerBlock: number;
  totalSupply: number;
  totalBorrow: number;
  supplyBalance: number;
  borrowBalance: bigint;
  liquidity: number;
  membership: boolean;
  exchangeRate: number;
  underlyingPrice: number;
  oracle: string;
  collateralFactor: number;
  reserveFactor: number;
  adminFee: number;
  ionicFee: number;
  borrowGuardianPaused: boolean;
  mintGuardianPaused: boolean;
};
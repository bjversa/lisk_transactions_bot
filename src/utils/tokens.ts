
enum Token {
  USDT = "USDT",
  USDC = "USDC",
  WETH = "WETH",
  ETH = "ETH"
}

const tokens: Record<Token, string> = {
  [Token.USDT]: "0x05D032ac25d322df992303dCa074EE7392C117b9",
  [Token.USDC]: "0xF242275d3a6527d877f2c927a82D9b057609cc71",
  [Token.WETH]: "0x4200000000000000000000000000000000000006",
  [Token.ETH]: "0x0000000000000000000000000000000000000000",
}

export {
  tokens,
  Token
}
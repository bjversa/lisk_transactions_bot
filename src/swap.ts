import axios from "axios";
import Web3, { Web3Account } from "web3";
import { SwapQuote } from "./types/swap_quote";
import { GasService } from "./gas";


export class SwapService {
  constructor(private readonly client: Web3) { }

  async fetchBestSwapRoute(account: Web3Account, inTokenAddress: string, outTokenAddress: string, value: number): Promise<SwapQuote> {
    const response = await axios.post("https://canoe.v2.icarus.tools/market/usor/swap_quote", {
      "chain": "lisk",
      "account": account.address,
      "inTokenAddress": inTokenAddress,
      "outTokenAddress": outTokenAddress,
      "isExactIn": true,
      "slippage": 50,
      "inTokenAmount": value.toString(),
    }, {
      headers: {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "content-type": "application/json",
        "Referer": "https://oku.trade/",
        "Referrer-Policy": "strict-origin-when-cross-origin"
      }
    });

    const bestSwapRoute = response.data;
    return bestSwapRoute;
  }

  async performSwap(account: Web3Account, bestSwapRoute: SwapQuote) {
    const {
      inAmount,
      outAmount,
      inToken,
      outToken,
      gasInUsdValue,
      fees,
      candidateTrade,
      coupon
    } = bestSwapRoute;

    console.log(`Performing swap of ${inAmount} ${inToken.symbol} for ${outAmount} ${outToken.symbol}`)

    const gasService = new GasService(this.client);

    const { estimatedGas: gasCost, gasPrice } = await gasService.estimateGasCosts({	
      from: account.address,	
      to: candidateTrade.to,	
      value: candidateTrade.value,	
      data: candidateTrade.data,	
    });

    console.log(`Estimated gas cost: ${gasCost} / Estimated gas price: ${await this.client.eth.getGasPrice()}`)

    const swap = await this.client.eth.accounts.signTransaction({
      to: candidateTrade.to,
      value: candidateTrade.value,
      gas: gasCost,
      gasPrice: gasPrice,
      data: candidateTrade.data,
      nonce: await this.client.eth.getTransactionCount(account.address),
    }, account.privateKey);

    const receipt = await this.client.eth.sendSignedTransaction(swap.rawTransaction)
    const hash = receipt.transactionHash
    return hash.toString();
  }

  async loopSwap(account: Web3Account, inTokenAddress: string, outTokenAddress: string, amount: number, value: number) {
    let inToken = inTokenAddress
    let outToken = outTokenAddress

    for (let i = 0; i < amount; i++) {
      const bestSwapRoute = await this.fetchBestSwapRoute(account, inToken, outToken, value)
      const hash = await this.performSwap(account, bestSwapRoute)
      inToken = bestSwapRoute.outToken.address
      outToken = bestSwapRoute.inToken.address

      console.log('Swap performed with hash:', hash)
      if (i === amount - 1) {
        console.log('Last swap performed')
        break
      }
      console.log('Waiting 5 seconds before performing next swap')
      console.log('--------------------------------------------\n\n')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }

    console.log('All swaps performed')
  }
}
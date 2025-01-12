import axios from "axios";
import { SwapQuote } from "./types/swap_quote";
import { GasService } from "./gas";
import { ContractService } from "./contract";
import {
  AllowanceProvider,
  AllowanceTransfer,
  PERMIT2_ADDRESS,
  PermitSingle,
  MaxAllowanceTransferAmount
} from '@uniswap/permit2-sdk';
import { ethers, providers, Wallet } from "ethers";
import { config, contracts } from "./utils/config";


export class SwapService {
  constructor(
    private readonly provider: providers.Provider,
    private readonly account: Wallet,
    private readonly contractService: ContractService,
    private readonly gasService: GasService
  ) { }

  async fetchBestSwapRoute(account: Wallet, inTokenAddress: string, outTokenAddress: string, value: number): Promise<SwapQuote> {
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

  async performSwap(account: Wallet, bestSwapRoute: SwapQuote) {
    const {
      inAmount,
      outAmount,
      inToken,
      outToken,
      candidateTrade,
    } = bestSwapRoute;

    console.log(`Performing swap of ${inAmount} ${inToken.symbol} for ${outAmount} ${outToken.symbol}`)

    const { estimatedGas: gasCost, gasPrice } = await this.gasService.estimateGasCosts({
      from: account.address,
      to: candidateTrade.to,
      value: candidateTrade.value,
      data: candidateTrade.data,
    });

    // console.log(`Estimated gas cost: ${gasCost} / Estimated gas price: ${await this.provider.getGasPrice()}`)

    const swap = await this.account.signTransaction({
      from: account.address,
      to: candidateTrade.to,
      value: candidateTrade.value,
      chainId: config.chainId,
      gasPrice,
      gasLimit: gasCost,
      data: candidateTrade.data,
      nonce: await this.provider.getTransactionCount(account.address, 'latest')
    });

    const receipt = await this.provider.sendTransaction(swap);
    const hash = receipt.hash;
    console.log('Swap performed with hash:', hash)
    return hash.toString();
  }

  async loopSwap(account: Wallet, inTokenAddress: string, outTokenAddress: string, amount: number, value: number) {
    let inToken = inTokenAddress
    let outToken = outTokenAddress

    // const inTokenContract = this.contractService.getContract(inToken)
    // const outTokenContract = this.contractService.getContract(outToken)

    for (let i = 0; i < 1; i++) {
      const bestSwapRoute = await this.fetchBestSwapRoute(account, "0xac485391EB2d7D88253a7F1eF18C37f4242D1A24", outToken, value)
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

  async swapPermit2Approval(account: Wallet, tokenAddress: string, value: number) {
    const allowanceProvider = new AllowanceProvider(this.provider, contracts.permit2Address);
    const { amount, expiration, nonce } = await allowanceProvider.getAllowanceData(
      tokenAddress, 
      account.address, 
      contracts.swapSpenderAddress
    );


    if (amount.gte(MaxAllowanceTransferAmount)) {
      console.log('Allowance already set');
      return true;
    }

    if (expiration > Date.now()) {
      console.log('Allowance not expired');
      return true;
    }

    const toDeadline = (expiration: number) => Math.floor((Date.now() + expiration) / 100);

    const permitSingle: PermitSingle = {
      spender: contracts.swapSpenderAddress,
      details: {
        amount: MaxAllowanceTransferAmount.toString(),
        nonce,
        expiration: toDeadline(1000 * 60 * 60 * 24 * 30),
        token: tokenAddress
      },
      sigDeadline: toDeadline(1000 * 60 * 60 * 24 * 30)
    }

    const { domain, types, values } = AllowanceTransfer.getPermitData(permitSingle, contracts.permit2Address, config.chainId);
    
    const signature = await account._signTypedData(domain, types, values);

    const permitAbiMock = [
      'function permit(address owner, tuple(tuple(address token,uint160 amount,uint48 expiration,uint48 nonce) details, address spender,uint256 sigDeadline) permitSingle, bytes calldata signature)',
    ];

    const permitContract = new ethers.Contract(contracts.permit2Address, permitAbiMock, account);
    const gasPrice = await this.provider.getGasPrice();


    const response = await permitContract.permit(account.address, permitSingle, signature, {
      gasLimit: 500000,
      gasPrice
    });

    if (!response){
      throw new Error('Permit failed');
    }

    const tokenContract = await this.contractService.getContract(tokenAddress);
    const allowance = await tokenContract.allowance(account.address, contracts.swapSpenderAddress);

    console.log(allowance)

    if (allowance > 0) {
      return true;
    }

    const approveResponse = await tokenContract.approve(contracts.swapSpenderAddress, MaxAllowanceTransferAmount, {
      gasLimit: 500000,
      gasPrice
    });


    if (!approveResponse) {
      throw new Error('Approve failed');
    }

    return true;
  }


}
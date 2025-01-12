import { config } from "./src/utils/config";
import { getPromptAnswer } from "./src/utils/prompts";
import { Token, tokens } from "./src/utils/tokens";
import { SwapService } from './src/swap';
import { LendAndBorrowService } from './src/lend_and_borrow';
import { ContractService } from './src/contract';
import { GasService } from './src/gas';
import { ethers } from "ethers";

async function main() {
  try {
    if (!process.env.PK) {
      throw new Error('Missing PK')
    }

    const { action, pair, amount } = await getPromptAnswer();

    const [inTokenSymbol, outTokenSymbol] = pair.split('/') as [Token, Token];

    const defaultInTokenAddress = tokens[inTokenSymbol];
    const defaultOutTokenAddress = tokens[outTokenSymbol];

    const provider = new ethers.providers.JsonRpcProvider(config.rpc);
    const account = new ethers.Wallet(process.env.PK, provider);

    const contractService = new ContractService(provider);
    const gasService = new GasService(provider);

    switch (action) {
      case 'Swap':
        const swapService = new SwapService(provider, account, contractService, gasService);
        const SWAP_VALUE = 0.05; // $0.05
        const couldSetAllowance = await swapService.swapPermit2Approval(account, defaultInTokenAddress, SWAP_VALUE);
        if (!couldSetAllowance) {
          console.error('Could not set allowance')
          process.exit(1)
        }
        await swapService.loopSwap(account, defaultInTokenAddress, defaultOutTokenAddress, amount, SWAP_VALUE)
        break;
      case 'Lend/Borrow':
        const lendAndBorrowService = new LendAndBorrowService(provider, contractService, gasService);

        // await lendAndBorrowService.lend(account, defaultInTokenAddress, 1);
        // await lendAndBorrowService.enableCollateral(account, defaultInTokenAddress);
        await lendAndBorrowService.borrow(account, defaultInTokenAddress);
        // await lendAndBorrowService.repay(account, defaultInTokenAddress);

        break;

      default:
        break;


    }

  } catch (error) {
    console.error(error)
  }

}

/**
 * {
    "details": {
        "token": "0xac485391EB2d7D88253a7F1eF18C37f4242D1A24",
        "amount": "1461501637330902918203684832716283019655932542975",
        "expiration": "1737241755",
        "nonce": "0"
    },
    "spender": "0x447b8e40b0cda8e55f405c86bc635d02d0540ab8",
    "sigDeadline": "1736638755"
}
 */

main()
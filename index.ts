import { Web3, HttpProvider, Web3Account } from 'web3'
import { config } from "./src/utils/config";
import { getPromptAnswer } from "./src/utils/prompts";
import { Token, tokens } from "./src/utils/tokens";
import { SwapService } from './src/swap';
import { LendAndBorrowService } from './src/lend_and_borrow';
import { ContractService } from './src/contract';

async function getAccount(client: Web3) {
  const pk = process.env.PK;
  const account = client.eth.accounts.privateKeyToAccount(`0x${pk}`)
  return account
}

async function main() {
  try {

    const { action, pair, amount } = await getPromptAnswer();

    const [inTokenSymbol, outTokenSymbol] = pair.split('/') as [Token, Token];

    const defaultInTokenAddress = tokens[inTokenSymbol];
    const defaultOutTokenAddress = tokens[outTokenSymbol];

    const client = new Web3(new HttpProvider(config.rpc))
    const account = await getAccount(client)

    switch (action) {
      case 'Swap':
        const swapService = new SwapService(client);
        const SWAP_VALUE = 1.0; // $1
        await swapService.loopSwap(account, defaultInTokenAddress, defaultOutTokenAddress, amount, SWAP_VALUE)
        break;
      case 'Lend/Borrow':
        const contractService = new ContractService(client);
        const lendAndBorrowService = new LendAndBorrowService(client, contractService);

        await lendAndBorrowService.lend(account, defaultInTokenAddress, 1);
        await lendAndBorrowService.enableCollateral(account, defaultInTokenAddress);
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

main()
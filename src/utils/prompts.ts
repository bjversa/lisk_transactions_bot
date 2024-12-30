import inquirer from "inquirer";
import { tokens } from "./tokens";

type Token = keyof typeof tokens;

type TPromptAnswers = {
  action: 'Swap' | 'Lend/Borrow' | 'Liquidity (Soon)';
  pair: `${Token}/${Token}`;
  amount: number
}

async function prompt(): Promise<TPromptAnswers> {
  const actions = ['Swap', 'Lend/Borrow', 'Liquidity (Soon)'];

  return inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: actions
    },
    {
      type: "list",
      name: "pair",
      message: "Select a token pair",
      choices: [
        "USDT/USDC",
        // "USDT/WETH",
      ],
      when: (answers) => answers.action === "Swap"
    },
    {
      type: "input",
      name: "amount",
      message: "Enter the amount of times you would like to swap",
      default: "3",
      validate: (value) => {
        if (isNaN(Number(value)) || Number(value) <= 0) {
          return 'Please enter a valid number greater than 0';
        }

        if (Number(value) > 50) {
          return 'Amount too high';
        }

        return true;
      },
      when: (answers) => answers.action === "Swap"
    },
    {
      type: "list",
      name: "pair",
      message: "Select a token pair",
      choices: [
        "USDT/WETH",
        // "USDT/WETH",
      ],
      when: (answers) => answers.action === "Lend/Borrow"
    },
  ]).then(answers => {
    return answers;
  });
}

async function getPromptAnswer() {
  return await prompt();
}


export {
  getPromptAnswer
}
import Web3, { Transaction } from "web3";


export class GasService {
  constructor(
    private readonly client: Web3
  ) { }

  async estimateGasCosts(transaction: Transaction) {
    const estimatedGas = await this.client.eth.estimateGas(transaction);

    const gasPrice = await this.client.eth.getGasPrice();

    return {
      estimatedGas,
      gasPrice
    }
  }
}
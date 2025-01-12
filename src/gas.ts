import { providers, Transaction } from "ethers";


export class GasService {
  constructor(
    private readonly provider: providers.Provider,
  ) { }

  async estimateGasCosts(transaction: providers.TransactionRequest) {
    console.log('AQUI')
    const estimatedGas = await this.provider.estimateGas(transaction);

    const gasPrice = await this.provider.getGasPrice();

    console.log('AQUI 2')
    return {
      estimatedGas,
      gasPrice
    }
  }
}
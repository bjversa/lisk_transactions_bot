import { providers, Transaction } from "ethers";


export class GasService {
  constructor(
    private readonly provider: providers.Provider,
  ) { }

  async estimateGasCosts(transaction: providers.TransactionRequest) {
    const estimatedGas = await this.provider.estimateGas(transaction);
    const gasPrice = await this.provider.getGasPrice();

    return {
      estimatedGas,
      gasPrice
    }
  }
}
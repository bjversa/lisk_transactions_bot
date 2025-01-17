import axios from "axios";
import { Contract, providers } from "ethers";

export class ContractService {
  private readonly baseApiUrl = "https://blockscout.lisk.com/api/v2";

  constructor(
    private readonly provider: providers.Provider
  ) { };

  async getContract(contractAddress: string) {
    const response = await axios.get(`${this.baseApiUrl}/smart-contracts/${contractAddress}`);
    
    if (!response.data) {
      throw new Error("Contract not found");
    }

    const abi = response.data.abi;

    if (!abi) {
      throw new Error("Contract ABI not found");
    }

    const contract = new Contract(contractAddress, abi, this.provider);

    return contract;
  }


}
import axios from "axios";
import Web3, { Contract } from "web3";


export class ContractService {
  private readonly baseApiUrl = "https://blockscout.lisk.com/api/v2";

  constructor(
    private readonly client: Web3
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

    const contract = new this.client.eth.Contract(abi, contractAddress);

    return contract;
  }


}
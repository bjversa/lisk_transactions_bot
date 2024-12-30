import Web3, { Web3Account } from "web3";
import { ContractService } from "./contract";
import { config, contracts } from "./utils/config";
import { GasService } from "./gas";
import { PoolAsset } from "./types/pool_assets";
import { maxUint256, parseUnits } from "viem";

export class LendAndBorrowService {
  constructor(
    private readonly client: Web3,
    private readonly contractService: ContractService
  ) { }

  private async approveLend(account: Web3Account, tokenAddress: string, value: number) {
    console.log(`Approving ${value} tokens of ${tokenAddress} to be lent`);
    const contract = await this.contractService.getContract(contracts.approveLendContractAddress);

    const transactionData = contract.methods.approve(
      contracts.lendContractProxyAddress,
      value * 10 ** 6
    ).encodeABI();

    const gasService = new GasService(this.client);

    const tx = {
      from: account.address,
      to: contracts.approveLendContractAddress,
      data: transactionData,
    }

    console.log('Estimating gas costs');

    const { estimatedGas: gasCost, gasPrice } = await gasService.estimateGasCosts(tx);

    console.log(`Estimated gas cost: ${gasCost} / Estimated gas price: ${gasPrice}`);

    console.log('Signing transaction');
    const signedTx = await this.client.eth.accounts.signTransaction({
      from: account.address,
      to: contracts.approveLendContractAddress,
      data: transactionData,
      gas: gasCost,
      gasPrice,
      nonce: await this.client.eth.getTransactionCount(account.address),
    }, account.privateKey);

    const receipt = await this.client.eth.sendSignedTransaction(signedTx.rawTransaction);

    console.log('Transaction hash:', receipt.transactionHash)
    console.log('\n\n');
    return receipt.transactionHash;
  }

  private async executeLend(account: Web3Account, tokenAddress: string, value: number) {
    console.log(`Lending ${value} tokens of ${tokenAddress}`);
    const contract = await this.contractService.getContract(contracts.lendContractImplementationAddress);

    const transactionData = contract.methods.mint(
      value * 10 ** 6
    ).encodeABI();

    const gasService = new GasService(this.client);

    const tx = {
      from: account.address,
      to: contracts.lendContractProxyAddress,
      data: transactionData,
    }

    console.log('Estimating gas costs');

    const { estimatedGas: gasCost, gasPrice } = await gasService.estimateGasCosts(tx);

    console.log(`Estimated gas cost: ${gasCost} / Estimated gas price: ${gasPrice}`);

    console.log('Signing transaction');
    const signedTx = await this.client.eth.accounts.signTransaction({
      from: account.address,
      to: contracts.lendContractProxyAddress,
      data: transactionData,
      gas: gasCost,
      gasPrice,
      nonce: await this.client.eth.getTransactionCount(account.address),
    }, account.privateKey);

    const receipt = await this.client.eth.sendSignedTransaction(signedTx.rawTransaction);

    console.log('Transaction hash:', receipt.transactionHash)
    return receipt.transactionHash;
  }

  async lend(account: Web3Account, tokenAddress: string, value: number) {
    const { balance, underlyingDecimals } = await this.getUserBalance(account, tokenAddress);

    if (balance < parseUnits(value.toString(), Number(underlyingDecimals))) {
      console.error('Insufficient balance');
      throw new Error('Insufficient balance');
    }

    await this.approveLend(account, tokenAddress, value);
    await this.executeLend(account, tokenAddress, value);
  }

  async enableCollateral(account: Web3Account, tokenAddress: string) {
    console.log(`Enabling ${tokenAddress} as collateral`);
    const contract = await this.contractService.getContract(contracts.enableCollateralImplementationAddress);

    const transactionData = contract.methods.enterMarkets(
      [contracts.ionUSDTAddress]
    ).encodeABI();

    const gasService = new GasService(this.client);

    const tx = {
      from: account.address,
      to: contracts.enableCollateralProxyAddress,
      data: transactionData,
    }

    console.log('Estimating gas costs');

    const { estimatedGas: gasCost, gasPrice } = await gasService.estimateGasCosts(tx);

    console.log(`Estimated gas cost: ${gasCost} / Estimated gas price: ${gasPrice}`);

    console.log('Signing transaction');
    const signedTx = await this.client.eth.accounts.signTransaction({
      from: account.address,
      to: contracts.enableCollateralProxyAddress,
      data: transactionData,
      gas: gasCost,
      gasPrice,
      nonce: await this.client.eth.getTransactionCount(account.address),
    }, account.privateKey);

    const receipt = await this.client.eth.sendSignedTransaction(signedTx.rawTransaction);

    console.log('Transaction hash:', receipt.transactionHash)
    return receipt.transactionHash;
  }

  async borrow(account: Web3Account, tokenAddress: string) {
    const borrowContract = await this.contractService.getContract(contracts.borrowContractImplementationAddress);
    const minBorrowAmount = await this.getMinBorrowAmount(account);

    const transactionData = borrowContract.methods.borrow(
      this.client.utils.toWei(minBorrowAmount.toString(), 'ether'),
    ).encodeABI();

    const gasService = new GasService(this.client);

    const tx = {
      from: account.address,
      to: contracts.borrowContractProxyAddress,
      data: transactionData,
    }

    console.log('Estimating gas costs');

    const { estimatedGas: gasCost, gasPrice } = await gasService.estimateGasCosts(tx);

    console.log(`Estimated gas cost: ${gasCost} / Estimated gas price: ${gasPrice}`);

    console.log('Signing transaction');
    const signedTx = await this.client.eth.accounts.signTransaction({
      from: account.address,
      to: contracts.borrowContractProxyAddress,
      data: transactionData,
      gas: gasCost,
      gasPrice,
      nonce: await this.client.eth.getTransactionCount(account.address),
    }, account.privateKey);

    const receipt = await this.client.eth.sendSignedTransaction(signedTx.rawTransaction);

    console.log('Transaction hash:', receipt.transactionHash)
    return receipt.transactionHash;
  }

  async repay(account: Web3Account, tokenAddress: string) {
    const borrowedTokenData = await this.getAccountPoolInfo(account);

    const borrowBalance = borrowedTokenData.borrowBalance;
    const underlyingDecimals = borrowedTokenData.underlyingDecimals;
    const underlyingToken = borrowedTokenData.underlyingToken;

    const balance = await this.getUserBalance(account, borrowedTokenData.underlyingToken);

    if (borrowBalance === 0n) {
      console.log('No borrow balance to repay');
      return;
    }


    // const balance = await this.getBalanceForRepay(account, borrowedTokenData.underlyingToken);
    await this.approveRepay(account, tokenAddress, borrowBalance);
    await this.repayBorrow(account, tokenAddress, borrowBalance);

    return;
  }

  private async getUserBalance(account: Web3Account, tokenAddress: string) {
    const contract = await this.contractService.getContract(tokenAddress);

    const symbol = await contract.methods.symbol().call();
    const underlyingDecimals = await contract.methods.decimals().call() as bigint;

    const balance = await contract.methods.balanceOf(account.address).call({
      from: account.address
    }) as bigint;

    console.log('User balance for', symbol, ':', balance);

    return {
      balance,
      underlyingDecimals
    };
  }

  private async getMinBorrowAmount(account: Web3Account) {
    const contract = await this.contractService.getContract(contracts.feeDistributorImplementationAddress);

    const data = contract.methods.getMinBorrowEth(
      contracts.ionWETHAddress
    ).encodeABI();

    const minBorrowAmount = await this.client.eth.call({
      to: contracts.feeDistributorProxyAddress,
      from: account.address,
      data,
    });

    const minBorrowAmountInEth = this.client.utils.fromWei(minBorrowAmount, 'ether');
    console.log('Min borrow amount in ETH:', minBorrowAmountInEth);
    return minBorrowAmountInEth;
  }

  private async getAccountPoolInfo(account: Web3Account) {
    const contract = await this.contractService.getContract(contracts.poolLensAddress);

    const accountPoolInfo = await contract.methods.getPoolAssetsWithData(
      contracts.comptrollerAddress
    ).call({
      from: account.address
    })

    if (!accountPoolInfo) {
      throw new Error('Account pool info not found');
    }

    const dataByToken = (accountPoolInfo as PoolAsset[]).find(i => i.underlyingSymbol === "WETH");

    if (!dataByToken) {
      throw new Error('Account pool info for WETH not found');
    }

    return dataByToken;
  }

  private async approveRepay(account: Web3Account, tokenAddress: string, value: bigint) {
    console.log(`Approving ${value} tokens of ${tokenAddress} to be repaid`);
    const contract = await this.contractService.getContract(contracts.wethAddress);

    const transactionData = contract.methods.approve(
      contracts.ionWETHAddress,
      value
    ).encodeABI();

    const gasService = new GasService(this.client);

    const tx = {
      from: account.address,
      to: contracts.wethAddress,
      data: transactionData,
    }

    console.log('Estimating gas costs');

    const { estimatedGas: gasCost, gasPrice } = await gasService.estimateGasCosts(tx);

    console.log(`Estimated gas cost: ${gasCost} / Estimated gas price: ${gasPrice}`);

    console.log('Signing transaction');
    const signedTx = await this.client.eth.accounts.signTransaction({
      from: account.address,
      to: contracts.wethAddress,
      data: transactionData,
      gas: gasCost,
      gasPrice,
      nonce: await this.client.eth.getTransactionCount(account.address),
    }, account.privateKey);

    const receipt = await this.client.eth.sendSignedTransaction(signedTx.rawTransaction);

    console.log('Transaction hash:', receipt.transactionHash)
    console.log('\n\n');
    return receipt.transactionHash;
  }

  private async repayBorrow(account: Web3Account, tokenAddress: string, value: bigint) {
    console.log(`Repaying ${value} tokens of ${tokenAddress}`);
    const contract = await this.contractService.getContract(contracts.borrowContractImplementationAddress);

    const transactionData = contract.methods.repayBorrow(
      value
    ).encodeABI();

    try {
      const gasService = new GasService(this.client);

      const tx = {
        from: account.address,
        to: contracts.borrowContractProxyAddress,
        data: transactionData,
      }

      console.log('Estimating gas costs');

      const { estimatedGas: gasCost, gasPrice } = await gasService.estimateGasCosts(tx);

      console.log(`Estimated gas cost: ${gasCost} / Estimated gas price: ${gasPrice}`);

      console.log('Signing transaction');
      const signedTx = await this.client.eth.accounts.signTransaction({
        from: account.address,
        to: contracts.borrowContractProxyAddress,
        data: transactionData,
        gas: gasCost,
        gasPrice,
        nonce: await this.client.eth.getTransactionCount(account.address),
      }, account.privateKey);

      const receipt = await this.client.eth.sendSignedTransaction(signedTx.rawTransaction);

      console.log('Transaction hash:', receipt.transactionHash)
      return receipt.transactionHash;
    } catch (error) {
      console.error('Error repaying borrow:', error);
    }
  }
}
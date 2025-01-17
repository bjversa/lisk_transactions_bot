import { ContractService } from "./contract";
import { config, contracts } from "./utils/config";
import { GasService } from "./gas";
import { PoolAsset } from "./types/pool_assets";
import { maxUint256, parseUnits } from "viem";
import { ethers, providers, Wallet } from "ethers";

export class LendAndBorrowService {
  constructor(
    private readonly provider: providers.Provider,
    private readonly account: Wallet,
    private readonly contractService: ContractService,
    private readonly gasService: GasService
  ) { }

  private async approveLend(tokenAddress: string, value: number) {
    console.log(`Approving ${value} tokens of ${tokenAddress} to be lent`);
    const contract = await this.contractService.getContract(contracts.approveLendContractAddress);

    const transactionData = await contract.populateTransaction.approve(
      contracts.lendContractProxyAddress,
      value * 10 ** 6
    );

    const tx = {
      from: this.account.address,
      to: contracts.approveLendContractAddress,
      data: transactionData.data,
    }
    

    console.log('Estimating gas costs');

    const { estimatedGas: gasCost, gasPrice } = await this.gasService.estimateGasCosts(tx);

    console.log(`Estimated gas cost: ${gasCost} / Estimated gas price: ${gasPrice}`);

    console.log('Signing transaction');
    const signedTx = await this.account.signTransaction({
      from: this.account.address,
      to: contracts.approveLendContractAddress,
      data: transactionData.data,
      gasLimit: gasCost,
      gasPrice,
      chainId: config.chainId,
      nonce: await this.provider.getTransactionCount(this.account.address),
    });

    const receipt = await this.provider.sendTransaction(signedTx);

    console.log('Transaction hash:', receipt.hash)
    console.log('\n');
    return receipt.hash;
  }

  private async executeLend(tokenAddress: string, value: number) {
    console.log(`Lending ${value} tokens of ${tokenAddress}`);
    const contract = await this.contractService.getContract(contracts.lendContractImplementationAddress);

    const transactionData = await contract.populateTransaction.mint(
      value * 10 ** 6
    )

    const tx = {
      from: this.account.address,
      to: contracts.lendContractProxyAddress,
      data: transactionData.data,
    }

    console.log('Estimating gas costs');

    const { estimatedGas: gasCost, gasPrice } = await this.gasService.estimateGasCosts(tx);

    console.log(`Estimated gas cost: ${gasCost} / Estimated gas price: ${gasPrice}`);

    console.log('Signing transaction');
    const signedTx = await this.account.signTransaction({
      from: this.account.address,
      to: contracts.lendContractProxyAddress,
      data: transactionData.data,
      gasLimit: gasCost,
      gasPrice,
      chainId: config.chainId,
      nonce: await this.provider.getTransactionCount(this.account.address),
    });

    const receipt = await this.provider.sendTransaction(signedTx);

    console.log('Transaction hash:', receipt.hash)
    return receipt.hash;
  }

  async lend(tokenAddress: string, value: number) {
    const { balance, underlyingDecimals } = await this.getUserBalance(tokenAddress);

    if (balance < parseUnits(value.toString(), Number(underlyingDecimals))) {
      console.error('Insufficient balance');
      throw new Error('Insufficient balance');
    }

    await this.approveLend(tokenAddress, value);
    await this.executeLend(tokenAddress, value);
  }

  async enableCollateral(tokenAddress: string) {
    console.log(`Enabling ${tokenAddress} as collateral`);
    const contract = await this.contractService.getContract(contracts.enableCollateralImplementationAddress);

    const transactionData = contract.methods.enterMarkets(
      [contracts.ionUSDTAddress]
    ).encodeABI();

    const tx = {
      from: this.account.address,
      to: contracts.enableCollateralProxyAddress,
      data: transactionData,
    }

    console.log('Estimating gas costs');

    const { estimatedGas: gasCost, gasPrice } = await this.gasService.estimateGasCosts(tx);

    console.log(`Estimated gas cost: ${gasCost} / Estimated gas price: ${gasPrice}`);

    console.log('Signing transaction');
    const signedTx = await this.account.signTransaction({
      from: this.account.address,
      to: contracts.enableCollateralProxyAddress,
      data: transactionData,
      // gas: gasCost,
      gasPrice,
      nonce: await this.provider.getTransactionCount(this.account.address),
    });

    const receipt = await this.provider.sendTransaction(signedTx);

    console.log('Transaction hash:', receipt.hash)
    return receipt.hash;
  }

  async borrow(tokenAddress: string) {
    const borrowContract = await this.contractService.getContract(contracts.borrowContractImplementationAddress);
    const minBorrowAmount = await this.getMinBorrowAmount();

    const transactionData = borrowContract.methods.borrow(
      ethers.utils.formatEther(minBorrowAmount),
    ).encodeABI();

    const tx = {
      from: this.account.address,
      to: contracts.borrowContractProxyAddress,
      data: transactionData,
    }

    console.log('Estimating gas costs');

    const { estimatedGas: gasCost, gasPrice } = await this.gasService.estimateGasCosts(tx);

    console.log(`Estimated gas cost: ${gasCost} / Estimated gas price: ${gasPrice}`);

    console.log('Signing transaction');
    const signedTx = await this.account.signTransaction({
      from: this.account.address,
      to: contracts.borrowContractProxyAddress,
      data: transactionData,
      // gas: gasCost,
      gasPrice,
      nonce: await this.provider.getTransactionCount(this.account.address),
    });

    const receipt = await this.provider.sendTransaction(signedTx);

    console.log('Transaction hash:', receipt.hash)
    return receipt.hash;
  }

  async repay(tokenAddress: string) {
    const borrowedTokenData = await this.getAccountPoolInfo();

    const borrowBalance = borrowedTokenData.borrowBalance;
    const underlyingDecimals = borrowedTokenData.underlyingDecimals;
    const underlyingToken = borrowedTokenData.underlyingToken;

    const balance = await this.getUserBalance(borrowedTokenData.underlyingToken);

    if (borrowBalance === 0n) {
      console.log('No borrow balance to repay');
      return;
    }


    // const balance = await this.getBalanceForRepay(borrowedTokenData.underlyingToken);
    await this.approveRepay(tokenAddress, borrowBalance);
    await this.repayBorrow(tokenAddress, borrowBalance);

    return;
  }

  private async getUserBalance(tokenAddress: string) {
    const contract = await this.contractService.getContract(tokenAddress);
    const symbol = await contract.symbol();
    
    const underlyingDecimals = await contract.decimals() as bigint;

    const balance = await contract.balanceOf(this.account.address);

    console.log('User balance for', symbol, ':', balance);

    return {
      balance,
      underlyingDecimals
    };
  }

  private async getMinBorrowAmount() {
    const contract = await this.contractService.getContract(contracts.feeDistributorImplementationAddress);

    const data = contract.methods.getMinBorrowEth(
      contracts.ionWETHAddress
    ).encodeABI();

    const minBorrowAmount = await this.provider.call({
      to: contracts.feeDistributorProxyAddress,
      from: this.account.address,
      data,
    });

    const minBorrowAmountInEth = ethers.utils.formatEther(minBorrowAmount);
    console.log('Min borrow amount in ETH:', minBorrowAmountInEth);
    return minBorrowAmountInEth;
  }

  private async getAccountPoolInfo() {
    const contract = await this.contractService.getContract(contracts.poolLensAddress);

    const accountPoolInfo = await contract.methods.getPoolAssetsWithData(
      contracts.comptrollerAddress
    ).call({
      from: this.account.address
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

  private async approveRepay(tokenAddress: string, value: bigint) {
    console.log(`Approving ${value} tokens of ${tokenAddress} to be repaid`);
    const contract = await this.contractService.getContract(contracts.wethAddress);

    const transactionData = contract.approve(
      contracts.ionWETHAddress,
      value
    ).encodeABI();

    const tx = {
      from: this.account.address,
      to: contracts.wethAddress,
      data: transactionData,
    }

    console.log('Estimating gas costs');

    const { estimatedGas: gasCost, gasPrice } = await this.gasService.estimateGasCosts(tx);

    console.log(`Estimated gas cost: ${gasCost} / Estimated gas price: ${gasPrice}`);

    console.log('Signing transaction');
    const signedTx = await this.account.signTransaction({
      from: this.account.address,
      to: contracts.wethAddress,
      data: transactionData,
      // gas: gasCost,
      gasPrice,
      nonce: await this.provider.getTransactionCount(this.account.address),
    });

    const receipt = await this.provider.sendTransaction(signedTx);

    console.log('Transaction hash:', receipt.hash)
    console.log('\n\n');
    return receipt.hash;
  }

  private async repayBorrow(tokenAddress: string, value: bigint) {
    console.log(`Repaying ${value} tokens of ${tokenAddress}`);
    const contract = await this.contractService.getContract(contracts.borrowContractImplementationAddress);

    const transactionData = contract.methods.repayBorrow(
      value
    ).encodeABI();

    try {
      const tx = {
        from: this.account.address,
        to: contracts.borrowContractProxyAddress,
        data: transactionData,
      }

      console.log('Estimating gas costs');

      const { estimatedGas: gasCost, gasPrice } = await this.gasService.estimateGasCosts(tx);

      console.log(`Estimated gas cost: ${gasCost} / Estimated gas price: ${gasPrice}`);

      console.log('Signing transaction');
      const signedTx = await this.account.signTransaction({
        from: this.account.address,
        to: contracts.borrowContractProxyAddress,
        data: transactionData,
        // gas: gasCost,
        gasPrice,
        nonce: await this.provider.getTransactionCount(this.account.address),
      });

      const receipt = await this.provider.sendTransaction(signedTx);

      console.log('Transaction hash:', receipt.hash)
      return receipt.hash;
    } catch (error) {
      console.error('Error repaying borrow:', error);
    }
  }
}
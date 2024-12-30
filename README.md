# Lisk transactions bot

## EN

#### ⚠️ Note
This project is for educational purposes only. The author is not responsible for any misuse of the information provided.

If you don't know what you are doing, please do not use this project.

If you have any questions, please contact me at [X](https://x.com/bjversa)

### Context
This is a bot that performs Swaps, Lend and borrow for Lisk airdrop tasks.

To get started, register your account on [Lisk airdrop campaign](https://portal.lisk.com/airdrop) and follow the instructions.

You are going to need a referral code, you can use mine: **uMYpJu**

### How to use
1. Clone this repository
```bash
git clone
```	

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root of the project and add the following variables:
```bash
PK=<your_private_key>
```

4. Run the bot
```bash
npm start
```

You are going to receive a prompt to choose the action you want to perform. You can choose between:
- Swap
- Lend/Borrow

The default swap amount is $1, you can change it in the `src/index.ts` file on `SWAP_VALUE` constant.

### Important
For now, the bot is not performing approval for swap assets. If you get an error, please perform the swap manually once on each direction and then run the bot again. 

[USDT -> USDC](https://oku.trade/?outTokenAmount=&outToken=0xF242275d3a6527d877f2c927a82D9b057609cc71&inToken=0x05D032ac25d322df992303dCa074EE7392C117b9&inTokenAmount=)

[USDC -> USDT](https://oku.trade/?outTokenAmount=&outToken=0x05D032ac25d322df992303dCa074EE7392C117b9&inToken=0xF242275d3a6527d877f2c927a82D9b057609cc71&inTokenAmount=&inputChain=lisk&isExactOut=true)

### Usefull Contracts
- Min Borrow: https://blockscout.lisk.com/address/0x9BAD1f7685f33ad855AE81089dFe79040864E2F6?tab=read_write_proxy
- Assets: https://blockscout.lisk.com/address/0xcD4D7c8e2bA627684a9B18F7fe88239341D3ba5c?tab=read_write_contract
- Ionic Repository: https://github.com/ionicprotocol/monorepo# 

## PT

#### ⚠️ Nota
Este projeto é apenas para fins educacionais. O autor não é responsável por qualquer uso indevido das informações fornecidas.

Se você não sabe o que está fazendo, por favor, não use este projeto.

Se você tiver alguma dúvida, entre em contato comigo em [X](https://x.com/bjversa)

### Contexto
Este é um bot que realiza Swaps, Lend e borrows para as tarefas de airdrop da Lisk.

Para começar, registre sua conta na [campanha de airdrop da Lisk](https://portal.lisk.com/airdrop) e siga as instruções.

Você vai precisar de um código de referência, você pode usar o meu: **uMYpJu**

### Como usar
1. Clone este repositório
```bash
git clone
```

2. Instale as dependências
```bash
npm install
```

3. Crie um arquivo `.env` na raiz do projeto e adicione as seguintes variáveis:
```bash
PK=<sua_chave_privada>
```

4. Execute o bot
```bash
npm start
```

Você vai receber um prompt para escolher a ação que deseja realizar. Você pode escolher entre:
- Swap
- Lend/Borrow

O valor padrão do swap é $1, você pode alterá-lo no arquivo `src/index.ts` na constante `SWAP_VALUE`.

### Importante
Por enquanto, o bot não está realizando a aprovação para ativos de swap. Se você receber um erro, por favor, realize o swap manualmente uma vez em cada direção e execute o bot novamente.

[USDT -> USDC](https://oku.trade/?outTokenAmount=&outToken=0xF242275d3a6527d877f2c927a82D9b057609cc71&inToken=0x05D032ac25d322df992303dCa074EE7392C117b9&inTokenAmount=)

[USDC -> USDT](https://oku.trade/?outTokenAmount=&outToken=0x05D032ac25d322df992303dCa074EE7392C117b9&inToken=0xF242275d3a6527d877f2c927a82D9b057609cc71&inTokenAmount=&inputChain=lisk&isExactOut=true)

### Contratos úteis
- Min Borrow: https://blockscout.lisk.com/address/0x9BAD1f7685f33ad855AE81089dFe79040864E2F6?tab=read_write_proxy
- Assets: https://blockscout.lisk.com/address/0xcD4D7c8e2bA627684a9B18F7fe88239341D3ba5c?tab=read_write_contract
- Ionic Repository: https://github.com/ionicprotocol/monorepo# 

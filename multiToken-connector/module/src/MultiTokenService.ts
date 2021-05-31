import {PinoLogger} from 'nestjs-pino';
import BigNumber from 'bignumber.js';
import {MultiTokenError} from './MultiTokenError';
import {
    CeloDeployMultiToken,
    CeloBurnMultiToken,
    CeloBurnMultiTokenBatch,
    CeloMintMultiToken,
    CeloMintMultiTokenBatch,
    CeloTransferMultiToken,
    CeloTransferMultiTokenBatch,
    Currency,
    EthBurnMultiToken,
    EthBurnMultiTokenBatch,
    EthDeployMultiToken,
    MintMultiToken,
    MintMultiTokenBatch,
    TransferMultiToken,
    TransferMultiTokenBatch,
    prepareEthDeployMultiTokenSignedTransaction,
    prepareCeloDeployMultiTokenSignedTransaction,
    prepareBscDeployMultiTokenSignedTransaction,
    prepareBscBurnMultiTokenBatchSignedTransaction,
    prepareBscBurnMultiTokenSignedTransaction,
    prepareCeloMintMultiTokenSignedTransaction,
    prepareBscMintMultiTokenSignedTransaction,
    prepareEthMintMultiTokenSignedTransaction,
    prepareCeloMintMultiTokenBatchSignedTransaction,
    prepareBscMintMultiTokenBatchSignedTransaction,
    prepareEthMintMultiTokenBatchSignedTransaction,
    prepareBscMintMultiTokenBatchCashbackSignedTransaction,
    prepareCeloMintMultiTokenBatchCashbackSignedTransaction,
    prepareEthMintMultipleCashbackMultiTokenSignedTransaction,
    prepareCeloMintMultiTokenCashbackSignedTransaction,
    prepareEthMintCashbackMultiTokenSignedTransaction,
    prepareBscMintMultiTokenCashbackSignedTransaction,
    prepareBscTransferMultiTokenSignedTransaction,
    prepareCeloTransferMultiTokenSignedTransaction,
    prepareEthTransferMultiTokenSignedTransaction,
    prepareEthUpdateCashbackForAuthorMultiTokenSignedTransaction,
    prepareBscUpdateCashbackForAuthorMultiTokenSignedTransaction,
    prepareCeloUpdateCashbackForAuthorMultiTokenSignedTransaction,
    prepareEthBurnMultiTokenSignedTransaction,
    prepareCeloBurnMultiTokenSignedTransaction,
    prepareEthBatchTransferMultiTokenSignedTransaction,
    prepareBscBatchTransferMultiTokenSignedTransaction,
    prepareCeloBatchTransferMultiTokenSignedTransaction,
    prepareCeloBurnMultiTokenBatchSignedTransaction,
    prepareEthBurnBatchMultiTokenSignedTransaction,
    UpdateCashbackMultiToken,
    CeloUpdateCashbackMultiToken,
    TransactionHash,   
} from '@tatumio/tatum';
import erc1155_abi from '@tatumio/tatum/dist/src/contracts/erc1155/erc1155_abi';
import Web3 from 'web3';
import {Transaction, TransactionReceipt} from 'web3-eth';

export abstract class MultiTokenService {

    protected constructor(protected readonly logger: PinoLogger) {
    }

    protected abstract storeKMSTransaction(txData: string, currency: string, signatureId: string[], index?: number): Promise<string>;

    protected abstract isTestnet(): Promise<boolean>;

    protected abstract getNodesUrl(chain: Currency, testnet: boolean): Promise<string[]>;

    protected abstract broadcast(chain: Currency, txData: string, signatureId?: string)

    public async getMetadataMultiToken(chain: Currency, token: string, contractAddress: string): Promise<{ data: string }> {
        // @ts-ignore
        const c = new (await this.getClient(chain, await this.isTestnet())).eth.Contract(erc1155_abi, contractAddress);
        try {
            return {data: await c.methods.tokenURI(token).call()};
        } catch (e) {
            this.logger.error(e);
            throw new MultiTokenError(`Unable to obtain information for token. ${e}`, 'nft.erc721.failed');
        }
    }

    public async getRoyaltyMultiToken(chain: Currency, token: string, contractAddress: string) {
        // @ts-ignore
        const c = new (await this.getClient(chain, await this.isTestnet())).eth.Contract(erc1155_abi, contractAddress);
        try {
            const [addresses, values] = await Promise.all([c.methods.tokenCashbackRecipients(token).call(), c.methods.tokenCashbackValues(token).call()]);
            return {addresses, values: values.map(c => new BigNumber(c).dividedBy(1e18).toString(10))};
        } catch (e) {
            this.logger.error(e);
            throw new MultiTokenError(`Unable to obtain information for token. ${e}`, 'nft.erc721.failed');
        }
    }

    public async getTokensOfOwner(chain: Currency, address: string, contractAddress: string): Promise<{ data: string }> {
        // @ts-ignore
        const c = new (await this.getClient(chain, await this.isTestnet())).eth.Contract(erc1155_abi, contractAddress);
        try {
            return {data: await c.methods.tokensOfOwner(address).call()};
        } catch (e) {
            this.logger.error(e);
            throw new MultiTokenError(`Unable to obtain information for token. ${e}`, 'nft.erc721.failed');
        }
    }

    public async getTransaction(chain: Currency, txId: string): Promise<Transaction & TransactionReceipt> {
        try {
            const web3 = await this.getClient(chain, await this.isTestnet());
            const {r, s, v, hash, ...transaction} = (await web3.eth.getTransaction(txId)) as any;
            let receipt: TransactionReceipt = undefined;
            try {
                receipt = await web3.eth.getTransactionReceipt(hash);
            } catch (_) {
                transaction.transactionHash = hash;
            }
            return {...transaction, ...receipt};
        } catch (e) {
            this.logger.error(e);
            throw new MultiTokenError('Transaction not found. Possible not exists or is still pending.', 'tx.not.found');
        }
    }

    public async transferMultiToken(body: CeloTransferMultiToken | TransferMultiToken): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthTransferMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.BSC:
                txData = await prepareBscTransferMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.CELO:
                txData = await prepareCeloTransferMultiTokenSignedTransaction(testnet, body as CeloTransferMultiToken, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            default:
                throw new MultiTokenError(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }
    public async transferMultiTokenBatch(body: CeloTransferMultiTokenBatch | TransferMultiTokenBatch): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthBatchTransferMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.BSC:
                txData = await prepareBscBatchTransferMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.CELO:
                txData = await prepareCeloBatchTransferMultiTokenSignedTransaction(testnet, body as CeloTransferMultiTokenBatch, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            default:
                throw new MultiTokenError(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async mintMultiToken(body: CeloMintMultiToken | MintMultiToken): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        const provider = (await this.getNodesUrl(chain, testnet))[0];
        switch (chain) {
            case Currency.ETH:
                if (!body.authorAddresses) {
                    txData = await prepareEthMintMultiTokenSignedTransaction(body, provider);
                } else {
                    txData = await prepareEthMintCashbackMultiTokenSignedTransaction(body, provider);
                }
                break;
            case Currency.BSC:
                if (!body.authorAddresses) {
                    txData = await prepareBscMintMultiTokenSignedTransaction(body, provider);
                } else {
                    txData = await prepareBscMintMultiTokenCashbackSignedTransaction(body, provider);
                }
                break;
            case Currency.CELO:
                if (!body.authorAddresses) {
                    txData = await prepareCeloMintMultiTokenSignedTransaction(testnet, body as CeloMintMultiToken, provider);
                } else {
                    txData = await prepareCeloMintMultiTokenCashbackSignedTransaction(testnet, body as CeloMintMultiToken, provider);
                }
                break;
            default:
                throw new MultiTokenError(`Unsupported chain ${chain}.`, 'unsupported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async mintMultiTokenBatch(body: CeloMintMultiTokenBatch | MintMultiTokenBatch): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        const provider = (await this.getNodesUrl(chain, testnet))[0];
        switch (chain) {
            case Currency.ETH:
                if (!body.authorAddresses) {
                    txData = await prepareEthMintMultiTokenBatchSignedTransaction(body, provider);
                } else {
                    txData = await prepareEthMintMultipleCashbackMultiTokenSignedTransaction(body, provider);
                }
                break;
            case Currency.BSC:
                if (!body.authorAddresses) {
                    txData = await prepareBscMintMultiTokenBatchSignedTransaction(body, provider);
                } else {
                    txData = await prepareBscMintMultiTokenBatchCashbackSignedTransaction(body, provider);
                }
                break;
            case Currency.CELO:
                if (!body.authorAddresses) {
                    txData = await prepareCeloMintMultiTokenBatchSignedTransaction(testnet, body as CeloMintMultiTokenBatch, provider);
                } else {
                    txData = await prepareCeloMintMultiTokenBatchCashbackSignedTransaction(testnet, body as CeloMintMultiTokenBatch, provider);
                }
                break;
            default:
                throw new MultiTokenError(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async updateCashbackForAuthor(body: CeloUpdateCashbackMultiToken | UpdateCashbackMultiToken): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthUpdateCashbackForAuthorMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.BSC:
                txData = await prepareBscUpdateCashbackForAuthorMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.CELO:
                txData = await prepareCeloUpdateCashbackForAuthorMultiTokenSignedTransaction(testnet, body as CeloUpdateCashbackMultiToken, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            default:
                throw new MultiTokenError(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    public async burnMultiToken(body: CeloBurnMultiToken | EthBurnMultiToken): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthBurnMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.BSC:
                txData = await prepareBscBurnMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.CELO:
                txData = await prepareCeloBurnMultiTokenSignedTransaction(testnet, body as CeloBurnMultiToken, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            default:
                throw new MultiTokenError(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }
    public async burnMultiTokenBatch(body: CeloBurnMultiTokenBatch | EthBurnMultiTokenBatch): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthBurnBatchMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.BSC:
                txData = await prepareBscBurnMultiTokenBatchSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.CELO:
                txData = await prepareCeloBurnMultiTokenBatchSignedTransaction(testnet, body as CeloBurnMultiTokenBatch, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            default:
                throw new MultiTokenError(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }
    public async deployMultiToken(body: CeloDeployMultiToken | EthDeployMultiToken): Promise<TransactionHash | { signatureId: string }> {
        const testnet = await this.isTestnet();
        let txData;
        const {chain} = body;
        switch (chain) {
            case Currency.ETH:
                txData = await prepareEthDeployMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.BSC:
                txData = await prepareBscDeployMultiTokenSignedTransaction(body, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            case Currency.CELO:
                txData = await prepareCeloDeployMultiTokenSignedTransaction(testnet, body as CeloDeployMultiToken, (await this.getNodesUrl(chain, testnet))[0]);
                break;
            default:
                throw new MultiTokenError(`Unsupported chain ${chain}.`, 'unsuported.chain');
        }
        if (body.signatureId) {
            return {signatureId: await this.storeKMSTransaction(txData, chain, [body.signatureId], body.index)};
        } else {
            return this.broadcast(chain, txData);
        }
    }

    private async getClient(chain: Currency, testnet: boolean) {
        return new Web3((await this.getNodesUrl(chain, testnet))[0]);
    }
}
import { Get, Post, HttpCode, HttpStatus, Query, Param, Body, BadRequestException } from '@nestjs/common';
import { AlgoService } from './AlgoService';
import { QueryMnemonic, PathAddress, AlgoNodeType } from '@tatumio/blockchain-connector-common';
import { AlgoError } from './AlgoError';
import { GeneratePrivateKey } from './dto/GeneratePrivateKey';
import { PathRountNumber } from './dto/PathRoundNumber';
import { PathTransactionId } from './dto/PathTransactionId';
import { AlgoTransaction, BroadcastTx } from '@tatumio/tatum';
import { PathFromTo } from './PathFromTo';
import { Pagination } from './Pagination';
export abstract class AlgoController {
  protected constructor(protected readonly service: AlgoService) { }

  @Get('/node/indexer/:xApiKey')
  @HttpCode(HttpStatus.OK)
  public async nodeGetIndexer(@Query() query: any) {
    try {
      return await this.service.nodeGetMethod(query, AlgoNodeType.INDEXER);
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === AlgoError.name) {
        throw e;
      }
      throw new AlgoError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'Algo.error');
    }
  }

  @Post('/node/indexer/:xApiKey')
  @HttpCode(HttpStatus.OK)
  public async nodePostIndexer(@Body() body: any) {
    try {
      return await this.service.nodePostMethod(body, AlgoNodeType.INDEXER);
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === AlgoError.name) {
        throw e;
      }
      throw new AlgoError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'Algo.error');
    }
  }

  @Get('/node/algod/:xApiKey')
  @HttpCode(HttpStatus.OK)
  public async nodeGetAlgod(@Query() query: any) {
    try {
      return await this.service.nodeGetMethod(query, AlgoNodeType.ALGOD);
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === AlgoError.name) {
        throw e;
      }
      throw new AlgoError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'Algo.error');
    }
  }

  @Post('/node/algod/:xApiKey')
  @HttpCode(HttpStatus.OK)
  public async nodePostAlgod(@Body() body: any) {
    try {
      return await this.service.nodePostMethod(body, AlgoNodeType.ALGOD);
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === AlgoError.name) {
        throw e;
      }
      throw new AlgoError(`Unexpected error occurred. Reason: ${e.message?.message || e.response?.data || e.message || e}`, 'Algo.error');
    }
  }

  @Get('/wallet')
  @HttpCode(HttpStatus.OK)
  public async generateWallet(@Query() query: QueryMnemonic) {
    try {
      return await this.service.generateWallet(query.mnemonic)
    } catch (e) {
      throw new AlgoError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'algo.error');
    }
  }

  @Get('/address/:fromPrivateKey')
  @HttpCode(HttpStatus.OK)
  public async generateAddress(@Param() { fromPrivateKey }: GeneratePrivateKey) {
    try {
      return await this.service.generateAddress(fromPrivateKey);
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === AlgoError.name) {
        throw e;
      }
      throw new AlgoError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'algo.error');
    }
  }

  @Get('/account/balance/:address')
  @HttpCode(HttpStatus.OK)
  public async getAccountBalance(@Param() param: PathAddress) {
    try {
      return await this.service.getBalance(param.address);
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === AlgoError.name) {
        throw e;
      }
      throw new AlgoError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'algo.error');
    }
  }

  @Post('/transaction')
  @HttpCode(HttpStatus.OK)
  public async sendTransaction(@Body() body: AlgoTransaction) {
    try {
      return await this.service.sendTransaction(body);
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === AlgoError.name) {
        throw e;
      }
      throw new AlgoError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'algo.error');
    }
  }

  @Post('/broadcast')
  @HttpCode(HttpStatus.OK)
  public async broadcast(@Body() body: BroadcastTx) {
    try {
      return await this.service.broadcast(body.txData, body.signatureId);
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === AlgoError.name) {
        throw e;
      }
      throw new AlgoError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'algo.error');
    }
  }

  @Get('/block/current')
  @HttpCode(HttpStatus.OK)
  public async getInfo() {
    try {
      return await this.service.getCurrentBlock();
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === AlgoError.name) {
        throw e;
      }
      throw new AlgoError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'algo.error');
    }
  }

  @Get('/block/:roundNumber')
  @HttpCode(HttpStatus.OK)
  public async getBlock(@Param() { roundNumber }: PathRountNumber) {
    try {
      return await this.service.getBlock(Number(roundNumber));
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === AlgoError.name) {
        throw e;
      }
      throw new AlgoError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'algo.error');
    }
  }

  @Get('/transaction/:txid')
  public async getTransaction(@Param() { txid }: PathTransactionId) {
    try {
      return await this.service.getTransaction(txid);
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === AlgoError.name) {
        throw e;
      }
      throw new AlgoError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'algo.error');
    }
  }
  @Get('/transactions/:from/:to')
  public async getPayTransactions(@Param() { from, to }: PathFromTo, @Query() { limit, next }: Pagination) {
    try {
      return await this.service.getPayTransactions(from, to, limit, next);
    } catch (e) {
      if (['Array', 'ValidationError'].includes(e.constructor.name)) {
        throw new BadRequestException(e);
      }
      if (e.constructor.name === 'TatumError' || e.constructor.name === AlgoError.name) {
        throw e;
      }
      throw new AlgoError(`Unexpected error occurred. Reason: ${e.message || e.response?.data || e}`, 'algo.error');
    }
  }
}

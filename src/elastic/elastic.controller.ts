import { Controller, Get, Post, Query } from '@nestjs/common';
import { ElasticService } from './elastic.service';

@Controller('elastic')
export class ElasticController {
  constructor(private readonly elasticService: ElasticService) {}

  @Post('index-all-products')
  async indexAllProductsWithBrands() {
    await this.elasticService.deleteIndexProductsWithBrand();
    await this.elasticService.createIndexProductsWithBrands();
    await this.elasticService.indexAllProductsWithBrand();
  }

  @Get('indices')
  async getIndices() {
    return this.elasticService.getIndices();
  }

  @Get('search')
  async search(@Query('q') query: string) {
    return this.elasticService.searchProductsWithBrands(query);
  }
}

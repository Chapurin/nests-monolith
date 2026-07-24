import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { IProductWithBrand } from '../common/types/Product';

@Injectable()
export class ElasticService implements OnModuleInit {
  private readonly PRODUCTS_WITH_BRANDS_INDEX = 'PRODUCTS_WITH_BRANDS_INDEX';

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly prismaService: PrismaService,
  ) {}

  async createIndexProductsWithBrands() {
    try {
      const indexExists = await this.elasticsearchService.indices.exists({
        index: this.PRODUCTS_WITH_BRANDS_INDEX,
      });

      if (!indexExists) {
        await this.elasticsearchService.indices.create({
          index: this.PRODUCTS_WITH_BRANDS_INDEX,
          body: {
            settings: {
              analysis: {
                tokenizer: {
                  edge_ngram_tokenizer: {
                    type: 'edge_ngram',
                    min_gram: 1,
                    max_gram: 25,
                    token_chars: ['letter', 'digit'],
                  },
                },
                analyzer: {
                  edge_ngram_analyzer: {
                    type: 'custom',
                    tokenizer: 'edge_ngram_tokenizer',
                  },
                },
              },
            },
            mappings: {
              properties: {
                title: {
                  type: 'text',
                  analyzer: 'edge_ngram_analyzer',
                },
                description: {
                  type: 'text',
                },
                brand: {
                  properties: {
                    title: 'text',
                  },
                },
              },
            },
          },
        });
        console.log('index created');
      }
    } catch (e) {
      console.error('error in createIndexProductsWithBrands: ', e);
    }
  }

  async deleteIndexProductsWithBrand() {
    try {
      const indexExists = await this.elasticsearchService.indices.exists({
        index: this.PRODUCTS_WITH_BRANDS_INDEX,
      });

      if (indexExists) {
        await this.elasticsearchService.indices.delete({
          index: this.PRODUCTS_WITH_BRANDS_INDEX,
        });
        console.log('index deleted');
      }

      console.log('deleteIndexProductsWithBrand');
    } catch (e) {
      console.error('error in deleteIndexProductsWithBrand: ', e);
    }
  }

  async indexProductsWithBrand(product: IProductWithBrand) {
    await this.elasticsearchService.index({
      index: this.PRODUCTS_WITH_BRANDS_INDEX,
      id: product.id,
      body: {
        title: product.title,
        description: product.description,
        brand: product.brand,
      },
    });
  }

  async indexAllProductsWithBrand() {
    const products = await this.prismaService.product.findMany({
      include: {
        Brand: true,
      },
    });

    for (const product of products) {
      await this.indexProductsWithBrand({
        id: product.id.toString(),
        title: product.title,
        description: product.description,
        brand: product.Brand,
      });
    }
  }

  async onModuleInit() {
    await this.deleteIndexProductsWithBrand();
    await this.createIndexProductsWithBrands();
    await this.indexAllProductsWithBrand();
  }

  async searchProductsWithBrands(query: string) {
    const result = await this.elasticsearchService.search({
      index: this.PRODUCTS_WITH_BRANDS_INDEX,
      body: {
        query: {
          multi_search: {
            query,
            fields: ['title', 'description', 'brand.title'],
          },
        },
      },
    });

    return result.hits.hits.map((hit) => hit._source);
  }

  async getIndices() {
    return await this.elasticsearchService.cat.indices({
      format: 'json',
    });
  }
}

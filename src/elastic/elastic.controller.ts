import { Controller } from '@nestjs/common';
import { ElasticService } from './elastic.service';

@Controller('elastic')
export class ElasticController {
  constructor(private readonly elasticService: ElasticService) {}
}

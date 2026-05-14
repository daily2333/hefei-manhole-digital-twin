import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT || 3001);
  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';

  app.use(helmet());
  app.enableCors({
    origin: corsOrigin.split(',').map((item) => item.trim())
  });
  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(port);
}

bootstrap();

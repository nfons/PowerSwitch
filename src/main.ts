import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const port : number= Number.parseInt(process.env.PORT ?? '', 10) || 8080;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();

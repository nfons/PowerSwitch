import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const port: number = Number.parseInt(process.env.PORT ?? '', 10) || 8080;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.setGlobalPrefix('api');
  const config = new DocumentBuilder()
    .setTitle('Power Switch')
    .setDescription('powerswitch api')
    .setVersion('1.0')
    .addTag('local')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory)
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();

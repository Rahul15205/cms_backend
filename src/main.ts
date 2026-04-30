import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  // Trust proxy for X-Forwarded-For headers
  (app.getHttpAdapter().getInstance() as any).set('trust proxy', 1);
  
  // Security headers (CSP, HSTS, X-Frame-Options, etc.)
  app.use(helmet());

  // CORS — allow public access for banner script and consent recording
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // We allow all origins for the public API endpoints to support multi-site integration
        callback(null, true); 
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  
  // Enable global validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Consent Management System API')
    .setDescription('Backend API for CMS')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
  console.log(`🚀 CMS Backend running on port ${process.env.PORT ?? 3001}`);
  console.log(`📄 Swagger docs: http://localhost:${process.env.PORT ?? 3001}/api/docs`);
}
bootstrap();


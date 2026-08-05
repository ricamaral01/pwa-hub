import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BiometriaFacial, BiometriaEvento } from './entities';
import { BiometriaService } from './biometria.service';
import { BiometriaController } from './biometria.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BiometriaFacial, BiometriaEvento]), AuthModule],
  controllers: [BiometriaController],
  providers: [BiometriaService],
})
export class BiometriaModule {}

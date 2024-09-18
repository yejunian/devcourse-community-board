import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { TokenGuard } from "./common/guard/token.guard";
import appConfig from "./config/app.config";
import { typeOrmConfig } from "./config/db.config";
import jwtConfig from "./config/jwt.config";
import { UserModule } from "./user/user.module";
import { PostModule } from './post/post.module';
import { LogModule } from './log/log.module';
import { LikeModule } from './like/like.module';
import { CommentModule } from './comment/comment.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			cache: true,
			isGlobal: true,
			load: [appConfig, typeOrmConfig, jwtConfig],
		}),
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
			...configService.get("typeorm"),
			logging: true,  
			}),
			inject: [ConfigService],
		}),
		UserModule,
		AuthModule,
		PostModule,
		LogModule,
		LikeModule,
		CommentModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_GUARD,
			useClass: TokenGuard,
		},
	],
})
export class AppModule {}

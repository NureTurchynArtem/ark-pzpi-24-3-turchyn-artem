import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '../database/entities';
import { Auth, CurrentUser } from './auth.decorators';
import { LoginResponse, AuthService } from './auth.service';
import { AuthUser } from './auth.types';
import { LoginDto } from './dto/login.dto';

@ApiTags('Автентифікація')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Вхід користувача та отримання JWT-токена' })
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto);
  }

  @Get('me')
  @Auth()
  @ApiOperation({ summary: 'Профіль поточного користувача' })
  me(@CurrentUser() user: AuthUser): Promise<User> {
    return this.authService.getProfile(user.id);
  }
}
